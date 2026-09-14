import { MobileCtaBar, SiteHeader } from "@/components/landing/site-header";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { AssistantShowcase } from "@/components/landing/assistant-showcase";
import { WhoOwesWhom } from "@/components/landing/who-owes-whom";
import { MoneyPlaces } from "@/components/landing/money-places";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Reports } from "@/components/landing/reports";
import { StayOnTop } from "@/components/landing/stay-on-top";
import { FinalCta } from "@/components/landing/final-cta";
import { SiteFooter } from "@/components/landing/site-footer";

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-background text-foreground">
      <SiteHeader />
      <main id="top">
        <Hero />
        <HowItWorks />
        <AssistantShowcase />
        <WhoOwesWhom />
        <MoneyPlaces />
        <DashboardPreview />
        <Reports />
        <StayOnTop />
        <FinalCta />
      </main>
      <SiteFooter />
      <MobileCtaBar />
    </div>
  );
}
