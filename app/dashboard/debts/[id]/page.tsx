'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import { Debt, DebtStatus, getRemainingAmount } from '../../../types/debt';
import { getCurrentUser } from '../../../lib/auth';
import { fetchDebtById, updateDebt, deleteDebt } from '../../../lib/debts';
import { fetchAgents } from '../../../../lib/agents';
import type { Agent } from '../../../types/agent';
import {
  fetchCollectionsForDebt,
  createCollection,
  DebtCollection,
} from '../../../lib/collections';
import {
  deleteDebtDocument,
  fetchDebtDocumentsWithUrls,
  uploadDebtDocumentsForDebt,
} from '../../../lib/debtDocuments';
import {
  COLLECTION_DOCUMENTS_BUCKET,
  deleteCollectionDocument,
  fetchCollectionDocumentsMap,
  uploadCollectionDocuments,
} from '../../../lib/collectionDocuments';
import type { CollectionAttachment } from '../../../types/collectionDocument';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

type PendingDebtDocument = {
  id: string;
  displayName: string;
  file: File | null;
};

export default function DebtDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const user = getCurrentUser();
  const [debt, setDebt] = useState<Debt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [collections, setCollections] = useState<DebtCollection[]>([]);
  const [isCollectionsLoading, setIsCollectionsLoading] = useState(true);
  const [newCollectionAmount, setNewCollectionAmount] = useState('');
  const [newCollectionDate, setNewCollectionDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [newCollectionInsurance, setNewCollectionInsurance] = useState('');
  const [newCollectionNotes, setNewCollectionNotes] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [pendingDocuments, setPendingDocuments] = useState<PendingDebtDocument[]>([]);
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);
  const [removingDocId, setRemovingDocId] = useState<string | null>(null);
  const [pendingCollectionDocs, setPendingCollectionDocs] = useState<PendingDebtDocument[]>([]);
  const [collectionDocsMap, setCollectionDocsMap] = useState<
    Map<string, CollectionAttachment[]>
  >(new Map());
  const [openCollectionDocFor, setOpenCollectionDocFor] = useState<string | null>(null);
  const [inlineCollectionDocName, setInlineCollectionDocName] = useState('');
  const [inlineCollectionFile, setInlineCollectionFile] = useState<File | null>(null);
  const [uploadingCollectionDocId, setUploadingCollectionDocId] = useState<string | null>(null);
  const [removingCollectionDocId, setRemovingCollectionDocId] = useState<string | null>(null);

  const refreshDocuments = async () => {
    if (!id) return;
    try {
      const documents = await fetchDebtDocumentsWithUrls(id);
      setDebt((prev) => (prev ? { ...prev, documents } : null));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        const data = await fetchDebtById(id);
        setDebt(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id]);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const data = await fetchAgents();
        setAgents(data.filter((agent) => agent.status === 'active'));
      } catch (error) {
        console.error(error);
        setAgents([]);
      }
    };
    loadAgents();
  }, []);

  useEffect(() => {
    if (!id) {
      setIsCollectionsLoading(false);
      return;
    }
    const loadCollections = async () => {
      try {
        const data = await fetchCollectionsForDebt(id);
        setCollections(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsCollectionsLoading(false);
      }
    };
    loadCollections();
  }, [id]);

  useEffect(() => {
    if (collections.length === 0) {
      setCollectionDocsMap(new Map());
      return;
    }
    fetchCollectionDocumentsMap(collections.map((c) => c.id))
      .then(setCollectionDocsMap)
      .catch(console.error);
  }, [collections]);

  const remaining = useMemo(
    () => (debt ? getRemainingAmount(debt) : 0),
    [debt],
  );

  const handleFieldChange = <K extends keyof Debt>(key: K, value: Debt[K]) => {
    if (!debt) return;
    setDebt({ ...debt, [key]: value });
  };

  const handleSave = async () => {
    if (!debt) return;
    setIsSaving(true);
    try {
      await updateDebt(debt.id, {
        creditor: debt.creditor,
        patientName: debt.patientName,
        serviceLine: debt.serviceLine,
        owner: debt.owner,
        assignedAgentId: debt.assignedAgentId,
        amount: debt.amount,
        paidAmount: debt.paidAmount,
        dueDate: debt.dueDate,
        status: debt.status,
        priority: debt.priority,
        description: debt.description,
      });
      router.push('/debts');
    } catch (error) {
      console.error(error);
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!debt) return;
    if (!confirm('Are you sure you want to delete this debt?')) return;
    try {
      await deleteDebt(debt.id);
      router.push('/debts');
    } catch (error) {
      console.error(error);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(value);

  const kenyaInsurers = [
    'Jubilee Health Insurance',
    'AAR Insurance',
    'Britam Insurance',
    'CIC Insurance',
    'APA Insurance',
    'Madison Insurance',
    'UAP Old Mutual',
    'Resolution Insurance',
    'First Assurance',
    'Kenindia Assurance',
  ];

  const handleAddCollection = async () => {
    if (!debt || !id) return;
    const amount = parseFloat(newCollectionAmount);
    if (!amount || amount <= 0) return;

    const toUpload = pendingCollectionDocs.filter((d) => d.file);
    for (const row of pendingCollectionDocs) {
      if (row.displayName.trim() && !row.file) {
        alert(
          `Add a file for "${row.displayName.trim()}" or remove that attachment row.`,
        );
        return;
      }
    }

    try {
      const created = await createCollection({
        debtId: id,
        amount,
        collectionDate: newCollectionDate,
        insuranceName: newCollectionInsurance || null,
        notes: newCollectionNotes || null,
      });

      if (toUpload.length > 0) {
        try {
          await uploadCollectionDocuments(
            created.id,
            toUpload.map((d) => ({
              file: d.file as File,
              displayName: d.displayName.trim() || (d.file as File).name,
            })),
          );
        } catch (uploadErr) {
          console.error(uploadErr);
          const detail =
            uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
          alert(
            `Collection was recorded, but uploading proof failed.\n\n${detail}\n\nYou can add files from the history row. Bucket: "${COLLECTION_DOCUMENTS_BUCKET}".`,
          );
        }
      }

      setCollections((prev) => [created, ...prev]);
      setPendingCollectionDocs([]);

      const nextPaid = debt.paidAmount + amount;
      const nextStatus =
        nextPaid >= debt.amount ? ('paid' as DebtStatus) : debt.status;

      setDebt({
        ...debt,
        paidAmount: nextPaid,
        status: nextStatus,
      });

      await updateDebt(id, { paidAmount: nextPaid, status: nextStatus });

      setNewCollectionAmount('');
      setNewCollectionNotes('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleUploadInlineCollectionDoc = async (collectionId: string) => {
    if (!inlineCollectionFile) {
      alert('Choose a file.');
      return;
    }
    setUploadingCollectionDocId(collectionId);
    try {
      await uploadCollectionDocuments(collectionId, [
        {
          file: inlineCollectionFile,
          displayName: inlineCollectionDocName.trim() || inlineCollectionFile.name,
        },
      ]);
      setOpenCollectionDocFor(null);
      setInlineCollectionDocName('');
      setInlineCollectionFile(null);
      const m = await fetchCollectionDocumentsMap(collections.map((c) => c.id));
      setCollectionDocsMap(m);
    } catch (e) {
      console.error(e);
      const detail = e instanceof Error ? e.message : String(e);
      alert(`Upload failed.\n\n${detail}`);
    } finally {
      setUploadingCollectionDocId(null);
    }
  };

  const handleRemoveCollectionDoc = async (documentId: string, label: string) => {
    if (!confirm(`Remove "${label}"?`)) return;
    setRemovingCollectionDocId(documentId);
    try {
      await deleteCollectionDocument(documentId);
      const m = await fetchCollectionDocumentsMap(collections.map((c) => c.id));
      setCollectionDocsMap(m);
    } catch (e) {
      console.error(e);
      alert('Could not remove document.');
    } finally {
      setRemovingCollectionDocId(null);
    }
  };

  const handleUploadPendingDocuments = async () => {
    if (!id) return;
    const toUpload = pendingDocuments.filter((d) => d.file);
    for (const row of pendingDocuments) {
      if (row.displayName.trim() && !row.file) {
        alert(
          `Add a file for the document named "${row.displayName.trim()}" or remove that row.`,
        );
        return;
      }
    }
    if (toUpload.length === 0) {
      alert('Add at least one file to upload.');
      return;
    }

    setIsUploadingDocs(true);
    try {
      await uploadDebtDocumentsForDebt(
        id,
        toUpload.map((d) => ({
          file: d.file as File,
          displayName: d.displayName.trim() || (d.file as File).name,
        })),
      );
      setPendingDocuments([]);
      await refreshDocuments();
    } catch (error) {
      console.error(error);
      alert('Upload failed. Check storage permissions and the debt-documents bucket.');
    } finally {
      setIsUploadingDocs(false);
    }
  };

  const handleRemoveDocument = async (documentId: string, label: string) => {
    if (!confirm(`Remove "${label}" from this debt? The file will be deleted permanently.`)) {
      return;
    }
    setRemovingDocId(documentId);
    try {
      await deleteDebtDocument(documentId);
      await refreshDocuments();
    } catch (error) {
      console.error(error);
      alert('Could not remove that document. Try again or check your permissions.');
    } finally {
      setRemovingDocId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Debt detail
              </p>
              <h1 className="text-3xl font-bold text-slate-900">
                {debt ? debt.patientName : 'Loading debt...'}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {debt?.creditor
                  ? `Outstanding balance with ${debt.creditor}.`
                  : 'Review and update this case in one view.'}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Stage:</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-800">
                  {debt?.stage ?? '—'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Status:</span>
                {debt && (
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      debt.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700'
                        : debt.status === 'pending'
                        ? 'bg-amber-50 text-amber-700'
                        : debt.status === 'overdue'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-sky-50 text-sky-700'
                    }`}
                  >
                    {debt.status === 'negotiating'
                      ? 'Negotiating'
                      : debt.status === 'paid'
                      ? 'Completed'
                      : debt.status.charAt(0).toUpperCase() +
                        debt.status.slice(1)}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500">
                Signed in as {user?.name ?? 'Client user'}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-8">
          {isLoading || !debt ? (
            <p className="text-sm text-slate-500">Loading debt details...</p>
          ) : (
            <div className="mx-auto max-w-6xl space-y-6">
              {/* Summary strip */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total exposure
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {formatCurrency(debt.amount)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Collected {formatCurrency(debt.paidAmount)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Remaining
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-rose-600">
                    {formatCurrency(remaining)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Due {new Date(debt.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Routing
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    Owner: {debt.owner || 'Unassigned'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Service line: {debt.serviceLine || '—'}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <Tabs defaultValue="overview">
                  <TabsList className="mb-4 flex flex-wrap gap-2">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="financials">Financials</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                  </TabsList>

                  {/* Overview */}
                  <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Healthcare Client</Label>
                        <Input
                          value={debt.creditor}
                          onChange={(e) =>
                            handleFieldChange('creditor', e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Patient / Debtor</Label>
                        <Input
                          value={debt.patientName}
                          onChange={(e) =>
                            handleFieldChange('patientName', e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Service Line</Label>
                        <Input
                          value={debt.serviceLine}
                          onChange={(e) =>
                            handleFieldChange('serviceLine', e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Collection Owner</Label>
                        <select
                          value={debt.assignedAgentId ?? ''}
                          onChange={(e) => {
                            const selected = agents.find((agent) => agent.id === e.target.value);
                            handleFieldChange('assignedAgentId', selected?.id);
                            handleFieldChange('owner', selected?.name ?? '');
                          }}
                          className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select collection owner</option>
                          {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Case notes</Label>
                      <Textarea
                        rows={4}
                        placeholder="Add escalation notes, payer responses or internal context..."
                        value={debt.description ?? ''}
                        onChange={(e) =>
                          handleFieldChange('description', e.target.value)
                        }
                      />
                    </div>
                  </TabsContent>

                  {/* Financials */}
                  <TabsContent value="financials" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Invoice Amount</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={debt.amount}
                          onChange={(e) =>
                            handleFieldChange(
                              'amount',
                              Number(e.target.value) || 0,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Collected to Date</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={debt.paidAmount}
                          onChange={(e) =>
                            handleFieldChange(
                              'paidAmount',
                              Number(e.target.value) || 0,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          value={debt.dueDate}
                          onChange={(e) =>
                            handleFieldChange('dueDate', e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <select
                          value={debt.status}
                          onChange={(e) =>
                            handleFieldChange(
                              'status',
                              e.target.value as DebtStatus,
                            )
                          }
                          className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="negotiating">Negotiating</option>
                          <option value="overdue">Overdue</option>
                          <option value="paid">Paid</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <select
                          value={debt.priority}
                          onChange={(e) =>
                            handleFieldChange(
                              'priority',
                              e.target.value as Debt['priority'],
                            )
                          }
                          className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Activity / Collections */}
                  <TabsContent value="activity" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Collections history
                        </p>
                        {isCollectionsLoading ? (
                          <p className="text-sm text-slate-500">
                            Loading collections...
                          </p>
                        ) : collections.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            No collections recorded for this debt yet.
                          </p>
                        ) : (
                          <div className="overflow-hidden rounded-2xl border border-slate-200">
                            <table className="min-w-full text-sm">
                              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                  <th className="px-4 py-3 text-left">
                                    Date
                                  </th>
                                  <th className="px-4 py-3 text-left">
                                    Insurance
                                  </th>
                                  <th className="px-4 py-3 text-left">
                                    Amount
                                  </th>
                                  <th className="px-4 py-3 text-left">
                                    Notes
                                  </th>
                                  <th className="min-w-[200px] px-4 py-3 text-left">
                                    Proof / documents
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {collections.map((c) => {
                                  const docs = collectionDocsMap.get(c.id) ?? [];
                                  const isOpen = openCollectionDocFor === c.id;
                                  return (
                                    <tr
                                      key={c.id}
                                      className="border-t border-slate-100 align-top"
                                    >
                                      <td className="px-4 py-2 align-middle text-xs text-slate-700">
                                        {new Date(
                                          c.collectionDate,
                                        ).toLocaleDateString()}
                                      </td>
                                      <td className="px-4 py-2 align-middle text-xs text-slate-700">
                                        {c.insuranceName || '—'}
                                      </td>
                                      <td className="px-4 py-2 align-middle text-xs font-semibold text-slate-900">
                                        {formatCurrency(c.amount)}
                                      </td>
                                      <td className="px-4 py-2 align-middle text-xs text-slate-500">
                                        {c.notes || '—'}
                                      </td>
                                      <td className="px-4 py-2 text-xs">
                                        <div className="space-y-2">
                                          {docs.length > 0 && (
                                            <ul className="space-y-1">
                                              {docs.map((doc) => (
                                                <li
                                                  key={doc.id}
                                                  className="flex flex-wrap items-center gap-1"
                                                >
                                                  {doc.url ? (
                                                    <a
                                                      href={doc.url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="font-medium text-blue-600 hover:underline"
                                                    >
                                                      {doc.name}
                                                    </a>
                                                  ) : (
                                                    <span className="text-slate-600">{doc.name}</span>
                                                  )}
                                                  <button
                                                    type="button"
                                                    className="text-rose-600 hover:underline"
                                                    disabled={removingCollectionDocId === doc.id}
                                                    onClick={() =>
                                                      handleRemoveCollectionDoc(doc.id, doc.name)
                                                    }
                                                  >
                                                    {removingCollectionDocId === doc.id
                                                      ? '…'
                                                      : 'Remove'}
                                                  </button>
                                                </li>
                                              ))}
                                            </ul>
                                          )}
                                          {isOpen ? (
                                            <div className="rounded-lg border border-slate-200 bg-white p-2 space-y-2">
                                              <Input
                                                placeholder="Document name"
                                                value={inlineCollectionDocName}
                                                onChange={(e) =>
                                                  setInlineCollectionDocName(e.target.value)
                                                }
                                                className="h-8 text-xs"
                                              />
                                              <Input
                                                type="file"
                                                className="cursor-pointer text-xs"
                                                onChange={(e) =>
                                                  setInlineCollectionFile(e.target.files?.[0] ?? null)
                                                }
                                              />
                                              <div className="flex flex-wrap gap-1">
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  className="h-7 text-[10px]"
                                                  disabled={uploadingCollectionDocId === c.id}
                                                  onClick={() => handleUploadInlineCollectionDoc(c.id)}
                                                >
                                                  {uploadingCollectionDocId === c.id
                                                    ? 'Uploading…'
                                                    : 'Upload'}
                                                </Button>
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-7 text-[10px]"
                                                  onClick={() => {
                                                    setOpenCollectionDocFor(null);
                                                    setInlineCollectionDocName('');
                                                    setInlineCollectionFile(null);
                                                  }}
                                                >
                                                  Cancel
                                                </Button>
                                              </div>
                                            </div>
                                          ) : (
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              className="h-7 text-[10px] rounded-lg"
                                              onClick={() => {
                                                setOpenCollectionDocFor(c.id);
                                                setInlineCollectionDocName('');
                                                setInlineCollectionFile(null);
                                              }}
                                            >
                                              + Add proof
                                            </Button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Add collection
                        </p>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Amount collected</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={newCollectionAmount}
                              onChange={(e) =>
                                setNewCollectionAmount(e.target.value)
                              }
                              placeholder="e.g. 5000"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Collection date</Label>
                            <Input
                              type="date"
                              value={newCollectionDate}
                              onChange={(e) =>
                                setNewCollectionDate(e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Insurance</Label>
                            <select
                              value={newCollectionInsurance}
                              onChange={(e) =>
                                setNewCollectionInsurance(e.target.value)
                              }
                              className="h-10 w-full rounded-2xl border border-slate-300 px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select insurer</option>
                              {kenyaInsurers.map((name) => (
                                <option key={name} value={name}>
                                  {name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Notes</Label>
                            <Textarea
                              rows={2}
                              value={newCollectionNotes}
                              onChange={(e) =>
                                setNewCollectionNotes(e.target.value)
                              }
                              placeholder="e.g. First remittance from insurer after appeal."
                            />
                          </div>
                          <div className="space-y-2 rounded-xl border border-dashed border-slate-200 bg-white p-3">
                            <div className="flex items-center justify-between gap-2">
                              <Label className="text-xs">Proof (optional)</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px]"
                                onClick={() =>
                                  setPendingCollectionDocs((prev) => [
                                    ...prev,
                                    {
                                      id: crypto.randomUUID(),
                                      displayName: '',
                                      file: null,
                                    },
                                  ])
                                }
                              >
                                + Row
                              </Button>
                            </div>
                            {pendingCollectionDocs.map((row) => (
                              <div
                                key={row.id}
                                className="grid gap-2 border-t border-slate-100 pt-2 first:border-t-0 first:pt-0"
                              >
                                <Input
                                  placeholder="Name (e.g. Remittance slip)"
                                  value={row.displayName}
                                  onChange={(e) =>
                                    setPendingCollectionDocs((prev) =>
                                      prev.map((p) =>
                                        p.id === row.id
                                          ? { ...p, displayName: e.target.value }
                                          : p,
                                      ),
                                    )
                                  }
                                  className="h-8 text-xs"
                                />
                                <Input
                                  type="file"
                                  className="cursor-pointer text-xs"
                                  onChange={(e) =>
                                    setPendingCollectionDocs((prev) =>
                                      prev.map((p) =>
                                        p.id === row.id
                                          ? { ...p, file: e.target.files?.[0] ?? null }
                                          : p,
                                      ),
                                    )
                                  }
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 justify-start text-[10px] text-rose-600"
                                  onClick={() =>
                                    setPendingCollectionDocs((prev) =>
                                      prev.filter((p) => p.id !== row.id),
                                    )
                                  }
                                >
                                  Remove row
                                </Button>
                              </div>
                            ))}
                            <p className="text-[10px] text-slate-500">
                              Files upload after the collection is saved (bucket:{' '}
                              {COLLECTION_DOCUMENTS_BUCKET}).
                            </p>
                          </div>
                          <Button
                            type="button"
                            className="w-full rounded-2xl text-xs"
                            onClick={handleAddCollection}
                            disabled={!newCollectionAmount}
                          >
                            Record collection
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="documents" className="space-y-6">
                    <p className="text-xs text-slate-500">
                      Open links stay valid for several hours; refresh the page if a download expires.
                    </p>

                    <div className="space-y-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Add documents</p>
                          <p className="text-xs text-slate-500">
                            Name each file, choose the file, then upload.
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
                          Add row
                        </Button>
                      </div>
                      {pendingDocuments.length > 0 && (
                        <div className="space-y-3">
                          {pendingDocuments.map((row) => (
                            <div
                              key={row.id}
                              className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-[1fr_1fr_auto]"
                            >
                              <div className="space-y-1">
                                <Label className="text-xs">Document name</Label>
                                <Input
                                  placeholder="e.g. Demand letter"
                                  value={row.displayName}
                                  onChange={(e) =>
                                    setPendingDocuments((prev) =>
                                      prev.map((p) =>
                                        p.id === row.id
                                          ? { ...p, displayName: e.target.value }
                                          : p,
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
                                  disabled={isUploadingDocs}
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
                                  disabled={isUploadingDocs}
                                  onClick={() =>
                                    setPendingDocuments((prev) =>
                                      prev.filter((p) => p.id !== row.id),
                                    )
                                  }
                                >
                                  Remove row
                                </Button>
                              </div>
                            </div>
                          ))}
                          <Button
                            type="button"
                            className="rounded-xl"
                            disabled={isUploadingDocs}
                            onClick={handleUploadPendingDocuments}
                          >
                            {isUploadingDocs ? 'Uploading...' : 'Upload documents'}
                          </Button>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        On file
                      </p>
                      {!debt.documents?.length ? (
                        <p className="text-sm text-slate-500">
                          No documents on file for this debt yet.
                        </p>
                      ) : (
                        <ul className="space-y-3">
                          {debt.documents.map((doc) => (
                            <li
                              key={doc.id}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {doc.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {doc.size} ·{' '}
                                  {new Date(doc.uploadedAt).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex shrink-0 flex-wrap items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] uppercase"
                                >
                                  {doc.type === 'other' ? 'file' : doc.type}
                                </Badge>
                                {doc.url ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl text-xs"
                                    asChild
                                  >
                                    <a
                                      href={doc.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      Open
                                    </a>
                                  </Button>
                                ) : (
                                  <span className="text-xs text-amber-600">
                                    Link unavailable
                                  </span>
                                )}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="rounded-xl border-rose-200 text-xs text-rose-600 hover:bg-rose-50"
                                  disabled={removingDocId === doc.id}
                                  onClick={() => handleRemoveDocument(doc.id, doc.name)}
                                >
                                  {removingDocId === doc.id ? 'Removing...' : 'Remove'}
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push('/debts')}
                >
                  Back to list
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl text-rose-600 hover:bg-rose-50"
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                  <Button
                    type="button"
                    className="rounded-2xl px-6"
                    disabled={isSaving}
                    onClick={handleSave}
                  >
                    {isSaving ? 'Saving...' : 'Save changes'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}