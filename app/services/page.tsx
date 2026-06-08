import type { Metadata } from "next";
import Link from "next/link";
import MarketingLayout from "@/components/landing/MarketingLayout";
import PageHero from "@/components/landing/PageHero";
import CTABanner from "@/components/landing/CTABanner";
import {
  Wallet,
  Building2,
  FileText,
  LineChart,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Our Solutions | Faways Solutions",
  description:
    "Debt collection, property management, bookkeeping, and credit control services tailored for Kenyan businesses.",
};

const services = [
  {
    id: "debt-collection",
    icon: Wallet,
    title: "Debt Collection & Recovery",
    description:
      "We recover outstanding debts on your behalf using ethical, legally compliant methods. Our no-win-no-fee model means zero upfront cost — you only pay when we successfully recover your money.",
    features: [
      "Commercial and consumer debt recovery",
      "Pre-legal notices and demand letters",
      "Negotiation and settlement facilitation",
      "Court process support and documentation",
      "No Win, No Fee pricing available",
    ],
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
  },
  {
    id: "property",
    icon: Building2,
    title: "Rent Collection & Property Management",
    description:
      "End-to-end property management for landlords and real estate agencies. We handle tenant relations, rent collection, and property reporting so you can focus on growing your portfolio.",
    features: [
      "Monthly rent collection and remittance",
      "Tenant screening and lease management",
      "Arrears follow-up and eviction support",
      "Property condition reports",
      "Vacancy marketing assistance",
    ],
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
  },
  {
    id: "bookkeeping",
    icon: FileText,
    title: "Bookkeeping & Financial Management",
    description:
      "Keep your books accurate and compliant. Our finance team maintains records, prepares statements, and helps you understand your cash position at all times.",
    features: [
      "Accounts payable and receivable management",
      "Monthly financial statements",
      "Cash flow forecasting",
      "Tax preparation support",
      "Audit-ready documentation",
    ],
    image:
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6f?w=800&q=80",
  },
  {
    id: "credit-control",
    icon: LineChart,
    title: "Credit Control Consultancy",
    description:
      "Prevent bad debts before they happen. We help businesses design credit policies, set payment terms, and build systems that protect cash flow.",
    features: [
      "Credit policy design and implementation",
      "Customer creditworthiness assessment",
      "Payment terms optimization",
      "Aging report analysis",
      "Staff training on credit management",
    ],
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
  },
];

const process = [
  { step: "01", title: "Discovery Call", text: "We understand your situation, volumes, and goals." },
  { step: "02", title: "Custom Proposal", text: "Tailored plan with timelines, fees, and expected outcomes." },
  { step: "03", title: "Onboarding", text: "Secure handover of accounts and documentation." },
  { step: "04", title: "Execution & Reporting", text: "Active management with regular progress updates." },
];

export default function ServicesPage() {
  return (
    <MarketingLayout>
      <PageHero
        label="Our Solutions"
        title="Comprehensive Financial Services Built for Kenyan Businesses"
        description="From debt recovery to property management, we provide end-to-end solutions that protect your revenue and simplify your finances."
        cta={{ label: "Get a Custom Quote", href: "/pricing" }}
        image="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&q=80"
      />

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-24">
          {services.map((service, i) => (
            <div
              key={service.id}
              id={service.id}
              className={`grid lg:grid-cols-2 gap-12 items-center ${
                i % 2 === 1 ? "lg:direction-rtl" : ""
              }`}
            >
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <div className="w-14 h-14 rounded-2xl bg-[#C9A34F] flex items-center justify-center mb-6">
                  <service.icon className="w-7 h-7 text-[#0A1628]" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#0A1628] mb-4">
                  {service.title}
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {service.description}
                </p>
                <ul className="space-y-3 mb-8">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-[#C9A34F] flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/consultation"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0A1628] text-white font-semibold hover:bg-[#12243D] transition-colors group"
                >
                  Enquire about this service
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <img
                src={service.image}
                alt={service.title}
                className={`w-full aspect-[4/3] object-cover rounded-3xl shadow-lg ${
                  i % 2 === 1 ? "lg:order-1" : ""
                }`}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-[#0A1628] mb-4">
              How We Get Started
            </h2>
            <p className="text-gray-600">
              A straightforward onboarding process designed to get you results fast.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {process.map((p) => (
              <div
                key={p.step}
                className="p-6 rounded-3xl bg-[#F9F7F4] border border-gray-100"
              >
                <span className="inline-flex w-12 h-12 rounded-xl bg-[#C9A34F]/15 text-[#C9A34F] font-bold items-center justify-center mb-4">
                  {p.step}
                </span>
                <h3 className="font-bold text-[#0A1628] mb-2">{p.title}</h3>
                <p className="text-gray-600 text-sm">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        title="Not Sure Which Service You Need?"
        description="Book a free consultation and we'll recommend the right solution for your situation."
        secondaryLabel="View Pricing"
        secondaryHref="/pricing"
      />
    </MarketingLayout>
  );
}
