import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

export default function LandingHero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0A1628]">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1920&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A1628]/95 via-[#0A1628]/80 to-[#0A1628]/40" />

      {/* Decorative elements */}
      <div className="absolute top-1/4 right-1/4 w-72 h-72 border border-[#C9A34F]/10 rounded-full" />
      <div className="absolute bottom-1/4 right-1/3 w-48 h-48 border border-[#C9A34F]/20 rounded-full" />

      <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-24 lg:pt-40 lg:pb-32 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#C9A34F]" />
              <span className="text-[#C9A34F] text-sm font-medium uppercase tracking-[0.15em]">
                Financial Consulting
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6">
              Expert Debt &{" "}
              <span className="text-[#C9A34F]">Financial</span> Management
              For Your Business Growth
            </h1>

            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-xl">
              Your debt is our concern. Faways Business Solutions delivers
              professional debt collection, property management, and financial
              consultancy across Kenya since 2013.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#C9A34F] text-[#0A1628] font-semibold hover:bg-[#d4b05f] transition-colors shadow-lg shadow-[#C9A34F]/25 group"
              >
                Free Consultation
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/30 text-white font-medium hover:border-[#C9A34F] hover:bg-white/5 hover:text-[#C9A34F] transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                Our Services
              </Link>
            </div>

            <div className="mt-12 inline-flex flex-wrap items-center gap-6 sm:gap-8 px-6 py-5 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div>
                <p className="text-3xl font-bold text-[#C9A34F]">12+</p>
                <p className="text-white/50 text-sm mt-1">Years Experience</p>
              </div>
              <div className="w-px h-12 bg-white/20 hidden sm:block" />
              <div>
                <p className="text-3xl font-bold text-[#C9A34F]">500+</p>
                <p className="text-white/50 text-sm mt-1">Clients Served</p>
              </div>
              <div className="w-px h-12 bg-white/20 hidden sm:block" />
              <div className="hidden sm:block">
                <p className="text-3xl font-bold text-[#C9A34F]">98%</p>
                <p className="text-white/50 text-sm mt-1">Success Rate</p>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80"
                alt="Financial consulting"
                className="w-full aspect-[4/5] object-cover rounded-3xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-[#C9A34F] p-6 max-w-[220px] rounded-2xl shadow-xl">
                <p className="text-[#0A1628] text-3xl font-bold">No Win</p>
                <p className="text-[#0A1628] text-lg font-semibold">No Fee</p>
                <p className="text-[#0A1628]/70 text-sm mt-2">
                  Debt recovery with zero upfront risk
                </p>
              </div>
              <div className="absolute -top-4 -right-4 w-full h-full border-2 border-[#C9A34F]/30 rounded-3xl -z-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" className="w-full">
          <path
            d="M0 40L60 35C120 30 240 20 360 15C480 10 600 10 720 20C840 30 960 50 1080 55C1200 60 1320 50 1380 45L1440 40V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0V40Z"
            fill="#F9F7F4"
          />
        </svg>
      </div>
    </section>
  );
}
