import LandingNav from "./LandingNav";
import LandingHero from "./LandingHero";
import {
  PartnersStrip,
  AboutSection,
  ServicesSection,
  StatsSection,
  ProcessSection,
  WhyChooseSection,
  TestimonialsSection,
  FAQSection,
  CTASection,
  LandingFooter,
} from "./LandingSections";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <LandingNav />
      <LandingHero />
      <PartnersStrip />
      <AboutSection />
      <ServicesSection />
      <StatsSection />
      <ProcessSection />
      <WhyChooseSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <LandingFooter />
    </main>
  );
}
