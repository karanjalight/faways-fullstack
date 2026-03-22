'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import { Debt, DebtStatus } from '../../types/debt';
import { getCurrentUser } from '../../lib/auth';
import { createDebt } from '../../lib/debts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

type Step = 1 | 2;

const serviceLines = [
  'Cardiology',
  'Orthopedics',
  'Oncology',
  'Trauma',
  'Radiology',
  'Pediatrics',
];

const owners = ['Nia Patel', 'Marcus Ochieng', 'Faith Kim', 'Grace Ahmed'];

const clientTypes: { label: string; value: Debt['clientType'] }[] = [
  { label: 'Hospital', value: 'hospital' },
  { label: 'Clinic', value: 'clinic' },
  { label: 'Specialty Practice', value: 'practice' },
];

interface FormState {
  creditor: string;
  clientType: Debt['clientType'];
  patientName: string;
  patientId: string;
  serviceLine: string;
  payer: string;
  owner: string;
  stage: Debt['stage'];
  amount: string;
  paidAmount: string;
  dueDate: string;
  status: DebtStatus;
  priority: Debt['priority'];
  serviceDate: string;
  description: string;
}

export default function NewDebtPage() {
  const router = useRouter();
  const user = getCurrentUser();

  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormState>({
    creditor: '',
    clientType: 'hospital',
    patientName: '',
    patientId: '',
    serviceLine: serviceLines[0],
    payer: '',
    owner: owners[0],
    stage: 'new',
    amount: '',
    paidAmount: '',
    dueDate: '',
    status: 'pending',
    priority: 'medium',
    serviceDate: '',
    description: '',
  });

  const goNext = () => {
    if (step === 1) {
      if (!formData.creditor || !formData.patientName || !formData.patientId) {
        alert('Please fill in client and patient details.');
        return;
      }
      if (!formData.payer || !formData.serviceLine) {
        alert('Please specify service line and payer.');
        return;
      }
      setStep(2);
    }
  };

  const goBack = () => {
    if (step === 2) setStep(1);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === 1) {
      goNext();
      return;
    }

    const amount = parseFloat(formData.amount);
    const paidAmount = parseFloat(formData.paidAmount) || 0;

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

    setIsSubmitting(true);

    try {
    const now = new Date().toISOString();

    await createDebt({
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
      description: formData.description || undefined,
      documents: [],
      serviceDate: formData.serviceDate || now.slice(0, 10),
      priority: formData.priority,
    });

    router.push('/debts');
    } catch {
      alert('Something went wrong while creating the debt. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="border-b border-gray-200 bg-white px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Create new healthcare debt
              </p>
              <h1 className="text-3xl font-bold text-slate-900">New Debt Workflow</h1>
              <p className="mt-1 text-sm text-slate-500">
                Capture client, patient, payer, and financial details in two guided steps.
              </p>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-1">
              <span className="text-xs text-slate-500">Signed in as</span>
              <span className="text-sm font-semibold text-slate-900">
                {user?.name ?? 'Client user'}
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  step === 1 ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                }`}
              >
                1
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Client & Patient
                </p>
                <p className="text-[11px] text-slate-500">Who and where the debt originates</p>
              </div>
            </div>
            <div className="h-px flex-1 rounded-full bg-slate-200" />
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  step === 2 ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                }`}
              >
                2
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Financial & Status
                </p>
                <p className="text-[11px] text-slate-500">Exposure, timing, and routing</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-8">
          <div className="mx-auto max-w-5xl space-y-8">
            {step === 1 && (
              <div className="space-y-6 rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      Client & patient context
                    </h2>
                    <p className="text-xs text-slate-500">
                      Map the healthcare client, patient identity, and payer before financials.
                    </p>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px]">
                    Step 1 of 2
                  </Badge>
                </div>

                <div className="space-y-4 rounded-2xl bg-slate-50/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Healthcare client
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>
                        Healthcare Client <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        value={formData.creditor}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, creditor: e.target.value }))
                        }
                        placeholder="e.g. Mercy General Hospital"
                        required
                      />
                    </div>
                    <div>
                      <Label>Client Type</Label>
                      <select
                        value={formData.clientType}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            clientType: e.target.value as Debt['clientType'],
                          }))
                        }
                        className="mt-1 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {clientTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>
                      Patient Name <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={formData.patientName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, patientName: e.target.value }))
                      }
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
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, patientId: e.target.value }))
                      }
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
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, serviceLine: e.target.value }))
                      }
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
                    <Input
                      value={formData.payer}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, payer: e.target.value }))
                      }
                      placeholder="e.g. BlueCross PPO"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Collection Owner</Label>
                    <select
                      value={formData.owner}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, owner: e.target.value }))
                      }
                      className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {owners.map((owner) => (
                        <option key={owner} value={owner}>
                          {owner}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Service Date</Label>
                    <Input
                      type="date"
                      value={formData.serviceDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, serviceDate: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      Financial exposure & routing
                    </h2>
                    <p className="text-xs text-slate-500">
                      Confirm amounts, timing and how the case enters your pipeline.
                    </p>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px]">
                    Step 2 of 2
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>
                      Invoice Amount <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, amount: e.target.value }))
                      }
                      placeholder="KES"
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
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, paidAmount: e.target.value }))
                      }
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
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stage</Label>
                    <select
                      value={formData.stage}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          stage: e.target.value as Debt['stage'],
                        }))
                      }
                      className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="new">New intake</option>
                      <option value="in-review">In review</option>
                      <option value="escalated">Escalated</option>
                      <option value="legal">Legal</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          priority: e.target.value as Debt['priority'],
                        }))
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
                        setFormData((prev) => ({
                          ...prev,
                          status: e.target.value as DebtStatus,
                        }))
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
                    <Label>Internal Notes</Label>
                    <Textarea
                      rows={3}
                      placeholder="Flag denials, payer feedback or escalation requests..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                disabled={step === 1 || isSubmitting}
                onClick={goBack}
              >
                Back
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => router.push('/debts')}
                  className="rounded-2xl"
                >
                  Cancel
                </Button>
                <Button
                  type={step === 2 ? 'submit' : 'button'}
                  onClick={step === 1 ? goNext : undefined}
                  disabled={isSubmitting}
                  className="rounded-2xl px-6"
                >
                  {step === 2 ? (isSubmitting ? 'Creating...' : 'Create Debt') : 'Continue'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

