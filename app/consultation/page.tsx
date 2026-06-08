import type { Metadata } from "next";
import MarketingLayout from "@/components/landing/MarketingLayout";
import PageHero from "@/components/landing/PageHero";
import ConsultationForm from "@/components/landing/ConsultationForm";

export const metadata: Metadata = {
  title: "Book Consultation | Faways Solutions",
  description:
    "Schedule a free consultation with Faways Solutions for debt collection, property management, and financial services.",
};

export default function ConsultationPage() {
  return (
    <MarketingLayout>
      <PageHero
        label="Book Consultation"
        title="Schedule Your Free Consultation"
        description="Tell us about your needs and pick a time that works. Our consultants will prepare a tailored recommendation before your session."
        image="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80"
      />
      <ConsultationForm />
    </MarketingLayout>
  );
}
