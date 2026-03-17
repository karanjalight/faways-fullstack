"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Menu, X } from "lucide-react";

const primaryLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
];

const solutionShortcuts = [
  { name: "Revenue Recovery", href: "/services#revenue" },
  { name: "Provider Enablement", href: "/services#enablement" },
  { name: "Data & Insights", href: "/services#data" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const toggleDropdown = (menu: string) => {
    if (menu === "") {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(activeDropdown === menu ? null : menu);
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300  ${
        isScrolled ? "bg-white shadow-md" : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-20 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          {/* <img
            src="https://fawayssolutions.vercel.app/static/img/logo.png"
            alt="Peckers Services Logo"
            className="h-16 sm:h-14 w-auto"
          /> */}
          <div className="font-bold text-2xl text-[#02273f]">
            Faways Solutions
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6 text-sm">
          {primaryLinks.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              isScrolled={isScrolled}
            />
          ))}
          <Dropdown
            label="Solutions"
            items={solutionShortcuts}
            activeDropdown={activeDropdown}
            toggleDropdown={toggleDropdown}
            isScrolled={isScrolled}
          />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href={"/login"}
            className="relative hidden font-normal lg:inline-flex items-center justify-center gap-2 px-6 py-3 border border-purple-500-400 bg-sky-600   overflow-hidden transition-all duration-500 hover:text-gray-800 hover:border-purple-500-600 before:absolute before:inset-0 before:bg-[#02273f] before:w-0 hover:before:w-full before:transition-all before:duration-500 before:rotate-45 before:-translate-x-1/2 before:-translate-y-1/2 before:origin-center before:top-1/2 before:left-1/2 before:h-[500%] before:z-0"
          >
            <span className="relative z-10 text-white">Login →</span>
          </Link>
          <Link
            href={"/contact"}
            className="relative hidden font-normal lg:inline-flex items-center justify-center gap-2 px-6 py-3 border border-purple-500-400 bg-sky-600   overflow-hidden transition-all duration-500 hover:text-gray-800 hover:border-purple-500-600 before:absolute before:inset-0 before:bg-[#02273f] before:w-0 hover:before:w-full before:transition-all before:duration-500 before:rotate-45 before:-translate-x-1/2 before:-translate-y-1/2 before:origin-center before:top-1/2 before:left-1/2 before:h-[500%] before:z-0"
          >
            <span className="relative z-10 text-white">Get Started →</span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden p-2 transition-colors ${
              isScrolled ? "text-gray-900" : "text-white"
            }`}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-purple-500-50 bg-opacity-50 z-40 lg:hidden" />
          <div className="fixed top-[0px]  left-0 right-0 bottom-0 bg -white z-50 lg:hidden overflow-y-auto">
            <div
              className="flex w-full  justify-between p-4"
              onClick={closeMobileMenu}
            >
              <div>
                <div className="flex items-center gap-2">
                  <img
                    src="/logo.png"
                    alt="Peckers Services Logo"
                    className="h-12 sm:h-14 w-auto"
                  />
                </div>
              </div>
              <div className="border p-2 border-purple-500-500 text-sky-600 px-5">
                x
              </div>
            </div>
            <div className="px-4 py-6 space-y-4">
              {primaryLinks.map((link) => (
                <MobileNavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  onClick={closeMobileMenu}
                />
              ))}

              <MobileDropdown
                label="Solutions"
                items={solutionShortcuts}
                activeDropdown={activeDropdown}
                toggleDropdown={toggleDropdown}
                closeMobileMenu={closeMobileMenu}
              />

              <div className="pt-4">
                <Button className="w-full text-white bg-sky-600 hover:bg-sky-600 rounded-none">
                  Get Started →
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}

/* --- Desktop Subcomponents --- */

function NavLink({
  href,
  label,
  isScrolled,
}: {
  href: string;
  label: string;
  isScrolled: boolean;
}) {
  return (
    <Link
      href={href}
      className={`transition-colors duration-300 ${
        isScrolled
          ? "text-gray-700  hover:text-sky-600"
          : "text-white hover:text-gray-200"
      }`}
    >
      {label}
    </Link>
  );
}

function Dropdown({
  label,
  items,
  activeDropdown,
  toggleDropdown,
  isScrolled,
}: {
  label: string;
  items: { name: string; href: string }[];
  activeDropdown: string | null;
  toggleDropdown: (menu: string) => void;
  isScrolled: boolean;
}) {
  const isActive = activeDropdown === label;

  return (
    <div
      className="relative"
      onMouseEnter={() => toggleDropdown(label)}
      onMouseLeave={() => toggleDropdown("")}
    >
      <button
        className={`flex items-center gap-1 transition-colors duration-300 cursor-pointer ${
          isScrolled
            ? "text-gray-700 hover:text-sky-600"
            : "text-white hover:text-gray-200"
        }`}
      >
        {label}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isActive ? "rotate-180" : ""
          }`}
        />
      </button>

      {isActive && (
        <div className="absolute top-full left-0 pt-2 w-64 z-50">
          <div className="bg-white text-gray-700 shadow-lg px-2 py-2 divide-y-2">
            {items.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-4 py-2 hover:bg-gray-100 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* --- Mobile Subcomponents --- */

function MobileNavLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block py-3 text-gray-700 hover:text-sky-600 transition-colors font-medium"
    >
      {label}
    </Link>
  );
}

function MobileDropdown({
  label,
  items,
  activeDropdown,
  toggleDropdown,
  closeMobileMenu,
}: {
  label: string;
  items: { name: string; href: string }[];
  activeDropdown: string | null;
  toggleDropdown: (menu: string) => void;
  closeMobileMenu: () => void;
}) {
  const isActive = activeDropdown === label;

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => toggleDropdown(label)}
        className="flex items-center justify-between w-full py-3 text-gray-700 hover:text-sky-600 transition-colors font-medium"
      >
        {label}
        <ChevronDown
          className={`h-5 w-5 transition-transform ${
            isActive ? "rotate-180" : ""
          }`}
        />
      </button>

      {isActive && (
        <div className="pl-4 pb-3 space-y-2">
          {items.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={closeMobileMenu}
              className="block py-2 text-gray-600 hover:text-sky-600 transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
