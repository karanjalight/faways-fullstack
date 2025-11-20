import Navbar from "@/components/Navbar";
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

      {/* Stats overlapping the hero */}
      <div className="flex lg:flex-row flex-col lg:-my-40 z-10 relative">
        <div className="lg:w-2/5"></div>
        <div className="lg:w-3/5">
          <StatsSection />
        </div>
      </div>
      <Service />     
      <Tabs />
      {/* <ProductCarousel /> */}
      {/* <Partners /> */}
      <TestimonialsSection />
      <Faqs />
      <Footer />
    </main>
  );
}
