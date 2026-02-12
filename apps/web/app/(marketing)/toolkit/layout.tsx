import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Attendance + Safeguarding Toolkit | Nexsteps",
  description:
    "Download blank templates for attendance registers, incident forms, parent consent, volunteer onboarding, and weekly safeguarding checks. No child details required.",
};

export default function ToolkitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
