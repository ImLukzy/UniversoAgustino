import { LandingHero } from "../components/landing/LandingHero";
import { LandingFeatures } from "../components/landing/LandingFeatures";
import { LandingShowcase } from "../components/landing/LandingShowcase";
import { LandingDevices } from "../components/landing/LandingDevices";
import { LandingStats } from "../components/landing/LandingStats";
import { LandingFAQ } from "../components/landing/LandingFAQ";
import { LandingFooter } from "../components/landing/LandingFooter";

// Landing pública long-scroll (visitantes sin sesión) estilo Studocu.
export function PublicLanding() {
  return (
    <main className="bg-white">
      <LandingHero />
      <LandingFeatures />
      <LandingShowcase />
      <LandingDevices />
      <LandingStats />
      <LandingFAQ />
      <LandingFooter />
    </main>
  );
}
