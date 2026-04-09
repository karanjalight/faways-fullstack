'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import {
  CalendarRange,
  Download,
  FileSpreadsheet,
  Filter,
  Paperclip,
  Printer,
  RotateCw,
  Search,
  Table2,
  X,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { fetchClients } from '../lib/clients';
import type { Client } from '../types/client';
import {
  commissionForRow,
  fetchCollectionsForInvoice,
  type CollectionInvoiceRow,
} from '../lib/commissions';
import {
  createCommissionInvoicesFromLineItems,
  fetchCollectionToInvoiceMap,
  listCommissionInvoices,
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
import { Separator } from '@/components/ui/separator';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';

function formatKes(n: number) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatRate(client: Client | undefined): string {
  if (!client) return '—';
  if (client.recoveryCommissionType === 'flat') {
    const f = client.recoveryCommissionFlat;
    return f != null && f > 0 ? `${formatKes(f)} / collection` : '—';
  }
  const p = client.recoveryCommissionPercent;
  return p != null && p > 0 ? `${p}%` : '—';
}

type ViewMode = 'all' | 'collections' | 'invoices';
type BillingFilter = 'all' | 'uninvoiced' | 'invoiced';

type UnifiedRow =
  | {
      kind: 'invoice';
      sortKey: string;
      invoice: CommissionInvoiceSummary;
    }
  | {
      kind: 'collection';
      sortKey: string;
      row: CollectionInvoiceRow;
      client: Client | undefined;
      commission: number;
      invoiceLink: { invoiceId: string; reference: string } | undefined;
    };

function csvEscape(cell: string) {
  const s = String(cell ?? '').replace(/"/g, '""');
  return `"${s}"`;
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

const VIEW_LABELS: Record<ViewMode, string> = {
  all: 'Collections & invoices',
  collections: 'Collections only',
  invoices: 'Saved invoices only',
};

const BILLING_LABELS: Record<BillingFilter, string> = {
  all: 'Any billing state',
  uninvoiced: 'Not on saved invoice',
  invoiced: 'On saved invoice',
};

function CollectionProofLinks({
  collectionId,
  docsMap,
}: {
  collectionId: string;
  docsMap: Map<string, CollectionAttachment[]>;
}) {
  const docs = docsMap.get(collectionId) ?? [];
  if (docs.length === 0) {
    return <span className="text-xs text-slate-400">—</span>;
  }
  return (
    <div className="flex max-w-[220px] flex-col gap-1">
      {docs.map((d) =>
        d.url ? (
          <a
            key={d.id}
            href={d.url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-xs font-medium text-blue-700 underline-offset-2 hover:underline"
          >
            {d.name}
          </a>
        ) : (
          <span key={d.id} className="truncate text-xs text-slate-600" title="Signed URL unavailable">
            {d.name}
          </span>
        ),
      )}
    </div>
  );
}

function RegisterSkeleton() {
  return (
    <Card className="overflow-hidden rounded-xl border-slate-200 shadow-sm">
      <CardHeader className="space-y-2">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-slate-100" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex gap-4 px-4 py-3">
              <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
              <div className="h-4 flex-1 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function InvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [rows, setRows] = useState<CollectionInvoiceRow[]>([]);
  const [collectionToInvoice, setCollectionToInvoice] = useState<
    Map<string, { invoiceId: string; reference: string }>
  >(new Map());
  const [savedInvoices, setSavedInvoices] = useState<CommissionInvoiceSummary[]>([]);
  const [collectionDocsMap, setCollectionDocsMap] = useState<
    Map<string, CollectionAttachment[]>
  >(() => new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [billingFilter, setBillingFilter] = useState<BillingFilter>('all');
  const [clientFilter, setClientFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

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
          const docMap = await fetchCollectionDocumentsMap(collectionIds);
          setCollectionDocsMap(docMap);
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
      setError(
        'Could not load data. Run DB migrations (commission + collection tables) and check RLS.',
      );
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
    setViewMode('all');
  }, []);

  const clientsById = useMemo(() => {
    const m = new Map<string, Client>();
    clients.forEach((c) => m.set(c.id, c));
    return m;
  }, [clients]);

  const filteredCollections = useMemo(() => {
    return rows.filter((r) => {
      const d = r.collectionDate.slice(0, 10);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    });
  }, [rows, fromDate, toDate]);

  const collectionLines = useMemo(() => {
    return filteredCollections.map((r) => {
      const client = r.clientId ? clientsById.get(r.clientId) : undefined;
      const commission = commissionForRow(r, clientsById);
      return { row: r, client, commission };
    });
  }, [filteredCollections, clientsById]);

  const unifiedRows = useMemo((): UnifiedRow[] => {
    const q = searchQuery.trim().toLowerCase();
    const out: UnifiedRow[] = [];

    const invoiceFrom = fromDate;
    const invoiceTo = toDate;

    if (viewMode !== 'collections') {
      for (const inv of savedInvoices) {
        if (invoiceStatusFilter === 'paid' && inv.status !== 'paid') continue;
        if (invoiceStatusFilter === 'unpaid' && inv.status !== 'paid') continue;
        if (clientFilter && inv.clientId !== clientFilter) continue;
        if (q) {
          const hay = `${inv.reference} ${inv.clientName ?? ''} ${inv.periodStart} ${inv.periodEnd}`.toLowerCase();
          if (!hay.includes(q)) continue;
        }
        if (invoiceFrom && inv.periodEnd < invoiceFrom) continue;
        if (invoiceTo && inv.periodStart > invoiceTo) continue;
        out.push({
          kind: 'invoice',
          sortKey: inv.createdAt,
          invoice: inv,
        });
      }
    }

    if (viewMode !== 'invoices') {
      for (const line of collectionLines) {
        const { row, client, commission } = line;
        const linked = collectionToInvoice.get(row.collectionId);
        if (billingFilter === 'uninvoiced' && linked) continue;
        if (billingFilter === 'invoiced' && !linked) continue;
        if (clientFilter && row.clientId !== clientFilter) continue;
        if (q) {
          const hay = `${client?.name ?? ''} ${row.creditorName} ${row.debtorName} ${linked?.reference ?? ''}`.toLowerCase();
          if (!hay.includes(q)) continue;
        }
        out.push({
          kind: 'collection',
          sortKey: row.collectionDate,
          row,
          client,
          commission,
          invoiceLink: linked,
        });
      }
    }

    out.sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1));
    return out;
  }, [
    savedInvoices,
    collectionLines,
    collectionToInvoice,
    viewMode,
    billingFilter,
    clientFilter,
    searchQuery,
    invoiceStatusFilter,
    fromDate,
    toDate,
  ]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (fromDate) n++;
    if (toDate) n++;
    if (clientFilter) n++;
    if (searchQuery.trim()) n++;
    if (viewMode !== 'all') n++;
    if (viewMode !== 'invoices' && billingFilter !== 'all') n++;
    if (viewMode !== 'collections' && invoiceStatusFilter !== 'all') n++;
    return n;
  }, [
    fromDate,
    toDate,
    clientFilter,
    searchQuery,
    viewMode,
    billingFilter,
    invoiceStatusFilter,
  ]);

  const filterChips = useMemo(() => {
    const chips: { id: string; label: string; onRemove: () => void }[] = [];
    if (fromDate) {
      chips.push({
        id: 'from',
        label: `From ${fromDate}`,
        onRemove: () => setFromDate(''),
      });
    }
    if (toDate) {
      chips.push({
        id: 'to',
        label: `To ${toDate}`,
        onRemove: () => setToDate(''),
      });
    }
    if (clientFilter) {
      const name = clientsById.get(clientFilter)?.name ?? 'Client';
      chips.push({
        id: 'client',
        label: name,
        onRemove: () => setClientFilter(''),
      });
    }
    if (viewMode !== 'all') {
      chips.push({
        id: 'view',
        label: VIEW_LABELS[viewMode],
        onRemove: () => setViewMode('all'),
      });
    }
    if (viewMode !== 'invoices' && billingFilter !== 'all') {
      chips.push({
        id: 'billing',
        label: BILLING_LABELS[billingFilter],
        onRemove: () => setBillingFilter('all'),
      });
    }
    if (viewMode !== 'collections' && invoiceStatusFilter !== 'all') {
      chips.push({
        id: 'invpay',
        label: invoiceStatusFilter === 'paid' ? 'Paid invoices' : 'Unpaid invoices',
        onRemove: () => setInvoiceStatusFilter('all'),
      });
    }
    if (searchQuery.trim()) {
      chips.push({
        id: 'q',
        label: `“${searchQuery.trim().slice(0, 24)}${searchQuery.trim().length > 24 ? '…' : ''}”`,
        onRemove: () => setSearchQuery(''),
      });
    }
    return chips;
  }, [
    fromDate,
    toDate,
    clientFilter,
    viewMode,
    billingFilter,
    invoiceStatusFilter,
    searchQuery,
    clientsById,
  ]);

  const collectionTotalsFromLines = useMemo(() => {
    let recovered = 0;
    let commission = 0;
    for (const u of unifiedRows) {
      if (u.kind === 'collection') {
        recovered += u.row.amount;
        commission += u.commission;
      }
    }
    return { recovered, commission };
  }, [unifiedRows]);

  const invoiceTotalsVisible = useMemo(() => {
    let commission = 0;
    let recovered = 0;
    for (const u of unifiedRows) {
      if (u.kind === 'invoice') {
        commission += u.invoice.totalCommission;
        recovered += u.invoice.totalRecovered;
      }
    }
    return { recovered, commission, count: unifiedRows.filter((x) => x.kind === 'invoice').length };
  }, [unifiedRows]);

  const uninvoicedLines = useMemo(() => {
    return collectionLines.filter((l) => !collectionToInvoice.has(l.row.collectionId));
  }, [collectionLines, collectionToInvoice]);

  const selectedItems = useMemo(() => {
    return uninvoicedLines.filter((l) => selectedIds.has(l.row.collectionId));
  }, [uninvoicedLines, selectedIds]);

  const selectedTotals = useMemo(() => {
    const recovered = selectedItems.reduce((s, l) => s + l.row.amount, 0);
    const commission = selectedItems.reduce((s, l) => s + l.commission, 0);
    return { recovered, commission };
  }, [selectedItems]);

  const toggleId = (collectionId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(collectionId)) next.delete(collectionId);
      else next.add(collectionId);
      return next;
    });
  };

  const selectAllUninvoicedInUnified = () => {
    const ids = new Set<string>();
    for (const u of unifiedRows) {
      if (u.kind === 'collection' && !collectionToInvoice.has(u.row.collectionId)) {
        ids.add(u.row.collectionId);
      }
    }
    setSelectedIds(ids);
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleCreateInvoices = async () => {
    if (selectedItems.length === 0) {
      alert('Select at least one collection that is not already on a saved invoice.');
      return;
    }
    setCreating(true);
    try {
      const created = await createCommissionInvoicesFromLineItems(
        selectedItems.map((l) => ({ row: l.row, commission: l.commission })),
      );
      setSelectedIds(new Set());
      await refresh();
      if (created.length === 1) {
        router.push(`/invoice/${created[0]}`);
      } else {
        alert(
          `Created ${created.length} saved invoices (one per client). Open them from the table.`,
        );
      }
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const exportRecords = useMemo(() => {
    return unifiedRows.map((u) => {
      if (u.kind === 'invoice') {
        const inv = u.invoice;
        return {
          Type: 'Saved invoice',
          Date: inv.createdAt.slice(0, 10),
          Reference: inv.reference,
          Client: inv.clientName ?? '',
          Detail: `${inv.periodStart} → ${inv.periodEnd}`,
          Recovered: inv.totalRecovered,
          Commission: inv.totalCommission,
          Status: inv.status === 'paid' ? 'Paid' : 'Unpaid',
          'Collection proof': '',
          'Saved invoice link': '',
        };
      }
      const { row, client, commission, invoiceLink } = u;
      const proofNames = (collectionDocsMap.get(row.collectionId) ?? [])
        .map((d) => d.name)
        .join('; ');
      return {
        Type: 'Collection',
        Date: row.collectionDate.slice(0, 10),
        Reference: invoiceLink?.reference ?? '',
        Client: client?.name ?? '',
        Detail: `${row.creditorName}${row.debtorName ? ` · ${row.debtorName}` : ''}`,
        Recovered: row.amount,
        Commission: commission,
        Status: invoiceLink ? 'On saved invoice' : 'Not invoiced',
        'Collection proof': proofNames,
        'Saved invoice link': invoiceLink ? `/invoice/${invoiceLink.invoiceId}` : '',
      };
    });
  }, [unifiedRows, collectionDocsMap]);

  const exportCsv = () => {
    if (exportRecords.length === 0) {
      alert('Nothing to export for the current filters.');
      return;
    }
    const headers = Object.keys(exportRecords[0]);
    const lines = [
      headers.map(csvEscape).join(','),
      ...exportRecords.map((r) =>
        headers.map((h) => csvEscape(String((r as Record<string, unknown>)[h] ?? ''))).join(','),
      ),
    ];
    downloadTextFile(
      `commission-export-${new Date().toISOString().slice(0, 10)}.csv`,
      '\uFEFF' + lines.join('\n'),
      'text/csv;charset=utf-8;',
    );
  };

  const exportXlsx = () => {
    if (exportRecords.length === 0) {
      alert('Nothing to export for the current filters.');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(exportRecords);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Commission');
    XLSX.writeFile(wb, `commission-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filterPanel = (
    <Card className="rounded-xl border-slate-200 shadow-sm print:hidden">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Filter className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <CardTitle className="text-base font-semibold">Filters</CardTitle>
            <CardDescription className="text-xs">
              {activeFilterCount === 0
                ? 'Showing all rows within your access.'
                : `${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        <div className="space-y-2">
          <Label htmlFor="invoice-search" className="text-xs font-medium text-slate-600">
            Search
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={2}
            />
            <Input
              id="invoice-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Client, case, reference…"
              className="h-11 rounded-lg pl-9"
              autoComplete="off"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <CalendarRange className="h-3.5 w-3.5" strokeWidth={2} />
            Date range
          </div>
          <p className="text-xs text-slate-500">
            For collections, filters by collection date. For saved invoices, overlaps the invoice
            period.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="invoice-from" className="text-xs font-medium text-slate-600">
                From
              </Label>
              <Input
                id="invoice-from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-11 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-to" className="text-xs font-medium text-slate-600">
                To
              </Label>
              <Input
                id="invoice-to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-11 rounded-lg"
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="invoice-view-mode" className="text-xs font-medium text-slate-600">
            Register
          </Label>
          <NativeSelect
            id="invoice-view-mode"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
          >
            <option value="all">Collections &amp; saved invoices</option>
            <option value="collections">Collections only</option>
            <option value="invoices">Saved invoices only</option>
          </NativeSelect>
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoice-client" className="text-xs font-medium text-slate-600">
            Client
          </Label>
          <NativeSelect
            id="invoice-client"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
          >
            <option value="">All clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </div>

        {viewMode !== 'invoices' && (
          <div className="space-y-2">
            <Label htmlFor="invoice-billing" className="text-xs font-medium text-slate-600">
              Collection billing
            </Label>
            <NativeSelect
              id="invoice-billing"
              value={billingFilter}
              onChange={(e) => setBillingFilter(e.target.value as BillingFilter)}
            >
              <option value="all">All</option>
              <option value="uninvoiced">Not on saved invoice</option>
              <option value="invoiced">On saved invoice</option>
            </NativeSelect>
          </div>
        )}

        {viewMode !== 'collections' && (
          <div className="space-y-2">
            <Label htmlFor="invoice-pay-status" className="text-xs font-medium text-slate-600">
              Invoice payment
            </Label>
            <NativeSelect
              id="invoice-pay-status"
              value={invoiceStatusFilter}
              onChange={(e) =>
                setInvoiceStatusFilter(e.target.value as 'all' | 'paid' | 'unpaid')
              }
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </NativeSelect>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-1 sm:flex-row xl:flex-col">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-lg border-slate-200"
            onClick={resetFilters}
          >
            Clear all filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const bulkCard =
    !loading && viewMode !== 'invoices' ? (
      <Card className="rounded-xl border-blue-200/80 bg-gradient-to-br from-blue-50/90 to-white shadow-sm print:hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900">Save commission invoices</CardTitle>
          <CardDescription className="text-xs">
            Select uninvoiced collections in the table, then create one saved invoice per client.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <p className="text-sm text-slate-700">
            <span className="text-slate-500">Selection · </span>
            {formatKes(selectedTotals.recovered)}
            <span className="mx-1 text-slate-300">·</span>
            <span className="font-semibold text-emerald-700">{formatKes(selectedTotals.commission)}</span>
            <span className="text-slate-500"> commission</span>
          </p>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-full justify-center rounded-lg"
              onClick={selectAllUninvoicedInUnified}
            >
              Select all uninvoiced (visible)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-full justify-center rounded-lg"
              onClick={clearSelection}
            >
              Clear selection
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-10 w-full rounded-lg font-semibold"
              disabled={creating || selectedItems.length === 0}
              onClick={handleCreateInvoices}
            >
              {creating ? 'Saving…' : 'Save as invoice(s)'}
            </Button>
          </div>
        </CardContent>
      </Card>
    ) : null;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1600px] space-y-6 pb-10 print:bg-white print:pb-0">
        <header className="flex flex-col gap-4 print:hidden lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Revenue
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Commission &amp; invoices
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
              One register for recoveries and formal commission invoices. Use filters to narrow the
              list; exports use exactly what you see.
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
            <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <Button
                type="button"
                variant="ghost"
                className="h-10 gap-1.5 rounded-none px-3 text-slate-700 hover:bg-slate-50"
                onClick={exportCsv}
                title="Download CSV"
              >
                <Table2 className="h-4 w-4" strokeWidth={2} />
                CSV
              </Button>
              <Separator orientation="vertical" className="h-10 bg-slate-200" decorative />
              <Button
                type="button"
                variant="ghost"
                className="h-10 gap-1.5 rounded-none px-3 text-slate-700 hover:bg-slate-50"
                onClick={exportXlsx}
                title="Download Excel"
              >
                <FileSpreadsheet className="h-4 w-4" strokeWidth={2} />
                Excel
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-2 rounded-lg border-slate-200"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" strokeWidth={2} />
              Print
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

        <div className="xl:grid xl:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] xl:items-start xl:gap-8">
          <aside className="mb-6 space-y-4 xl:sticky xl:top-4 xl:mb-0 xl:self-start">
            {filterPanel}
            {bulkCard}
          </aside>

          <div className="min-w-0 space-y-6">
            <div className="grid gap-3 print:hidden sm:grid-cols-2 lg:grid-cols-4">
              <Card className="rounded-xl border-slate-200 shadow-sm">
                <CardHeader className="pb-2 pt-4">
                  <CardDescription className="text-xs">Recovered (collections in view)</CardDescription>
                  <CardTitle className="text-lg font-bold tabular-nums text-slate-900 sm:text-xl">
                    {formatKes(collectionTotalsFromLines.recovered)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="rounded-xl border-slate-200 shadow-sm">
                <CardHeader className="pb-2 pt-4">
                  <CardDescription className="text-xs">Commission (collections in view)</CardDescription>
                  <CardTitle className="text-lg font-bold tabular-nums text-emerald-700 sm:text-xl">
                    {formatKes(collectionTotalsFromLines.commission)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="rounded-xl border-slate-200 shadow-sm">
                <CardHeader className="pb-2 pt-4">
                  <CardDescription className="text-xs">Saved invoices in view</CardDescription>
                  <CardTitle className="text-lg font-bold tabular-nums sm:text-xl">
                    {invoiceTotalsVisible.count}
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Commission {formatKes(invoiceTotalsVisible.commission)}
                  </p>
                </CardHeader>
              </Card>
              <Card className="rounded-xl border-slate-200 shadow-sm">
                <CardHeader className="pb-2 pt-4">
                  <CardDescription className="text-xs">Rows in register</CardDescription>
                  <CardTitle className="text-lg font-bold tabular-nums sm:text-xl">
                    {unifiedRows.length}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {filterChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <span className="text-xs font-medium text-slate-500">Active:</span>
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-slate-600"
                  onClick={resetFilters}
                >
                  Clear all
                </Button>
              </div>
            )}

            {error && (
              <p
                className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                role="alert"
              >
                {error}
              </p>
            )}

            {loading ? (
              <RegisterSkeleton />
            ) : (
              <Card className="overflow-hidden rounded-xl border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-slate-50/80 pb-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">Register</CardTitle>
                      <CardDescription>
                        Newest first. Collections and saved invoices together.
                      </CardDescription>
                    </div>
                    <p className="text-xs text-slate-500">
                      <Download className="mr-1 inline h-3.5 w-3.5 align-text-bottom" strokeWidth={2} />
                      CSV / Excel export the filtered rows only.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[min(70vh,900px)] overflow-auto print:max-h-none">
                    <table className="w-full min-w-[1040px] text-sm">
                      <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600 shadow-sm">
                        <tr>
                          <th className="w-10 px-2 py-3 print:hidden" scope="col" />
                          <th className="px-3 py-3" scope="col">
                            Type
                          </th>
                          <th className="px-3 py-3" scope="col">
                            Date
                          </th>
                          <th className="px-3 py-3" scope="col">
                            Client
                          </th>
                          <th className="px-3 py-3" scope="col">
                            Reference / case
                          </th>
                          <th className="px-3 py-3 print:hidden" scope="col">
                            <span className="inline-flex items-center gap-1 normal-case">
                              <Paperclip className="h-3 w-3" strokeWidth={2} />
                              Proof
                            </span>
                          </th>
                          <th className="px-3 py-3 text-right" scope="col">
                            Recovered
                          </th>
                          <th className="px-3 py-3 text-right" scope="col">
                            Commission
                          </th>
                          <th className="px-3 py-3" scope="col">
                            Rate / status
                          </th>
                          <th className="px-3 py-3 print:hidden" scope="col">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {unifiedRows.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="px-4 py-16 text-center text-slate-500">
                              <p className="font-medium text-slate-700">No rows match these filters.</p>
                              <p className="mt-1 text-xs">Try clearing filters or widening the date range.</p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-4 rounded-lg"
                                onClick={resetFilters}
                              >
                                Reset filters
                              </Button>
                            </td>
                          </tr>
                        ) : (
                          unifiedRows.map((u) => {
                            if (u.kind === 'invoice') {
                              const inv = u.invoice;
                              return (
                                <tr
                                  key={`inv-${inv.id}`}
                                  className="bg-violet-50/50 transition-colors hover:bg-violet-50/80"
                                >
                                  <td className="px-2 py-3 print:hidden" />
                                  <td className="px-3 py-3">
                                    <Badge className="rounded-md border-0 bg-violet-100 font-medium normal-case text-violet-800">
                                      Invoice
                                    </Badge>
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-3 text-slate-700">
                                    {new Date(inv.createdAt).toLocaleDateString('en-KE')}
                                  </td>
                                  <td className="px-3 py-3 text-slate-900">
                                    {inv.clientName ?? <span className="text-slate-400">—</span>}
                                  </td>
                                  <td className="max-w-[240px] px-3 py-3">
                                    <span className="font-mono text-xs font-semibold text-slate-900">
                                      {inv.reference}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-slate-500">
                                      {inv.periodStart} → {inv.periodEnd}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 print:hidden">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                        Invoice files
                                      </span>
                                      <Button
                                        type="button"
                                        variant="link"
                                        className="h-auto min-h-0 justify-start p-0 text-xs font-medium"
                                        onClick={() => router.push(`/invoice/${inv.id}`)}
                                      >
                                        View on detail →
                                      </Button>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 text-right font-medium tabular-nums">
                                    {formatKes(inv.totalRecovered)}
                                  </td>
                                  <td className="px-3 py-3 text-right font-semibold tabular-nums text-emerald-700">
                                    {formatKes(inv.totalCommission)}
                                  </td>
                                  <td className="px-3 py-3">
                                    <Badge
                                      className={cn(
                                        'rounded-full border-0 font-medium normal-case tracking-normal',
                                        inv.status === 'paid'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-amber-100 text-amber-900',
                                      )}
                                    >
                                      {inv.status === 'paid' ? 'Paid' : 'Unpaid'}
                                    </Badge>
                                  </td>
                                  <td className="px-3 py-3 print:hidden">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="rounded-lg text-xs"
                                      onClick={() => router.push(`/invoice/${inv.id}`)}
                                    >
                                      Open
                                    </Button>
                                  </td>
                                </tr>
                              );
                            }
                            const { row, client, commission, invoiceLink } = u;
                            const invoiced = Boolean(invoiceLink);
                            return (
                              <tr
                                key={`col-${row.collectionId}`}
                                className={cn(
                                  'transition-colors hover:bg-slate-50/80',
                                  invoiced ? 'bg-slate-50/40' : '',
                                )}
                              >
                                <td className="px-2 py-3 print:hidden">
                                  {!invoiced && (
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                      checked={selectedIds.has(row.collectionId)}
                                      onChange={() => toggleId(row.collectionId)}
                                      aria-label="Select collection for new invoice"
                                    />
                                  )}
                                </td>
                                <td className="px-3 py-3">
                                  <Badge
                                    variant="secondary"
                                    className="rounded-md font-medium normal-case tracking-normal text-slate-700"
                                  >
                                    Collection
                                  </Badge>
                                </td>
                                <td className="whitespace-nowrap px-3 py-3 text-slate-700">
                                  {new Date(row.collectionDate).toLocaleDateString('en-KE')}
                                </td>
                                <td className="px-3 py-3 text-slate-900">
                                  {client?.name ?? <span className="text-slate-400">No client</span>}
                                </td>
                                <td className="max-w-[260px] px-3 py-3 text-slate-600">
                                  <span className="line-clamp-2">
                                    {row.creditorName}
                                    {row.debtorName ? ` · ${row.debtorName}` : ''}
                                  </span>
                                  {invoiceLink && (
                                    <span className="mt-1 block text-xs font-medium text-violet-700">
                                      On {invoiceLink.reference}
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-3 print:hidden align-top">
                                  <CollectionProofLinks
                                    collectionId={row.collectionId}
                                    docsMap={collectionDocsMap}
                                  />
                                </td>
                                <td className="px-3 py-3 text-right font-medium tabular-nums text-slate-900">
                                  {formatKes(row.amount)}
                                </td>
                                <td className="px-3 py-3 text-right font-semibold tabular-nums text-emerald-700">
                                  {formatKes(commission)}
                                </td>
                                <td className="px-3 py-3 text-slate-600">
                                  <span className="text-sm">{formatRate(client)}</span>
                                  {invoiced && (
                                    <Badge
                                      variant="outline"
                                      className="ml-2 align-middle text-[10px] font-normal"
                                    >
                                      Invoiced
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-3 py-3 print:hidden">
                                  <div className="flex flex-wrap gap-1.5">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="rounded-lg text-xs"
                                      onClick={() => router.push(`/dashboard/debts/${row.debtId}`)}
                                    >
                                      Case
                                    </Button>
                                    {invoiceLink ? (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="rounded-lg text-xs"
                                        onClick={() =>
                                          router.push(`/invoice/${invoiceLink.invoiceId}`)
                                        }
                                      >
                                        Invoice
                                      </Button>
                                    ) : null}
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
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
