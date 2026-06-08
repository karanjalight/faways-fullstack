import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarketingLayout from "@/components/landing/MarketingLayout";
import CTABanner from "@/components/landing/CTABanner";
import { Clock, ArrowLeft, Tag } from "lucide-react";

const articles: Record<
  string,
  {
    title: string;
    category: string;
    readTime: string;
    date: string;
    image: string;
    content: string[];
  }
> = {
  "no-win-no-fee-debt-recovery": {
    title: "Understanding No Win, No Fee Debt Recovery in Kenya",
    category: "Debt Recovery",
    readTime: "6 min read",
    date: "May 15, 2025",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80",
    content: [
      "Chasing overdue payments is one of the most draining tasks for any Kenyan business owner. You have already delivered the product or service — now you are spending hours on follow-up calls, sending reminders, and worrying about cash flow. This is where professional debt collection, and specifically the No Win, No Fee model, becomes a game-changer.",
      "Under a No Win, No Fee arrangement, you pay Faways Solutions only when we successfully recover your debt. There are no upfront fees, no monthly retainers, and no risk if the debt cannot be collected. Our commission is agreed upon before engagement and deducted from the recovered amount.",
      "This model works best for commercial debts — overdue invoices from clients, unpaid supplier credits, and outstanding loan repayments. It aligns our incentives with yours: we only earn when you get paid.",
      "Before we begin, we conduct a free assessment of your debt portfolio. We evaluate the age of the debt, the debtor's profile, available documentation, and the likelihood of recovery. This helps us set realistic expectations and agree on fair commission rates.",
      "Our recovery process is fully compliant with Kenyan law. We issue formal demand letters, conduct professional follow-ups, facilitate negotiations, and support legal proceedings when necessary — always with your approval at each stage.",
      "If you have outstanding debts sitting on your books, don't let them age further. The older a debt becomes, the harder it is to recover. Contact Faways today for a free portfolio review.",
    ],
  },
  "credit-policy-smes": {
    title: "5 Credit Policy Mistakes Kenyan SMEs Make",
    category: "Credit Control",
    readTime: "5 min read",
    date: "April 28, 2025",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
    content: [
      "Many small and medium enterprises in Kenya extend credit to customers without a formal policy. This leads to inconsistent payment terms, delayed collections, and ultimately, bad debts that threaten the business.",
      "Mistake 1: No written credit terms. Verbal agreements are hard to enforce. Every customer should sign off on payment terms before goods or services are delivered.",
      "Mistake 2: Ignoring credit checks. Before extending credit, verify the customer's payment history, business registration, and financial standing. A simple reference check can save you months of chasing.",
      "Mistake 3: Waiting too long to follow up. The best time to follow up on an overdue invoice is the day after the due date — not 90 days later.",
      "Mistake 4: No escalation process. Define what happens at 7 days, 30 days, and 60 days overdue. Who makes the call? When do you involve a collection agency?",
      "Mistake 5: Mixing personal and business relationships with credit decisions. Friends and family accounts often become the worst-performing debts because there is no professional distance.",
      "Faways Solutions helps SMEs design and implement credit policies that protect cash flow while maintaining customer relationships. Book a consultation to get started.",
    ],
  },
  "landlord-rent-collection": {
    title: "A Landlord's Guide to Stress-Free Rent Collection",
    category: "Property Management",
    readTime: "7 min read",
    date: "April 10, 2025",
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80",
    content: [
      "Managing rental properties in Nairobi and other Kenyan cities comes with its own set of challenges — tenant turnover, maintenance requests, and most critically, rent collection.",
      "The foundation of smooth rent collection is thorough tenant screening. Verify employment, check previous landlord references, and require a security deposit equivalent to at least one month's rent.",
      "Use clear, written lease agreements that specify rent amount, due date, late payment penalties, and the process for handling arrears. Have every tenant sign before move-in.",
      "Set up automated reminders three days before rent is due, on the due date, and at 3, 7, and 14 days overdue. Consistency is key — tenants who know you will follow up pay more reliably.",
      "When arrears exceed 30 days, escalate professionally. Issue a formal demand letter, offer a payment plan if appropriate, and know when to involve a property management agency.",
      "Faways Solutions manages rent collection for landlords across Nairobi, Kiambu, and Mombasa. We handle tenant communication, arrears follow-up, and monthly remittance reports — so you receive your rent on time, every time.",
    ],
  },
  "legal-debt-collection-kenya": {
    title: "What Kenyan Law Says About Debt Collection",
    category: "Compliance",
    readTime: "8 min read",
    date: "March 22, 2025",
    image:
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&q=80",
    content: [
      "Debt collection in Kenya is governed by several laws including the Consumer Protection Act, the Data Protection Act, and general contract law principles. Understanding these frameworks protects both creditors and debtors.",
      "Creditors have the right to pursue legitimate debts through demand letters, negotiation, and court proceedings. However, harassment, threats, and disclosure of debt information to third parties without consent are prohibited.",
      "A professional collection agency must operate within these boundaries. At Faways Solutions, every recovery action is documented, compliant, and approved by the client before execution.",
      "For debts that require legal action, the process typically begins with a demand letter, followed by filing a claim in the appropriate court. Small claims courts handle disputes under certain thresholds, while larger amounts go to the High Court.",
      "The Limitation of Actions Act sets time limits on how long a creditor can pursue a debt through courts — generally six years for contract debts. This is why acting promptly on overdue accounts is critical.",
      "If you are unsure about the legal status of your debts, our team can review your portfolio and advise on the best recovery approach within the law.",
    ],
  },
  "cash-flow-management": {
    title: "Cash Flow Management Tips for Growing Businesses",
    category: "Finance",
    readTime: "4 min read",
    date: "March 5, 2025",
    image:
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6f?w=1200&q=80",
    content: [
      "Revenue on paper means nothing if cash isn't in your bank account. For growing Kenyan businesses, managing cash flow is often more important than managing profit.",
      "Track receivables weekly, not monthly. An aging report showing debts at 30, 60, and 90+ days gives you an early warning system for collection problems.",
      "Negotiate shorter payment terms with new clients — net 15 or net 30 instead of net 60. Offer a small discount for early payment to incentivize faster settlement.",
      "Build a cash reserve equal to at least two months of operating expenses. This buffer lets you survive slow-paying clients without taking emergency loans.",
      "Outsource collections for accounts that are 60+ days overdue. The cost of a collection agency is almost always less than the cost of a write-off.",
      "Faways Solutions provides bookkeeping and credit control services that give you real-time visibility into your cash position. Contact us to learn more.",
    ],
  },
  "when-to-outsource-collections": {
    title: "When Should You Outsource Debt Collection?",
    category: "Debt Recovery",
    readTime: "6 min read",
    date: "February 18, 2025",
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80",
    content: [
      "Many businesses try to handle debt collection in-house before seeking professional help. While this works for occasional late payments, there are clear signs that it's time to bring in experts.",
      "Sign 1: Your team spends more than 5 hours per week on payment follow-ups. That time is better spent on sales, delivery, and growth.",
      "Sign 2: Debts are aging past 60 days. Recovery rates drop significantly after this point — professional intervention at 30-60 days yields the best results.",
      "Sign 3: You have a large portfolio of small debts. Chasing fifty KES 10,000 invoices is inefficient in-house but economical for a collection agency working on contingency.",
      "Sign 4: Customer relationships are suffering. When your sales team is also doing collections, tensions rise. A third-party agency creates professional distance.",
      "Sign 5: You lack legal expertise for escalation. Professional agencies know when and how to initiate legal proceedings, saving you costly mistakes.",
      "With Faways' No Win, No Fee model, there is zero financial risk in trying professional collection. You only pay when money comes in.",
    ],
  },
  "tenant-screening-checklist": {
    title: "Tenant Screening Checklist for Kenyan Landlords",
    category: "Property Management",
    readTime: "5 min read",
    date: "January 30, 2025",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
    content: [
      "The best rent collection strategy starts before the tenant moves in. A thorough screening process dramatically reduces the risk of arrears and eviction headaches.",
      "Verify identity: National ID or passport, and cross-check the name against the lease agreement. Take a copy of the ID for your records.",
      "Confirm employment: Request a recent payslip or employment letter. The rent should not exceed 30% of the tenant's monthly income.",
      "Check references: Call the previous landlord. Ask about payment history, property condition, and reason for leaving. Red flags include vague answers or refusal to provide a reference.",
      "Review rental history: How long did they stay at their previous property? Frequent moves may indicate payment problems.",
      "Require a security deposit: At minimum one month's rent, held in a separate account and returned per the terms of the lease upon vacating.",
      "Faways Solutions offers tenant screening as part of our property management package. We verify documents, conduct reference checks, and prepare lease agreements — giving landlords confidence from day one.",
    ],
  },
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = articles[slug];
  if (!article) return { title: "Article Not Found" };
  return {
    title: `${article.title} | Faways Solutions Blog`,
    description: article.content[0]?.slice(0, 160),
  };
}

export async function generateStaticParams() {
  return Object.keys(articles).map((slug) => ({ slug }));
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = articles[slug];
  if (!article) notFound();

  return (
    <MarketingLayout>
      <article>
        <div className="relative bg-[#0A1628] pt-8 pb-20">
          <div className="max-w-4xl mx-auto px-6">
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 text-white/60 hover:text-[#C9A34F] text-sm mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blogs
            </Link>
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 rounded-full bg-[#C9A34F]/20 text-[#C9A34F] text-xs font-semibold flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {article.category}
              </span>
              <span className="text-white/40 text-xs flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {article.readTime}
              </span>
              <span className="text-white/40 text-xs">{article.date}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              {article.title}
            </h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 -mt-10">
          <img
            src={article.image}
            alt={article.title}
            className="w-full aspect-[21/9] object-cover rounded-3xl shadow-xl mb-12"
          />
          <div className="prose prose-lg max-w-none pb-16">
            {article.content.map((paragraph, i) => (
              <p
                key={i}
                className="text-gray-600 leading-relaxed mb-6 text-base"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </article>

      <CTABanner
        title="Need Help With Your Finances?"
        description="Our team is ready to assist with debt recovery, property management, and more."
      />
    </MarketingLayout>
  );
}
