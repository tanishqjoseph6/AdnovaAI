import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustedBrands from "@/components/landing/TrustedBrands";
import EverythingAdvora from "@/components/landing/EverythingAdvora";
import HowItWorks from "@/components/landing/HowItWorks";
import DashboardPreview from "@/components/landing/DashboardPreview";
import AiOutputExamples from "@/components/landing/AiOutputExamples";
import CompetitorShowcase from "@/components/landing/CompetitorShowcase";
import BrandKitShowcase from "@/components/landing/BrandKitShowcase";
import SocialSchedulerShowcase from "@/components/landing/SocialSchedulerShowcase";
import LandingPricing from "@/components/landing/LandingPricing";
import LandingFaq from "@/components/landing/LandingFaq";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#030014] text-zinc-100">
      <Navbar />
      <main>
        <Hero />
        <TrustedBrands />
        <EverythingAdvora />
        <HowItWorks />
        <DashboardPreview />
        <AiOutputExamples />
        <CompetitorShowcase />
        <BrandKitShowcase />
        <SocialSchedulerShowcase />
        <LandingPricing />
        <LandingFaq />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
