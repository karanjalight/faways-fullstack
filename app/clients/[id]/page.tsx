 "use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "../../components/DashboardLayout";
import type { Client } from "../../types/client";
import { Button } from "@/components/ui/button";

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

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setClient(found);
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

  const statusStyles: Record<Client["status"], string> = {
    active: "bg-blue-100 text-blue-800",
    inactive: "bg-gray-100 text-gray-800",
    closed: "bg-green-100 text-green-800",
  };

  const progress =
    client && client.totalDebt > 0
      ? (client.paidAmount / client.totalDebt) * 100
      : 0;

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
          <div className="grid gap-6 lg:grid-cols-[3fr,2fr]">
            <div className="space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Financial exposure
              </h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total debt</span>
                  <span className="text-lg font-semibold text-slate-900">
                    {formatCurrency(client.totalDebt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Collected</span>
                  <span className="text-sm font-semibold text-emerald-600">
                    {formatCurrency(client.paidAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Outstanding</span>
                  <span className="text-sm font-semibold text-rose-600">
                    {formatCurrency(client.remainingAmount)}
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
        )}
      </div>
    </DashboardLayout>
  );
}

