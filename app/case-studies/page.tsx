import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, FileText, Building2, Stethoscope } from "lucide-react";

const studies = [
  {
    client: "Mercy General Hospital",
    sector: "Tertiary hospital",
    icon: Building2,
    headline: "Turned 18-month AR into 42-day collections window",
    outcome: ["$12.4M recovered in 2 quarters", "Denials down 41%", "Patient sentiment 4.9/5"],
  },
  {
    client: "Lakeside Children’s Clinic",
    sector: "Multi-location pediatrics",
    icon: Stethoscope,
    headline: "Quarterbacked end-to-end intake and payer conversations",
    outcome: ["Registered patients up 32%", "Appeal win rate 68%", "Staffing costs down 27%"],
  },
  {
    client: "Starlight Oncology Group",
    sector: "Specialty practice",
    icon: FileText,
    headline: "Staged legal-ready packets in under 6 hours",
    outcome: ["Settlements accelerated by 3 months", "Recovered $6.3M", "100% compliance score"],
  },
];

export default function CaseStudiesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 pt-32">
        <section className="px-4 sm:px-6 lg:px-20 pb-16">
          <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr] items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="rounded-full px-4 py-1 text-xs tracking-wide">
                Case studies
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight">
                Operators trust Faways when the board asks for proof.
              </h1>
              <p className="text-lg text-slate-600">
                Explore how we partner with hospitals, clinics, and physician groups to unlock cash, protect
                relationships, and keep regulators impressed.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild className="rounded-2xl px-6">
                  <Link href="/contact">Request a tailored reference</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-2xl px-6">
                  <Link href="/services">View services</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-[36px] border border-slate-900 bg-slate-900 p-8 text-white shadow-lg">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Snapshot</p>
              <h2 className="mt-3 text-3xl font-semibold">Audit-ready reporting</h2>
              <p className="mt-2 text-slate-300">
                Every program includes compliance artifacts, call QA, and documentation for your auditors and payers.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-200">
                <li>• ISO-aligned policies</li>
                <li>• Secure document vault</li>
                <li>• Quarterly executive business reviews</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-20 pb-16">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {studies.map((study) => (
              <Card key={study.client} className="rounded-3xl border border-slate-100 bg-white">
                <CardHeader className="space-y-4">
                  <div className="flex items-center gap-3">
                    <study.icon className="h-10 w-10 text-sky-600" />
                    <div>
                      <p className="text-sm uppercase tracking-wide text-slate-500">{study.sector}</p>
                      <CardTitle className="text-xl text-slate-900">{study.client}</CardTitle>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">{study.headline}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {study.outcome.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-sky-600 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="ghost" className="mt-6 w-full justify-between text-slate-700">
                    <Link href="/contact">
                      Request full deck
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-20 pb-20">
          <div className="rounded-[40px] border border-slate-100 bg-white p-10 shadow-lg shadow-slate-100/70">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">next story</p>
                <h2 className="mt-3 text-3xl font-semibold text-slate-900">
                  Your metrics deserve to be in this gallery.
                </h2>
                <p className="mt-2 text-slate-600">
                  We co-author case studies with partners once we hit milestones. Expect on-brand visuals, anonymized
                  payer views, and quotes your board can use.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-6 text-sm text-slate-600 space-y-3">
                <p>• We sign NDAs + marketing guidelines before publishing.</p>
                <p>• Analysts help quantify impact with trailing 12-month data.</p>
                <p>• Creative studio delivers decks, one-pagers, and social tiles.</p>
                <Button asChild className="mt-4 rounded-2xl">
                  <Link href="/contact">Start a pilot</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}


