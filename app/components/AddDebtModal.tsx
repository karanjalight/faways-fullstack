'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { Debt, DebtDocument, DebtStatus } from '../types/debt';
import { addCustomInsurer } from '../constants/kenyanInsurers';
import InsuranceSelect from './InsuranceSelect';
import { fetchAgents } from '../../lib/agents';
import type { Agent } from '../types/agent';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (debt: Omit<Debt, 'id' | 'createdAt'>) => void;
  editingDebt?: Debt | null;
}

const serviceLines = ['Cardiology', 'Orthopedics', 'Oncology', 'Trauma', 'Radiology', 'Pediatrics'];
const clientTypes = [
  { label: 'Hospital', value: 'hospital' },
  { label: 'Clinic', value: 'clinic' },
  { label: 'Specialty Practice', value: 'practice' },
];

export default function AddDebtModal({
  isOpen,
  onClose,
  onSave,
  editingDebt,
}: AddDebtModalProps) {
  const [formData, setFormData] = useState({
    creditor: '',
    clientType: 'hospital' as Debt['clientType'],
    patientName: '',
    patientId: '',
    serviceLine: serviceLines[0],
    payer: '',
    owner: '',
    stage: 'new' as Debt['stage'],
    amount: '',
    paidAmount: '',
    dueDate: '',
    status: 'pending' as DebtStatus,
    priority: 'medium' as Debt['priority'],
    serviceDate: '',
    description: '',
  });
  const [attachments, setAttachments] = useState<DebtDocument[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [lockedClientName, setLockedClientName] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);

  useEffect(() => {
    if (editingDebt) {
      setFormData({
        creditor: editingDebt.creditor,
        clientType: editingDebt.clientType,
        patientName: editingDebt.patientName,
        patientId: editingDebt.patientId,
        serviceLine: editingDebt.serviceLine,
        payer: editingDebt.payer,
        owner: editingDebt.owner,
        stage: editingDebt.stage,
        amount: editingDebt.amount.toString(),
        paidAmount: editingDebt.paidAmount.toString(),
        dueDate: editingDebt.dueDate,
        status: editingDebt.status,
        priority: editingDebt.priority,
        serviceDate: editingDebt.serviceDate ?? '',
        description: editingDebt.description ?? '',
      });
      setAttachments(editingDebt.documents ?? []);
    } else {
      setFormData({
        creditor: '',
        clientType: 'hospital',
        patientName: '',
        patientId: '',
        serviceLine: serviceLines[0],
        payer: '',
        owner: agents[0]?.name ?? '',
        stage: 'new',
        amount: '',
        paidAmount: '',
        dueDate: '',
        status: 'pending',
        priority: 'medium',
        serviceDate: '',
        description: '',
      });
      setAttachments([]);
    }
  }, [editingDebt, isOpen, agents]);

  useEffect(() => {
    const loadAgents = async () => {
      setIsLoadingAgents(true);
      try {
        const data = await fetchAgents();
        const activeAgents = data.filter((agent) => agent.status === 'active');
        setAgents(activeAgents);
        setFormData((prev) => ({
          ...prev,
          owner: prev.owner || activeAgents[0]?.name || '',
        }));
      } catch (error) {
        console.error(error);
        setAgents([]);
      } finally {
        setIsLoadingAgents(false);
      }
    };

    if (isOpen) {
      loadAgents();
    }
  }, [isOpen]);

  // Load clients and determine if current user is a client (lock client selection)
  useEffect(() => {
    const loadContext = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const role = (user.user_metadata?.role as string | undefined)?.toLowerCase();

      if (role === 'client') {
        const { data: client } = await supabase
          .from('clients')
          .select('id, name')
          .eq('email', user.email)
          .maybeSingle();

        if (client) {
          setSelectedClientId(client.id);
          setLockedClientName(client.name);
          setFormData((prev) => ({ ...prev, creditor: client.name }));
          return;
        }
      }

      // Admin/agent or fallback: load all clients for selection
      const { data } = await supabase
        .from('clients')
        .select('id, name')
        .order('name', { ascending: true });
      setClients((data as { id: string; name: string }[]) ?? []);
    };

    if (isOpen) {
      loadContext();
    }
  }, [isOpen]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const mapped: DebtDocument[] = Array.from(files).map((file, index) => {
      const kb = Math.round(file.size / 1024);
      return {
        id: editingDebt?.id
          ? `${editingDebt.id}-doc-${attachments.length + index + 1}`
          : `new-doc-${Date.now()}-${index}`,
        name: file.name,
        type: file.type.includes('pdf')
          ? 'pdf'
          : file.type.startsWith('image/')
            ? 'image'
            : 'other',
        size: kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`,
        uploadedAt: new Date().toISOString(),
        uploadedBy: formData.owner,
        url: URL.createObjectURL(file),
      };
    });

    setAttachments((prev) => [...prev, ...mapped]);
  };

  const selectedClient = useMemo(
    () => clientTypes.find((type) => type.value === formData.clientType),
    [formData.clientType]
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = parseFloat(formData.amount);
    const paidAmount = parseFloat(formData.paidAmount) || 0;

    if (!formData.creditor || !formData.patientName || !formData.patientId) {
      alert('Please fill in all required client and patient fields.');
      return;
    }
    if (!selectedClientId) {
      alert('Please select a client for this debt.');
      return;
    }
    if (!formData.serviceLine || !formData.payer) {
      alert('Please include a service line and payer.');
      return;
    }
    if (Number.isNaN(amount) || amount <= 0) {
      alert('Invoice amount must be greater than zero.');
      return;
    }
    if (!formData.dueDate) {
      alert('A due date is required.');
      return;
    }
    if (paidAmount > amount) {
      alert('Collected amount cannot exceed the invoice.');
      return;
    }

    const selectedAgent = agents.find((agent) => agent.name === formData.owner);

    if (formData.payer.trim()) {
      addCustomInsurer(formData.payer);
    }

    onSave({
      clientId: selectedClientId,
      assignedAgentId: selectedAgent?.id,
      creditor: formData.creditor,
      clientType: formData.clientType,
      patientName: formData.patientName,
      patientId: formData.patientId,
      serviceLine: formData.serviceLine,
      payer: formData.payer,
      owner: formData.owner,
      stage: formData.stage,
      amount,
      paidAmount,
      dueDate: formData.dueDate,
      status: formData.status,
      description: formData.description,
      priority: formData.priority,
      documents: attachments,
      serviceDate: formData.serviceDate || new Date().toISOString().slice(0, 10),
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[32px]">
        <DialogHeader>
          <DialogTitle>
            {editingDebt ? 'Update Healthcare Debt' : 'Add Healthcare Debt'}
          </DialogTitle>
          <DialogDescription>
            7 required inputs capture client, patient, payer, service line, amount, due date, and
            ownership before attachments.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="space-y-4 rounded-3xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Client context
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>
                  Client <span className="text-rose-500">*</span>
                </Label>
                {lockedClientName ? (
                  <Input value={lockedClientName} disabled />
                ) : (
                  <select
                    value={selectedClientId ?? ''}
                    onChange={(e) => {
                      const id = e.target.value || null;
                      setSelectedClientId(id);
                      const found = clients.find((c) => c.id === id);
                      if (found) {
                        setFormData((prev) => ({ ...prev, creditor: found.name }));
                      }
                    }}
                    className="mt-1 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select client…</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <Label>Client Type</Label>
                <select
                  value={formData.clientType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      clientType: e.target.value as Debt['clientType'],
                    })
                  }
                  className="mt-1 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {clientTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedClient?.label} routing for analytics.
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Patient Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                placeholder="Full name on claim"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>
                Patient ID / MRN <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                placeholder="e.g. MRN-88421"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>
                Service Line <span className="text-rose-500">*</span>
              </Label>
              <select
                value={formData.serviceLine}
                onChange={(e) => setFormData({ ...formData, serviceLine: e.target.value })}
                className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {serviceLines.map((line) => (
                  <option key={line} value={line}>
                    {line}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>
                Payer / Insurance <span className="text-rose-500">*</span>
              </Label>
              <InsuranceSelect
                value={formData.payer}
                onChange={(payer) => setFormData({ ...formData, payer })}
                required
                showSearch
              />
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Invoice Amount <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="USD"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Collected to Date</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.paidAmount}
                onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>
                Due Date <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Service Date</Label>
              <Input
                type="date"
                value={formData.serviceDate}
                onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
              />
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Priority</Label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as Debt['priority'] })
                }
                className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as DebtStatus })
                }
                className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="negotiating">Negotiating</option>
                <option value="overdue">Overdue</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Collection Owner</Label>
              <select
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                disabled={isLoadingAgents}
                className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {isLoadingAgents ? 'Loading agents...' : 'Select collection owner'}
                </option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.name}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="space-y-2">
            <Label>Clinical Notes</Label>
            <Textarea
              rows={3}
              placeholder="Flag denials, payer feedback or escalation requests..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </section>

          <section className="space-y-4 rounded-3xl border border-dashed border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Attachments</p>
                <p className="text-xs text-slate-500">
                  Upload PDF or image evidence supporting this case.
                </p>
              </div>
              <Badge variant="secondary">{attachments.length} files</Badge>
            </div>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white/50 p-6 text-center text-sm text-slate-500 hover:border-blue-400 hover:bg-blue-50/30">
              <span className="font-medium text-slate-800">Click to upload</span>
              <span className="text-xs text-slate-500">PDF or images up to 10MB</span>
              <input
                type="file"
                accept=".pdf,image/*"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            {attachments.length > 0 && (
              <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
                {attachments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold text-slate-800">{doc.name}</p>
                      <p className="text-xs text-slate-500">
                        {doc.size} • Uploaded by {doc.uploadedBy}
                      </p>
                    </div>
                    <Badge variant={doc.type === 'pdf' ? 'secondary' : 'default'}>
                      {doc.type === 'other' ? 'FILE' : doc.type.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </section>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-2xl px-8">
              {editingDebt ? 'Save Updates' : 'Create Debt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


