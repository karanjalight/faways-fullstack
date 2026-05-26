'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Loader2, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { fetchAgents } from '@/lib/agents';
import { fetchClients } from '../lib/clients';
import { listCommissionInvoices } from '../lib/commissionInvoices';
import { fetchDebts } from '../lib/debts';
import { fetchInsuranceContacts } from '../lib/insurance';
import type { Agent } from '../types/agent';
import type { Client } from '../types/client';
import type { CommissionInvoiceSummary } from '../types/commissionInvoice';
import type { Debt } from '../types/debt';
import type { InsuranceContact } from '../types/insurance';

type SearchType = 'page' | 'client' | 'debt' | 'agent' | 'contact' | 'invoice';

type SearchResult = {
  id: string;
  type: SearchType;
  title: string;
  subtitle: string;
  href: string;
  keywords: string[];
  priority: number;
};

type SearchData = {
  agents: Agent[];
  clients: Client[];
  debts: Debt[];
  insurance: InsuranceContact[];
  invoices: CommissionInvoiceSummary[];
};

const EMPTY_DATA: SearchData = {
  agents: [],
  clients: [],
  debts: [],
  insurance: [],
  invoices: [],
};

const pageDefinitions: Array<
  Omit<SearchResult, 'id' | 'type'> & { adminOnly?: boolean }
> = [
  {
    title: 'Dashboard',
    subtitle: 'Overview, metrics, recent activity',
    href: '/dashboard',
    keywords: ['home', 'overview', 'analytics', 'summary'],
    priority: 1,
  },
  {
    title: 'Debts',
    subtitle: 'Cases, patients, payers, collection status',
    href: '/debts',
    keywords: ['cases', 'collections', 'patients', 'payer', 'claims'],
    priority: 2,
  },
  {
    title: 'Create Debt',
    subtitle: 'Add a new collection case',
    href: '/debts/new',
    keywords: ['new debt', 'add case', 'create case'],
    priority: 3,
    adminOnly: true,
  },
  {
    title: 'Agents',
    subtitle: 'Collectors, teams, performance',
    href: '/agents',
    keywords: ['collectors', 'staff', 'users', 'team'],
    priority: 4,
  },
  {
    title: 'Clients',
    subtitle: 'Hospitals, clinics, client accounts',
    href: '/clients',
    keywords: ['hospitals', 'clinics', 'accounts', 'providers'],
    priority: 5,
    adminOnly: true,
  },
  {
    title: 'Invoice Overview',
    subtitle: 'Recoveries, commissions, saved invoices',
    href: '/invoice',
    keywords: ['billing', 'commission', 'recovery', 'invoice'],
    priority: 6,
    adminOnly: true,
  },
  {
    title: 'Client Billing',
    subtitle: 'Billing configuration and client commission rates',
    href: '/invoice/client-billing',
    keywords: ['rates', 'commission rates', 'billing setup'],
    priority: 7,
    adminOnly: true,
  },
  {
    title: 'Invoice Collections',
    subtitle: 'Collection lines ready for invoicing',
    href: '/invoice/collections',
    keywords: ['collections', 'payments', 'recovered'],
    priority: 8,
    adminOnly: true,
  },
  {
    title: 'Saved Invoices',
    subtitle: 'Issued and paid commission invoices',
    href: '/invoice/saved',
    keywords: ['issued invoices', 'paid invoices', 'documents'],
    priority: 9,
    adminOnly: true,
  },
  {
    title: 'Contacts',
    subtitle: 'Insurance contacts and payer details',
    href: '/insurance',
    keywords: ['insurance', 'payer', 'policy', 'contacts'],
    priority: 10,
    adminOnly: true,
  },
  {
    title: 'Reports',
    subtitle: 'Operational and commission reports',
    href: '/reports',
    keywords: ['analytics', 'charts', 'performance'],
    priority: 11,
  },
  {
    title: 'Settings',
    subtitle: 'Account, notifications, company settings',
    href: '/settings',
    keywords: ['preferences', 'profile', 'configuration'],
    priority: 12,
  },
];

const resultTypeLabel: Record<SearchType, string> = {
  page: 'Page',
  client: 'Client',
  debt: 'Debt',
  agent: 'Agent',
  contact: 'Contact',
  invoice: 'Invoice',
};

const resultTypeStyles: Record<SearchType, string> = {
  page: 'bg-slate-100 text-slate-700',
  client: 'bg-blue-50 text-blue-700',
  debt: 'bg-rose-50 text-rose-700',
  agent: 'bg-violet-50 text-violet-700',
  contact: 'bg-emerald-50 text-emerald-700',
  invoice: 'bg-amber-50 text-amber-700',
};

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function compact(values: Array<string | number | null | undefined>): string[] {
  return values
    .map((value) => String(value ?? '').trim())
    .filter(Boolean);
}

function resultIndex(result: SearchResult): string {
  return normalize([result.title, result.subtitle, ...result.keywords].join(' '));
}

function resultMatches(result: SearchResult, query: string): boolean {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const index = resultIndex(result);
  return words.every((word) => index.includes(word));
}

function scoreResult(result: SearchResult, query: string): number {
  const normalizedQuery = normalize(query);
  const normalizedTitle = normalize(result.title);

  if (!normalizedQuery) return result.priority;
  if (normalizedTitle === normalizedQuery) return 0;
  if (normalizedTitle.startsWith(normalizedQuery)) return 1;
  if (normalizedTitle.includes(normalizedQuery)) return 2;
  return 10 + result.priority;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function fulfilledOr<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback;
}

export default function UniversalSearch({ role }: { role?: string }) {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [data, setData] = useState<SearchData>(EMPTY_DATA);

  const isClientRole = normalize(role ?? '') === 'client';
  const canViewAdminData = !isClientRole;

  useEffect(() => {
    setData(EMPTY_DATA);
    setHasLoadedData(false);
    setLoadError(null);
  }, [canViewAdminData]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!searchRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const loadSearchData = useCallback(async () => {
    if (isLoading || hasLoadedData) return;

    setIsLoading(true);
    setLoadError(null);

    const [agents, debts, clients, insurance, invoices] = await Promise.allSettled([
      fetchAgents(),
      fetchDebts(),
      canViewAdminData ? fetchClients() : Promise.resolve([] as Client[]),
      canViewAdminData ? fetchInsuranceContacts() : Promise.resolve([] as InsuranceContact[]),
      canViewAdminData ? listCommissionInvoices() : Promise.resolve([] as CommissionInvoiceSummary[]),
    ]);

    const failed = [agents, debts, clients, insurance, invoices].some(
      (result) => result.status === 'rejected',
    );

    setData({
      agents: fulfilledOr(agents, []),
      debts: fulfilledOr(debts, []),
      clients: fulfilledOr(clients, []),
      insurance: fulfilledOr(insurance, []),
      invoices: fulfilledOr(invoices, []),
    });
    setHasLoadedData(true);
    setIsLoading(false);

    if (failed) {
      setLoadError('Some records could not be loaded.');
    }
  }, [canViewAdminData, hasLoadedData, isLoading]);

  useEffect(() => {
    if (query.trim().length >= 2) {
      void loadSearchData();
    }
  }, [loadSearchData, query]);

  const pageResults = useMemo<SearchResult[]>(
    () =>
      pageDefinitions
        .filter((page) => canViewAdminData || !page.adminOnly)
        .map((page) => ({
          id: `page-${page.href}`,
          type: 'page',
          title: page.title,
          subtitle: page.subtitle,
          href: page.href,
          keywords: page.keywords,
          priority: page.priority,
        })),
    [canViewAdminData],
  );

  const recordResults = useMemo<SearchResult[]>(() => {
    if (!hasLoadedData) return [];

    const clients = canViewAdminData
      ? data.clients.map<SearchResult>((client, index) => ({
          id: `client-${client.id}`,
          type: 'client',
          title: client.name,
          subtitle: compact([client.email, client.phone, client.company, client.status]).join(' | '),
          href: `/clients/${client.id}`,
          keywords: compact([
            client.name,
            client.email,
            client.phone,
            client.company,
            client.status,
            client.totalDebt,
            client.remainingAmount,
          ]),
          priority: 20 + index,
        }))
      : [];

    const debts = data.debts.map<SearchResult>((debt, index) => ({
      id: `debt-${debt.id}`,
      type: 'debt',
      title: debt.patientName || debt.creditor || `Debt ${debt.id.slice(0, 8)}`,
      subtitle: compact([
        debt.creditor,
        debt.patientId && `Patient ID ${debt.patientId}`,
        debt.payer,
        debt.status,
        formatCurrency(debt.amount - debt.paidAmount),
      ]).join(' | '),
      href: `/debts/${debt.id}`,
      keywords: compact([
        debt.id,
        debt.creditor,
        debt.patientName,
        debt.patientId,
        debt.payer,
        debt.serviceLine,
        debt.owner,
        debt.status,
        debt.stage,
        debt.priority,
        debt.description,
        debt.amount,
        debt.paidAmount,
      ]),
      priority: 100 + index,
    }));

    const agents = data.agents.map<SearchResult>((agent, index) => ({
      id: `agent-${agent.id}`,
      type: 'agent',
      title: agent.name,
      subtitle: compact([agent.email, agent.phone, agent.department, agent.status]).join(' | '),
      href: '/agents',
      keywords: compact([
        agent.name,
        agent.email,
        agent.phone,
        agent.department,
        agent.status,
        agent.assignedDebts,
        agent.totalCollected,
      ]),
      priority: 200 + index,
    }));

    const insurance = canViewAdminData
      ? data.insurance.map<SearchResult>((contact, index) => ({
          id: `contact-${contact.id}`,
          type: 'contact',
          title: contact.company,
          subtitle: compact([
            contact.contactPerson,
            contact.email,
            contact.phone,
            contact.policyNumber,
          ]).join(' | '),
          href: '/insurance',
          keywords: compact([
            contact.company,
            contact.contactPerson,
            contact.email,
            contact.phone,
            contact.policyNumber,
            contact.coverageType,
            contact.status,
            contact.notes,
          ]),
          priority: 300 + index,
        }))
      : [];

    const invoices = canViewAdminData
      ? data.invoices.map<SearchResult>((invoice, index) => ({
          id: `invoice-${invoice.id}`,
          type: 'invoice',
          title: invoice.reference,
          subtitle: compact([
            invoice.clientName,
            invoice.status,
            `${invoice.periodStart} to ${invoice.periodEnd}`,
            formatCurrency(invoice.totalCommission),
          ]).join(' | '),
          href: `/invoice/${invoice.id}`,
          keywords: compact([
            invoice.reference,
            invoice.clientName,
            invoice.status,
            invoice.periodStart,
            invoice.periodEnd,
            invoice.totalRecovered,
            invoice.totalCommission,
          ]),
          priority: 400 + index,
        }))
      : [];

    return [...clients, ...debts, ...agents, ...insurance, ...invoices];
  }, [canViewAdminData, data, hasLoadedData]);

  const results = useMemo(() => {
    const allResults = [...pageResults, ...recordResults];
    const filtered = query.trim()
      ? allResults.filter((result) => resultMatches(result, query))
      : pageResults.slice(0, 6);

    return filtered
      .sort((left, right) => scoreResult(left, query) - scoreResult(right, query))
      .slice(0, 10);
  }, [pageResults, query, recordResults]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, results.length]);

  function navigateToResult(result: SearchResult) {
    router.push(result.href);
    setQuery('');
    setIsOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) setIsOpen(true);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (results.length ? (current + 1) % results.length : 0));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) =>
        results.length ? (current - 1 + results.length) % results.length : 0,
      );
    }

    if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      navigateToResult(results[activeIndex]);
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-xl">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-700">
        <Search className="h-4 w-4" strokeWidth={1.8} />
      </span>
      <Input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search pages, clients, debts, invoices..."
        className="h-10 rounded-full border-slate-500 bg-white pl-9 pr-10 text-sm placeholder:text-slate-500"
        aria-label="Universal search"
        aria-expanded={isOpen}
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            setIsOpen(true);
          }}
          className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-700"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" strokeWidth={1.8} />
        </button>
      )}

      {isOpen && (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Universal Search
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Find pages and records from the dashboard.
            </p>
          </div>

          <div className="max-h-[28rem] overflow-y-auto py-2">
            {results.map((result, index) => (
              <button
                key={result.id}
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => navigateToResult(result)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                  activeIndex === index ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                }`}
              >
                <span
                  className={`mt-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${resultTypeStyles[result.type]}`}
                >
                  {resultTypeLabel[result.type]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    {result.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {result.subtitle}
                  </span>
                </span>
                <ArrowUpRight className="mt-1 h-4 w-4 flex-none text-slate-400" />
              </button>
            ))}

            {query.trim().length >= 2 && isLoading && (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching records...
              </div>
            )}

            {query.trim() && !isLoading && results.length === 0 && (
              <div className="px-4 py-6 text-sm text-slate-500">
                No matching pages or records found.
              </div>
            )}

            {!query.trim() && (
              <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
                Start typing at least 2 characters to include database records.
              </div>
            )}

            {loadError && (
              <div className="border-t border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-700">
                {loadError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
