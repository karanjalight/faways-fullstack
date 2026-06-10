"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  RefreshCw,
  Shield,
  UserCircle2,
} from "lucide-react";
import ClientCredentialsModal from "./ClientCredentialsModal";
import { PORTAL_LOGIN_URL } from "../constants/portal";
import {
  createClientAccount,
  fetchClientAccounts,
  resetClientAccountPassword,
} from "../lib/clientAccounts";
import type { ClientAccount, ClientCredentials } from "../types/clientAccount";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type ClientPortalSectionProps = {
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
};

type FormErrors = Record<string, string>;

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function validatePasswordPair(password: string, confirm: string): FormErrors {
  const errors: FormErrors = {};
  if (!password.trim()) {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  if (!confirm.trim()) {
    errors.confirmPassword = "Please confirm the password.";
  } else if (password !== confirm) {
    errors.confirmPassword = "Passwords do not match.";
  }
  return errors;
}

export default function ClientPortalSection({
  clientId,
  clientName,
  clientEmail,
  clientPhone,
}: ClientPortalSectionProps) {
  const [accounts, setAccounts] = useState<ClientAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<ClientAccount | null>(null);

  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [issuedCredentials, setIssuedCredentials] = useState<{
    credentials: ClientCredentials;
    contactName?: string;
    purpose: "new_account" | "password_reset";
  } | null>(null);

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchClientAccounts(clientId);
      setAccounts(data);
    } catch (e) {
      console.error(e);
      setLoadError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const resetForm = () => {
    setContactName(clientName);
    setEmail(clientEmail);
    setPhone(clientPhone);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setFormErrors({});
    setActionError(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openResetDialog = (account: ClientAccount) => {
    setResetTarget(account);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setFormErrors({});
    setActionError(null);
    setResetOpen(true);
  };

  const handleCreate = async () => {
    const errors: FormErrors = {};
    if (!contactName.trim()) errors.contactName = "Contact name is required.";
    if (!email.trim()) errors.email = "Email is required.";
    Object.assign(errors, validatePasswordPair(password, confirmPassword));
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    setActionError(null);
    try {
      const { account, credentials } = await createClientAccount(clientId, {
        contactName: contactName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      setAccounts((prev) => [...prev, account]);
      setCreateOpen(false);
      setIssuedCredentials({
        credentials,
        contactName: contactName.trim(),
        purpose: "new_account",
      });
    } catch (e) {
      console.error(e);
      setActionError((e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!resetTarget) return;
    const errors = validatePasswordPair(password, confirmPassword);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    setActionError(null);
    try {
      const { credentials } = await resetClientAccountPassword(
        clientId,
        resetTarget.id,
        password,
      );
      setResetOpen(false);
      setResetTarget(null);
      setIssuedCredentials({
        credentials,
        contactName: resetTarget.fullName || undefined,
        purpose: "password_reset",
      });
    } catch (e) {
      console.error(e);
      setActionError((e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Card className="overflow-hidden rounded-3xl border-none shadow-sm ring-1 ring-slate-100">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 px-6 py-5 text-white">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Portal access</h2>
                  <p className="mt-1 text-sm text-slate-200/90">
                    Manage login accounts for {clientName}. Users sign in at{" "}
                    <a
                      href={PORTAL_LOGIN_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-blue-200 underline underline-offset-2 hover:text-white"
                    >
                      {PORTAL_LOGIN_URL.replace("https://", "")}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </p>
                </div>
              </div>
              <Button
                type="button"
                className="rounded-full bg-white text-slate-900 hover:bg-slate-100"
                onClick={openCreateDialog}
              >
                <Plus className="mr-2 h-4 w-4" />
                New account
              </Button>
            </div>
          </div>

          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
            ) : loadError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-center">
                <p className="text-sm font-medium text-rose-800">{loadError}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 rounded-full"
                  onClick={loadAccounts}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            ) : accounts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                <UserCircle2 className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-700">
                  No portal accounts yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Create a login so this client can access their debts online.
                </p>
                <Button
                  type="button"
                  className="mt-4 rounded-full bg-blue-800 hover:bg-blue-900"
                  onClick={openCreateDialog}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create first account
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-800">
                        {(account.fullName || account.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-slate-900">
                            {account.fullName || "Portal user"}
                          </p>
                          <Badge variant={account.isActive ? "success" : "secondary"}>
                            {account.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="mt-1 break-all text-sm text-slate-600">
                          {account.email}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Added {formatDate(account.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 rounded-full"
                      onClick={() => openResetDialog(account)}
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      Set new password
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-0">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
            <DialogHeader>
              <DialogTitle className="text-xl">Create portal account</DialogTitle>
              <DialogDescription>
                Set the login email and password for a user at {clientName}.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-4 px-6 py-5">
            <div className="space-y-2">
              <Label htmlFor="portal-contact-name">Contact name</Label>
              <Input
                id="portal-contact-name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Jane Doe"
                className="rounded-xl"
              />
              {formErrors.contactName && (
                <p className="text-xs text-rose-600">{formErrors.contactName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="portal-email">Login email</Label>
              <Input
                id="portal-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@client.com"
                className="rounded-xl"
              />
              {formErrors.email && (
                <p className="text-xs text-rose-600">{formErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="portal-phone">Phone (optional)</Label>
              <Input
                id="portal-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254..."
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="portal-password">Password</Label>
                <div className="relative">
                  <Input
                    id="portal-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-xs text-rose-600">{formErrors.password}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="portal-confirm-password">Confirm password</Label>
                <Input
                  id="portal-confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="rounded-xl"
                />
                {formErrors.confirmPassword && (
                  <p className="text-xs text-rose-600">{formErrors.confirmPassword}</p>
                )}
              </div>
            </div>
            {actionError && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {actionError}
              </p>
            )}
          </div>
          <DialogFooter className="border-t border-slate-200 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={isSubmitting}
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full bg-blue-800 hover:bg-blue-900"
              disabled={isSubmitting}
              onClick={handleCreate}
            >
              {isSubmitting ? "Creating…" : "Create account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={resetOpen}
        onOpenChange={(open) => {
          setResetOpen(open);
          if (!open) setResetTarget(null);
        }}
      >
        <DialogContent className="max-w-md rounded-3xl p-0">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
            <DialogHeader>
              <DialogTitle className="text-xl">Set new password</DialogTitle>
              <DialogDescription>
                {resetTarget
                  ? `Choose a new password for ${resetTarget.email}.`
                  : "Choose a new password for this account."}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-4 px-6 py-5">
            <div className="space-y-2">
              <Label htmlFor="reset-password">New password</Label>
              <div className="relative">
                <Input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-xs text-rose-600">{formErrors.password}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-confirm-password">Confirm password</Label>
              <Input
                id="reset-confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="rounded-xl"
              />
              {formErrors.confirmPassword && (
                <p className="text-xs text-rose-600">{formErrors.confirmPassword}</p>
              )}
            </div>
            {actionError && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {actionError}
              </p>
            )}
          </div>
          <DialogFooter className="border-t border-slate-200 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={isSubmitting}
              onClick={() => setResetOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full bg-blue-800 hover:bg-blue-900"
              disabled={isSubmitting}
              onClick={handleReset}
            >
              {isSubmitting ? "Saving…" : "Update password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {issuedCredentials && (
        <ClientCredentialsModal
          credentials={issuedCredentials.credentials}
          clientName={clientName}
          contactName={issuedCredentials.contactName}
          purpose={issuedCredentials.purpose}
          onClose={() => setIssuedCredentials(null)}
        />
      )}
    </>
  );
}
