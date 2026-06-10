-- =============================================================================
-- SINGLE RECOVERY / COLLECTION DELETE (Faways)
-- =============================================================================
-- Optional Postgres function. The app uses DELETE /api/collections/[id]
-- (lib/delete-collection.ts) via the service role.
--
-- Usage: select public.delete_collection_cascade('collection-uuid-here');
-- =============================================================================

create or replace function public.delete_collection_cascade(p_collection_id uuid)
returns table (debt_id uuid, paid_amount numeric, status public.debt_status)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_debt_id uuid;
  v_debt_amount numeric;
  v_current_status public.debt_status;
  v_client_id uuid;
  v_agent_id uuid;
  v_paid_amount numeric;
  v_next_status public.debt_status;
  v_invoice_id uuid;
  v_affected_invoice_ids uuid[];
begin
  select dc.debt_id, dc.amount
  into v_debt_id, v_paid_amount
  from public.debt_collections dc
  where dc.id = p_collection_id;

  if v_debt_id is null then
    raise exception 'Recovery record not found' using errcode = 'P0002';
  end if;

  select d.amount, d.status, d.client_id, d.assigned_agent_id
  into v_debt_amount, v_current_status, v_client_id, v_agent_id
  from public.debts d
  where d.id = v_debt_id;

  if exists (
    select 1
    from public.commission_invoice_lines cil
    join public.commission_invoices ci on ci.id = cil.invoice_id
    where cil.debt_collection_id = p_collection_id
      and ci.status = 'paid'
  ) then
    raise exception 'Recovery is on a paid commission invoice' using errcode = 'P0001';
  end if;

  select coalesce(array_agg(distinct invoice_id), '{}')
  into v_affected_invoice_ids
  from public.commission_invoice_lines
  where debt_collection_id = p_collection_id;

  delete from public.commission_invoice_lines
  where debt_collection_id = p_collection_id;

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
  where debt_collection_id = p_collection_id;

  delete from public.debt_collections
  where id = p_collection_id;

  select coalesce(sum(amount), 0)
  into v_paid_amount
  from public.debt_collections
  where debt_id = v_debt_id;

  if v_paid_amount >= v_debt_amount then
    v_next_status := 'paid';
  elsif v_paid_amount = 0 and v_current_status = 'paid' then
    v_next_status := 'pending';
  elsif v_paid_amount > 0 and v_current_status = 'paid' then
    v_next_status := 'in_progress';
  else
    v_next_status := v_current_status;
  end if;

  update public.debts
  set paid_amount = v_paid_amount, status = v_next_status
  where id = v_debt_id;

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

  return query
  select v_debt_id, v_paid_amount, v_next_status;
end;
$$;
