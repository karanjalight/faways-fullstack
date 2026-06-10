-- =============================================================================
-- SINGLE DEBT CASCADE DELETE (Faways)
-- =============================================================================
-- Optional Postgres function for atomic debt deletion. The app uses
-- DELETE /api/debts/[id] (lib/delete-debt.ts) which performs the same steps
-- via the service role. Run this in Supabase SQL Editor if you prefer an RPC.
--
-- Usage: select public.delete_debt_cascade('your-debt-uuid-here');
-- =============================================================================

create or replace function public.delete_debt_cascade(p_debt_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_agent_id uuid;
  v_collection_ids uuid[];
  v_affected_invoice_ids uuid[];
  v_invoice_id uuid;
begin
  select client_id, assigned_agent_id
  into v_client_id, v_agent_id
  from public.debts
  where id = p_debt_id;

  if not found then
    raise exception 'Debt not found' using errcode = 'P0002';
  end if;

  select coalesce(array_agg(id), '{}')
  into v_collection_ids
  from public.debt_collections
  where debt_id = p_debt_id;

  if array_length(v_collection_ids, 1) is not null then
    select coalesce(array_agg(distinct invoice_id), '{}')
    into v_affected_invoice_ids
    from public.commission_invoice_lines
    where debt_collection_id = any (v_collection_ids);

    delete from public.commission_invoice_lines
    where debt_collection_id = any (v_collection_ids);

    if array_length(v_affected_invoice_ids, 1) is not null then
      foreach v_invoice_id in array v_affected_invoice_ids loop
        if not exists (
          select 1 from public.commission_invoice_lines where invoice_id = v_invoice_id
        ) then
          delete from public.commission_invoices where id = v_invoice_id;
        else
          update public.commission_invoices
          set
            total_recovered = (
              select coalesce(sum(amount_recovered), 0)
              from public.commission_invoice_lines
              where invoice_id = v_invoice_id
            ),
            total_commission = (
              select coalesce(sum(commission_amount), 0)
              from public.commission_invoice_lines
              where invoice_id = v_invoice_id
            ),
            updated_at = now()
          where id = v_invoice_id;
        end if;
      end loop;
    end if;

    delete from public.debt_collection_documents
    where debt_collection_id = any (v_collection_ids);

    delete from public.debt_collections where debt_id = p_debt_id;
  end if;

  delete from public.invoice_items where debt_id = p_debt_id;
  delete from public.contact_interactions where debt_id = p_debt_id;
  delete from public.internal_messages where debt_id = p_debt_id;
  delete from public.email_logs where related_debt_id = p_debt_id;
  delete from public.debt_notes where debt_id = p_debt_id;
  delete from public.debt_documents where debt_id = p_debt_id;

  delete from public.notifications
  where type in ('client_debt_submitted', 'debt_assigned_to_client')
     or payload->>'debtId' = p_debt_id::text;

  delete from public.debts where id = p_debt_id;

  if v_client_id is not null then
    update public.clients
    set
      total_debt = coalesce((
        select sum(amount) from public.debts where client_id = v_client_id
      ), 0),
      total_paid = coalesce((
        select sum(paid_amount) from public.debts where client_id = v_client_id
      ), 0)
    where id = v_client_id;
  end if;

  if v_agent_id is not null then
    update public.agents
    set
      assigned_debts = coalesce((
        select count(*)
        from public.debts
        where assigned_agent_id = v_agent_id
          and status not in ('paid', 'written_off')
      ), 0),
      total_collected = coalesce((
        select sum(paid_amount)
        from public.debts
        where assigned_agent_id = v_agent_id
      ), 0)
    where id = v_agent_id;
  end if;
end;
$$;
