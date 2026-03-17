// Debt list component with filtering and sorting
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Debt, DebtStatus, getRemainingAmount } from "../types/debt";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DebtListProps {
  debts: Debt[];
  onEdit: (debt: Debt) => void;
  onStatusChange: (debtId: string, newStatus: DebtStatus) => void;
  onDelete?: (debtId: string) => void;
}

export default function DebtList({
  debts,
  onEdit,
  onStatusChange,
  onDelete,
}: DebtListProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<DebtStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "priority">("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceLine, setServiceLine] = useState<"all" | string>("all");

  const uniqueServiceLines = Array.from(
    new Set(debts.map((debt) => debt.serviceLine)),
  );

  const filteredDebts = debts
    .filter((debt) => {
      const matchesStatus = filter === "all" || debt.status === filter;
      const matchesService =
        serviceLine === "all" ||
        debt.serviceLine.toLowerCase() === serviceLine.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        debt.creditor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        debt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        debt.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        debt.payer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesService && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "amount":
          return b.amount - a.amount;
        case "priority": {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        case "date":
        default:
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
    });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "Ksh",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const handleRowClick = (debtId: string) => {
    router.push(`/dashboard/debts/${debtId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-600 bg-white/80 p-5 shadow-sm lg:flex-row lg:items-center">
        <div className="text-sm text-slate-500">
          <h4 className="text-2xl font-semibold text-slate-900">Debts</h4>
          Showing{" "}
          <span className="font-semibold text-slate-900">
            {filteredDebts.length}
          </span>{" "}
          of {debts.length} open cases
        </div>
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search client, patient ID, payer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 rounded-2xl border border-slate-500"
          />
        </div>

        <div className="flex gap-4">
          <div className="grid flex-1 grid-cols-2 gap-3 lg:flex lg:flex-1">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as DebtStatus | "all")}
              className="h-12 rounded-2xl border border-slate-600 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="negotiating">Negotiating</option>
              <option value="paid">Paid</option>
            </select>
            <select
              value={serviceLine}
              onChange={(e) => setServiceLine(e.target.value)}
              className="h-12 rounded-2xl border border-slate-500 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Service Lines</option>
              {uniqueServiceLines.map((line) => (
                <option key={line} value={line}>
                  {line}
                </option>
              ))}
            </select>
          </div>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "date" | "amount" | "priority")
            }
            className="col-span-2 h-12 rounded-2xl border border-slate-500 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Due Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="priority">Sort by Priority</option>
          </select>
          <Button
            variant="secondary"
            className="col-span-2 h-12 rounded-2xl text-sm font-semibold"
            onClick={() => {
              setFilter("all");
              setSortBy("date");
              setSearchQuery("");
              setServiceLine("all");
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      {filteredDebts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-500 bg-white/60 p-12 text-center">
          <p className="text-sm text-slate-500">No cases match your filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-500 bg-white shadow-sm">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-900 text-left text-xs font-semibold uppercase tracking-wide text-slate-100">
                {/* <th className="px-6 py-4 rounded-tl-3xl">Ref #</th> */}
                <th className="px-4 py-4">Client / Debtor</th>
                <th className="px-4 py-4">Service Line</th>
                <th className="px-4 py-4">Owner</th>
                <th className="px-4 py-4">Amount</th>
                <th className="px-4 py-4">Remaining</th>
                <th className="px-4 py-4">Due Date</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 rounded-tr-3xl text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDebts.map((debt, index) => {
                const remaining = getRemainingAmount(debt);
                const isEven = index % 2 === 1;

                return (
                  <tr
                    key={debt.id}
                    onClick={() => handleRowClick(debt.id)}
                    className={`cursor-pointer text-sm transition-colors ${
                      isEven ? "bg-slate-50/80" : "bg-white"
                    } hover:bg-slate-100`}
                  >
                    {/* <td className="px-6 py-4 align-middle text-[13px] font-semibold text-slate-900">
                      {debt.id}
                    </td> */}
                    <td className="px-4 py-4 align-middle text-[13px] text-slate-700">
                      <div className="flex flex-col">
                        <span className="font-semibold">{debt.creditor}</span>
                        <span className="text-xs text-slate-500">
                          {debt.patientName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle text-[13px] text-slate-700">
                      {debt.serviceLine}
                    </td>
                    <td className="px-4 py-4 align-middle text-[13px] text-slate-700">
                      {debt.owner}
                    </td>
                    <td className="px-4 py-4 align-middle text-[13px] text-slate-700">
                      {formatCurrency(debt.amount)}
                    </td>
                    <td className="px-4 py-4 align-middle text-[13px] text-slate-700">
                      {formatCurrency(remaining)}
                    </td>
                    <td className="px-4 py-4 align-middle text-[13px] text-slate-700">
                      {formatDate(debt.dueDate)}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                          debt.status === "paid"
                            ? "bg-emerald-50 text-emerald-700"
                            : debt.status === "pending"
                              ? "bg-amber-50 text-amber-700"
                              : debt.status === "overdue"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-sky-50 text-sky-700"
                        }`}
                      >
                        {debt.status === "negotiating"
                          ? "Negotiating"
                          : debt.status === "paid"
                            ? "Completed"
                            : debt.status.charAt(0).toUpperCase() +
                              debt.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle text-right">
                      <div
                        className="inline-flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full px-3 text-xs"
                          onClick={() => onEdit(debt)}
                        >
                          Edit
                        </Button>
                        {debt.status !== "paid" && (
                          <select
                            value={debt.status}
                            onChange={(e) =>
                              onStatusChange(
                                debt.id,
                                e.target.value as DebtStatus,
                              )
                            }
                            className="h-8 rounded-full border border-slate-300 px-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="negotiating">Negotiating</option>
                            <option value="paid">Mark as Paid</option>
                          </select>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full px-3 text-xs text-rose-600 hover:bg-rose-50"
                            onClick={() => onDelete(debt.id)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
