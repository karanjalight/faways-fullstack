import jsPDF from 'jspdf';
import { PORTAL_LOGIN_URL } from '../constants/portal';

export type CredentialsPdfOptions = {
  email: string;
  password: string;
  clientName: string;
  contactName?: string;
  loginUrl?: string;
  purpose?: 'new_account' | 'password_reset';
};

function safeFilename(name: string) {
  return name.replace(/[^a-z0-9-_]+/gi, '-').replace(/-+/g, '-').slice(0, 60);
}

/** Download a branded PDF with portal login credentials. */
export function downloadClientCredentialsPdf(options: CredentialsPdfOptions) {
  const {
    email,
    password,
    clientName,
    contactName,
    loginUrl = PORTAL_LOGIN_URL,
    purpose = 'new_account',
  } = options;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  const generatedAt = new Date().toLocaleString('en-KE', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const headerHeight = 120;
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');
  doc.setFillColor(37, 99, 235);
  doc.rect(0, headerHeight - 4, pageWidth, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('FAWAYS', margin, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(203, 213, 225);
  doc.text('Debt recovery & client portal', margin, 62);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(
    purpose === 'password_reset' ? 'Password reset credentials' : 'Portal access credentials',
    margin,
    92,
  );

  let y = headerHeight + 36;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Prepared for', margin, y);
  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(clientName, margin, y);
  if (contactName) {
    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(contactName, margin, y);
  }

  y += 36;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 148, 8, 8, 'FD');

  const boxPad = 20;
  let innerY = y + boxPad + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('LOGIN EMAIL', margin + boxPad, innerY);
  innerY += 18;
  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(email, margin + boxPad, innerY);

  innerY += 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(
    purpose === 'password_reset' ? 'NEW TEMPORARY PASSWORD' : 'PASSWORD',
    margin + boxPad,
    innerY,
  );
  innerY += 18;
  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 64, 175);
  doc.text(password, margin + boxPad, innerY);

  innerY += 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('PORTAL URL', margin + boxPad, innerY);
  innerY += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235);
  doc.text(loginUrl, margin + boxPad, innerY);

  y += 168;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Getting started', margin, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const steps = [
    '1. Open the portal URL above in your web browser.',
    '2. Sign in using the email and temporary password provided.',
    '3. Change your password immediately after your first login.',
    '4. Keep this document secure and delete it once credentials are saved safely.',
  ];
  steps.forEach((step) => {
    doc.text(step, margin, y);
    y += 16;
  });

  y += 12;
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(margin, y, contentWidth, 52, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(146, 64, 14);
  doc.text('Security notice', margin + 14, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    'Do not share these credentials by unsecured channels. Faways staff will never ask for your password.',
    margin + 14,
    y + 32,
    { maxWidth: contentWidth - 28 },
  );

  const footerY = doc.internal.pageSize.getHeight() - 36;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 12, pageWidth - margin, footerY - 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated ${generatedAt} · Faways Company`, margin, footerY);
  doc.text('Confidential — for intended recipient only', margin, footerY + 12);

  const filename = `${safeFilename(clientName)}-portal-credentials.pdf`;
  doc.save(filename);
}
