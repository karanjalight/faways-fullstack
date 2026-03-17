import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, LaptopMinimalCheck, Shield, ArrowUpRight } from "lucide-react";

const roles = [
  {
    title: "Collections Strategy Lead",
    location: "Nairobi • Hybrid",
    type: "Full-time",
    summary: "Design multi-payer playbooks, coach pods, and partner with CFOs.",
  },
  {
    title: "Clinical Documentation Specialist",
    location: "Remote • Kenya",
    type: "Contract",
    summary: "Support providers with pre-auth packets and appeal narratives.",
  },
  {
    title: "Data Product Engineer",
    location: "Nairobi • Hybrid",
    type: "Full-time",
    summary: "Ship dashboards, alerts, and secure integrations inside the Data Studio.",
  },
];

const benefits = [
  {
    icon: Users,
    title: "People-first culture",
    detail: "Small, empowered squads with access to mentors and leadership.",
  },
  {
    icon: LaptopMinimalCheck,
    title: "Modern tooling",
    detail: "MacBooks, premium software, and automation labs to keep work sharp.",
  },
  {
    icon: Shield,
    title: "Wellness & impact",
    detail: "Comprehensive health cover, mental health days, and community programs.",
  },
];

export default function CareersPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 pt-32">
        <section className="px-4 sm:px-6 lg:px-20 pb-16">
          <div className="rounded-[40px] border border-slate-100 bg-white p-10 shadow-lg shadow-slate-100/80">
            <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr] items-center">
              <div className="space-y-6">
                <Badge variant="secondary" className="rounded-full px-4 py-1 text-xs tracking-wide">
                  Careers at Faways
                </Badge>
                <h1 className="text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight">
                  Build the most trusted collections platform for African healthcare.
                </h1>
                <p className="text-lg text-slate-600">
                  We hire sharp operators, analysts, engineers, and clinicians. You&apos;ll launch products that hospitals
                  depend on and see your work in our client dashboards within weeks.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button asChild className="rounded-2xl px-6">
                    <Link href="#roles">View open roles</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-2xl px-6">
                    <Link href="/contact">Refer a teammate</Link>
                  </Button>
                </div>
              </div>
              <div className="rounded-[32px] border border-slate-900 bg-slate-900 p-8 text-white">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">perks</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-200">
                  <li>• Remote-friendly + cowork hubs</li>
                  <li>• Education stipend & certifications</li>
                  <li>• Quarterly off-sites and hack weeks</li>
                  <li>• Equity for leadership roles</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="roles" className="px-4 sm:px-6 lg:px-20 pb-16">
          <div className="grid gap-6">
            {roles.map((role) => (
              <Card key={role.title} className="rounded-3xl border border-slate-100 bg-white">
                <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle className="text-2xl text-slate-900">{role.title}</CardTitle>
                    <p className="text-sm text-slate-500">
                      {role.location} • {role.type}
                    </p>
                  </div>
                  <Button asChild variant="secondary" className="rounded-2xl">
                    <Link href="/contact">
                      Apply now
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{role.summary}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-20 pb-20">
          <div className="rounded-[40px] border border-slate-100 bg-white p-10 shadow-lg shadow-slate-100/70">
            <div className="grid gap-8 lg:grid-cols-3">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="rounded-3xl border border-slate-100 p-6">
                  <benefit.icon className="h-8 w-8 text-sky-600" />
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">{benefit.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{benefit.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 rounded-3xl bg-slate-900 p-6 text-white">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-lg font-semibold">Didn&apos;t see a role? We&apos;re always scouting talent.</p>
                <Button asChild className="rounded-2xl bg-white text-slate-900 hover:bg-slate-100">
                  <Link href="mailto:careers@fawayssolutions.co.ke">careers@fawayssolutions.co.ke</Link>
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


