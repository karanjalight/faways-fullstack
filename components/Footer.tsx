"use client";

import React, { useState } from "react";
import {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Phone,
  Mail,
  MapPin,
  Send,
} from "lucide-react";

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = () => {
    if (email) {
      console.log("Subscribing email:", email);
      setEmail("");
    }
  };

  const handleKeyPress = (e: { key: string }) => {
    if (e.key === "Enter") {
      handleSubscribe();
    }
  };

  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "Household Staffing", href: "/about#household" },
    { name: "Pharma Training", href: "/about#training" },
    { name: "Contact Us", href: "/contact" },
  ];

  const pages = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "Our Services", href: "/about" },
    { name: "Contact Us", href: "/contact" },
  ];

  const services = [
    { name: "Backup Nannies", href: "/about#household" },
    { name: "Contract Nannies", href: "/about#household" },
    { name: "Pharma Training", href: "/about#training" },
    { name: "Performance Analytics", href: "/about#analytics" },
    { name: "Corporate Solutions", href: "/about#training" },
  ];

  return (
    <footer className="bg-[#02273f] text-white">
      {/* Main Footer Content */}
      <div className="px-4 sm:px-8 lg:px-20 py-12 lg:py-16">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-6">
          {/* Left Column - Company Info & Socials */}
          <div className="lg:col-span-4 space-y-8 text-left lg:text-left">
            {/* Description */}
            <div className="max-w-md mx-auto lg:mx-0">
              <p className="text-gray-300 leading-relaxed mb-6 text-sm sm:text-base">
                Your Debt Is Our Concern Faways Business Solutions is a trusted
                debt collection and management company based in Nairobi, serving
                clients across Kenya since 2013{" "}
              </p>
            </div>

            {/* Social Media Icons */}
            <div className="flex justify-center lg:justify-start flex-wrap gap-4">
              <a
                href="https://www.instagram.com/peckers_services"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-sky-400 rounded flex items-center justify-center hover:bg-sky-400 hover:text-blue-900 transition-all"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/company/peckers-services-ltd"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-sky-400 rounded flex items-center justify-center hover:bg-sky-400 hover:text-blue-900 transition-all"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Divider (hidden on small screens) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="w-px h-full bg-blue-800 mx-auto"></div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-7 space-y-10">
            {/* Newsletter Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <h3 className="text-2xl sm:text-3xl font-semibold leading-snug text-left md:text-left">
                Subscribe to our <br className="hidden sm:block" />
                newsletter for the <br className="hidden sm:block" />
                latest updates
              </h3>

              <div className="flex flex-col sm:flex-row items-stretch p-2 bg-white   overflow-hidden shadow-md max-w-md mx-auto md:mx-0 w-full sm:w-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Your Email..."
                  className="flex-1 px-4 py-3 text-gray-800 outline-none text-sm"
                />
                <button
                  onClick={handleSubscribe}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 flex items-center justify-center transition"
                  aria-label="Subscribe"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Links Section */}
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 text-left md:text-left">
              {/* Quick Links */}
              <div>
                <h4 className="text-sky-400 font-semibold text-lg mb-4">
                  Quick Links
                </h4>
                <ul className="space-y-2">
                  {quickLinks.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-gray-300 hover:text-sky-400 transition-colors text-sm"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pages */}
              <div>
                <h4 className="text-sky-400 font-semibold text-lg mb-4">
                  Pages
                </h4>
                <ul className="space-y-2">
                  {pages.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-gray-300 hover:text-sky-400 transition-colors text-sm"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Services */}
              <div>
                <h4 className="text-sky-400 font-semibold text-lg mb-4">
                  Services
                </h4>
                <ul className="space-y-2">
                  {services.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-gray-300 hover:text-sky-400 transition-colors text-sm"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-sky-400 font-semibold text-lg mb-4">
                  Contact
                </h4>
                <ul className="space-y-5 text-sm text-gray-300">
                  {/* Phone */}
                  <li className="flex items-start gap-3">
                    <div className="w-10 h-10 border-2 border-sky-400 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-sky-400" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <a
                        href="tel:+2547XX XXX XXX"
                        className="hover:text-sky-400 transition-colors font-medium"
                      >
                        +254 7XX XXX XXX
                      </a>
                    </div>
                  </li>

                  {/* Email */}
                  <li className="flex items-start gap-3">
                    <div className="w-10 h-10 border-2 border-sky-400 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-sky-400" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <a
                        href="mailto:info@peckers.co.ke"
                        className="hover:text-sky-400 transition-colors font-medium"
                      >
                        info@fawayssolutions.co.ke
                      </a>
                    </div>
                  </li>

                  {/* Address */}
                  <li className="flex items-start gap-3">
                    <div className="w-10 h-10 border-2 border-sky-400 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-sky-400" />
                    </div>
                    <span className="leading-relaxed">
                      Nairobi, Kenya
                      <br />
                      Serving Nairobi, Kiambu, Nakuru, Mombasa, Eldoret
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-blue-800">
        <div className="lg:px-20 px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-gray-400 text-left md:text-left">
            <p>
              © 2025{" "}
              <span className="text-sky-400 font-semibold">
                Faways Solutions
              </span>{" "}
              All rights reserved.
            </p>
            <div className="flex justify-center items-center gap-4">
              <a
                href="/privacy"
                className="hover:text-sky-400 transition-colors"
              >
                Privacy Policy
              </a>
              <span>•</span>
              <a href="/terms" className="hover:text-sky-400 transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
