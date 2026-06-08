import LandingNav from "./LandingNav";
import { LandingFooter } from "./LandingSections";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F9F7F4] font-sans">
      <LandingNav />
      <div className="pt-28 lg:pt-36">{children}</div>
      <LandingFooter />
    </div>
  );
}
