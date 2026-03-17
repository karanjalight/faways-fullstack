'use client';

import { supabase } from '@/lib/supabase-client';
import type { Agent } from '../app/types/agent';

type AgentRow = {
  id: string;
  profile_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  department: string | null;
  status: 'active' | 'inactive' | 'on-leave';
  assigned_debts: number;
  total_collected: number;
  performance_score: number | null;
  join_date: string;
};

const mapRowToAgent = (row: AgentRow): Agent => ({
  id: row.id,
  name: row.name ?? 'Agent',
  email: row.email ?? '',
  phone: row.phone ?? '',
  department: row.department ?? '',
  status: row.status,
  assignedDebts: row.assigned_debts,
  totalCollected: row.total_collected,
  performance: row.performance_score ?? 0,
  joinDate: row.join_date,
});

export async function fetchAgents(): Promise<Agent[]> {
  const { data, error } = await supabase
    .from('agents')
    .select(
      'id, profile_id, name, email, phone, department, status, assigned_debts, total_collected, performance_score, join_date',
    )
    .order('join_date', { ascending: false });

  if (error) {
    console.error('Error fetching agents', error);
    throw error;
  }

  return (data as AgentRow[]).map(mapRowToAgent);
}

export async function createAgent(agent: Omit<Agent, 'id' | 'joinDate'>) {
  const { data, error } = await supabase
    .from('agents')
    .insert({
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      department: agent.department,
      status: agent.status,
      assigned_debts: agent.assignedDebts,
      total_collected: agent.totalCollected,
      performance_score: agent.performance,
    })
    .select(
      'id, profile_id, name, email, phone, department, status, assigned_debts, total_collected, performance_score, join_date',
    )
    .single();

  if (error) {
    console.error('Error creating agent', error);
    throw error;
  }

  return mapRowToAgent(data as AgentRow);
}

export async function updateAgent(
  id: string,
  agent: Omit<Agent, 'id' | 'joinDate'>,
) {
  const { error } = await supabase
    .from('agents')
    .update({
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      department: agent.department,
      status: agent.status,
      assigned_debts: agent.assignedDebts,
      total_collected: agent.totalCollected,
      performance_score: agent.performance,
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating agent', error);
    throw error;
  }
}

export async function deleteAgent(id: string) {
  const { error } = await supabase.from('agents').delete().eq('id', id);
  if (error) {
    console.error('Error deleting agent', error);
    throw error;
  }
}

