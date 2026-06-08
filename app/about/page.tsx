import type { Metadata } from "next";
import Link from "next/link";
import MarketingLayout from "@/components/landing/MarketingLayout";
import PageHero from "@/components/landing/PageHero";
import CTABanner from "@/components/landing/CTABanner";
import {
  Shield,
  Target,
  Users,
  Award,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | Faways Solutions",
  description:
    "Learn about Faways Business Solutions — trusted debt collection and financial management in Kenya since 2013.",
};

const stats = [
  { value: "12+", label: "Years in operation" },
  { value: "500+", label: "Clients served" },
  { value: "5", label: "Cities covered" },
  { value: "98%", label: "Client satisfaction" },
];

const values = [
  {
    icon: Shield,
    title: "Integrity First",
    description:
      "Every recovery action follows Kenyan law and ethical standards. We protect your reputation as fiercely as we pursue your debts.",
  },
  {
    icon: Target,
    title: "Results Driven",
    description:
      "Our no-win-no-fee model means we only succeed when you do. We measure every engagement by recovery rates and client outcomes.",
  },
  {
    icon: Users,
    title: "People Centered",
    description:
      "Debt recovery is sensitive work. Our teams balance firmness with professionalism to preserve relationships where possible.",
  },
];

const team = [
  {
    name: "Faith Wekesa",
    role: "Founder & Managing Director",
    bio: "Founded Faways in 2013 with a mission to professionalize debt recovery in East Africa.",
  },
  {
    name: "James Otieno",
    role: "Head of Collections",
    bio: "15+ years in credit management, leading our recovery operations across Kenya.",
  },
  {
    name: "Grace Wanjiru",
    role: "Director of Finance",
    bio: "Oversees bookkeeping, compliance, and financial reporting for corporate clients.",
  },
];

const milestones = [
  { year: "2013", text: "Faways Business Solutions founded in Nairobi." },
  { year: "2016", text: "Expanded into property management and rent collection." },
  { year: "2019", text: "Launched credit control consultancy for SMEs." },
  { year: "2022", text: "Reached 400+ active clients across five counties." },
  { year: "2024", text: "Introduced digital dashboards for real-time debt tracking." },
];

export default function AboutPage() {
  return (
    <MarketingLayout>
      <PageHero
        label="About Us"
        title="Your Trusted Partner in Debt & Financial Management"
        description="Since 2013, Faways Business Solutions has helped businesses, landlords, and individuals across Kenya recover debts, manage properties, and build financial stability."
        cta={{ label: "Work With Us", href: "/consultation" }}
        image="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&q=80"
      />

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-[#0A1628] mb-6">
              Who We Are
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Faways Business Solutions is a Nairobi-based company specializing in
              debt collection, rent and property management, bookkeeping, and credit
              control consultancy. We serve clients across Nairobi, Kiambu, Mombasa,
              Nakuru, and Eldoret.
            </p>
            <p className="text-gray-600 leading-relaxed mb-8">
              Our tagline — &ldquo;Your Debt Is Our Concern&rdquo; — reflects our
              commitment to treating every case with urgency, confidentiality, and
              professionalism. Whether you are a small business chasing overdue
              invoices or a landlord managing multiple properties, we have the
              expertise to help.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm"
                >
                  <p className="text-2xl font-bold text-[#C9A34F]">{s.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <img
            src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80"
            alt="Faways team at work"
            className="w-full aspect-[4/3] object-cover rounded-3xl shadow-xl"
          />
        </div>
      </section>

      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-[#0A1628] mb-4">
              Our Core Values
            </h2>
            <p className="text-gray-600">
              The principles that guide every interaction with our clients and
              debtors.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((v) => (
              <div
                key={v.title}
                className="p-8 rounded-3xl bg-[#F9F7F4] border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#C9A34F] flex items-center justify-center mb-6">
                  <v.icon className="w-7 h-7 text-[#0A1628]" />
                </div>
                <h3 className="text-xl font-bold text-[#0A1628] mb-3">
                  {v.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="team" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-[#0A1628] mb-4">
              Meet Our Leadership
            </h2>
            <p className="text-gray-600">
              Experienced professionals dedicated to your financial success.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member) => (
              <div
                key={member.name}
                className="p-8 rounded-3xl bg-white border border-gray-100 shadow-sm text-center"
              >
                <div className="w-20 h-20 rounded-full bg-[#0A1628] mx-auto mb-5 flex items-center justify-center text-[#C9A34F] text-2xl font-bold">
                  {member.name.charAt(0)}
                </div>
                <h3 className="text-lg font-bold text-[#0A1628]">
                  {member.name}
                </h3>
                <p className="text-[#C9A34F] text-sm font-medium mb-3">
                  {member.role}
                </p>
                <p className="text-gray-600 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16">
          <div>
            <h2 className="text-3xl font-bold text-[#0A1628] mb-8">
              Our Journey
            </h2>
            <div className="space-y-6">
              {milestones.map((m) => (
                <div key={m.year} className="flex gap-5">
                  <span className="flex-shrink-0 w-16 h-10 rounded-full bg-[#C9A34F]/15 text-[#C9A34F] font-bold text-sm flex items-center justify-center">
                    {m.year}
                  </span>
                  <p className="text-gray-600 text-sm pt-2">{m.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="p-8 rounded-3xl bg-[#0A1628] text-white">
            <Award className="w-10 h-10 text-[#C9A34F] mb-6" />
            <h3 className="text-2xl font-bold mb-4">Why Clients Choose Us</h3>
            <ul className="space-y-4">
              {[
                "Licensed and compliant with Kenyan regulations",
                "No Win, No Fee debt recovery model",
                "Confidential handling of all cases",
                "Transparent reporting and documentation",
                "Dedicated account managers for every client",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-white/80">
                  <CheckCircle2 className="w-5 h-5 text-[#C9A34F] flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 mt-8 text-[#C9A34F] font-semibold hover:gap-3 transition-all"
            >
              Explore our solutions
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <CTABanner
        title="Ready to Partner With Faways?"
        description="Schedule a free consultation and discover how we can strengthen your financial position."
      />
    </MarketingLayout>
  );
}
