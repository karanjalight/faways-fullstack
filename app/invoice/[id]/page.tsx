'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import DashboardLayout from '../../components/DashboardLayout';
import {
  deleteCommissionInvoiceDocument,
  fetchCommissionInvoiceDetail,
  updateCommissionInvoicePayment,
  uploadCommissionInvoiceDocument,
} from '../../lib/commissionInvoices';
import type { CommissionInvoiceDetail } from '../../types/commissionInvoice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function formatKes(n: number) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(n);
}

function safeFilename(input: string) {
  return input.replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '') || 'invoice';
}

export default function CommissionInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const router = useRouter();

  const [detail, setDetail] = useState<CommissionInvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paidNote, setPaidNote] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [docName, setDocName] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [removingDocId, setRemovingDocId] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCommissionInvoiceDetail(id);
      if (!data) {
        setError('Invoice not found.');
        setDetail(null);
      } else {
        setDetail(data);
        setPaidNote(data.paidNote ?? '');
      }
    } catch (e) {
      console.error(e);
      setError('Could not load this invoice.');
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleConfirmPaid = async () => {
    if (!id || !detail) return;
    setSavingPayment(true);
    try {
      await updateCommissionInvoicePayment(id, 'paid', paidNote);
      await load();
    } catch (e) {
      console.error(e);
      alert('Could not update payment status.');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleMarkUnpaid = async () => {
    if (!id || !detail) return;
    if (!confirm('Mark this invoice as unpaid? Payment date and note will be cleared.')) return;
    setSavingPayment(true);
    try {
      await updateCommissionInvoicePayment(id, 'issued', null);
      setPaidNote('');
      await load();
    } catch (e) {
      console.error(e);
      alert('Could not update payment status.');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleUploadDoc = async () => {
    if (!id || !docFile) {
      alert('Choose a file to upload.');
      return;
    }
    setUploadingDoc(true);
    try {
      await uploadCommissionInvoiceDocument(id, docFile, docName || docFile.name);
      setDocName('');
      setDocFile(null);
      await load();
    } catch (e) {
      console.error(e);
      alert('Upload failed. Ensure the commission-invoice-documents bucket exists and policies allow upload.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleRemoveDoc = async (documentId: string, label: string) => {
    if (!confirm(`Remove "${label}"?`)) return;
    setRemovingDocId(documentId);
    try {
      await deleteCommissionInvoiceDocument(documentId);
      await load();
    } catch (e) {
      console.error(e);
      alert('Could not remove the document.');
    } finally {
      setRemovingDocId(null);
    }
  };

  const exportInvoicePdf = () => {
    if (!detail) return;

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const generatedAt = new Date().toLocaleString('en-KE');
    const clientName = detail.clientName ?? 'No linked client';

    doc.setFontSize(20);
    doc.text('FAWAYS COMMISSION INVOICE', 40, 48);
    doc.setFontSize(10);
    doc.text(`Invoice: ${detail.reference}`, 40, 70);
    doc.text(`Client: ${clientName}`, 40, 86);
    doc.text(
      `Period: ${new Date(detail.periodStart).toLocaleDateString('en-KE')} - ${new Date(
        detail.periodEnd,
      ).toLocaleDateString('en-KE')}`,
      40,
      102,
    );
    doc.text(`Generated: ${generatedAt}`, 40, 118);

    doc.setFontSize(11);
    doc.text(`Total recovered: ${formatKes(detail.totalRecovered)}`, 360, 70);
    doc.setFontSize(13);
    doc.text(`Commission due: ${formatKes(detail.totalCommission)}`, 360, 90);
    doc.setFontSize(10);
    doc.text(`Status: ${detail.status === 'paid' ? 'Paid' : 'Unpaid'}`, 360, 108);

    autoTable(doc, {
      startY: 150,
      head: [['Date', 'Case', 'Recovered', 'Commission']],
      body: detail.lines.map((line) => [
        line.collectionDate
          ? new Date(line.collectionDate).toLocaleDateString('en-KE')
          : '',
        `${line.creditorName}${line.debtorName ? ` - ${line.debtorName}` : ''}`,
        formatKes(line.amountRecovered),
        formatKes(line.commissionAmount),
      ]),
      foot: [['', 'Total', formatKes(detail.totalRecovered), formatKes(detail.totalCommission)]],
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [37, 99, 235] },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
      },
    });

    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 150;
    doc.setFontSize(9);
    doc.text(
      'This invoice is generated from recorded collections and the client commission terms configured in Faways.',
      40,
      Math.min(finalY + 32, 780),
    );

    doc.save(`${safeFilename(detail.reference)}.pdf`);
  };

  const exportInvoiceXlsx = () => {
    if (!detail) return;

    const summaryRows = [
      { Field: 'Invoice reference', Value: detail.reference },
      { Field: 'Client', Value: detail.clientName ?? '' },
      { Field: 'Period start', Value: detail.periodStart },
      { Field: 'Period end', Value: detail.periodEnd },
      { Field: 'Total recovered', Value: detail.totalRecovered },
      { Field: 'Commission due', Value: detail.totalCommission },
      { Field: 'Status', Value: detail.status === 'paid' ? 'Paid' : 'Unpaid' },
      { Field: 'Paid at', Value: detail.paidAt ?? '' },
      { Field: 'Payment note', Value: detail.paidNote ?? '' },
    ];

    const lineRows = detail.lines.map((line) => ({
      Date: line.collectionDate,
      Creditor: line.creditorName,
      Debtor: line.debtorName,
      Recovered: line.amountRecovered,
      Commission: line.commissionAmount,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Summary');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lineRows), 'Line items');
    XLSX.writeFile(wb, `${safeFilename(detail.reference)}.xlsx`);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Button
                type="button"
                variant="ghost"
                className="mb-2 -ml-2 rounded-xl"
                onClick={() => router.push('/invoice')}
              >
                ← Back to invoices
              </Button>
              <h1 className="text-2xl font-bold text-slate-900">
                {detail ? detail.reference : 'Invoice'}
              </h1>
              {detail && (
                <p className="text-sm text-slate-600">
                  {detail.clientName ?? 'No linked client'} · Period{' '}
                  {new Date(detail.periodStart).toLocaleDateString('en-KE')} –{' '}
                  {new Date(detail.periodEnd).toLocaleDateString('en-KE')}
                </p>
              )}
            </div>
            {detail && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={exportInvoiceXlsx}
                >
                  Download Excel
                </Button>
                <Button type="button" className="rounded-xl" onClick={exportInvoicePdf}>
                  Download PDF
                </Button>
                <Badge
                  className={
                    detail.status === 'paid'
                      ? 'rounded-full bg-emerald-100 text-emerald-800'
                      : 'rounded-full bg-amber-100 text-amber-800'
                  }
                >
                  {detail.status === 'paid' ? 'Paid' : 'Unpaid'}
                </Badge>
              </div>
            )}
          </div>

          {loading && <p className="text-sm text-slate-500">Loading…</p>}
          {error && !loading && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </p>
          )}

          {detail && !loading && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardDescription>Total recovered</CardDescription>
                    <CardTitle className="text-xl">{formatKes(detail.totalRecovered)}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardDescription>Commission due</CardDescription>
                    <CardTitle className="text-xl text-emerald-700">
                      {formatKes(detail.totalCommission)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card className="rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardDescription>Lines</CardDescription>
                    <CardTitle className="text-xl">{detail.lines.length}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg">Payment</CardTitle>
                  <CardDescription>
                    Confirm when commission for this invoice has been received. Attach proof below if
                    needed.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {detail.status === 'paid' && detail.paidAt && (
                    <p className="text-sm text-slate-600">
                      Recorded paid on{' '}
                      <span className="font-medium text-slate-900">
                        {new Date(detail.paidAt).toLocaleString('en-KE')}
                      </span>
                      {detail.paidNote ? (
                        <>
                          <br />
                          <span className="text-slate-700">Note: {detail.paidNote}</span>
                        </>
                      ) : null}
                    </p>
                  )}
                  <div className="space-y-2">
                    <Label className="text-xs">Payment note (optional)</Label>
                    <Textarea
                      rows={2}
                      value={paidNote}
                      onChange={(e) => setPaidNote(e.target.value)}
                      placeholder="e.g. Bank ref MPESA…"
                      disabled={detail.status === 'paid'}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {detail.status !== 'paid' ? (
                      <Button
                        type="button"
                        className="rounded-xl"
                        disabled={savingPayment}
                        onClick={handleConfirmPaid}
                      >
                        {savingPayment ? 'Saving…' : 'Confirm amount paid'}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl border-rose-200 text-rose-700"
                        disabled={savingPayment}
                        onClick={handleMarkUnpaid}
                      >
                        Mark as unpaid
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg">Attachments</CardTitle>
                  <CardDescription>
                    Receipts, bank slips, or signed confirmations for this invoice.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_1fr_auto]">
                    <div className="space-y-1">
                      <Label className="text-xs">Document name</Label>
                      <Input
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        placeholder="e.g. Payment receipt"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">File</Label>
                      <Input
                        type="file"
                        className="cursor-pointer rounded-xl text-sm"
                        onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        className="rounded-xl"
                        disabled={uploadingDoc}
                        onClick={handleUploadDoc}
                      >
                        {uploadingDoc ? 'Uploading…' : 'Upload'}
                      </Button>
                    </div>
                  </div>
                  {detail.documents.length === 0 ? (
                    <p className="text-sm text-slate-500">No documents yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {detail.documents.map((doc) => (
                        <li
                          key={doc.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                        >
                          <div>
                            <p className="font-medium text-slate-900">{doc.name}</p>
                            <p className="text-xs text-slate-500">
                              {doc.sizeLabel} · {new Date(doc.uploadedAt).toLocaleString('en-KE')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {doc.url ? (
                              <Button variant="outline" size="sm" className="rounded-lg" asChild>
                                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                  Open
                                </a>
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-lg border-rose-200 text-rose-700"
                              disabled={removingDocId === doc.id}
                              onClick={() => handleRemoveDoc(doc.id, doc.name)}
                            >
                              {removingDocId === doc.id ? 'Removing…' : 'Remove'}
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg">Line items (snapshot)</CardTitle>
                  <CardDescription>
                    Amounts frozen when the invoice was created.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Case</th>
                          <th className="px-4 py-3 text-right">Recovered</th>
                          <th className="px-4 py-3 text-right">Commission</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.lines.map((line) => (
                          <tr key={line.lineId} className="border-b border-slate-100">
                            <td className="px-4 py-3 whitespace-nowrap">
                              {line.collectionDate
                                ? new Date(line.collectionDate).toLocaleDateString('en-KE')
                                : '—'}
                            </td>
                            <td className="max-w-[240px] px-4 py-3 text-slate-600">
                              {line.creditorName}
                              {line.debtorName ? ` · ${line.debtorName}` : ''}
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              {formatKes(line.amountRecovered)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                              {formatKes(line.commissionAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
