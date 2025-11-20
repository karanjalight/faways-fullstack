"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HeroSection() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Array of background images for the slideshow
  const backgroundImages = [
    "/african-business-male-people-shaking-hands.jpg",
    "/server-hub-it-staff-members-debugging-optimizing-code.jpg",
    "https://digital4africa.com/wp-content/uploads/2022/02/best-digital-marketing-training-in-nairobi-kenya-learn-seo-social-media-strategy-analytics-online-advertising-etc.jpg",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex + 1) % backgroundImages.length
      );
    }, 8000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative flex lg:h-[80vh] h-[60vh] flex-col md:flex-row items-center lg:justify-between px-6 sm:px-10 md:px-20 py-16 md:py-20 text-white overflow-hidden">
      {/* Background Image Slideshow */}
      {backgroundImages.map((image, index) => (
        <div
          key={image}
          className="absolute inset-0 lg:bg-contain bg-cover bg-left lg:bg-center  transition-opacity duration-2000 ease-in-out"
          style={{
            backgroundImage: `url('${image}')`,
            opacity: currentImageIndex === index ? 1 : 0,
            zIndex: 0,
          }}
        />
      ))}

      {/* Overlays */}
      <div className="absolute inset-0 bg-sky-600/10 z-0" />
      <div className="absolute inset-0 bg-black/50 z-0" />

      {/* Content Wrapper */}
      <div className="flex flex-col md:flex-row-reverse items-end justify-between w-full md:-mb-60 z-10">
        {/* Left Side - Heading */}
        <div className="relative bg-black/50 lg:px-20 lg:py-10 p-4  z-10 mt-40 sm:mt-48 md:mt-60 text-center md:text-left"></div>

        {/* Right Side - Image + Text + Buttons */}
        <div className="relative   z-10 mt-10 md:mt-0 hidden sm:block md:block">
          <div className="text-center bg-sky-600/60 lg:px-20 lg:py-10  md:text-left mt-6 md:mt-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
              FAWAYS <span className="text-[#02273f]">SOLUTION</span>{" "}
            </h1>
            <p className="text-white font-light text-sm sm:text-base md:w-110 px-4 md:px-0 line-clamp-5">
              Your Debt Is Our Concern Faways Business Solutions is a trusted
              debt collection and management company based in Nairobi, serving
              clients across Kenya since 2013
            </p>

            <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start px-4 md:px-0">
              <Button
                variant="outline"
                className="bg-transparent rounded-none border-white px-8 hover:bg-white/10 text-sm sm:text-base"
                asChild
              >
                <Link href="/contact">Contact Us</Link>
              </Button>
              <Button
                className="bg-[#02273f] hover:bg-[#0d141a]  flex gap-2 px-10 sm:px-12 w-full sm:w-60 text-white"
                asChild
              >
                <Link href="/about">
                  <div>Our Services</div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      d="M2 12h20m-9-9l9 9l-9 9"
                    />
                  </svg>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-Only Text + Buttons */}
      <div className="relative z-10 mt-5 sm:hidden text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
          Peckers <span className="text-purple-400">Services</span>{" "}
        </h1>
        <p className="text-white font-light text-sm px-6">
          Kenya's first fully integrated provider of Household Support and
          Corporate Productivity Solutions. Trust, continuity, and world-class
          professionalism.
        </p>
        <div className="mt-6 flex flex-col gap-4 items-center">
          <Button
            variant="outline"
            className="bg-transparent w-60 rounded-none border-white px-8 hover:bg-white/10 text-sm"
            asChild
          >
            <Link href="/contact">Contact Us</Link>
          </Button>
          <Button
            className="bg-purple-600  w-60 hover:bg-purple-600 flex gap-2 px-10 text-white text-sm"
            asChild
          >
            <Link href="/about">
              <div>Our Services</div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  d="M2 12h20m-9-9l9 9l-9 9"
                />
              </svg>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
