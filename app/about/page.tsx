import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeartPulse, ShieldCheck, Sparkles, LineChart } from "lucide-react";

const stats = [
  { label: "Hospitals & Clinics supported", value: "140+" },
  { label: "Recovered for clinicians", value: "$68M" },
  { label: "Median days to collect", value: "34 days" },
  { label: "NPS with providers", value: "92" },
];

const values = [
  {
    icon: ShieldCheck,
    title: "Regulatory first",
    description:
      "Licensed compliance teams ensure every interaction is ethical, well-documented, and audit ready.",
  },
  {
    icon: HeartPulse,
    title: "Patient empathy",
    description:
      "We protect long-term provider relationships with compassionate outreach and culturally-aware teams.",
  },
  {
    icon: LineChart,
    title: "Outcome obsession",
    description:
      "Data science pods benchmark every escalation so you see forecasted cash, not guesswork.",
  },
];

const leadership = [
  {
    name: "Faith Wekesa",
    role: "Founder & CEO",
    bio: "Built revenue teams for East African health networks before launching Faways in 2013.",
  },
  {
    name: "Dr. Collins Atieno",
    role: "Chief Medical Partnerships",
    bio: "Former hospital CFO focused on physician group alignment and specialty expansion.",
  },
  {
    name: "Njeri Kwamboka",
    role: "Head of Analytics",
    bio: "Leads the Faways Data Studio, surfacing payer risk signals in near-real time.",
  },
];

const milestones = [
  { year: "2013", detail: "Faways launches with two Nairobi hospitals." },
  { year: "2017", detail: "Expands provider enablement to clinics and imaging centers." },
  { year: "2020", detail: "Opens remote analytics hub serving 5 countries." },
  { year: "2024", detail: "Introduces Care Collections Cloud for global teams." },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 pt-32">
        <section className="px-4 sm:px-6 lg:px-20 pb-16">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="rounded-full px-4 py-1 text-xs tracking-wide">
                About Faways Solutions
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight">
                We build the recovery muscle hospitals and doctors wish they already had.
              </h1>
              <p className="text-lg text-slate-600">
                Since 2013 we have orchestrated enterprise-grade collections, patient outreach, and
                litigation-ready workflows for the providers that keep East Africa healthy. Every
                product we ship blends empathy, compliance, and machine-level precision.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild className="rounded-2xl px-6">
                  <Link href="/services">Explore Services</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-2xl px-6">
                  <Link href="/case-studies">See Case Studies</Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-sm"
                >
                  <p className="text-3xl font-semibold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-20 pb-16">
          <div className="rounded-[36px] border border-slate-100 bg-white p-8 shadow-lg shadow-slate-100/70">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Sparkles className="h-4 w-4 text-sky-500" />
              <span>What guides us</span>
            </div>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900">Values that scale trust</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {values.map((value) => (
                <div key={value.title} className="rounded-3xl border border-slate-100 p-6">
                  <value.icon className="h-10 w-10 text-sky-600" />
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">{value.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-20 pb-16">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="rounded-[36px] border border-slate-100 bg-white p-8 shadow-md">
              <p className="text-xs uppercase tracking-wide text-slate-500">Leadership</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">Operators on your side</h2>
              <div className="mt-6 space-y-6">
                {leadership.map((leader) => (
                  <div
                    key={leader.name}
                    className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                  >
                    <p className="text-lg font-semibold text-slate-900">{leader.name}</p>
                    <p className="text-sm text-sky-600">{leader.role}</p>
                    <p className="mt-2 text-sm text-slate-600">{leader.bio}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[36px] border border-slate-100 bg-white p-8 shadow-md">
              <p className="text-xs uppercase tracking-wide text-slate-500">Milestones</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                A decade of resilient growth
              </h2>
              <div className="mt-6 space-y-6">
                {milestones.map((milestone) => (
                  <div key={milestone.year} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                        {milestone.year}
                      </div>
                      <div className="h-full w-px bg-slate-200" />
                    </div>
                    <p className="text-sm text-slate-600">{milestone.detail}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                <p>
                  Ready to see how the next milestone looks? We pair every new engagement with a
                  blueprint session covering workflow design, staffing pods, and KPIs aligned to your
                  board.
                </p>
                <Button asChild variant="secondary" className="mt-4 rounded-2xl">
                  <Link href="/contact">Book a chemistry call</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-20 pb-20">
          <div className="rounded-[36px] border border-slate-100 bg-slate-900 p-10 text-white">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">next move</p>
                <h2 className="mt-4 text-3xl font-semibold">
                  Let&apos;s co-design your collections playbook.
                </h2>
                <p className="mt-2 text-slate-300">
                  Bring your CFO, bring your practice managers. We&apos;ll bring the team that blends
                  human empathy with automation for premium patient finance experiences.
                </p>
              </div>
              <div className="flex gap-4">
                <Button asChild className="rounded-2xl bg-white text-slate-900 hover:bg-slate-200">
                  <Link href="/services">View Services</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-2xl border-white text-white">
                  <Link href="/contact">Contact Us</Link>
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


