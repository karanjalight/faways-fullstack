'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import { Debt, DebtStatus } from '../../types/debt';
import { Client } from '../../types/client';
import { getCurrentUser } from '../../lib/auth';
import { createDebt } from '../../lib/debts';
import {
  DEBT_DOCUMENTS_BUCKET,
  uploadDebtDocumentsForDebt,
} from '../../lib/debtDocuments';
import { createClientApi, fetchClientByEmail, fetchClients } from '../../lib/clients';
import { fetchAgents } from '../../../lib/agents';
import type { Agent } from '../../types/agent';
import { KENYAN_INSURERS } from '../../constants/kenyanInsurers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

type Step = 1 | 2;
type DebtSource =
  | 'hospital-intake'
  | 'newspaper-lead'
  | 'client-referral'
  | 'contact-us-lead';
type DebtorKind = 'patient' | 'non-patient';

type PendingDebtDocument = {
  id: string;
  displayName: string;
  file: File | null;
};

const serviceLines = [
  'General Recovery',
  'Debt Collection & Recovery',
  'Rent Collection & Property Management',
  'Bookkeeping & Financial Management',
  'Credit Control & Consultancy',
  'Cardiology',
  'Orthopedics',
  'Oncology',
  'Trauma',
  'Radiology',
  'Pediatrics',
  'Newspaper Lead',
];

const clientTypes: { label: string; value: Debt['clientType'] }[] = [
  { label: 'Business', value: 'hospital' },
  { label: 'Property / SME', value: 'clinic' },
  { label: 'Enterprise / Corporate', value: 'practice' },
];

const fawaysContact = {
  phones: ['0735 343000', '0729 806 234'],
  email: 'info@fawaysolutions.co.ke',
};

interface FormState {
  debtSource: DebtSource;
  debtorKind: DebtorKind;
  assignedClientId: string;
  creditor: string;
  clientType: Debt['clientType'];
  patientName: string;
  patientId: string;
  serviceLine: string;
  payer: string;
  contactEmail: string;
  contactPhone: string;
  createTrackingAccount: boolean;
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
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientOptions, setClientOptions] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [agentOptions, setAgentOptions] = useState<Agent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [pendingDocuments, setPendingDocuments] = useState<PendingDebtDocument[]>([]);
  const [formData, setFormData] = useState<FormState>({
    debtSource: 'hospital-intake',
    debtorKind: 'patient',
    assignedClientId: '',
    creditor: '',
    clientType: 'hospital',
    patientName: '',
    patientId: '',
    serviceLine: 'General Recovery',
    payer: '',
    contactEmail: '',
    contactPhone: '',
    createTrackingAccount: false,
    owner: '',
    stage: 'new',
    amount: '',
    paidAmount: '',
    dueDate: '',
    status: 'pending',
    priority: 'medium',
    serviceDate: '',
    description: '',
  });

  useEffect(() => {
    const loadClients = async () => {
      setIsLoadingClients(true);
      try {
        const data = await fetchClients();
        setClientOptions(data.filter((client) => client.status === 'active'));
      } catch (error) {
        console.error(error);
        setClientOptions([]);
      } finally {
        setIsLoadingClients(false);
      }
    };
    loadClients();
  }, []);

  useEffect(() => {
    const loadAgents = async () => {
      setIsLoadingAgents(true);
      try {
        const agents = await fetchAgents();
        const activeAgents = agents.filter((agent) => agent.status === 'active');
        setAgentOptions(activeAgents);
        setFormData((prev) => ({
          ...prev,
          owner: prev.owner || activeAgents[0]?.name || '',
        }));
      } catch (error) {
        console.error(error);
        setAgentOptions([]);
      } finally {
        setIsLoadingAgents(false);
      }
    };

    loadAgents();
  }, []);

  const goNext = () => {
    if (step === 1) {
      const isNewspaperLead = formData.debtSource === 'newspaper-lead';
      const isContactLead = formData.debtSource === 'contact-us-lead';
      const requiresPatientFields = formData.debtorKind === 'patient' && !isNewspaperLead;
      if (!formData.creditor) {
        alert('Please add the client name.');
        return;
      }
      if (!formData.serviceLine) {
        alert('Please specify the service line.');
        return;
      }
      if (!formData.owner) {
        alert('Please assign a collection owner.');
        return;
      }
      if (requiresPatientFields && (!formData.patientName || !formData.patientId)) {
        alert('Please fill patient and payer details for this debt source.');
        return;
      }
      if (!isNewspaperLead && !isContactLead && !formData.payer) {
        alert('Please add payer details for this debt source.');
        return;
      }
      if (
        (isNewspaperLead || isContactLead) &&
        formData.createTrackingAccount &&
        !formData.contactEmail.trim()
      ) {
        alert('Client email is required to create a tracking account.');
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
    setCreatedCredentials(null);

    try {
      let linkedClientId: string | undefined = formData.assignedClientId || undefined;
      let linkedExistingClient = false;
      const shouldCreateTrackingAccount =
        (formData.debtSource === 'newspaper-lead' ||
          formData.debtSource === 'contact-us-lead') &&
        formData.createTrackingAccount;
      const normalizedEmail = formData.contactEmail.trim().toLowerCase();

      if (!linkedClientId && normalizedEmail) {
        const existingClient = await fetchClientByEmail(normalizedEmail);
        if (existingClient) {
          linkedClientId = existingClient.id;
          linkedExistingClient = true;
        }
      }

      if (shouldCreateTrackingAccount && !linkedClientId) {
        const { client, credentials } = await createClientApi({
          clientName: formData.creditor,
          contactName: formData.creditor,
          email: normalizedEmail,
          phone: formData.contactPhone.trim() || undefined,
          region:
            formData.debtSource === 'contact-us-lead'
              ? 'Contact Us lead'
              : 'Newspaper lead',
        });
        linkedClientId = client.id;
        setCreatedCredentials(credentials);
      }

      const now = new Date().toISOString();
      const generatedLeadId = `LEAD-${Date.now().toString().slice(-6)}`;
      const sourceLabel =
        formData.debtSource === 'newspaper-lead'
          ? 'Newspaper lead'
          : formData.debtSource === 'contact-us-lead'
            ? 'Contact Us lead'
          : formData.debtSource === 'client-referral'
            ? 'Client referral'
            : 'Hospital intake';
      const baseNotes = formData.description?.trim() ?? '';
      const sourceNotes = [
        `Source: ${sourceLabel}`,
        linkedClientId ? `Assigned client account ID: ${linkedClientId}` : null,
        formData.contactEmail.trim()
          ? `Client contact email: ${formData.contactEmail.trim()}`
          : null,
        shouldCreateTrackingAccount
          ? 'Tracking account created for this client.'
          : null,
        linkedExistingClient
          ? 'Linked to an existing client account for tracking.'
          : null,
        formData.debtSource === 'contact-us-lead'
          ? `Captured via Contact Us: ${fawaysContact.phones.join(' / ')} | ${fawaysContact.email}`
          : null,
      ]
        .filter(Boolean)
        .join('\n');

      const selectedAgent = agentOptions.find((agent) => agent.name === formData.owner);

      const toUpload = pendingDocuments.filter((d) => d.file);
      for (const row of pendingDocuments) {
        if (row.displayName.trim() && !row.file) {
          alert(`Add a file for the document named "${row.displayName.trim()}" or remove that row.`);
          setIsSubmitting(false);
          return;
        }
      }

      const created = await createDebt({
        clientId: linkedClientId,
        assignedAgentId: selectedAgent?.id,
        creditor: formData.creditor,
        clientType: formData.clientType,
        patientName: formData.patientName.trim() || formData.creditor,
        patientId: formData.patientId.trim() || generatedLeadId,
        serviceLine: formData.serviceLine,
        payer:
          formData.payer.trim() ||
          (formData.debtSource === 'newspaper-lead' ||
          formData.debtSource === 'contact-us-lead'
            ? 'Self-reported lead'
            : 'Not provided'),
        owner: formData.owner,
        stage: formData.stage,
        amount,
        paidAmount,
        dueDate: formData.dueDate,
        status: formData.status,
        description:
          [baseNotes, sourceNotes].filter(Boolean).join('\n\n') || undefined,
        documents: [],
        serviceDate: formData.serviceDate || now.slice(0, 10),
        priority: formData.priority,
      });

      if (toUpload.length > 0) {
        try {
          await uploadDebtDocumentsForDebt(
            created.id,
            toUpload.map((d) => ({
              file: d.file as File,
              displayName: d.displayName.trim() || (d.file as File).name,
            })),
          );
        } catch (uploadErr) {
          console.error(uploadErr);
          alert(
            `The debt was created, but uploading one or more documents failed. You can add files later from the debt detail page once storage is configured (bucket "${DEBT_DOCUMENTS_BUCKET}").`,
          );
        }
      }

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
                Create new debt case
              </p>
              <h1 className="text-3xl font-bold text-slate-900">New Debt Workflow</h1>
              <p className="mt-1 text-sm text-slate-500">
                Capture business or patient debt details in two guided steps.
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
                  Client & Debtor
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
                      Client & debtor context
                    </h2>
                    <p className="text-xs text-slate-500">
                      Record whether this is a patient case or a normal business/client debt.
                    </p>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px]">
                    Step 1 of 2
                  </Badge>
                </div>

                <div className="space-y-4 rounded-2xl bg-slate-50/80 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Debt Source</Label>
                      <select
                        value={formData.debtSource}
                        onChange={(e) => {
                          const nextSource = e.target.value as DebtSource;
                          setFormData((prev) => ({
                            ...prev,
                            debtSource: nextSource,
                            serviceLine:
                              nextSource === 'newspaper-lead'
                                ? 'Newspaper Lead'
                                : prev.serviceLine === 'Newspaper Lead'
                                  ? 'General Recovery'
                                  : prev.serviceLine,
                            createTrackingAccount:
                              nextSource === 'newspaper-lead'
                                ? prev.createTrackingAccount
                                : false,
                          }));
                        }}
                        className="mt-1 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="hospital-intake">Hospital intake</option>
                        <option value="newspaper-lead">Newspaper lead</option>
                        <option value="contact-us-lead">Contact Us lead</option>
                        <option value="client-referral">Client referral</option>
                      </select>
                    </div>
                    {(formData.debtSource === 'newspaper-lead' ||
                      formData.debtSource === 'contact-us-lead') && (
                      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700">
                        Lead case detected. Use minimal intake, then optionally create a tracking
                        account for this client.
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Is this a patient debt?</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, debtorKind: 'patient' }))
                        }
                        className={`h-11 rounded-2xl border text-sm font-medium ${
                          formData.debtorKind === 'patient'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        Yes, patient case
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            debtorKind: 'non-patient',
                            patientId: prev.patientId,
                          }))
                        }
                        className={`h-11 rounded-2xl border text-sm font-medium ${
                          formData.debtorKind === 'non-patient'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        No, business/client debt
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Client details
                  </p>
                  <div className="space-y-2">
                    <Label>Assign to Existing Client Account</Label>
                    <select
                      value={formData.assignedClientId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const selectedClient = clientOptions.find(
                          (client) => client.id === selectedId,
                        );
                        setFormData((prev) => ({
                          ...prev,
                          assignedClientId: selectedId,
                          creditor:
                            selectedClient?.name && !prev.creditor
                              ? selectedClient.name
                              : prev.creditor,
                          contactEmail:
                            selectedClient?.email && !prev.contactEmail
                              ? selectedClient.email
                              : prev.contactEmail,
                          contactPhone:
                            selectedClient?.phone && !prev.contactPhone
                              ? selectedClient.phone
                              : prev.contactPhone,
                        }));
                      }}
                      disabled={isLoadingClients}
                      className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">
                        {isLoadingClients
                          ? 'Loading client accounts...'
                          : 'Unassigned (manual/new client)'}
                      </option>
                      {clientOptions.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name} ({client.email || 'No email'})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500">
                      Select a client account so this debt appears directly in that user&apos;s
                      portal.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>
                        Client Name <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        value={formData.creditor}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, creditor: e.target.value }))
                        }
                        placeholder="e.g. Karanja Traders"
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
                        {formData.debtorKind === 'patient'
                          ? 'Patient Name'
                          : 'Debtor Name'}
                        {(formData.debtSource !== 'newspaper-lead' ||
                          formData.debtorKind === 'non-patient') && (
                          <span className="text-rose-500"> *</span>
                        )}
                    </Label>
                    <Input
                      value={formData.patientName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, patientName: e.target.value }))
                      }
                      placeholder={
                        formData.debtorKind === 'patient'
                          ? 'Full name on claim'
                          : 'Person or company that owes'
                      }
                      required={
                        formData.debtorKind === 'non-patient' ||
                        formData.debtSource !== 'newspaper-lead'
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Patient ID / MRN
                      {(formData.debtorKind === 'patient' ||
                        formData.debtSource !== 'newspaper-lead') && (
                        <span className="text-rose-500"> *</span>
                      )}
                    </Label>
                    <Input
                      value={formData.patientId}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, patientId: e.target.value }))
                      }
                      placeholder={
                        formData.debtorKind === 'patient'
                          ? 'e.g. MRN-88421'
                          : 'e.g. INVOICE-208'
                      }
                      required={
                        formData.debtorKind === 'patient' ||
                        formData.debtSource !== 'newspaper-lead'
                      }
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
                      Insurance
                      {formData.debtorKind === 'patient' &&
                        formData.debtSource !== 'newspaper-lead' && (
                        <span className="text-rose-500"> *</span>
                      )}
                    </Label>
                    <select
                      value={formData.payer}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, payer: e.target.value }))
                      }
                      className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={
                        formData.debtorKind === 'patient' &&
                        formData.debtSource !== 'newspaper-lead'
                      }
                    >
                      <option value="">Select insurance provider</option>
                      {KENYAN_INSURERS.map((insurer) => (
                        <option key={insurer} value={insurer}>
                          {insurer}
                        </option>
                      ))}
                      <option value="Self Pay">Self Pay</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {(formData.debtSource === 'newspaper-lead' ||
                  formData.debtSource === 'contact-us-lead') && (
                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    {formData.debtSource === 'contact-us-lead' && (
                      <div className="rounded-xl bg-white px-3 py-2 text-xs text-slate-600">
                        Contact line: {fawaysContact.phones.join(' / ')} | {fawaysContact.email}
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Client tracking account
                        </p>
                        <p className="text-xs text-slate-500">
                          Create login credentials so this client can track their debt status.
                        </p>
                      </div>
                      <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={formData.createTrackingAccount}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              createTrackingAccount: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        Enable account
                      </label>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>
                          Client Email
                          {formData.createTrackingAccount && (
                            <span className="text-rose-500"> *</span>
                          )}
                        </Label>
                        <Input
                          type="email"
                          value={formData.contactEmail}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))
                          }
                          placeholder="client@example.com"
                          required={formData.createTrackingAccount}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Client Phone</Label>
                        <Input
                          value={formData.contactPhone}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))
                          }
                          placeholder="+254..."
                        />
                      </div>
                    </div>
                    {formData.debtSource === 'contact-us-lead' && (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            contactEmail: prev.contactEmail || fawaysContact.email,
                            contactPhone: prev.contactPhone || fawaysContact.phones[0],
                          }))
                        }
                      >
                        Use Contact Us defaults
                      </Button>
                    )}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Collection Owner</Label>
                    <select
                      value={formData.owner}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, owner: e.target.value }))
                      }
                      disabled={isLoadingAgents}
                      className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">
                        {isLoadingAgents ? 'Loading agents...' : 'Select collection owner'}
                      </option>
                      {agentOptions.map((agent) => (
                        <option key={agent.id} value={agent.name}>
                          {agent.name}
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
                      Confirm amounts, due date, and processing status for this case.
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

                <div className="space-y-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Supporting documents</p>
                      <p className="text-xs text-slate-500">
                        Optional. Name each file, then choose the file to upload with this debt.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() =>
                        setPendingDocuments((prev) => [
                          ...prev,
                          { id: crypto.randomUUID(), displayName: '', file: null },
                        ])
                      }
                    >
                      Add document
                    </Button>
                  </div>
                  {pendingDocuments.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No attachments. Use Add document if you have invoices, letters, or scans.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {pendingDocuments.map((row) => (
                        <div
                          key={row.id}
                          className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-[1fr_1fr_auto]"
                        >
                          <div className="space-y-1">
                            <Label className="text-xs">Document name</Label>
                            <Input
                              placeholder="e.g. Invoice, demand letter"
                              value={row.displayName}
                              onChange={(e) =>
                                setPendingDocuments((prev) =>
                                  prev.map((p) =>
                                    p.id === row.id ? { ...p, displayName: e.target.value } : p,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">File</Label>
                            <Input
                              type="file"
                              accept=".pdf,image/*,.doc,.docx"
                              className="cursor-pointer text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs"
                              onChange={(e) => {
                                const file = e.target.files?.[0] ?? null;
                                setPendingDocuments((prev) =>
                                  prev.map((p) =>
                                    p.id === row.id ? { ...p, file } : p,
                                  ),
                                );
                              }}
                            />
                            {row.file && (
                              <p className="text-[11px] text-slate-500">{row.file.name}</p>
                            )}
                          </div>
                          <div className="flex items-end justify-end md:justify-start">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:text-rose-700"
                              onClick={() =>
                                setPendingDocuments((prev) =>
                                  prev.filter((p) => p.id !== row.id),
                                )
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {createdCredentials && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    Tracking account created for {createdCredentials.email}. Temporary password:{' '}
                    <span className="font-semibold">{createdCredentials.password}</span>
                  </div>
                )}
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

