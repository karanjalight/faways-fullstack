import type { Metadata } from "next";
import Link from "next/link";
import MarketingLayout from "@/components/landing/MarketingLayout";
import PageHero from "@/components/landing/PageHero";
import CTABanner from "@/components/landing/CTABanner";
import { Clock, ArrowRight, Tag } from "lucide-react";

export const metadata: Metadata = {
  title: "Blogs | Faways Solutions",
  description:
    "Insights on debt collection, credit management, property management, and financial best practices for Kenyan businesses.",
};

const featured = {
  slug: "no-win-no-fee-debt-recovery",
  title: "Understanding No Win, No Fee Debt Recovery in Kenya",
  excerpt:
    "How the contingency model works, what to expect, and why it's the smartest choice for businesses chasing overdue payments without upfront risk.",
  category: "Debt Recovery",
  readTime: "6 min read",
  date: "May 15, 2025",
  image:
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80",
};

const posts = [
  {
    slug: "credit-policy-smes",
    title: "5 Credit Policy Mistakes Kenyan SMEs Make",
    excerpt:
      "Weak payment terms and poor follow-up are costing small businesses millions. Here's how to fix your credit policy before bad debts pile up.",
    category: "Credit Control",
    readTime: "5 min read",
    date: "April 28, 2025",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
  },
  {
    slug: "landlord-rent-collection",
    title: "A Landlord's Guide to Stress-Free Rent Collection",
    excerpt:
      "From tenant screening to arrears management — practical steps every property owner in Nairobi should follow.",
    category: "Property Management",
    readTime: "7 min read",
    date: "April 10, 2025",
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80",
  },
  {
    slug: "legal-debt-collection-kenya",
    title: "What Kenyan Law Says About Debt Collection",
    excerpt:
      "Know your rights and obligations. A plain-language overview of the legal framework governing debt recovery in Kenya.",
    category: "Compliance",
    readTime: "8 min read",
    date: "March 22, 2025",
    image:
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80",
  },
  {
    slug: "cash-flow-management",
    title: "Cash Flow Management Tips for Growing Businesses",
    excerpt:
      "Why tracking receivables weekly beats monthly reviews, and how to build a cash buffer that survives slow-paying clients.",
    category: "Finance",
    readTime: "4 min read",
    date: "March 5, 2025",
    image:
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6f?w=600&q=80",
  },
  {
    slug: "when-to-outsource-collections",
    title: "When Should You Outsource Debt Collection?",
    excerpt:
      "Signs your in-house team is overwhelmed, and how to evaluate whether a professional agency will deliver better ROI.",
    category: "Debt Recovery",
    readTime: "6 min read",
    date: "February 18, 2025",
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80",
  },
  {
    slug: "tenant-screening-checklist",
    title: "Tenant Screening Checklist for Kenyan Landlords",
    excerpt:
      "The documents, references, and red flags to check before handing over your keys — and how to reduce default risk.",
    category: "Property Management",
    readTime: "5 min read",
    date: "January 30, 2025",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
  },
];

const categories = [
  "All",
  "Debt Recovery",
  "Credit Control",
  "Property Management",
  "Finance",
  "Compliance",
];

export default function BlogsPage() {
  return (
    <MarketingLayout>
      <PageHero
        label="Blogs"
        title="Insights & Resources for Smarter Financial Management"
        description="Expert articles on debt recovery, credit control, property management, and business finance — written for Kenyan entrepreneurs and property owners."
        image="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80"
      />

      {/* Featured post */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <Link
            href={`/blogs/${featured.slug}`}
            className="group grid lg:grid-cols-2 gap-8 items-center p-6 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-shadow"
          >
            <img
              src={featured.image}
              alt={featured.title}
              className="w-full aspect-[16/10] object-cover rounded-2xl"
            />
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-[#C9A34F]/15 text-[#C9A34F] text-xs font-semibold">
                  {featured.category}
                </span>
                <span className="text-gray-400 text-xs flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {featured.readTime}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0A1628] mb-4 group-hover:text-[#C9A34F] transition-colors">
                {featured.title}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                {featured.excerpt}
              </p>
              <span className="text-sm text-gray-400">{featured.date}</span>
              <div className="mt-4 inline-flex items-center gap-2 text-[#0A1628] font-semibold group-hover:gap-3 transition-all">
                Read article <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 pb-8">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-3 justify-center">
          {categories.map((cat) => (
            <span
              key={cat}
              className={`px-5 py-2 rounded-full text-sm font-medium cursor-default ${
                cat === "All"
                  ? "bg-[#0A1628] text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-[#C9A34F] hover:text-[#C9A34F] transition-colors"
              }`}
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* Post grid */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blogs/${post.slug}`}
              className="group flex flex-col rounded-3xl bg-white border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
            >
              <img
                src={post.image}
                alt={post.title}
                className="w-full aspect-[16/10] object-cover group-hover:scale-[1.02] transition-transform duration-300"
              />
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-3.5 h-3.5 text-[#C9A34F]" />
                  <span className="text-[#C9A34F] text-xs font-semibold">
                    {post.category}
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-400 text-xs">{post.readTime}</span>
                </div>
                <h3 className="text-lg font-bold text-[#0A1628] mb-3 group-hover:text-[#C9A34F] transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-400">{post.date}</span>
                  <span className="text-sm font-medium text-[#0A1628] group-hover:text-[#C9A34F] transition-colors flex items-center gap-1">
                    Read <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CTABanner
        title="Want Expert Advice for Your Situation?"
        description="Our consultants are ready to help — book a free session and get personalized recommendations."
        primaryLabel="Book Consultation"
        primaryHref="/consultation"
      />
    </MarketingLayout>
  );
}
