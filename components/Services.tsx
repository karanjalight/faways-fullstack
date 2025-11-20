"use client";
import { useState, useEffect } from "react";
import { CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const services = [
    { title: "Household Support", icon: "👶" },
    { title: "Medical Training", icon: "💊" },
    { title: "Performance Dashboards", icon: "📊" },
    { title: "Corporate Solutions", icon: "🏢" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % services.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [services.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % services.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + services.length) % services.length);
  };

  return (
    <div className="w-full flex flex-col lg:flex-row items-end bg-white -mt-40 lg:-mb-20 lg:py-20">
      <div className="relative lg:w-1/3 lg:h-[70vh] h-[40vh]">
        <img
          src="/front-view-flight-attendants-with-tablet.jpg"
          alt="Peckers Services"
          className="object-cover object-top w-full h-full"
        />
        <div className="absolute bottom-4 right-0 bg-white text-gray-700 px-5 py-6">
          <div>
            <h2 className="text-3xl font-bold">Verified</h2>
            <p>Service Provider</p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-2/3">
        <div className="flex items-center justify-center">
          <div className="max-w-6xl w-full backdrop-blur-sm p-4 py-10 lg:p-12">
            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl font-bold text-[#02273f] my-6 leading-tight">
              About Us
            </h1>

            {/* Subheading */}
            <p className="text-gray-600 text-md mb-12 max-w-2xl">
              Faways Solutions delivers reliable support, training, performance dashboards, and corporate solutions under one trusted brand.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 lg:divide-x-2 divide-gray-300 md:grid-cols-2 gap-8 mb-12">
              <div className="flex items-start gap-4">
                <div className="bg-purple-100 p-3 flex-shrink-0">
                  <img
                    src="https://books-buddies.vercel.app/landing-1.png"
                    alt="Fast Deployment"
                    className="h-9 w-auto"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-[#02273f] text-lg mb-2">
                    6-Hour Deployment
                  </h3>
                  <p className="text-gray-600 text-md pr-5">
                    Quick response to provide backup staff when needed most.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-purple-100 p-3 flex-shrink-0">
                  <img
                    src="https://books-buddies.vercel.app/landing-1.png"
                    alt="Vetted Staff"
                    className="h-9 w-auto"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-[#02273f] text-lg mb-2">
                    100% Vetted Staff
                  </h3>
                  <p className="text-gray-600 text-md">
                    All staff are trained, vetted, and accountable.
                  </p>
                </div>
              </div>
            </div>

            {/* Checkmark Features */}
            <div className="grid text-md grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#02273f] flex-shrink-0" />
                <span className="text-gray-700">Backup & Emergency Support</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#02273f] flex-shrink-0" />
                <span className="text-gray-700">Medical & Corporate Training</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#02273f] flex-shrink-0" />
                <span className="text-gray-700">Performance Dashboards & Analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#02273f] flex-shrink-0" />
                <span className="text-gray-700">Technology-Backed Solutions</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link href="/about" className="flex items-center gap-2 px-6 py-3 border-2 border-sky-600 text-[#8a5f2c] font-semibold hover:bg-sky-600 hover:text-white transition-all duration-300 group">
                Our Services
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/contact" className="flex items-center gap-2 px-6 py-3 bg-sky-600 text-white font-semibold hover:bg-sky-500 transition-all duration-300 shadow-lg hover:shadow-xl group">
                Contact Us
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
