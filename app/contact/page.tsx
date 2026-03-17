"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Building, Mail, Phone, MapPin, Sparkles } from "lucide-react";

const contactChannels = [
  {
    icon: Phone,
    title: "Talk to an advisor",
    description: "+254 700 123 456",
    href: "tel:+254700123456",
  },
  {
    icon: Mail,
    title: "Send documentation",
    description: "hello@fawayssolutions.co.ke",
    href: "mailto:hello@fawayssolutions.co.ke",
  },
  {
    icon: Building,
    title: "Visit our HQ",
    description: "Eden Square Complex, Westlands, Nairobi",
    href: "https://maps.google.com",
  },
];

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setFormState({
      name: "",
      company: "",
      email: "",
      phone: "",
      message: "",
    });
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 pt-32">
        <section className="px-4 sm:px-6 lg:px-20 pb-16">
          <div className="rounded-[40px] border border-slate-100 bg-white p-10 shadow-lg shadow-slate-100/80">
            <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
              <div className="space-y-6">
                <Badge variant="secondary" className="rounded-full px-4 py-1 text-xs tracking-wide">
                  Contact us
                </Badge>
                <h1 className="text-4xl font-semibold text-slate-900 leading-tight">
                  Tell us about your backlog, denials, or document chaos—we&apos;ll build a plan.
                </h1>
                <p className="text-lg text-slate-600">
                  Whether you&apos;re a hospital CFO, clinic administrator, or legal partner, our advisors respond in under
                  1 business day with the right pod, pricing, and compliance path.
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {contactChannels.map((channel) => (
                    <Card key={channel.title} className="rounded-3xl border border-slate-100">
                      <CardHeader className="space-y-1">
                        <channel.icon className="h-6 w-6 text-sky-600" />
                        <CardTitle className="text-base text-slate-900">{channel.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <a href={channel.href} className="text-sm text-slate-500 hover:text-sky-600 transition">
                          {channel.description}
                        </a>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <form onSubmit={handleSubmit} className="rounded-[32px] border border-slate-100 bg-slate-50/80 p-6 space-y-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                  <Sparkles className="h-4 w-4 text-sky-500" />
                  <span>Discovery form</span>
                </div>
                <Input
                  name="name"
                  placeholder="Your name"
                  required
                  value={formState.name}
                  onChange={handleChange}
                  className="rounded-2xl border-slate-200"
                />
                <Input
                  name="company"
                  placeholder="Hospital or company"
                  required
                  value={formState.company}
                  onChange={handleChange}
                  className="rounded-2xl border-slate-200"
                />
                <Input
                  type="email"
                  name="email"
                  placeholder="Work email"
                  required
                  value={formState.email}
                  onChange={handleChange}
                  className="rounded-2xl border-slate-200"
                />
                <Input
                  name="phone"
                  placeholder="Phone number"
                  value={formState.phone}
                  onChange={handleChange}
                  className="rounded-2xl border-slate-200"
                />
                <Textarea
                  name="message"
                  placeholder="Share volumes, pain points, or timelines..."
                  rows={4}
                  required
                  value={formState.message}
                  onChange={handleChange}
                  className="rounded-2xl border-slate-200"
                />
                <Button type="submit" className="w-full rounded-2xl">
                  {submitted ? "Received! We’ll respond shortly." : "Send message"}
                </Button>
                <p className="text-xs text-center text-slate-500">
                  By clicking submit you agree to our{" "}
                  <Link href="/privacy" className="underline">
                    privacy policy
                  </Link>
                  .
                </p>
              </form>
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-20 pb-20">
          <div className="rounded-[40px] border border-slate-900 bg-slate-900 p-10 text-white">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">where we work</p>
                <h2 className="mt-4 text-3xl font-semibold">Nairobi HQ, distributed reach</h2>
                <p className="mt-2 text-slate-300">
                  Onsite pods embed inside hospitals across Nairobi, Kiambu, Nakuru, Eldoret, and Mombasa while our remote
                  Command Center covers pan-African and global providers.
                </p>
              </div>
              <div className="space-y-3 text-sm text-slate-200">
                <div className="flex gap-3">
                  <MapPin className="h-5 w-5 text-sky-400" />
                  <span>Faways Solutions • Eden Square Complex, Westlands, Nairobi</span>
                </div>
                <div className="flex gap-3">
                  <Phone className="h-5 w-5 text-sky-400" />
                  <span>+254 700 123 456</span>
                </div>
                <div className="flex gap-3">
                  <Mail className="h-5 w-5 text-sky-400" />
                  <span>hello@fawayssolutions.co.ke</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}


