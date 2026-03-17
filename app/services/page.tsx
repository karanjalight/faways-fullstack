import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  Bot,
  Database,
  Headphones,
  Sparkles,
  Target,
  Workflow,
} from "lucide-react";

const serviceCategories = [
  {
    id: "revenue",
    icon: Activity,
    title: "Revenue Recovery Pods",
    description:
      "Omnichannel follow-up teams staffed with licensed collectors, paralegals, and multilingual patient advocates.",
    highlights: ["Early-out + late-stage coverage", "Pre-legal & writ prep", "Patient financial counseling"],
  },
  {
    id: "enablement",
    icon: Workflow,
    title: "Provider Enablement",
    description:
      "In-practice teams handling registrations, benefits checks, prior auth, and denial prevention for surgeons and allied health.",
    highlights: ["White-glove intake desks", "Clinical documentation support", "Appeals & peer review orchestration"],
  },
  {
    id: "data",
    icon: Database,
    title: "Faways Data Studio",
    description:
      "Command center that blends payer feeds, EMR data, and AI models to flag stall-outs before cash is at risk.",
    highlights: ["Realtime payer scorecards", "Predictive promise-to-pay radar", "Embedded compliance reporting"],
  },
  {
    id: "labs",
    icon: Bot,
    title: "Automation Labs",
    description:
      "Low-code bots and secure integrations that stitch together call logs, dispute letters, and document management.",
    highlights: ["Intake & reminder bots", "Auto-generated legal packets", "Secure document vault"],
  },
  {
    id: "advisory",
    icon: Target,
    title: "Collections Advisory",
    description:
      "Consultants that redesign operating playbooks, incentive plans, and shared services for hospital networks.",
    highlights: ["Maturity assessments", "Credit policy design", "Board-ready reporting"],
  },
  {
    id: "support",
    icon: Headphones,
    title: "Patient Support Desk",
    description:
      "Always-on concierge handling inbound queries, installment plans, and charity program guidance across channels.",
    highlights: ["24/7 secure messaging", "Installment plan orchestration", "Experience QA & speech analytics"],
  },
];

const proofPoints = [
  { metric: "$8.2M", detail: "Recovered in 90 days for regional hospital group" },
  { metric: "37%", detail: "Reduction in denial touches after enablement sprint" },
  { metric: "4.8 / 5", detail: "Patient sentiment rating post-contact" },
];

export default function ServicesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 pt-32">
        <section className="px-4 sm:px-6 lg:px-20 pb-16">
          <div className="grid gap-10 lg:grid-cols-[1.2fr,0.8fr] items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="rounded-full px-4 py-1 text-xs tracking-wide">
                Premium services
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight">
                Every workflow your CFO wants lives inside Faways Care Collections Cloud.
              </h1>
              <p className="text-lg text-slate-600">
                Choose fully managed pods or co-managed teams integrated with your EMR, billing, and legal partners.
                We land fast with proven runbooks, multilayer security, and outcome-based pricing.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild className="rounded-2xl px-6">
                  <Link href="/contact">Book a discovery call</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-2xl px-6">
                  <Link href="/case-studies">View proof</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-[36px] border border-slate-100 bg-white p-6 shadow-lg shadow-slate-100/80">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Impact snapshot</p>
              <div className="mt-6 grid gap-4">
                {proofPoints.map((point) => (
                  <div key={point.metric} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <p className="text-3xl font-semibold text-slate-900">{point.metric}</p>
                    <p className="text-sm text-slate-500">{point.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-20 pb-16">
          <div className="rounded-[40px] border border-slate-100 bg-white p-8 shadow-lg shadow-slate-100/70">
            <div className="flex items-center gap-3 text-slate-500 text-sm">
              <Sparkles className="h-4 w-4 text-sky-500" />
              <span>Modular offerings</span>
            </div>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Choose your acceleration lane</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {serviceCategories.map((service) => (
                <Card key={service.id} id={service.id} className="rounded-3xl border border-slate-100">
                  <CardHeader>
                    <service.icon className="h-10 w-10 text-sky-600" />
                    <CardTitle className="text-2xl font-semibold text-slate-900">{service.title}</CardTitle>
                    <p className="text-sm text-slate-500">{service.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-slate-600">
                      {service.highlights.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="text-sky-600 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-20 pb-16">
          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="rounded-[32px] border border-slate-100 bg-white">
              <CardHeader>
                <CardTitle className="text-3xl text-slate-900">Interlock with your estate</CardTitle>
                <p className="text-sm text-slate-500">
                  We integrate inside Epic, MediSmart, Athena, Microsoft Dynamics, Freshdesk, and custom practice systems.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {["Single sign-on + IP allow lists", "Secure document handoff", "Joint QA dashboards"].map(
                  (item) => (
                    <div key={item} className="rounded-2xl border border-slate-100 p-4 text-sm text-slate-600">
                      {item}
                    </div>
                  )
                )}
              </CardContent>
            </Card>
            <Card className="rounded-[32px] border border-slate-100 bg-white">
              <CardHeader>
                <CardTitle className="text-3xl text-slate-900">Premium support</CardTitle>
                <p className="text-sm text-slate-500">
                  Dedicated engagement leads, quarterly innovation sprints, and realtime Slack bridges keep you in the loop.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {["Executive business reviews", "Patient journey heatmaps", "White-label communication kits"].map(
                  (item) => (
                    <div key={item} className="rounded-2xl border border-slate-100 p-4 text-sm text-slate-600">
                      {item}
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-20 pb-20">
          <div className="rounded-[40px] border border-slate-900 bg-slate-900 p-10 text-white">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">next steps</p>
                <h2 className="mt-4 text-3xl font-semibold">
                  Tell us your backlog. We&apos;ll ship a playbook in 10 days.
                </h2>
                <p className="mt-2 text-slate-300">
                  Every scope includes case studies, projected uplift, staffing model, and compliance matrix.
                </p>
              </div>
              <div className="flex gap-4">
                <Button asChild className="rounded-2xl bg-white text-slate-900 hover:bg-slate-100">
                  <Link href="/contact">Schedule a workshop</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-2xl border-white text-white">
                  <Link href="/careers">Meet the team</Link>
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


