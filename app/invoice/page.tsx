'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { CalendarRange, Download, FileSpreadsheet, Filter, Paperclip, RotateCw, Search, X } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { fetchClients } from '../lib/clients';
import type { Client } from '../types/client';
import {
  commissionForRow,
  fetchCollectionsForInvoice,
  type CollectionInvoiceRow,
} from '../lib/commissions';
import {
  CommissionInvoiceClientError,
  createCommissionInvoicesFromLineItems,
  deleteCommissionInvoice,
  fetchCollectionToInvoiceMap,
  listCommissionInvoices,
  mergeCommissionInvoices,
} from '../lib/commissionInvoices';
import { fetchCollectionDocumentsMap } from '../lib/collectionDocuments';
import type { CollectionAttachment } from '../types/collectionDocument';
import type { CommissionInvoiceSummary } from '../types/commissionInvoice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';

type BillingFilter = 'all' | 'uninvoiced' | 'invoiced';
type InvoiceSection = 'all' | 'billing' | 'collections' | 'saved';

type CollectionLine = {
  row: CollectionInvoiceRow;
  client: Client | undefined;
  commission: number;
  invoiceLink: { invoiceId: string; reference: string } | undefined;
};

type ClientBillingSummary = {
  clientKey: string;
  clientId: string | null;
  clientName: string;
  commissionRate: string;
  collectionCount: number;
  recovered: number;
  commission: number;
  periodStart: string;
  periodEnd: string;
  collectionIds: string[];
};

function formatKes(n: number) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatRate(client: Client | undefined): string {
  if (!client) return 'No rate';
  if (client.recoveryCommissionType === 'flat') {
    const flat = client.recoveryCommissionFlat;
    return flat != null && flat > 0 ? `${formatKes(flat)} / collection` : 'No rate';
  }
  const percent = client.recoveryCommissionPercent;
  return percent != null && percent > 0 ? `${percent}%` : 'No rate';
}

function csvEscape(cell: string) {
  return `"${String(cell ?? '').replace(/"/g, '""')}"`;
}

function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function reportDateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function CollectionProofLinks({
  collectionId,
  docsMap,
}: {
  collectionId: string;
  docsMap: Map<string, CollectionAttachment[]>;
}) {
  const docs = docsMap.get(collectionId) ?? [];
  if (docs.length === 0) return <span className="text-xs text-slate-400">No proof</span>;

  return (
    <div className="flex max-w-[220px] flex-col gap-1">
      {docs.map((doc) =>
        doc.url ? (
          <a
            key={doc.id}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-xs font-medium text-blue-700 underline-offset-2 hover:underline"
          >
            {doc.name}
          </a>
        ) : (
          <span key={doc.id} className="truncate text-xs text-slate-600" title="Signed URL unavailable">
            {doc.name}
          </span>
        ),
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="rounded-xl border-slate-200 shadow-sm">
      <CardContent className="space-y-3 p-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-4 flex-1 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function InvoicePage({
  initialSection = 'all',
}: {
  initialSection?: InvoiceSection;
} = {}) {
  const router = useRouter();
  const showBilling = initialSection === 'all' || initialSection === 'billing';
  const showCollections = initialSection === 'all' || initialSection === 'collections';
  const showInvoices = initialSection === 'all' || initialSection === 'saved';
  const sectionTitle =
    initialSection === 'billing'
      ? 'Client billing'
      : initialSection === 'collections'
        ? 'Collections to invoice'
        : initialSection === 'saved'
          ? 'Saved invoices'
          : 'Client invoicing';
  const sectionDescription =
    initialSection === 'billing'
      ? 'See what each client should be invoiced for and export billing reports.'
      : initialSection === 'collections'
        ? 'Review recovery collections, proof documents, and create commission invoices.'
        : initialSection === 'saved'
          ? 'Open formal commission invoices, check payment status, and download invoice files.'
          : 'Start with the client billing summary, review the underlying collections, then create and share a formal commission invoice.';
  const [clients, setClients] = useState<Client[]>([]);
  const [rows, setRows] = useState<CollectionInvoiceRow[]>([]);
  const [collectionToInvoice, setCollectionToInvoice] = useState<
    Map<string, { invoiceId: string; reference: string }>
  >(new Map());
  const [savedInvoices, setSavedInvoices] = useState<CommissionInvoiceSummary[]>([]);
  const [collectionDocsMap, setCollectionDocsMap] = useState<Map<string, CollectionAttachment[]>>(
    () => new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [billingFilter, setBillingFilter] = useState<BillingFilter>('all');
  const [clientFilter, setClientFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);
  const [mergingInvoices, setMergingInvoices] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [clientList, collectionRows, invMap, invoices] = await Promise.all([
        fetchClients(),
        fetchCollectionsForInvoice(),
        fetchCollectionToInvoiceMap(),
        listCommissionInvoices(),
      ]);
      setClients(clientList);
      setRows(collectionRows);
      setCollectionToInvoice(invMap);
      setSavedInvoices(invoices);

      const collectionIds = collectionRows.map((r) => r.collectionId);
      if (collectionIds.length > 0) {
        try {
          setCollectionDocsMap(await fetchCollectionDocumentsMap(collectionIds));
        } catch (docErr) {
          console.error('Collection proof documents', docErr);
          setCollectionDocsMap(new Map());
        }
      } else {
        setCollectionDocsMap(new Map());
      }
    } catch (e) {
      console.error(e);
      setCollectionDocsMap(new Map());
      setError('Could not load invoicing data. Check migrations and Supabase permissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const resetFilters = useCallback(() => {
    setFromDate('');
    setToDate('');
    setClientFilter('');
    setSearchQuery('');
    setBillingFilter('all');
    setInvoiceStatusFilter('all');
  }, []);

  const clientsById = useMemo(() => {
    const map = new Map<string, Client>();
    clients.forEach((client) => map.set(client.id, client));
    return map;
  }, [clients]);

  const allCollectionLines = useMemo((): CollectionLine[] => {
    return rows.map((row) => {
      const client = row.clientId ? clientsById.get(row.clientId) : undefined;
      return {
        row,
        client,
        commission: commissionForRow(row, clientsById),
        invoiceLink: collectionToInvoice.get(row.collectionId),
      };
    });
  }, [rows, clientsById, collectionToInvoice]);

  const dateFilteredCollectionLines = useMemo(() => {
    return allCollectionLines.filter(({ row }) => {
      const d = row.collectionDate.slice(0, 10);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    });
  }, [allCollectionLines, fromDate, toDate]);

  const filteredCollectionLines = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return dateFilteredCollectionLines.filter((line) => {
      if (clientFilter && line.row.clientId !== clientFilter) return false;
      if (billingFilter === 'uninvoiced' && line.invoiceLink) return false;
      if (billingFilter === 'invoiced' && !line.invoiceLink) return false;
      if (query) {
        const hay = `${line.client?.name ?? ''} ${line.row.creditorName} ${line.row.debtorName} ${line.invoiceLink?.reference ?? ''}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [dateFilteredCollectionLines, clientFilter, billingFilter, searchQuery]);

  const filteredInvoices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return savedInvoices.filter((invoice) => {
      if (invoiceStatusFilter === 'paid' && invoice.status !== 'paid') return false;
      if (invoiceStatusFilter === 'unpaid' && invoice.status === 'paid') return false;
      if (clientFilter && invoice.clientId !== clientFilter) return false;
      if (fromDate && invoice.periodEnd < fromDate) return false;
      if (toDate && invoice.periodStart > toDate) return false;
      if (query) {
        const hay = `${invoice.reference} ${invoice.clientName ?? ''} ${invoice.periodStart} ${invoice.periodEnd}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [savedInvoices, invoiceStatusFilter, clientFilter, fromDate, toDate, searchQuery]);

  const uninvoicedLinesForBilling = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return dateFilteredCollectionLines.filter((line) => {
      if (line.invoiceLink) return false;
      if (clientFilter && line.row.clientId !== clientFilter) return false;
      if (query) {
        const hay = `${line.client?.name ?? ''} ${line.row.creditorName} ${line.row.debtorName}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [dateFilteredCollectionLines, clientFilter, searchQuery]);

  const clientBillingSummaries = useMemo((): ClientBillingSummary[] => {
    const grouped = new Map<string, Omit<ClientBillingSummary, 'clientKey'>>();

    for (const line of uninvoicedLinesForBilling) {
      const clientId = line.row.clientId ?? null;
      const clientKey = clientId ?? '__no_client__';
      const date = line.row.collectionDate.slice(0, 10);
      const existing = grouped.get(clientKey);

      if (!existing) {
        grouped.set(clientKey, {
          clientId,
          clientName: line.client?.name ?? 'No linked client',
          commissionRate: formatRate(line.client),
          collectionCount: 1,
          recovered: line.row.amount,
          commission: line.commission,
          periodStart: date,
          periodEnd: date,
          collectionIds: [line.row.collectionId],
        });
        continue;
      }

      existing.collectionCount += 1;
      existing.recovered += line.row.amount;
      existing.commission += line.commission;
      existing.periodStart = existing.periodStart < date ? existing.periodStart : date;
      existing.periodEnd = existing.periodEnd > date ? existing.periodEnd : date;
      existing.collectionIds.push(line.row.collectionId);
    }

    return Array.from(grouped.entries())
      .map(([clientKey, summary]) => ({ clientKey, ...summary }))
      .sort((a, b) => b.commission - a.commission);
  }, [uninvoicedLinesForBilling]);

  const clientBillingTotals = useMemo(() => {
    return clientBillingSummaries.reduce(
      (acc, summary) => {
        acc.recovered += summary.recovered;
        acc.commission += summary.commission;
        acc.collections += summary.collectionCount;
        return acc;
      },
      { recovered: 0, commission: 0, collections: 0 },
    );
  }, [clientBillingSummaries]);

  const collectionTotals = useMemo(() => {
    return filteredCollectionLines.reduce(
      (acc, line) => {
        acc.recovered += line.row.amount;
        acc.commission += line.commission;
        if (!line.invoiceLink) acc.uninvoiced += 1;
        return acc;
      },
      { recovered: 0, commission: 0, uninvoiced: 0 },
    );
  }, [filteredCollectionLines]);

  const invoiceTotals = useMemo(() => {
    return filteredInvoices.reduce(
      (acc, invoice) => {
        acc.recovered += invoice.totalRecovered;
        acc.commission += invoice.totalCommission;
        if (invoice.status === 'paid') acc.paid += 1;
        else acc.unpaid += 1;
        return acc;
      },
      { recovered: 0, commission: 0, paid: 0, unpaid: 0 },
    );
  }, [filteredInvoices]);

  const selectedSavedInvoices = useMemo(
    () => filteredInvoices.filter((invoice) => selectedInvoiceIds.has(invoice.id)),
    [filteredInvoices, selectedInvoiceIds],
  );

  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(invoiceId)) next.delete(invoiceId);
      else next.add(invoiceId);
      return next;
    });
  };

  const handleDeleteSavedInvoice = async (invoice: CommissionInvoiceSummary) => {
    if (deletingInvoiceId) return;

    if (
      !confirm(
        `Delete invoice ${invoice.reference}?\n\nCollections on this invoice will become uninvoiced again. Attachments will be removed. This cannot be undone.`,
      )
    ) {
      return;
    }

    setDeletingInvoiceId(invoice.id);
    try {
      await deleteCommissionInvoice(invoice.id);
      setSelectedInvoiceIds((prev) => {
        const next = new Set(prev);
        next.delete(invoice.id);
        return next;
      });
      await refresh();
    } catch (e) {
      console.error(e);
      const message =
        e instanceof CommissionInvoiceClientError
          ? e.message
          : 'Could not delete this invoice.';
      alert(message);
    } finally {
      setDeletingInvoiceId(null);
    }
  };

  const handleMergeSavedInvoices = async () => {
    if (mergingInvoices || selectedSavedInvoices.length < 2) return;

    const clientNames = [...new Set(selectedSavedInvoices.map((inv) => inv.clientName ?? 'No client'))];
    if (clientNames.length > 1) {
      alert('Selected invoices must belong to the same client to merge.');
      return;
    }

    const paid = selectedSavedInvoices.filter((inv) => inv.status === 'paid');
    if (paid.length > 0) {
      alert('Paid invoices cannot be merged. Mark them unpaid first.');
      return;
    }

    const sorted = [...selectedSavedInvoices].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const keep = sorted[0];
    const remove = sorted.slice(1);
    const combinedRecovered = selectedSavedInvoices.reduce((sum, inv) => sum + inv.totalRecovered, 0);
    const combinedCommission = selectedSavedInvoices.reduce((sum, inv) => sum + inv.totalCommission, 0);

    if (
      !confirm(
        `Merge ${selectedSavedInvoices.length} invoices into ${keep.reference}?\n\n` +
          `Client: ${clientNames[0]}\n` +
          `Combined recovered: ${formatKes(combinedRecovered)}\n` +
          `Combined commission: ${formatKes(combinedCommission)}\n\n` +
          `These invoices will be removed:\n${remove.map((inv) => `• ${inv.reference}`).join('\n')}\n\n` +
          `All line items and attachments will move to ${keep.reference}.`,
      )
    ) {
      return;
    }

    setMergingInvoices(true);
    try {
      const result = await mergeCommissionInvoices(
        selectedSavedInvoices.map((inv) => inv.id),
        keep.id,
      );
      setSelectedInvoiceIds(new Set());
      await refresh();
      router.push(`/invoice/${result.mergedInvoiceId}`);
    } catch (e) {
      console.error(e);
      const message =
        e instanceof CommissionInvoiceClientError
          ? e.message
          : 'Could not merge invoices.';
      alert(message);
    } finally {
      setMergingInvoices(false);
    }
  };

  const selectedItems = useMemo(() => {
    return dateFilteredCollectionLines.filter(
      (line) => !line.invoiceLink && selectedIds.has(line.row.collectionId),
    );
  }, [dateFilteredCollectionLines, selectedIds]);

  const selectedTotals = useMemo(() => {
    return selectedItems.reduce(
      (acc, line) => {
        acc.recovered += line.row.amount;
        acc.commission += line.commission;
        return acc;
      },
      { recovered: 0, commission: 0 },
    );
  }, [selectedItems]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (fromDate) count += 1;
    if (toDate) count += 1;
    if (clientFilter) count += 1;
    if (searchQuery.trim()) count += 1;
    if (billingFilter !== 'all') count += 1;
    if (invoiceStatusFilter !== 'all') count += 1;
    return count;
  }, [fromDate, toDate, clientFilter, searchQuery, billingFilter, invoiceStatusFilter]);

  const filterChips = useMemo(() => {
    const chips: { id: string; label: string; onRemove: () => void }[] = [];
    if (fromDate) chips.push({ id: 'from', label: `From ${fromDate}`, onRemove: () => setFromDate('') });
    if (toDate) chips.push({ id: 'to', label: `To ${toDate}`, onRemove: () => setToDate('') });
    if (clientFilter) {
      chips.push({
        id: 'client',
        label: clientsById.get(clientFilter)?.name ?? 'Client',
        onRemove: () => setClientFilter(''),
      });
    }
    if (billingFilter !== 'all') {
      chips.push({
        id: 'billing',
        label: billingFilter === 'uninvoiced' ? 'Collections not invoiced' : 'Collections invoiced',
        onRemove: () => setBillingFilter('all'),
      });
    }
    if (invoiceStatusFilter !== 'all') {
      chips.push({
        id: 'status',
        label: invoiceStatusFilter === 'paid' ? 'Paid invoices' : 'Unpaid invoices',
        onRemove: () => setInvoiceStatusFilter('all'),
      });
    }
    if (searchQuery.trim()) {
      chips.push({
        id: 'search',
        label: `Search: ${searchQuery.trim().slice(0, 22)}`,
        onRemove: () => setSearchQuery(''),
      });
    }
    return chips;
  }, [fromDate, toDate, clientFilter, clientsById, billingFilter, invoiceStatusFilter, searchQuery]);

  const clientBillingReportRecords = useMemo(() => {
    return clientBillingSummaries.map((summary) => ({
      Client: summary.clientName,
      'Commission rate': summary.commissionRate,
      'Uninvoiced collections': summary.collectionCount,
      'Period start': summary.periodStart,
      'Period end': summary.periodEnd,
      Recovered: summary.recovered,
      'Commission due': summary.commission,
    }));
  }, [clientBillingSummaries]);

  const collectionReportRecords = useMemo(() => {
    return filteredCollectionLines.map((line) => ({
      Type: 'Collection',
      Date: line.row.collectionDate.slice(0, 10),
      Client: line.client?.name ?? '',
      Case: `${line.row.creditorName}${line.row.debtorName ? ` - ${line.row.debtorName}` : ''}`,
      Recovered: line.row.amount,
      Commission: line.commission,
      Rate: formatRate(line.client),
      Status: line.invoiceLink ? `On ${line.invoiceLink.reference}` : 'Not invoiced',
      Proof: (collectionDocsMap.get(line.row.collectionId) ?? []).map((d) => d.name).join('; '),
    }));
  }, [filteredCollectionLines, collectionDocsMap]);

  const invoiceReportRecords = useMemo(() => {
    return filteredInvoices.map((invoice) => ({
      Type: 'Saved invoice',
      Date: invoice.createdAt.slice(0, 10),
      Reference: invoice.reference,
      Client: invoice.clientName ?? '',
      Period: `${invoice.periodStart} to ${invoice.periodEnd}`,
      Recovered: invoice.totalRecovered,
      Commission: invoice.totalCommission,
      Status: invoice.status === 'paid' ? 'Paid' : 'Unpaid',
      Link: `/invoice/${invoice.id}`,
    }));
  }, [filteredInvoices]);

  const toggleId = (collectionId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(collectionId)) next.delete(collectionId);
      else next.add(collectionId);
      return next;
    });
  };

  const selectVisibleUninvoiced = () => {
    setSelectedIds(
      new Set(filteredCollectionLines.filter((line) => !line.invoiceLink).map((line) => line.row.collectionId)),
    );
  };

  const clearSelection = () => setSelectedIds(new Set());

  const reviewClientDraft = (summary: ClientBillingSummary) => {
    setSelectedIds(new Set(summary.collectionIds));
    setClientFilter(summary.clientId ?? '');
    setBillingFilter('uninvoiced');
    setInvoiceStatusFilter('all');
  };

  const createInvoiceFromLines = async (lines: CollectionLine[]) => {
    if (lines.length === 0) {
      alert('Select at least one uninvoiced collection.');
      return;
    }
    setCreating(true);
    try {
      const created = await createCommissionInvoicesFromLineItems(
        lines.map((line) => ({ row: line.row, commission: line.commission })),
      );
      setSelectedIds(new Set());
      await refresh();
      if (created.length === 1 && created[0]) router.push(`/invoice/${created[0]}`);
      else if (created.length > 1) alert(`Created ${created.length} invoices, one per client.`);
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateSelectedInvoices = () => createInvoiceFromLines(selectedItems);

  const handleCreateClientInvoice = (summary: ClientBillingSummary) => {
    if (!summary.clientId) {
      alert('Link these collections to a client before creating a formal invoice.');
      return;
    }
    if (summary.commission <= 0) {
      alert('This client has no commission due. Check the client commission settings first.');
      return;
    }
    createInvoiceFromLines(
      dateFilteredCollectionLines.filter((line) => summary.collectionIds.includes(line.row.collectionId)),
    );
  };

  const exportClientBillingCsv = () => {
    if (clientBillingReportRecords.length === 0) {
      alert('No client billing report to export.');
      return;
    }
    const headers = Object.keys(clientBillingReportRecords[0]);
    const lines = [
      headers.map(csvEscape).join(','),
      ...clientBillingReportRecords.map((r) =>
        headers.map((h) => csvEscape(String((r as Record<string, unknown>)[h] ?? ''))).join(','),
      ),
    ];
    downloadTextFile(
      `client-billing-report-${reportDateStamp()}.csv`,
      '\uFEFF' + lines.join('\n'),
      'text/csv;charset=utf-8;',
    );
  };

  const exportWorkspaceXlsx = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientBillingReportRecords), 'Client billing');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(collectionReportRecords), 'Collections');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invoiceReportRecords), 'Saved invoices');
    XLSX.writeFile(wb, `faways-invoicing-${reportDateStamp()}.xlsx`);
  };

  const exportClientBillingPdf = () => {
    if (clientBillingSummaries.length === 0) {
      alert('No client billing report to export.');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(18);
    doc.text('Faways Client Billing Report', 40, 44);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString('en-KE')}`, 40, 62);
    doc.text(`Clients to bill: ${clientBillingSummaries.length}`, 40, 78);
    doc.text(`Uninvoiced recoveries: ${formatKes(clientBillingTotals.recovered)}`, 220, 78);
    doc.text(`Commission to invoice: ${formatKes(clientBillingTotals.commission)}`, 460, 78);

    autoTable(doc, {
      startY: 100,
      head: [['Client', 'Period', 'Collections', 'Recovered', 'Commission due', 'Rate']],
      body: clientBillingSummaries.map((summary) => [
        summary.clientName,
        `${summary.periodStart} to ${summary.periodEnd}`,
        String(summary.collectionCount),
        formatKes(summary.recovered),
        formatKes(summary.commission),
        summary.commissionRate,
      ]),
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [16, 185, 129] },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
    });

    doc.save(`client-billing-report-${reportDateStamp()}.pdf`);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1600px] space-y-6 pb-10 print:bg-white print:pb-0">
        <header className="flex flex-col gap-4 print:hidden lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Revenue</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {sectionTitle}
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
              {sectionDescription}
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
            {showBilling ? (
              <Button
                type="button"
                variant="outline"
                className="h-10 gap-2 rounded-lg border-slate-200"
                onClick={exportClientBillingPdf}
                disabled={clientBillingSummaries.length === 0}
              >
                <Download className="h-4 w-4" strokeWidth={2} />
                Billing PDF
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-2 rounded-lg border-slate-200"
              onClick={exportWorkspaceXlsx}
            >
              <FileSpreadsheet className="h-4 w-4" strokeWidth={2} />
              Excel workbook
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-2 rounded-lg border-slate-200"
              onClick={() => refresh()}
              disabled={loading}
            >
              <RotateCw className={cn('h-4 w-4', loading && 'animate-spin')} strokeWidth={2} />
              Refresh
            </Button>
          </div>
        </header>

        <Card className="rounded-xl border-slate-200 shadow-sm print:hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Filter className="h-4 w-4" strokeWidth={2} />
              </span>
              <div>
                <CardTitle className="text-base font-semibold">Filters</CardTitle>
                <CardDescription className="text-xs">
                  {activeFilterCount === 0 ? 'Showing all billing data.' : `${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <div className="space-y-2 xl:col-span-2">
                <Label htmlFor="invoice-search" className="text-xs font-medium text-slate-600">Search</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={2} />
                  <Input
                    id="invoice-search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Client, case, invoice reference..."
                    className="h-11 rounded-lg pl-9"
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice-from" className="flex items-center gap-1 text-xs font-medium text-slate-600">
                  <CalendarRange className="h-3.5 w-3.5" strokeWidth={2} /> From
                </Label>
                <Input id="invoice-from" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-11 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice-to" className="text-xs font-medium text-slate-600">To</Label>
                <Input id="invoice-to" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-11 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice-client" className="text-xs font-medium text-slate-600">Client</Label>
                <NativeSelect id="invoice-client" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
                  <option value="">All clients</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </NativeSelect>
              </div>
              {showCollections ? (
                <div className="space-y-2">
                  <Label htmlFor="invoice-billing" className="text-xs font-medium text-slate-600">Collections</Label>
                  <NativeSelect id="invoice-billing" value={billingFilter} onChange={(e) => setBillingFilter(e.target.value as BillingFilter)}>
                    <option value="all">All collections</option>
                    <option value="uninvoiced">Not invoiced</option>
                    <option value="invoiced">Already invoiced</option>
                  </NativeSelect>
                </div>
              ) : null}
              {showInvoices ? (
                <div className="space-y-2">
                  <Label htmlFor="invoice-pay-status" className="text-xs font-medium text-slate-600">Invoices</Label>
                  <NativeSelect
                    id="invoice-pay-status"
                    value={invoiceStatusFilter}
                    onChange={(e) => setInvoiceStatusFilter(e.target.value as 'all' | 'paid' | 'unpaid')}
                  >
                    <option value="all">All invoices</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                  </NativeSelect>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {filterChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={chip.onRemove}
                  aria-label={`Remove filter: ${chip.label}`}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white py-1 pl-2.5 pr-1 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  {chip.label}
                  <span className="flex h-5 w-5 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800" aria-hidden>
                    <X className="h-3 w-3" strokeWidth={2} />
                  </span>
                </button>
              ))}
              <Button type="button" variant="outline" className="h-8 rounded-lg text-xs" onClick={resetFilters}>
                Reset filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 print:hidden sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-xl border-slate-200 shadow-sm">
            <CardHeader className="pb-2 pt-4">
              <CardDescription className="text-xs">Clients ready to bill</CardDescription>
              <CardTitle className="text-xl font-bold tabular-nums text-slate-900">{clientBillingSummaries.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-xl border-slate-200 shadow-sm">
            <CardHeader className="pb-2 pt-4">
              <CardDescription className="text-xs">Commission to invoice</CardDescription>
              <CardTitle className="text-xl font-bold tabular-nums text-emerald-700">{formatKes(clientBillingTotals.commission)}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-xl border-slate-200 shadow-sm">
            <CardHeader className="pb-2 pt-4">
              <CardDescription className="text-xs">Collections in view</CardDescription>
              <CardTitle className="text-xl font-bold tabular-nums text-slate-900">{filteredCollectionLines.length}</CardTitle>
              <p className="text-xs text-slate-500">{collectionTotals.uninvoiced} not invoiced</p>
            </CardHeader>
          </Card>
          <Card className="rounded-xl border-slate-200 shadow-sm">
            <CardHeader className="pb-2 pt-4">
              <CardDescription className="text-xs">Saved invoices in view</CardDescription>
              <CardTitle className="text-xl font-bold tabular-nums text-slate-900">{filteredInvoices.length}</CardTitle>
              <p className="text-xs text-slate-500">Commission {formatKes(invoiceTotals.commission)}</p>
            </CardHeader>
          </Card>
        </div>

        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {showBilling ? (
            <Card className="overflow-hidden rounded-xl border-emerald-200/80 bg-emerald-50/30 shadow-sm print:hidden">
              <CardHeader className="border-b border-emerald-100/80 bg-white/70 pb-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-900">1. Client billing summary</CardTitle>
                    <CardDescription>
                      Per-client report showing how much Faways should invoice from uninvoiced collections.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" className="rounded-lg bg-white" onClick={exportClientBillingCsv} disabled={clientBillingReportRecords.length === 0}>
                      Export CSV
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="rounded-lg bg-white" onClick={exportWorkspaceXlsx}>
                      Export Excel
                    </Button>
                    <Button type="button" size="sm" className="rounded-lg" onClick={exportClientBillingPdf} disabled={clientBillingReportRecords.length === 0}>
                      Download PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid gap-3 border-b border-emerald-100 bg-white/60 px-4 py-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Uninvoiced recoveries</p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{formatKes(clientBillingTotals.recovered)}</p>
                    <p className="text-xs text-slate-500">{clientBillingTotals.collections} collections</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Commission to invoice</p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700">{formatKes(clientBillingTotals.commission)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Clients</p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{clientBillingSummaries.length}</p>
                  </div>
                </div>
                {clientBillingSummaries.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">No uninvoiced collections are ready for client billing.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-sm">
                      <thead className="border-b border-emerald-100 bg-white/80 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Client</th>
                          <th className="px-4 py-3">Period</th>
                          <th className="px-4 py-3 text-right">Collections</th>
                          <th className="px-4 py-3 text-right">Recovered</th>
                          <th className="px-4 py-3 text-right">Commission due</th>
                          <th className="px-4 py-3">Rate</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-100/80 bg-white">
                        {clientBillingSummaries.map((summary) => (
                          <tr key={summary.clientKey} className="hover:bg-emerald-50/60">
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-900">{summary.clientName}</p>
                              {!summary.clientId ? <p className="text-xs text-amber-700">Link these cases to a client before invoicing.</p> : null}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{summary.periodStart} to {summary.periodEnd}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{summary.collectionCount}</td>
                            <td className="px-4 py-3 text-right font-medium tabular-nums">{formatKes(summary.recovered)}</td>
                            <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-700">{formatKes(summary.commission)}</td>
                            <td className="px-4 py-3 text-slate-600">{summary.commissionRate}</td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => reviewClientDraft(summary)}>Review</Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="rounded-lg"
                                  disabled={creating || !summary.clientId || summary.commission <= 0}
                                  onClick={() => handleCreateClientInvoice(summary)}
                                >
                                  Create invoice
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
            ) : null}

            {showCollections ? (
            <Card className="overflow-hidden rounded-xl border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/80 pb-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">2. Collections</CardTitle>
                    <CardDescription>Recoveries used to calculate commission. Select uninvoiced rows to create client invoices.</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2 print:hidden">
                    <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={selectVisibleUninvoiced}>Select visible uninvoiced</Button>
                    <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={clearSelection}>Clear</Button>
                    <Button type="button" size="sm" className="rounded-lg" disabled={creating || selectedItems.length === 0} onClick={handleCreateSelectedInvoices}>
                      {creating ? 'Saving...' : 'Create invoice(s)'}
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Selected: {formatKes(selectedTotals.recovered)} recovered, {formatKes(selectedTotals.commission)} commission
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1040px] text-sm">
                    <thead className="border-b border-slate-200 bg-slate-100 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      <tr>
                        <th className="w-10 px-2 py-3 print:hidden" />
                        <th className="px-3 py-3">Date</th>
                        <th className="px-3 py-3">Client</th>
                        <th className="px-3 py-3">Case</th>
                        <th className="px-3 py-3 print:hidden"><span className="inline-flex items-center gap-1 normal-case"><Paperclip className="h-3 w-3" strokeWidth={2} />Proof</span></th>
                        <th className="px-3 py-3 text-right">Recovered</th>
                        <th className="px-3 py-3 text-right">Commission</th>
                        <th className="px-3 py-3">Rate / status</th>
                        <th className="px-3 py-3 print:hidden">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCollectionLines.length === 0 ? (
                        <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-500">No collections match these filters.</td></tr>
                      ) : (
                        filteredCollectionLines.map((line) => {
                          const invoiced = Boolean(line.invoiceLink);
                          return (
                            <tr key={line.row.collectionId} className={cn('transition-colors hover:bg-slate-50/80', invoiced ? 'bg-slate-50/40' : '')}>
                              <td className="px-2 py-3 print:hidden">
                                {!invoiced ? (
                                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={selectedIds.has(line.row.collectionId)} onChange={() => toggleId(line.row.collectionId)} aria-label="Select collection for invoice" />
                                ) : null}
                              </td>
                              <td className="whitespace-nowrap px-3 py-3 text-slate-700">{new Date(line.row.collectionDate).toLocaleDateString('en-KE')}</td>
                              <td className="px-3 py-3 text-slate-900">{line.client?.name ?? <span className="text-slate-400">No client</span>}</td>
                              <td className="max-w-[280px] px-3 py-3 text-slate-600">
                                <span className="line-clamp-2">{line.row.creditorName}{line.row.debtorName ? ` - ${line.row.debtorName}` : ''}</span>
                                {line.invoiceLink ? <span className="mt-1 block text-xs font-medium text-violet-700">On {line.invoiceLink.reference}</span> : null}
                              </td>
                              <td className="px-3 py-3 print:hidden align-top"><CollectionProofLinks collectionId={line.row.collectionId} docsMap={collectionDocsMap} /></td>
                              <td className="px-3 py-3 text-right font-medium tabular-nums text-slate-900">{formatKes(line.row.amount)}</td>
                              <td className="px-3 py-3 text-right font-semibold tabular-nums text-emerald-700">{formatKes(line.commission)}</td>
                              <td className="px-3 py-3 text-slate-600">
                                <span className="text-sm">{formatRate(line.client)}</span>
                                {invoiced ? <Badge variant="outline" className="ml-2 align-middle text-[10px] font-normal">Invoiced</Badge> : null}
                              </td>
                              <td className="px-3 py-3 print:hidden">
                                <div className="flex flex-wrap gap-1.5">
                                  <Button type="button" variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => router.push(`/dashboard/debts/${line.row.debtId}`)}>Case</Button>
                                  {line.invoiceLink ? <Button type="button" variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => router.push(`/invoice/${line.invoiceLink!.invoiceId}`)}>Invoice</Button> : null}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            ) : null}

            {showInvoices ? (
            <Card className="overflow-hidden rounded-xl border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-violet-50/60 pb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">3. Saved invoices</CardTitle>
                    <CardDescription>
                      Formal commission invoices. Select multiple unpaid invoices for the same client to merge.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs text-slate-500">{invoiceTotals.paid} paid, {invoiceTotals.unpaid} unpaid</p>
                    {selectedInvoiceIds.size > 0 ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-lg text-xs"
                          onClick={() => setSelectedInvoiceIds(new Set())}
                        >
                          Clear ({selectedInvoiceIds.size})
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="rounded-lg text-xs"
                          disabled={selectedSavedInvoices.length < 2 || mergingInvoices}
                          onClick={handleMergeSavedInvoices}
                        >
                          {mergingInvoices ? 'Merging…' : `Merge selected (${selectedSavedInvoices.length})`}
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px] text-sm">
                    <thead className="border-b border-slate-200 bg-slate-100 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      <tr>
                        <th className="w-10 px-3 py-3 print:hidden" aria-label="Select invoice" />
                        <th className="px-3 py-3">Date</th>
                        <th className="px-3 py-3">Invoice</th>
                        <th className="px-3 py-3">Client</th>
                        <th className="px-3 py-3">Period</th>
                        <th className="px-3 py-3 text-right">Recovered</th>
                        <th className="px-3 py-3 text-right">Commission</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3 print:hidden">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredInvoices.length === 0 ? (
                        <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-500">No saved invoices match these filters.</td></tr>
                      ) : (
                        filteredInvoices.map((invoice) => (
                          <tr key={invoice.id} className="transition-colors hover:bg-violet-50/50">
                            <td className="px-3 py-3 print:hidden">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300"
                                checked={selectedInvoiceIds.has(invoice.id)}
                                disabled={invoice.status === 'paid'}
                                title={invoice.status === 'paid' ? 'Paid invoices cannot be merged' : 'Select for merge'}
                                onChange={() => toggleInvoiceSelection(invoice.id)}
                              />
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-slate-700">{new Date(invoice.createdAt).toLocaleDateString('en-KE')}</td>
                            <td className="px-3 py-3"><span className="font-mono text-xs font-semibold text-slate-900">{invoice.reference}</span></td>
                            <td className="px-3 py-3 text-slate-900">{invoice.clientName ?? <span className="text-slate-400">No client</span>}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-slate-600">{invoice.periodStart} to {invoice.periodEnd}</td>
                            <td className="px-3 py-3 text-right font-medium tabular-nums">{formatKes(invoice.totalRecovered)}</td>
                            <td className="px-3 py-3 text-right font-semibold tabular-nums text-emerald-700">{formatKes(invoice.totalCommission)}</td>
                            <td className="px-3 py-3">
                              <Badge className={cn('rounded-full border-0 font-medium normal-case tracking-normal', invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900')}>
                                {invoice.status === 'paid' ? 'Paid' : 'Unpaid'}
                              </Badge>
                            </td>
                            <td className="px-3 py-3 print:hidden">
                              <div className="flex flex-wrap gap-1">
                                <Button type="button" variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => router.push(`/invoice/${invoice.id}`)}>Open</Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="rounded-lg border-rose-200 text-xs text-rose-700 hover:bg-rose-50"
                                  disabled={deletingInvoiceId === invoice.id || invoice.status === 'paid'}
                                  title={invoice.status === 'paid' ? 'Mark unpaid before deleting' : 'Delete invoice'}
                                  onClick={() => handleDeleteSavedInvoice(invoice)}
                                >
                                  {deletingInvoiceId === invoice.id ? 'Deleting…' : 'Delete'}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            ) : null}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
