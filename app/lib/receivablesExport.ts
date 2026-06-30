import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatKes } from '@/lib/format-kes';
import { flattenReceivablesRows } from './receivablesRows';
import type { InsurerReceivable, ReceivablesTotals } from '../types/receivable';

const dateStamp = (): string => new Date().toISOString().slice(0, 10);

export function exportReceivablesExcel(
  insurers: InsurerReceivable[],
  totals: ReceivablesTotals,
  isAdmin: boolean,
): void {
  const rows = flattenReceivablesRows(insurers, isAdmin);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Receivables');

  const summary = [
    { Metric: 'Total billed', Amount: totals.billed },
    { Metric: 'Total paid', Amount: totals.paid },
    { Metric: 'Total outstanding', Amount: totals.outstanding },
    { Metric: 'Insurers', Amount: totals.insurerCount },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'Summary');

  XLSX.writeFile(wb, `faways-receivables-${dateStamp()}.xlsx`);
}

export function exportReceivablesPdf(
  insurers: InsurerReceivable[],
  totals: ReceivablesTotals,
  isAdmin: boolean,
): void {
  const rows = flattenReceivablesRows(insurers, isAdmin);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  doc.setFontSize(16);
  doc.text('Insurance Receivables', 40, 40);
  doc.setFontSize(10);
  doc.text(
    `Total billed: ${formatKes(totals.billed)}   Paid: ${formatKes(totals.paid)}   Outstanding: ${formatKes(totals.outstanding)}   Insurers: ${totals.insurerCount}`,
    40,
    60,
  );

  const head = isAdmin
    ? [['Insurer', 'Client', 'Patient', 'Patient ID', 'Status', 'Due date', 'Billed', 'Paid', 'Outstanding']]
    : [['Insurer', 'Patient', 'Patient ID', 'Status', 'Due date', 'Billed', 'Paid', 'Outstanding']];

  const body = rows.map((r) =>
    isAdmin
      ? [r.Insurer, r.Client, r.Patient, r['Patient ID'], r.Status, r['Due date'], formatKes(r.Billed), formatKes(r.Paid), formatKes(r.Outstanding)]
      : [r.Insurer, r.Patient, r['Patient ID'], r.Status, r['Due date'], formatKes(r.Billed), formatKes(r.Paid), formatKes(r.Outstanding)],
  );

  autoTable(doc, {
    head,
    body,
    startY: 80,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 64, 175] },
  });

  doc.save(`faways-receivables-${dateStamp()}.pdf`);
}
