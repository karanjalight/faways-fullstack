"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Menu,
  X,
  Phone,
  Mail,
  Linkedin,
  Facebook,
  Twitter,
} from "lucide-react";

const navLinks = [
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Our Solutions" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blogs", label: "Blogs" },
  { href: "/consultation", label: "Book Consultation" },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 font-sans">
      {/* Top bar */}
      <div
        className={`hidden lg:block bg-[#0A1628] text-white/80 text-sm transition-all duration-300 ${
          scrolled ? "h-0 opacity-0 overflow-hidden" : "h-auto opacity-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a
              href="tel:+254700000000"
              className="flex items-center gap-2 hover:text-[#C9A34F] transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#C9A34F]" />
              +254 700 000 000
            </a>
            <a
              href="mailto:info@fawayssolutions.co.ke"
              className="flex items-center gap-2 hover:text-[#C9A34F] transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-[#C9A34F]" />
              info@fawayssolutions.co.ke
            </a>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/50 text-xs uppercase tracking-widest">
              Follow us
            </span>
            {[Linkedin, Facebook, Twitter].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center hover:border-[#C9A34F] hover:text-[#C9A34F] transition-colors"
              >
                <Icon className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav
        className={`transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-lg shadow-black/5 rounded-b-3xl"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group justify-self-start">
            <div className="w-10 h-10 bg-[#C9A34F] rounded-2xl flex items-center justify-center">
              <span className="text-[#0A1628] font-bold text-lg">F</span>
            </div>
            <div>
              <span
                className={`block font-semibold text-lg leading-tight transition-colors ${
                  scrolled ? "text-[#0A1628]" : "text-white"
                }`}
              >
                Faways
              </span>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-[#C9A34F]">
                Solutions
              </span>
            </div>
          </Link>

          {/* Center nav links */}
          <div className="hidden lg:flex items-center justify-center gap-1">
            {navLinks.map((link) => (
              <NavItem
                key={link.label}
                href={link.href}
                label={link.label}
                scrolled={scrolled}
              />
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden lg:flex items-center gap-3 justify-self-end">
            <Link
              href="/login"
              className={`text-sm font-medium px-5 py-2.5 rounded-full transition-colors ${
                scrolled
                  ? "text-[#0A1628] hover:bg-[#F9F7F4] hover:text-[#C9A34F]"
                  : "text-white hover:bg-white/10 hover:text-[#C9A34F]"
              }`}
            >
              Client Login
            </Link>
            <Link
              href="/consultation"
              className="text-sm font-semibold px-6 py-2.5 rounded-full bg-[#C9A34F] text-[#0A1628] hover:bg-[#d4b05f] transition-colors shadow-md shadow-[#C9A34F]/20"
            >
              Get Started
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden p-2.5 rounded-xl transition-colors justify-self-end col-start-3 ${
              scrolled || mobileOpen
                ? "text-[#0A1628] hover:bg-[#F9F7F4]"
                : "text-white hover:bg-white/10"
            }`}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-0 bg-white z-40 overflow-y-auto font-sans rounded-b-3xl">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3"
            >
              <div className="w-9 h-9 bg-[#C9A34F] rounded-xl flex items-center justify-center">
                <span className="text-[#0A1628] font-bold">F</span>
              </div>
              <span className="font-semibold text-[#0A1628]">Faways Solutions</span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="p-2 rounded-full hover:bg-[#F9F7F4] transition-colors"
            >
              <X className="w-6 h-6 text-[#0A1628]" />
            </button>
          </div>
          <div className="px-6 py-6 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-3 px-3 rounded-xl text-[#0A1628] font-medium hover:bg-[#F9F7F4] hover:text-[#C9A34F] transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-6 flex flex-col gap-3">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="text-center py-3 rounded-full border border-[#0A1628] text-[#0A1628] font-medium"
              >
                Client Login
              </Link>
              <Link
                href="/consultation"
                onClick={() => setMobileOpen(false)}
                className="text-center py-3 rounded-full bg-[#C9A34F] text-[#0A1628] font-semibold"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function NavItem({
  href,
  label,
  scrolled,
}: {
  href: string;
  label: string;
  scrolled: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-3 xl:px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors hover:text-[#C9A34F] ${
        scrolled
          ? "text-[#0A1628] hover:bg-[#F9F7F4]"
          : "text-white/90 hover:bg-white/10"
      }`}
    >
      {label}
    </Link>
  );
}
