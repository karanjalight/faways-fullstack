import Link from "next/link";
import { ArrowRight } from "lucide-react";

type CTABannerProps = {
  title: string;
  description: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export default function CTABanner({
  title,
  description,
  primaryLabel = "Book Consultation",
  primaryHref = "/consultation",
  secondaryLabel = "View Pricing",
  secondaryHref = "/pricing",
}: CTABannerProps) {
  return (
    <section className="py-16 px-6">
      <div className="max-w-5xl mx-auto p-10 sm:p-12 rounded-[2.5rem] bg-[#0A1628] text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 50%, #C9A34F 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            {title}
          </h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto">{description}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={primaryHref}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#C9A34F] text-[#0A1628] font-semibold hover:bg-[#d4b05f] transition-colors"
            >
              {primaryLabel}
              <ArrowRight className="w-4 h-4" />
            </Link>
            {secondaryLabel && (
              <Link
                href={secondaryHref}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/30 text-white font-medium hover:bg-white/5 transition-colors"
              >
                {secondaryLabel}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
