"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Example SVG icons (replace with real ones if you have)
const DebtIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="32" r="30" fill="#b38f62" opacity="0.3" />
    <path d="M16 32H48" stroke="white" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const PropertyIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none">
    <rect x="16" y="24" width="32" height="28" rx="2" fill="#02273f" opacity="0.3"/>
    <path d="M32 12L16 24H48L32 12Z" fill="#02273f"/>
  </svg>
);

const BookkeepingIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none">
    <rect x="16" y="16" width="32" height="32" rx="4" fill="#7C3AED" opacity="0.3"/>
    <path d="M24 24H40M24 32H40M24 40H40" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CreditIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="32" r="28" fill="#f97316" opacity="0.3"/>
    <path d="M24 32H40M32 24V40" stroke="white" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

interface Service {
  id: number;
  title: string;
  color: string;
  icon: any;
  image: string;
  gradient: string;
  slug: string;
}

export default function FawaysServices() {
  const [activeTab, setActiveTab] = useState<string>("Debt Management");

  const cards: Service[] = [
    {
      id: 1,
      title: "Debt Collection & Recovery",
      color: "Debt Management",
      icon: DebtIcon,
      image: "/trained-security-guard-pointing-his-baton-against-blue-background.jpg",
      gradient: "from-sky-700/30 to-sky-900/50",
      slug: "services/debt-collection",
    },
    {
      id: 2,
      title: "Rent Collection & Property Management",
      color: "Property",
      icon: PropertyIcon,
      image: "/portrait-menacing-bodyguard-pointing-towards-security-body-camera.jpg",
      gradient: "from-sky-700/30 to-sky-900/50",
      slug: "services/property-management",
    },
    {
      id: 3,
      title: "Bookkeeping & Financial Management",
      color: "Financial",
      icon: BookkeepingIcon,
      image: "/african-business-male-people-shaking-hands.jpg",
      gradient: "from-sky-700/30 to-sky-900/50",
      slug: "services/bookkeeping-financial",
    },
    {
      id: 4,
      title: "Credit Control & Consultancy",
      color: "Credit Consultancy",
      icon: CreditIcon,
      image: "/server-hub-it-staff-members-debugging-optimizing-code.jpg",
      gradient: "from-sky-700/30 to-sky-900/50",
      slug: "services/credit-control",
    },
  ];

  const collections: Record<string, Service[]> = cards.reduce((acc, card) => {
    if (!acc[card.color]) acc[card.color] = [];
    acc[card.color].push(card);
    return acc;
  }, {} as Record<string, Service[]>);

  const tabs = Object.keys(collections);

  return (
    <div className="bg-white py-16 lg:pt-30 px-4">
      <div className="lg:px-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#02273f] mb-4">
            Our Solutions
          </h1>
          <p className="text-gray-600 text-sm max-w-3xl mx-auto">
            Faways Solutions is committed to redefining debt management and financial services with professionalism, integrity, and efficiency.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-12 text-lg justify-center">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 transition-all duration-300 ${
                activeTab === tab
                  ? "bg-sky-600 text-white"
                  : "bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-800 hover:text-purple-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {collections[activeTab]?.map((service, index) => (
            <Link
              key={service.id}
              href={`/${service.slug}`}
              className="group relative overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 block"
              style={{
                animation: `fadeIn 0.6s ease-out ${index * 0.1}s both`,
              }}
            >
              <div className="relative h-80 overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${service.gradient} opacity-90 group-hover:opacity-100 transition-opacity duration-300`}
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-sm font-semibold mb-2 uppercase tracking-wide">
                    {service.color}
                  </p>
                  <h3 className="text-2xl font-bold mb-2">{service.title}</h3>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    <span className="text-sm">Learn More</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
