"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Landmark,
  LineChart,
  Shield,
  Users,
  Wallet,
  Building2,
  FileText,
  Star,
  Plus,
  Minus,
  Send,
  Phone,
  Mail,
  MapPin,
  Linkedin,
  Facebook,
  Twitter,
} from "lucide-react";

/* ─── Partners strip ─── */
export function PartnersStrip() {
  const partners = [
    "Safaricom",
    "KCB Bank",
    "Equity Bank",
    "Co-op Bank",
    "Britam",
    "Jubilee",
  ];
  return (
    <section className="bg-[#F9F7F4] py-12 border-b border-gray-200/60">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-xs uppercase tracking-[0.25em] text-gray-400 mb-8">
          Trusted by leading organizations across Kenya
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6">
          {partners.map((name) => (
            <span
              key={name}
              className="text-gray-400 font-semibold text-sm tracking-wide px-5 py-2.5 rounded-full bg-white border border-gray-200/80 hover:text-[#C9A34F] hover:border-[#C9A34F]/30 transition-colors"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── About ─── */
export function AboutSection() {
  return (
    <section className="py-24 bg-[#F9F7F4]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80"
              alt="Faways team"
              className="w-full aspect-[4/3] object-cover rounded-3xl"
            />
            <div className="absolute -bottom-8 -right-8 bg-[#0A1628] text-white p-8 hidden md:block rounded-2xl shadow-xl">
              <p className="text-4xl font-bold text-[#C9A34F]">2013</p>
              <p className="text-sm text-white/70 mt-1">Serving Kenya</p>
            </div>
            <div className="absolute top-6 left-6 w-24 h-24 border-2 border-[#C9A34F] rounded-3xl" />
          </div>

          <div>
            <SectionLabel>About Us</SectionLabel>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A1628] leading-tight mb-6">
              We Are Professional Financial Advisors For Your Business
            </h2>
            <p className="text-gray-600 leading-relaxed mb-8">
              Faways Business Solutions is a trusted debt collection and
              management company based in Nairobi. We combine integrity,
              efficiency, and proven strategies to recover debts, manage
              properties, and strengthen your financial position.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                "Licensed & Compliant Operations",
                "No Win, No Fee Model",
                "Confidential & Ethical Process",
                "Nationwide Coverage",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 p-3 rounded-xl bg-white/60">
                  <CheckCircle2 className="w-5 h-5 text-[#C9A34F] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">{item}</span>
                </div>
              ))}
            </div>

            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0A1628] text-white font-semibold hover:bg-[#12243D] transition-colors group"
            >
              Learn More About Us
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Services ─── */
const services = [
  {
    icon: Wallet,
    title: "Debt Collection & Recovery",
    description:
      "Professional recovery of outstanding debts with a proven no-win-no-fee approach that protects your reputation.",
    href: "/services",
  },
  {
    icon: Building2,
    title: "Rent & Property Management",
    description:
      "End-to-end rent collection, tenant screening, and property reporting for landlords and agencies.",
    href: "/services",
  },
  {
    icon: FileText,
    title: "Bookkeeping & Finance",
    description:
      "Accurate financial records, cash flow management, and compliance-ready reporting for your business.",
    href: "/services",
  },
  {
    icon: LineChart,
    title: "Credit Control Consultancy",
    description:
      "Strengthen credit policies, minimize bad debts, and improve cash flow with expert guidance.",
    href: "/services",
  },
];

export function ServicesSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <SectionLabel>Our Services</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0A1628] mb-4">
            Comprehensive Financial Solutions
          </h2>
          <p className="text-gray-600">
            Tailored services designed to recover revenue, manage assets, and
            build long-term financial stability for businesses and individuals.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <Link
              key={service.title}
              href={service.href}
              className="group p-8 rounded-3xl bg-[#F9F7F4] hover:bg-[#0A1628] transition-all duration-300 border border-gray-100 hover:border-[#C9A34F]/20 shadow-sm hover:shadow-xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#C9A34F]/10 group-hover:bg-[#C9A34F]/20 flex items-center justify-center mb-6 transition-colors">
                <service.icon className="w-7 h-7 text-[#C9A34F]" />
              </div>
              <h3 className="text-lg font-bold text-[#0A1628] group-hover:text-white mb-3 transition-colors">
                {service.title}
              </h3>
              <p className="text-gray-600 group-hover:text-white/70 text-sm leading-relaxed mb-4 transition-colors">
                {service.description}
              </p>
              <span className="inline-flex items-center gap-1 text-[#C9A34F] text-sm font-medium group-hover:gap-2 transition-all">
                Read More <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Stats ─── */
function Counter({ target, suffix = "+" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 30);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}

export function StatsSection() {
  const stats = [
    { value: 12, suffix: "+", label: "Years of Excellence" },
    { value: 500, suffix: "+", label: "Clients Served" },
    { value: 98, suffix: "%", label: "Recovery Success Rate" },
    { value: 5, suffix: "+", label: "Cities Covered" },
  ];

  return (
    <section className="py-20 bg-[#0A1628] relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #C9A34F 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-6 rounded-3xl bg-white/5 border border-white/10">
              <p className="text-4xl sm:text-5xl font-bold text-[#C9A34F] mb-2">
                <Counter target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-white/60 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Process ─── */
export function ProcessSection() {
  const steps = [
    {
      num: "01",
      title: "Assessment",
      description: "We analyze your debt portfolio and develop a tailored recovery strategy.",
    },
    {
      num: "02",
      title: "Engagement",
      description: "Professional outreach to debtors using ethical, compliant methods.",
    },
    {
      num: "03",
      title: "Recovery",
      description: "Active collection and negotiation to maximize recovery rates.",
    },
    {
      num: "04",
      title: "Reporting",
      description: "Transparent reporting and full documentation of all outcomes.",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <SectionLabel>How It Works</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A1628] mb-6">
              Simple Process, Powerful Results
            </h2>
            <p className="text-gray-600 leading-relaxed mb-8">
              Our proven four-step methodology ensures efficient debt recovery
              while maintaining your professional relationships and brand
              reputation.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#0A1628] text-white font-semibold hover:bg-[#12243D] transition-colors shadow-lg group"
            >
              Start Your Recovery
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="space-y-6">
            {steps.map((step) => (
              <div
                key={step.num}
                className="flex gap-6 p-6 rounded-2xl bg-[#F9F7F4] hover:bg-[#0A1628] group transition-all duration-300 border border-gray-100"
              >
                <span className="text-3xl font-bold text-[#C9A34F] flex-shrink-0 w-12 h-12 rounded-xl bg-[#C9A34F]/10 flex items-center justify-center text-xl">
                  {step.num}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-[#0A1628] group-hover:text-white mb-2 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 group-hover:text-white/70 text-sm transition-colors">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Why Choose Us ─── */
export function WhyChooseSection() {
  const features = [
    {
      icon: Shield,
      title: "Ethical & Compliant",
      description: "Every action follows Kenyan law and industry best practices.",
    },
    {
      icon: Landmark,
      title: "Industry Expertise",
      description: "Over a decade of experience in debt and financial management.",
    },
    {
      icon: Users,
      title: "Dedicated Team",
      description: "Specialists assigned to your case for personalized attention.",
    },
  ];

  return (
    <section className="py-24 bg-[#F9F7F4]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionLabel>Why Choose Us</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A1628] mb-6">
              Your Trusted Partner in Financial Recovery
            </h2>
            <p className="text-gray-600 leading-relaxed mb-10">
              We don&apos;t just collect debts — we build lasting financial
              health for your business with transparency, professionalism, and
              results you can measure.
            </p>
            <div className="space-y-6">
              {features.map((f) => (
                <div key={f.title} className="flex gap-5 p-4 rounded-2xl bg-white/70">
                  <div className="w-12 h-12 rounded-2xl bg-[#C9A34F] flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-6 h-6 text-[#0A1628]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0A1628] mb-1">{f.title}</h3>
                    <p className="text-gray-600 text-sm">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80"
              alt="Consultation"
              className="w-full aspect-square object-cover rounded-3xl"
            />
            <div className="absolute inset-0 bg-[#0A1628]/20 rounded-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ─── */
const testimonials = [
  {
    name: "Sarah Mwangi",
    role: "Small Business Owner",
    text: "Faways helped us recover outstanding debts quickly and professionally. Their no-win-no-fee approach gave us confidence without any upfront risk.",
    rating: 5,
  },
  {
    name: "James Ochieng",
    role: "Property Landlord",
    text: "The property management team ensures timely rent collection and handles all tenant interactions seamlessly. Managing my rentals has never been easier.",
    rating: 5,
  },
  {
    name: "Mary Wanjiku",
    role: "Entrepreneur",
    text: "Their bookkeeping services helped us maintain accurate records and improve cash flow visibility. Professional, reliable, and thorough.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <SectionLabel>Testimonials</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0A1628] mb-4">
            What Our Clients Say
          </h2>
          <p className="text-gray-600">
            Real feedback from businesses and individuals who trust Faways
            Solutions for their financial needs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="p-8 rounded-3xl bg-[#F9F7F4] border border-gray-100 hover:border-[#C9A34F]/30 transition-colors shadow-sm hover:shadow-lg"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-[#C9A34F] text-[#C9A34F]"
                  />
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-6 text-sm">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <div className="w-10 h-10 bg-[#0A1628] rounded-full flex items-center justify-center text-[#C9A34F] font-bold text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-[#0A1628] text-sm">
                    {t.name}
                  </p>
                  <p className="text-gray-500 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
const faqs = [
  {
    q: "How long does Faways take to start debt recovery?",
    a: "We begin the recovery process immediately after engagement. Our team works efficiently while maintaining confidentiality to protect your reputation.",
  },
  {
    q: "Do you operate on a No Win, No Fee basis?",
    a: "Yes. For debt collection services, our no-win-no-fee model means you pay only when we successfully recover your debt.",
  },
  {
    q: "Which areas do you serve?",
    a: "We serve clients across Nairobi, Kiambu, Mombasa, Nakuru, and Eldoret, with nationwide coverage for corporate clients.",
  },
  {
    q: "What property management services do you offer?",
    a: "We handle rent collection, tenant screening, lease agreements, and detailed property reports for landlords and agencies.",
  },
];

export function FAQSection() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="py-24 bg-[#F9F7F4]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <SectionLabel>FAQs</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A1628] mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Have questions about our services? Here are answers to the most
              common questions from our clients.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={faq.q}
                className={`rounded-2xl border transition-colors overflow-hidden ${
                  open === i
                    ? "border-[#C9A34F] bg-white shadow-md"
                    : "border-gray-200 bg-white"
                }`}
              >
                <button
                  onClick={() => setOpen(open === i ? -1 : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-[#0A1628] text-sm pr-4">
                    {faq.q}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      open === i ? "bg-[#C9A34F]" : "bg-[#0A1628]"
                    }`}
                  >
                    {open === i ? (
                      <Minus className="w-4 h-4 text-[#0A1628]" />
                    ) : (
                      <Plus className="w-4 h-4 text-white" />
                    )}
                  </div>
                </button>
                {open === i && (
                  <div className="px-5 pb-5">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
export function CTASection() {
  return (
    <section className="py-20 bg-[#0A1628] relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(45deg, #C9A34F 25%, transparent 25%), linear-gradient(-45deg, #C9A34F 25%, transparent 25%)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>
      <div className="max-w-4xl mx-auto px-6 text-center relative">
        <div className="p-10 sm:p-12 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-sm">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to Recover What&apos;s Yours?
        </h2>
        <p className="text-white/60 mb-8 max-w-xl mx-auto">
          Get a free consultation with our financial experts. No obligations,
          no upfront fees — just professional advice.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#C9A34F] text-[#0A1628] font-semibold hover:bg-[#d4b05f] transition-colors shadow-lg shadow-[#C9A34F]/20"
          >
            Get Free Consultation
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="tel:+254700000000"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/30 text-white font-medium hover:border-[#C9A34F] hover:bg-white/5 transition-colors"
          >
            <Phone className="w-4 h-4" />
            Call Us Now
          </Link>
        </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
export function LandingFooter() {
  const [email, setEmail] = useState("");

  return (
    <footer className="bg-[#071220] text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#C9A34F] rounded-2xl flex items-center justify-center">
                <span className="text-[#0A1628] font-bold text-lg">F</span>
              </div>
              <div>
                <span className="block font-semibold text-lg">Faways</span>
                <span className="block text-[10px] uppercase tracking-[0.2em] text-[#C9A34F]">
                  Solutions
                </span>
              </div>
            </div>
            <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-sm">
              Your debt is our concern. Professional debt collection, property
              management, and financial consultancy across Kenya since 2013.
            </p>
            <div className="flex gap-3">
              {[Linkedin, Facebook, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:border-[#C9A34F] hover:text-[#C9A34F] transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 grid sm:grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-[#C9A34F] font-semibold mb-4 text-sm uppercase tracking-wider">
                Quick Links
              </h4>
              <ul className="space-y-2">
                {[
                  { name: "Home", href: "/" },
                  { name: "About Us", href: "/about" },
                  { name: "Our Solutions", href: "/services" },
                  { name: "Pricing", href: "/pricing" },
                  { name: "Blogs", href: "/blogs" },
                  { name: "Book Consultation", href: "/consultation" },
                ].map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-white/50 text-sm hover:text-[#C9A34F] transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[#C9A34F] font-semibold mb-4 text-sm uppercase tracking-wider">
                Services
              </h4>
              <ul className="space-y-2">
                {[
                  "Debt Collection",
                  "Property Management",
                  "Bookkeeping",
                  "Credit Control",
                ].map((name) => (
                  <li key={name}>
                    <Link
                      href="/services"
                      className="text-white/50 text-sm hover:text-[#C9A34F] transition-colors"
                    >
                      {name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[#C9A34F] font-semibold mb-4 text-sm uppercase tracking-wider">
                Contact
              </h4>
              <ul className="space-y-4 text-sm text-white/50">
                <li className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#C9A34F] mt-0.5 flex-shrink-0" />
                  +254 700 000 000
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#C9A34F] mt-0.5 flex-shrink-0" />
                  info@fawayssolutions.co.ke
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#C9A34F] mt-0.5 flex-shrink-0" />
                  Nairobi, Kenya
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <p className="text-white/70 text-sm">
            Subscribe to our newsletter for the latest updates
          </p>
          <div className="flex max-w-md w-full rounded-full overflow-hidden border border-white/10 bg-white/5 p-1">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email..."
              className="flex-1 px-4 py-2.5 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
            />
            <button className="px-5 py-2.5 rounded-full bg-[#C9A34F] text-[#0A1628] hover:bg-[#d4b05f] transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/40">
          <p>
            &copy; {new Date().getFullYear()}{" "}
            <span className="text-[#C9A34F]">Faways Solutions</span>. All
            rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-[#C9A34F] transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-[#C9A34F] transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Shared label ─── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[#C9A34F]/10 border border-[#C9A34F]/20">
      <span className="w-1.5 h-1.5 rounded-full bg-[#C9A34F]" />
      <span className="text-[#C9A34F] text-xs font-semibold uppercase tracking-[0.15em]">
        {children}
      </span>
    </div>
  );
}
