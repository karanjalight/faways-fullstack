"use client";

import { Copy, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PORTAL_LOGIN_URL } from "../constants/portal";
import { downloadClientCredentialsPdf } from "../lib/credentialsPdf";
import type { ClientCredentials } from "../types/clientAccount";

type ClientCredentialsModalProps = {
  credentials: ClientCredentials;
  clientName: string;
  contactName?: string;
  purpose?: "new_account" | "password_reset";
  onClose: () => void;
};

export default function ClientCredentialsModal({
  credentials,
  clientName,
  contactName,
  purpose = "new_account",
  onClose,
}: ClientCredentialsModalProps) {
  const title =
    purpose === "password_reset"
      ? "Password reset complete"
      : "Portal account created";

  const description =
    purpose === "password_reset"
      ? "A new temporary password has been set. Share these credentials securely with the user."
      : "Share these credentials securely with your client. They have been provisioned with a client role.";

  const handleCopy = async () => {
    const message = `Welcome to the Faways portal.\n\nClient: ${clientName}\nPortal: ${PORTAL_LOGIN_URL}\nLogin email: ${credentials.email}\nPassword: ${credentials.password}\n\nPlease log in and update your password after first access.`;
    try {
      await navigator.clipboard.writeText(message);
      alert("Credentials copied to clipboard.");
    } catch {
      alert("Unable to copy. Please copy manually.");
    }
  };

  const handleDownloadPdf = () => {
    downloadClientCredentialsPdf({
      email: credentials.email,
      password: credentials.password,
      clientName,
      contactName,
      purpose,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">{title}</h2>
              <p className="mt-1 text-xs text-slate-200/80">{description}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-100 hover:bg-white/20"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5 text-sm">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Client
            </p>
            <p className="mt-1 font-semibold text-slate-900">{clientName}</p>
            {contactName && (
              <p className="text-xs text-slate-600">{contactName}</p>
            )}
          </div>

          <div className="grid gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-blue-900">
                Login email
              </p>
              <p className="mt-1 break-all font-mono text-xs text-slate-900">
                {credentials.email}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-blue-900">
                Password
              </p>
              <p className="mt-1 font-mono text-xs text-slate-900">
                {credentials.password}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-blue-900">
                Portal URL
              </p>
              <p className="mt-1 text-xs text-blue-800">{PORTAL_LOGIN_URL}</p>
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 p-3 text-[11px] text-amber-900 ring-1 ring-amber-200/80">
            This password is shown only once. Download the PDF or copy the
            credentials before closing this dialog.
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={handleCopy}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
          <Button
            type="button"
            className="rounded-full bg-blue-800 hover:bg-blue-900"
            onClick={handleDownloadPdf}
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
