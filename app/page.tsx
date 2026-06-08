import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Faways Solutions | Debt Collection & Financial Management",
  description:
    "Professional debt collection, property management, and financial consultancy across Kenya. Your debt is our concern.",
};

export default function IndexPage() {
  return <LandingPage />;
}

