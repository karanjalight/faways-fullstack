import Navbar from "@/components/NavbarLanding";
import HeroSection from "@/components/HeroSection";
import Service from "@/components/Services";
import Tabs from "@/components/Tabs";
import TestimonialsSection from "@/components/Testimonials.";
import Faqs from "@/components/Faqs";
import Footer from "@/components/Footer";
import StatsSection from "@/components/Stats";

export default async function HomePage() {
  return (
    <main className="min-h-screen bg-white ">
      <Navbar />
      <HeroSection />
      <div className="flex lg:flex-row flex-col  z-10 relative">
        <div className="lg:w-5/5">
          <StatsSection />
        </div>
      </div>
      <Service />
      <Tabs />
      <TestimonialsSection />
      <Faqs />
      <Footer />
    </main>
  );
}

