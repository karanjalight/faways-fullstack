"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, Plus, RefreshCw, Shield } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import ClientCredentialsModal from "../../components/ClientCredentialsModal";
import type { Client, RecoveryCommissionType } from "../../types/client";
import type { Debt } from "../../types/debt";
import type { ClientAccount, ClientCredentials } from "../../types/clientAccount";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchDebts } from "../../lib/debts";
import { updateClientApi } from "../../lib/clients";
import {
  createClientAccount,
  fetchClientAccounts,
  resetClientAccountPassword,
} from "../../lib/clientAccounts";
import { formatKes } from "@/lib/format-kes";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [clientDebts, setClientDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commissionType, setCommissionType] =
    useState<RecoveryCommissionType>("percent");
  const [commissionPercent, setCommissionPercent] = useState("");
  const [commissionFlat, setCommissionFlat] = useState("");
  const [isSavingCommission, setIsSavingCommission] = useState(false);
  const [commissionMessage, setCommissionMessage] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<ClientAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newAccountEmail, setNewAccountEmail] = useState("");
  const [newAccountPhone, setNewAccountPhone] = useState("");
  const [newAccountPassword, setNewAccountPassword] = useState("");
  const [newAccountConfirmPassword, setNewAccountConfirmPassword] = useState("");
  const [showNewAccountPassword, setShowNewAccountPassword] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [issuedCredentials, setIssuedCredentials] = useState<{
    credentials: ClientCredentials;
    contactName?: string;
    purpose: "new_account" | "password_reset";
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        // Fetch all clients and pick the one matching this id.
        // This avoids requiring a separate /api/clients/[id] route.
        const res = await fetch("/api/clients");
        if (!res.ok) {
          throw new Error("Failed to load clients");
        }
        const data = (await res.json()) as Client[];
        const found = data.find((c) => c.id === params.id);
        if (!found) {
          throw new Error("Client not found");
        }
        const allDebts = await fetchDebts();
        const relatedDebts = allDebts.filter((debt) => debt.clientId === found.id);
        const totalDebt = relatedDebts.reduce((sum, debt) => sum + debt.amount, 0);
        const paidAmount = relatedDebts.reduce((sum, debt) => sum + debt.paidAmount, 0);
        setClientDebts(relatedDebts);
        const merged: Client = {
          ...found,
          totalDebt,
          paidAmount,
          remainingAmount: totalDebt - paidAmount,
        };
        setClient(merged);
        setCommissionType(merged.recoveryCommissionType ?? "percent");
        setCommissionPercent(
          merged.recoveryCommissionPercent != null
            ? String(merged.recoveryCommissionPercent)
            : "",
        );
        setCommissionFlat(
          merged.recoveryCommissionFlat != null
            ? String(merged.recoveryCommissionFlat)
            : "",
        );
        setCommissionMessage(null);
      } catch (e) {
        console.error(e);
        setError("Unable to load this client profile.");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      load();
    }
  }, [params.id]);

  useEffect(() => {
    const loadAccounts = async () => {
      if (!params.id || !client) return;
      setIsLoadingAccounts(true);
      setAccountsError(null);
      try {
        const data = await fetchClientAccounts(params.id);
        setAccounts(data);
      } catch (e) {
        console.error(e);
        setAccountsError("Unable to load portal accounts.");
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    loadAccounts();
  }, [params.id, client?.id]);

  const statusStyles: Record<Client["status"], string> = {
    active: "bg-blue-100 text-blue-800",
    inactive: "bg-gray-100 text-gray-800",
    closed: "bg-green-100 text-green-800",
  };

  const progress =
    client && client.totalDebt > 0
      ? (client.paidAmount / client.totalDebt) * 100
      : 0;
  const overdueDebts = clientDebts.filter((debt) => debt.status === "overdue").length;
  const openDebts = clientDebts.filter((debt) => debt.status !== "paid").length;

  const resetCommissionForm = () => {
    if (!client) return;
    setCommissionType(client.recoveryCommissionType ?? "percent");
    setCommissionPercent(
      client.recoveryCommissionPercent != null
        ? String(client.recoveryCommissionPercent)
        : "",
    );
    setCommissionFlat(
      client.recoveryCommissionFlat != null ? String(client.recoveryCommissionFlat) : "",
    );
    setCommissionMessage(null);
  };

  const handleSaveCommission = async () => {
    if (!client || !params.id) return;
    const pct =
      commissionType === "percent" ? parseFloat(commissionPercent) : NaN;
    const flat =
      commissionType === "flat" ? parseFloat(commissionFlat) : NaN;

    if (commissionType === "percent" && commissionPercent.trim()) {
      if (Number.isNaN(pct) || pct < 0 || pct > 100) {
        alert("Commission percent must be between 0 and 100.");
        return;
      }
    }
    if (commissionType === "flat" && commissionFlat.trim()) {
      if (Number.isNaN(flat) || flat < 0) {
        alert("Flat commission must be zero or a positive amount.");
        return;
      }
    }

    const recoveryCommissionPercent =
      commissionType === "percent"
        ? commissionPercent.trim()
          ? pct
          : null
        : null;
    const recoveryCommissionFlat =
      commissionType === "flat"
        ? commissionFlat.trim()
          ? flat
          : null
        : null;

    setIsSavingCommission(true);
    setCommissionMessage(null);
    try {
      const updated = await updateClientApi(params.id, {
        recoveryCommissionType: commissionType,
        recoveryCommissionPercent,
        recoveryCommissionFlat,
      });
      const totalDebt = clientDebts.reduce((sum, debt) => sum + debt.amount, 0);
      const paidAmount = clientDebts.reduce((sum, debt) => sum + debt.paidAmount, 0);
      setClient({
        ...updated,
        totalDebt,
        paidAmount,
        remainingAmount: totalDebt - paidAmount,
      });
      setCommissionMessage("Commission settings saved.");
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
    } finally {
      setIsSavingCommission(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!params.id || !client) return;
    if (!newContactName.trim() || !newAccountEmail.trim() || !newAccountPassword.trim()) {
      alert("Contact name, email and password are required.");
      return;
    }

    if (newAccountPassword.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }

    if (newAccountPassword !== newAccountConfirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setIsCreatingAccount(true);
    try {
      const { account, credentials } = await createClientAccount(params.id, {
        contactName: newContactName.trim(),
        email: newAccountEmail.trim(),
        password: newAccountPassword,
        phone: newAccountPhone.trim() || undefined,
      });
      setAccounts((prev) => [...prev, account]);
      setIssuedCredentials({
        credentials,
        contactName: newContactName.trim(),
        purpose: "new_account",
      });
      setShowCreateAccount(false);
      setNewContactName("");
      setNewAccountEmail("");
      setNewAccountPhone("");
      setNewAccountPassword("");
      setNewAccountConfirmPassword("");
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleResetPassword = async (account: ClientAccount) => {
    if (!params.id || !client) return;
    if (
      !confirm(
        `Reset the password for ${account.email}? The user will need the new temporary password to sign in.`,
      )
    ) {
      return;
    }

    setResettingUserId(account.id);
    try {
      const { credentials } = await resetClientAccountPassword(params.id, account.id);
      setIssuedCredentials({
        credentials,
        contactName: account.fullName || undefined,
        purpose: "password_reset",
      });
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
    } finally {
      setResettingUserId(null);
    }
  };

  const commissionSummary =
    client &&
    (client.recoveryCommissionType === "flat"
      ? client.recoveryCommissionFlat != null && client.recoveryCommissionFlat > 0
        ? `${formatKes(client.recoveryCommissionFlat)} per collection`
        : "No flat fee set"
      : client.recoveryCommissionPercent != null && client.recoveryCommissionPercent > 0
        ? `${client.recoveryCommissionPercent}% of each recovery`
        : "No percentage set");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Client profile
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              {client ? client.name : "Client"}
            </h1>
            {client?.company && (
              <p className="text-sm text-slate-500">{client.company}</p>
            )}
          </div>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => router.push("/clients")}
          >
            Back to clients
          </Button>
        </div>

        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-2xl ring-1 ring-slate-700/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-2xl font-bold text-blue-100 shadow-inner">
                {client?.name?.charAt(0) ?? "C"}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Relationship snapshot
                </p>
                <p className="text-sm text-slate-100">
                  {client
                    ? `${client.email} • ${client.phone}`
                    : "Contact details loading"}
                </p>
                {client && (
                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                      statusStyles[client.status]
                    }`}
                  >
                    {client.status.charAt(0).toUpperCase() +
                      client.status.slice(1)}
                  </span>
                )}
              </div>
            </div>
            {client && (
              <div className="rounded-2xl bg-slate-800/60 px-4 py-3 text-xs">
                <p className="text-slate-300">
                  Last contact:{" "}
                  <span className="font-semibold text-white">
                    {formatDate(client.lastContact)}
                  </span>
                </p>
                <p className="text-slate-300">
                  Created:{" "}
                  <span className="font-semibold text-white">
                    {formatDate(client.createdAt)}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {isLoading && (
          <p className="text-sm text-slate-500">Loading client details...</p>
        )}
        {error && !isLoading && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {client && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <p className="text-xs uppercase tracking-wide text-slate-500">Total debt</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {formatKes(client.totalDebt)}
                </p>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <p className="text-xs uppercase tracking-wide text-slate-500">Collected</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-600">
                  {formatKes(client.paidAmount)}
                </p>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <p className="text-xs uppercase tracking-wide text-slate-500">Outstanding</p>
                <p className="mt-2 text-2xl font-semibold text-rose-600">
                  {formatKes(client.remainingAmount)}
                </p>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <p className="text-xs uppercase tracking-wide text-slate-500">Open / Overdue</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {openDebts} / <span className="text-rose-600">{overdueDebts}</span>
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Recovery commission
                  </h2>
                  <p className="text-xs text-slate-500">
                    Fee terms for this client apply to every debt linked to this account. Each
                    recorded collection on the Invoice page uses these rules.
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    <span className="font-medium text-slate-500">Currently on file: </span>
                    {commissionSummary}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 rounded-full"
                  onClick={() => router.push("/invoice")}
                >
                  View invoice
                </Button>
              </div>

              <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-xs">Basis</Label>
                  <select
                    value={commissionType}
                    onChange={(e) =>
                      setCommissionType(e.target.value as RecoveryCommissionType)
                    }
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="percent">% of amount recovered</option>
                    <option value="flat">Flat per collection</option>
                  </select>
                </div>
                {commissionType === "percent" ? (
                  <div className="space-y-2">
                    <Label className="text-xs">Percent (0–100)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={commissionPercent}
                      onChange={(e) => setCommissionPercent(e.target.value)}
                      placeholder="e.g. 15"
                      className="rounded-xl"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-xs">Flat fee per collection</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={commissionFlat}
                      onChange={(e) => setCommissionFlat(e.target.value)}
                      placeholder="e.g. 2500"
                      className="rounded-xl"
                    />
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <Button
                    type="button"
                    className="rounded-xl"
                    disabled={isSavingCommission}
                    onClick={handleSaveCommission}
                  >
                    {isSavingCommission ? "Saving…" : "Save commission"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    disabled={isSavingCommission}
                    onClick={resetCommissionForm}
                  >
                    Reset
                  </Button>
                </div>
              </div>
              {commissionMessage && (
                <p className="mt-3 text-sm text-emerald-700">{commissionMessage}</p>
              )}
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-800" />
                    <h2 className="text-base font-semibold text-slate-900">
                      Portal accounts
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Create login access for this client organization, reset passwords,
                    and download credentials as a PDF.
                  </p>
                </div>
                <Button
                  type="button"
                  className="shrink-0 rounded-full bg-blue-800 hover:bg-blue-900"
                  onClick={() => {
                    setShowCreateAccount((open) => !open);
                    if (!showCreateAccount && client) {
                      setNewContactName(client.name);
                      setNewAccountEmail(client.email);
                      setNewAccountPhone(client.phone);
                    }
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create account
                </Button>
              </div>

              {showCreateAccount && (
                <div className="mb-4 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Contact name</Label>
                    <Input
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Login email</Label>
                    <Input
                      type="email"
                      value={newAccountEmail}
                      onChange={(e) => setNewAccountEmail(e.target.value)}
                      placeholder="user@client.com"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Phone (optional)</Label>
                    <Input
                      value={newAccountPhone}
                      onChange={(e) => setNewAccountPhone(e.target.value)}
                      placeholder="+254..."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Password</Label>
                    <div className="relative">
                      <Input
                        type={showNewAccountPassword ? "text" : "password"}
                        value={newAccountPassword}
                        onChange={(e) => setNewAccountPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="rounded-xl pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewAccountPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        aria-label={showNewAccountPassword ? "Hide password" : "Show password"}
                      >
                        {showNewAccountPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs">Confirm password</Label>
                    <Input
                      type={showNewAccountPassword ? "text" : "password"}
                      value={newAccountConfirmPassword}
                      onChange={(e) => setNewAccountConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="flex items-end gap-2 md:col-span-2">
                    <Button
                      type="button"
                      className="rounded-xl"
                      disabled={isCreatingAccount}
                      onClick={handleCreateAccount}
                    >
                      {isCreatingAccount ? "Creating…" : "Provision account"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      disabled={isCreatingAccount}
                      onClick={() => setShowCreateAccount(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {isLoadingAccounts && (
                <p className="text-sm text-slate-500">Loading portal accounts…</p>
              )}
              {accountsError && !isLoadingAccounts && (
                <p className="text-sm text-red-600">{accountsError}</p>
              )}
              {!isLoadingAccounts && !accountsError && accounts.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No portal accounts yet. Create one so this client can sign in and
                  track their debts.
                </div>
              )}
              {!isLoadingAccounts && accounts.length > 0 && (
                <div className="space-y-3">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-slate-900">
                            {account.fullName || "Portal user"}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              account.isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {account.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="mt-1 break-all font-mono text-xs text-slate-600">
                          {account.email}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Created {formatDate(account.createdAt)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 rounded-full"
                        disabled={resettingUserId === account.id}
                        onClick={() => handleResetPassword(account)}
                      >
                        {resettingUserId === account.id ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <KeyRound className="mr-2 h-4 w-4" />
                        )}
                        Reset password
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-[3fr,2fr]">
              <div className="space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Financial exposure
              </h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total debt</span>
                  <span className="text-lg font-semibold text-slate-900">
                    {formatKes(client.totalDebt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Collected</span>
                  <span className="text-sm font-semibold text-emerald-600">
                    {formatKes(client.paidAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Outstanding</span>
                  <span className="text-sm font-semibold text-rose-600">
                    {formatKes(client.remainingAmount)}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Recovery progress</span>
                  <span className="font-medium text-slate-700">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              </div>

              <div className="space-y-4 rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-100">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Account metadata
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500">Assigned agent</p>
                  <p className="font-medium text-slate-900">
                    {client.assignedAgent || "Unassigned"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Primary email</p>
                  <p className="font-mono text-xs text-slate-900">
                    {client.email}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Phone</p>
                  <p className="text-slate-900">{client.phone}</p>
                </div>
              </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Related debts
                  </h2>
                  <p className="text-xs text-slate-500">
                    Every debt currently linked to this client account.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => router.push("/debts/new")}
                >
                  + Add Debt
                </Button>
              </div>
              {clientDebts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No debts linked to this client yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {clientDebts.map((debt) => (
                    <button
                      key={debt.id}
                      type="button"
                      onClick={() => router.push(`/debts/${debt.id}`)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50/30"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {debt.patientName || debt.creditor}
                          </p>
                          <p className="text-xs text-slate-500">
                            {debt.serviceLine} • Due {formatDate(debt.dueDate)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            debt.status === "paid"
                              ? "bg-emerald-100 text-emerald-700"
                              : debt.status === "overdue"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {debt.status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-slate-500">
                          Paid {formatKes(debt.paidAmount)} /{" "}
                          {formatKes(debt.amount)}
                        </span>
                        <span className="font-semibold text-rose-600">
                          Remaining {formatKes(debt.amount - debt.paidAmount)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {issuedCredentials && client && (
          <ClientCredentialsModal
            credentials={issuedCredentials.credentials}
            clientName={client.name}
            contactName={issuedCredentials.contactName}
            purpose={issuedCredentials.purpose}
            onClose={() => setIssuedCredentials(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

