import { LandingHero } from "../components/landing/LandingHero";
import { LandingFeatures } from "../components/landing/LandingFeatures";
import { LandingShowcase } from "../components/landing/LandingShowcase";
import { LandingDevices } from "../components/landing/LandingDevices";
import { LandingStats } from "../components/landing/LandingStats";
import { LandingFAQ } from "../components/landing/LandingFAQ";
import { LandingFooter } from "../components/landing/LandingFooter";

// Landing pública long-scroll estilo Studocu.
// Si withSession es true, adaptada para usuarios con sesión.
export function PublicLanding({ withSession }: { withSession?: boolean } = {}) {
  return (
    <main className="bg-white">
      <LandingHero withSession={withSession} />
      <LandingFeatures />
      <LandingShowcase />
      <LandingDevices />
      <LandingStats />
      <LandingFAQ />
      <LandingFooter />
    </main>
  );
}
