import type { Metadata } from "next";
import Link from "next/link";
import MarketingLayout from "@/components/landing/MarketingLayout";
import PageHero from "@/components/landing/PageHero";
import CTABanner from "@/components/landing/CTABanner";
import { CheckCircle2, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing | Faways Solutions",
  description:
    "Transparent pricing for debt collection, property management, bookkeeping, and credit control services in Kenya.",
};

const plans = [
  {
    name: "Starter",
    description: "For individuals and micro-businesses with straightforward needs.",
    price: "From KES 5,000",
    period: "/month",
    highlight: false,
    features: [
      "Up to 10 active debt accounts",
      "Basic rent collection (1–3 units)",
      "Monthly financial summary",
      "Email support",
      "Standard reporting",
    ],
    cta: "Get Started",
  },
  {
    name: "Professional",
    description: "For SMEs managing growing portfolios and multiple accounts.",
    price: "From KES 15,000",
    period: "/month",
    highlight: true,
    features: [
      "Up to 50 active debt accounts",
      "Property management (up to 15 units)",
      "Full bookkeeping & monthly statements",
      "Dedicated account manager",
      "Priority phone & email support",
      "Quarterly business review",
    ],
    cta: "Most Popular",
  },
  {
    name: "Enterprise",
    description: "For corporates, agencies, and high-volume operations.",
    price: "Custom",
    period: "pricing",
    highlight: false,
    features: [
      "Unlimited debt accounts",
      "Full property portfolio management",
      "Complete finance department outsourcing",
      "Credit policy design & training",
      "24/7 priority support",
      "Custom dashboards & API access",
      "On-site team deployment available",
    ],
    cta: "Contact Sales",
  },
];

const debtPricing = [
  {
    model: "No Win, No Fee",
    detail: "Pay only when we recover your debt. Commission rate agreed upfront based on age and size of debt.",
    best: "Commercial debt recovery",
  },
  {
    model: "Fixed Fee",
    detail: "Flat fee per account for straightforward collections with predictable costs.",
    best: "Small invoice recovery",
  },
  {
    model: "Retainer + Success Fee",
    detail: "Monthly retainer for ongoing portfolio management plus reduced commission on recoveries.",
    best: "High-volume clients",
  },
];

const faqs = [
  {
    q: "Is there a setup fee?",
    a: "Most plans have no setup fee. Enterprise engagements may include a one-time onboarding charge depending on complexity.",
  },
  {
    q: "How does No Win, No Fee work?",
    a: "We agree on a commission percentage before starting. You pay nothing upfront — our fee is deducted only from successfully recovered amounts.",
  },
  {
    q: "Can I switch plans?",
    a: "Yes. You can upgrade or downgrade with 30 days notice. We'll adjust your service scope accordingly.",
  },
  {
    q: "Do you offer annual discounts?",
    a: "Yes — annual contracts receive up to 15% off monthly rates. Contact us for a custom quote.",
  },
];

export default function PricingPage() {
  return (
    <MarketingLayout>
      <PageHero
        label="Pricing"
        title="Transparent Plans for Every Business Size"
        description="Choose a plan that fits your needs, or let us build a custom package. No hidden fees — just clear value."
        cta={{ label: "Book Free Consultation", href: "/consultation" }}
        image="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&q=80"
      />

      <section className="py-20 px-6 -mt-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-8 rounded-3xl border transition-shadow hover:shadow-xl ${
                plan.highlight
                  ? "bg-[#0A1628] text-white border-[#C9A34F] shadow-xl scale-[1.02]"
                  : "bg-white border-gray-100"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#C9A34F] text-[#0A1628] text-xs font-bold uppercase">
                  Recommended
                </span>
              )}
              <h3
                className={`text-xl font-bold mb-2 ${
                  plan.highlight ? "text-white" : "text-[#0A1628]"
                }`}
              >
                {plan.name}
              </h3>
              <p
                className={`text-sm mb-6 ${
                  plan.highlight ? "text-white/60" : "text-gray-500"
                }`}
              >
                {plan.description}
              </p>
              <div className="mb-8">
                <span
                  className={`text-3xl font-bold ${
                    plan.highlight ? "text-[#C9A34F]" : "text-[#0A1628]"
                  }`}
                >
                  {plan.price}
                </span>
                <span
                  className={`text-sm ${
                    plan.highlight ? "text-white/50" : "text-gray-400"
                  }`}
                >
                  {plan.period}
                </span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className={`flex items-start gap-3 text-sm ${
                      plan.highlight ? "text-white/80" : "text-gray-600"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-5 h-5 flex-shrink-0 ${
                        plan.highlight ? "text-[#C9A34F]" : "text-[#C9A34F]"
                      }`}
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/consultation"
                className={`block text-center py-3 rounded-full font-semibold transition-colors ${
                  plan.highlight
                    ? "bg-[#C9A34F] text-[#0A1628] hover:bg-[#d4b05f]"
                    : "bg-[#0A1628] text-white hover:bg-[#12243D]"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-[#0A1628] mb-4">
              Debt Recovery Pricing Models
            </h2>
            <p className="text-gray-600">
              Flexible options designed to align our success with yours.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {debtPricing.map((d) => (
              <div
                key={d.model}
                className="p-8 rounded-3xl bg-[#F9F7F4] border border-gray-100"
              >
                <h3 className="text-lg font-bold text-[#0A1628] mb-3">
                  {d.model}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {d.detail}
                </p>
                <span className="inline-block px-3 py-1 rounded-full bg-[#C9A34F]/15 text-[#C9A34F] text-xs font-medium">
                  Best for: {d.best}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 justify-center mb-10">
            <HelpCircle className="w-6 h-6 text-[#C9A34F]" />
            <h2 className="text-2xl font-bold text-[#0A1628]">
              Pricing FAQs
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="p-6 rounded-2xl bg-white border border-gray-100"
              >
                <h3 className="font-semibold text-[#0A1628] mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        title="Need a Custom Quote?"
        description="Tell us about your portfolio and we'll prepare a tailored proposal within 24 hours."
        primaryLabel="Request Custom Quote"
        primaryHref="/consultation"
        secondaryLabel="View Solutions"
        secondaryHref="/services"
      />
    </MarketingLayout>
  );
}
