import Link from "next/link";
import { ArrowRight } from "lucide-react";

type PageHeroProps = {
  label: string;
  title: string;
  description: string;
  cta?: { label: string; href: string };
  image?: string;
};

export default function PageHero({
  label,
  title,
  description,
  cta,
  image = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80",
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#0A1628]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url('${image}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A1628] via-[#0A1628]/90 to-[#0A1628]/70" />

      <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-white/10 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A34F]" />
            <span className="text-[#C9A34F] text-xs font-semibold uppercase tracking-[0.15em]">
              {label}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            {title}
          </h1>
          <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-2xl">
            {description}
          </p>
          {cta && (
            <Link
              href={cta.href}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#C9A34F] text-[#0A1628] font-semibold hover:bg-[#d4b05f] transition-colors shadow-lg shadow-[#C9A34F]/20 group"
            >
              {cta.label}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" className="w-full">
          <path
            d="M0 30L60 28C120 26 240 22 360 20C480 18 600 18 720 22C840 26 960 34 1080 36C1200 38 1320 34 1380 32L1440 30V60H0V30Z"
            fill="#F9F7F4"
          />
        </svg>
      </div>
    </section>
  );
}
