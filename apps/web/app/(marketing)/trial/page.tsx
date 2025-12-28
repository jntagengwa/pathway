/**
 * Trial waitlist page - will later become self-serve onboarding wizard (Milestone 6).
 * Currently a waitlist form; future versions will support self-serve tenant creation.
 */

import type { Metadata } from "next";
import TrialPageClient from "./trial-page-client";

export const metadata: Metadata = {
  title: "Join the Trial Waitlist | Nexsteps",
  description:
    "Be the first to try Nexsteps. Join our trial waitlist and we'll contact you to set up your Nexsteps site when trial access becomes available.",
};

export default function TrialPage() {
  return <TrialPageClient />;
}
