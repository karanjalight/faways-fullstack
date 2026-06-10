"use client";

import { useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Calendar,
  Clock,
} from "lucide-react";

const services = [
  "Debt Collection & Recovery",
  "Rent & Property Management",
  "Bookkeeping & Finance",
  "Credit Control Consultancy",
  "Not sure — need guidance",
];

const timeSlots = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
];

const benefits = [
  "Free 30-minute session with a senior consultant",
  "Personalized assessment of your situation",
  "No obligation — honest advice even if we're not the right fit",
  "Response within 1 business day",
];

export default function ConsultationForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    service: "",
    date: "",
    time: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setForm({
      name: "",
      email: "",
      phone: "",
      company: "",
      service: "",
      date: "",
      time: "",
      message: "",
    });
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-5 gap-12">
        <div className="lg:col-span-3">
          <form
            onSubmit={handleSubmit}
            className="p-8 sm:p-10 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-6"
          >
            <h2 className="text-2xl font-bold text-[#0A1628]">
              Consultation Request
            </h2>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Kamau"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#C9A34F] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company / Organization
                </label>
                <input
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Your business name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#C9A34F] transition-colors"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@company.co.ke"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#C9A34F] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <input
                  name="phone"
                  required
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+254 7XX XXX XXX"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#C9A34F] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service of Interest *
              </label>
              <select
                name="service"
                required
                value={form.service}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#C9A34F] transition-colors bg-white"
              >
                <option value="">Select a service</option>
                {services.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Preferred Date *
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  value={form.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#C9A34F] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Preferred Time *
                </label>
                <select
                  name="time"
                  required
                  value={form.time}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#C9A34F] transition-colors bg-white"
                >
                  <option value="">Select a time</option>
                  {timeSlots.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tell us about your situation
              </label>
              <textarea
                name="message"
                rows={4}
                value={form.message}
                onChange={handleChange}
                placeholder="Briefly describe your needs — e.g. amount of outstanding debt, number of properties, etc."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#C9A34F] transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-full bg-[#C9A34F] text-[#0A1628] font-semibold hover:bg-[#d4b05f] transition-colors shadow-lg shadow-[#C9A34F]/20"
            >
              {submitted
                ? "Request Sent! We'll confirm shortly."
                : "Book My Free Consultation"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="p-8 rounded-3xl bg-[#0A1628] text-white">
            <h3 className="text-xl font-bold mb-6">What to Expect</h3>
            <ul className="space-y-4">
              {benefits.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-3 text-sm text-white/80"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#C9A34F] flex-shrink-0 mt-0.5" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-gray-100 space-y-5">
            <h3 className="text-lg font-bold text-[#0A1628]">
              Contact Us Directly
            </h3>
            <a
              href="tel:+254729806234"
              className="flex items-center gap-3 text-gray-600 hover:text-[#C9A34F] transition-colors text-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F9F7F4] flex items-center justify-center">
                <Phone className="w-4 h-4 text-[#C9A34F]" />
              </div>
              0729 806 234
            </a>
            <a
              href="mailto:info@fawayssolutions.co.ke"
              className="flex items-center gap-3 text-gray-600 hover:text-[#C9A34F] transition-colors text-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F9F7F4] flex items-center justify-center">
                <Mail className="w-4 h-4 text-[#C9A34F]" />
              </div>
              info@fawayssolutions.co.ke
            </a>
            <div className="flex items-start gap-3 text-gray-600 text-sm">
              <div className="w-10 h-10 rounded-xl bg-[#F9F7F4] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-[#C9A34F]" />
              </div>
              Nairobi, Kenya — Serving Nairobi, Kiambu, Mombasa, Nakuru, Eldoret & Kisumu
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
