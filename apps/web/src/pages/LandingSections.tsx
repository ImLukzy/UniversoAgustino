import { LandingFeatures } from "../components/landing/LandingFeatures";
import { LandingShowcase } from "../components/landing/LandingShowcase";
import { LandingDevices } from "../components/landing/LandingDevices";
import { LandingStats } from "../components/landing/LandingStats";
import { LandingFAQ } from "../components/landing/LandingFAQ";
import { LandingFooter } from "../components/landing/LandingFooter";

export function LandingSections() {
  return <><LandingFeatures /><LandingShowcase /><LandingDevices /><LandingStats /><LandingFAQ /><LandingFooter /></>;
}
