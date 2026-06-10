"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  FileText,
  Mail,
  Phone,
  Shield,
  TrendingUp,
} from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import ClientPortalSection from "../../components/ClientPortalSection";
import type { Client, RecoveryCommissionType } from "../../types/client";
import type { Debt } from "../../types/debt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { fetchDebts } from "../../lib/debts";
import { fetchClientById, updateClientApi } from "../../lib/clients";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatKes(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

const statusVariant: Record<Client["status"], "default" | "secondary" | "success"> = {
  active: "default",
  inactive: "secondary",
  closed: "success",
};

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

  useEffect(() => {
    const load = async () => {
      if (!params.id) return;
      try {
        setError(null);
        setIsLoading(true);
        const [found, allDebts] = await Promise.all([
          fetchClientById(params.id),
          fetchDebts(),
        ]);
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
        setError((e as Error).message || "Unable to load this client profile.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [params.id]);

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
        setCommissionMessage("Commission percent must be between 0 and 100.");
        return;
      }
    }
    if (commissionType === "flat" && commissionFlat.trim()) {
      if (Number.isNaN(flat) || flat < 0) {
        setCommissionMessage("Flat commission must be zero or a positive amount.");
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
      setCommissionMessage((e as Error).message);
    } finally {
      setIsSavingCommission(false);
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Button
              variant="outline"
              size="icon"
              className="mt-1 shrink-0 rounded-full"
              onClick={() => router.push("/clients")}
              aria-label="Back to clients"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Client profile
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">
                {client ? client.name : "Client"}
              </h1>
              {client?.company && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <Building2 className="h-4 w-4" />
                  {client.company}
                </p>
              )}
            </div>
          </div>
          {client && (
            <Badge variant={statusVariant[client.status]} className="self-start sm:self-center">
              {client.status}
            </Badge>
          )}
        </div>

        {isLoading && (
          <div className="space-y-4">
            <div className="h-36 animate-pulse rounded-3xl bg-slate-100" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-3xl bg-slate-100" />
              ))}
            </div>
          </div>
        )}

        {error && !isLoading && (
          <Card className="rounded-3xl border-rose-200 bg-rose-50">
            <CardContent className="py-8 text-center">
              <p className="text-sm font-medium text-rose-800">{error}</p>
              <Button
                variant="outline"
                className="mt-4 rounded-full"
                onClick={() => router.push("/clients")}
              >
                Back to clients
              </Button>
            </CardContent>
          </Card>
        )}

        {client && !isLoading && (
          <>
            <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl ring-1 ring-slate-700/60">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/15 text-2xl font-bold text-blue-100">
                    {client.name.charAt(0)}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                      Contact details
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-100">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-4 w-4 text-slate-400" />
                        {client.email || "No email"}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-4 w-4 text-slate-400" />
                        {client.phone || "No phone"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
                    <p className="text-slate-400">Last contact</p>
                    <p className="mt-1 font-semibold">{formatDate(client.lastContact)}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
                    <p className="text-slate-400">Client since</p>
                    <p className="mt-1 font-semibold">{formatDate(client.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="rounded-3xl">
                <CardHeader className="pb-2">
                  <CardDescription>Total debt</CardDescription>
                  <CardTitle className="text-2xl">{formatCurrency(client.totalDebt)}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="rounded-3xl">
                <CardHeader className="pb-2">
                  <CardDescription>Collected</CardDescription>
                  <CardTitle className="text-2xl text-emerald-600">
                    {formatCurrency(client.paidAmount)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="rounded-3xl">
                <CardHeader className="pb-2">
                  <CardDescription>Outstanding</CardDescription>
                  <CardTitle className="text-2xl text-rose-600">
                    {formatCurrency(client.remainingAmount)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="rounded-3xl">
                <CardHeader className="pb-2">
                  <CardDescription>Open / overdue debts</CardDescription>
                  <CardTitle className="text-2xl">
                    {openDebts}{" "}
                    <span className="text-base font-normal text-rose-500">
                      / {overdueDebts} overdue
                    </span>
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="overview" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="portal" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Portal access
                </TabsTrigger>
                <TabsTrigger value="debts" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Debts ({clientDebts.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                  <Card className="rounded-3xl">
                    <CardHeader>
                      <CardTitle>Recovery commission</CardTitle>
                      <CardDescription>
                        Fee terms applied to every debt and collection for this client.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-slate-700">
                        <span className="font-medium text-slate-500">On file: </span>
                        {commissionSummary}
                      </p>
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
                            {isSavingCommission ? "Saving…" : "Save"}
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
                        <p
                          className={`text-sm ${
                            commissionMessage.includes("saved")
                              ? "text-emerald-700"
                              : "text-rose-600"
                          }`}
                        >
                          {commissionMessage}
                        </p>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => router.push("/invoice")}
                      >
                        View invoices
                      </Button>
                    </CardContent>
                  </Card>

                  <div className="space-y-6">
                    <Card className="rounded-3xl">
                      <CardHeader>
                        <CardTitle>Recovery progress</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="text-slate-500">Collected vs total</span>
                          <span className="font-semibold text-slate-900">
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="mt-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Total</span>
                            <span className="font-medium">{formatCurrency(client.totalDebt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Collected</span>
                            <span className="font-medium text-emerald-600">
                              {formatCurrency(client.paidAmount)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Outstanding</span>
                            <span className="font-medium text-rose-600">
                              {formatCurrency(client.remainingAmount)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-3xl bg-slate-50">
                      <CardHeader>
                        <CardTitle>Account details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm">
                        <div>
                          <p className="text-slate-500">Assigned agent</p>
                          <p className="font-medium text-slate-900">
                            {client.assignedAgent || "Unassigned"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Primary email</p>
                          <p className="font-mono text-xs text-slate-900">{client.email}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Phone</p>
                          <p className="text-slate-900">{client.phone || "—"}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="portal">
                <ClientPortalSection
                  clientId={client.id}
                  clientName={client.name}
                  clientEmail={client.email}
                  clientPhone={client.phone}
                />
              </TabsContent>

              <TabsContent value="debts">
                <Card className="rounded-3xl">
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle>Related debts</CardTitle>
                      <CardDescription>
                        All debts currently linked to this client.
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      className="shrink-0 rounded-full"
                      onClick={() => router.push("/debts/new")}
                    >
                      + Add debt
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {clientDebts.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                        No debts linked to this client yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {clientDebts.map((debt) => (
                          <button
                            key={debt.id}
                            type="button"
                            onClick={() => router.push(`/debts/${debt.id}`)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {debt.patientName || debt.creditor}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {debt.serviceLine} • Due {formatDate(debt.dueDate)}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  debt.status === "paid"
                                    ? "success"
                                    : debt.status === "overdue"
                                      ? "destructive"
                                      : "warning"
                                }
                              >
                                {debt.status}
                              </Badge>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-sm">
                              <span className="text-slate-500">
                                Paid {formatCurrency(debt.paidAmount)} /{" "}
                                {formatCurrency(debt.amount)}
                              </span>
                              <span className="font-semibold text-rose-600">
                                Remaining {formatCurrency(debt.amount - debt.paidAmount)}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
