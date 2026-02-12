/**
 * Nexsteps Safeguarding & Ops Readiness Score quiz configuration.
 * Single source of truth for questions, scoring, and results logic.
 */

export const QUIZ_STORAGE_KEY = "nexsteps_readiness_quiz_v1";

export const SCORED_QUESTION_IDS = [
  "attendance_capture",
  "attendance_followup",
  "safeguarding_logging",
  "rota_visibility",
  "comms_channels",
  "reporting_readiness",
] as const;

export const RISK_AREAS_MAPPING: Record<string, readonly string[]> = {
  Attendance: ["attendance_capture", "attendance_followup"],
  Safeguarding: ["safeguarding_logging"],
  "Rota & Staffing": ["rota_visibility"],
  Comms: ["comms_channels"],
  Reporting: ["reporting_readiness"],
} as const;

export type SingleChoiceOption = {
  value: string;
  label: string;
};

export type QuestionBase = {
  id: string;
  category: string;
  prompt: string;
};

export type SingleChoiceQuestion = QuestionBase & {
  type: "single_choice";
  options: SingleChoiceOption[];
  scoring: Record<string, number> | { type: "non_scoring" };
};

export type NumericQuestion = QuestionBase & {
  type: "numeric";
  suffix: string;
  validation: { min: number; max: number };
  scoring?: { type: "non_scoring" };
};

export type Question = SingleChoiceQuestion | NumericQuestion;

export const QUESTIONS: Question[] = [
  {
    id: "attendance_capture",
    category: "Attendance",
    type: "single_choice",
    prompt: "How do you record attendance today?",
    options: [
      { value: "paper", label: "Paper registers" },
      { value: "spreadsheet", label: "Spreadsheet (Excel/Sheets)" },
      { value: "mixed", label: "A mix of tools" },
      { value: "system", label: "A dedicated system" },
    ],
    scoring: { paper: 0, spreadsheet: 1, mixed: 2, system: 4 },
  },
  {
    id: "attendance_followup",
    category: "Attendance",
    type: "single_choice",
    prompt: "How reliably can you see who is missing and follow up?",
    options: [
      { value: "not_reliable", label: "Not reliably" },
      { value: "sometimes", label: "Sometimes" },
      { value: "usually", label: "Usually" },
      { value: "always", label: "Always" },
    ],
    scoring: { not_reliable: 0, sometimes: 1, usually: 3, always: 4 },
  },
  {
    id: "safeguarding_logging",
    category: "Safeguarding",
    type: "single_choice",
    prompt: "Where do safeguarding concerns/notes get recorded?",
    options: [
      { value: "not_recorded", label: "They're not recorded consistently" },
      { value: "messages", label: "Messages / email / WhatsApp" },
      { value: "docs", label: "Docs/spreadsheets" },
      { value: "system", label: "A dedicated safeguarding system" },
    ],
    scoring: { not_recorded: 0, messages: 0, docs: 2, system: 4 },
  },
  {
    id: "rota_visibility",
    category: "Rota & Staffing",
    type: "single_choice",
    prompt: "Do you know who is scheduled (and available) for each session ahead of time?",
    options: [
      { value: "no", label: "No, it's last minute" },
      { value: "partial", label: "Partially / depends" },
      { value: "mostly", label: "Mostly" },
      { value: "yes", label: "Yes, reliably" },
    ],
    scoring: { no: 0, partial: 1, mostly: 3, yes: 4 },
  },
  {
    id: "comms_channels",
    category: "Comms",
    type: "single_choice",
    prompt: "How do you communicate with parents/guardians when needed?",
    options: [
      { value: "ad_hoc", label: "Ad hoc messages (WhatsApp, texts)" },
      { value: "email", label: "Email lists" },
      { value: "platform", label: "A platform/app" },
      { value: "none", label: "We don't have a consistent method" },
    ],
    scoring: { none: 0, ad_hoc: 1, email: 2, platform: 4 },
  },
  {
    id: "reporting_readiness",
    category: "Reporting",
    type: "single_choice",
    prompt:
      "If you were asked for evidence (attendance, safeguarding actions, staffing), how quickly could you produce it?",
    options: [
      { value: "days", label: "Days (manual digging)" },
      { value: "hours", label: "A few hours" },
      { value: "minutes", label: "Minutes" },
      { value: "instant", label: "Instantly" },
    ],
    scoring: { days: 0, hours: 2, minutes: 3, instant: 4 },
  },
  {
    id: "org_size_people",
    category: "Context",
    type: "numeric",
    prompt: "Roughly how many children/young people do you oversee weekly?",
    suffix: "people",
    validation: { min: 1, max: 10000 },
  },
  {
    id: "sessions_per_week",
    category: "Context",
    type: "numeric",
    prompt: "How many sessions do you run per week?",
    suffix: "sessions",
    validation: { min: 1, max: 500 },
  },
  {
    id: "admin_time_hours",
    category: "Cost of delay",
    type: "numeric",
    prompt:
      "How many admin hours do you estimate are spent each week on attendance, rota, and follow-ups?",
    suffix: "hours/week",
    validation: { min: 0, max: 200 },
  },
  {
    id: "sites_count",
    category: "Context",
    type: "single_choice",
    prompt: "How many sites/locations do you operate?",
    options: [
      { value: "1", label: "1 site" },
      { value: "2_3", label: "2–3 sites" },
      { value: "4_plus", label: "4+ sites" },
    ],
    scoring: { type: "non_scoring" as const },
  },
  {
    id: "primary_goal",
    category: "Context",
    type: "single_choice",
    prompt: "What's the main outcome you want in the next 30 days?",
    options: [
      { value: "stop_paper", label: "Stop paper/spreadsheets for attendance" },
      { value: "rota", label: "Get rota/staffing organised" },
      { value: "safeguarding", label: "Improve safeguarding recording" },
      { value: "reporting", label: "Become inspection-ready" },
    ],
    scoring: { type: "non_scoring" as const },
  },
];

export type Band = "High risk" | "Developing" | "Strong";

export const BANDS: Array<{ min: number; max: number; label: Band; tone: string }> = [
  { min: 0, max: 34, label: "High risk", tone: "danger_soft" },
  { min: 35, max: 69, label: "Developing", tone: "warning_soft" },
  { min: 70, max: 100, label: "Strong", tone: "success_soft" },
];

export type RiskAreaSeverity = "high" | "medium" | "low";

export type RiskAreaResult = {
  area: string;
  severity: RiskAreaSeverity;
  copy: string;
  nextSteps: string[];
};

export const RISK_AREA_COPY: Record<
  string,
  { copy: string; nextSteps: string[]; severity: RiskAreaSeverity }
> = {
  Attendance: {
    copy: "Attendance capture and follow-up may be inconsistent or manual.",
    nextSteps: [
      "Introduce a digital attendance register",
      "Set up automatic follow-up alerts for absences",
      "Keep records in one place for audit trails",
    ],
    severity: "high",
  },
  Safeguarding: {
    copy: "Safeguarding notes and concerns may not be recorded in a secure, auditable way.",
    nextSteps: [
      "Use a dedicated safeguarding system",
      "Ensure staff know where and how to log concerns",
      "Implement audit trails for sensitive records",
    ],
    severity: "high",
  },
  "Rota & Staffing": {
    copy: "Rota and staffing visibility may be unclear or last-minute.",
    nextSteps: [
      "Plan rotas in advance with visibility for all staff",
      "Use a system that tracks availability and confirmations",
      "Reduce ad hoc cover swaps and confusion",
    ],
    severity: "medium",
  },
  Comms: {
    copy: "Parent communication may be ad hoc or fragmented.",
    nextSteps: [
      "Use a single platform for announcements and messages",
      "Ensure GDPR-compliant contact lists",
      "Reduce reliance on WhatsApp and personal devices",
    ],
    severity: "medium",
  },
  Reporting: {
    copy: "Producing evidence for inspections or audits may take longer than needed.",
    nextSteps: [
      "Store attendance and safeguarding data in one system",
      "Set up standard reports you can run on demand",
      "Build an audit trail for key actions",
    ],
    severity: "medium",
  },
};

export type PlanCode = "core" | "starter" | "growth" | "enterprise";

export type RecommendedPlan = {
  code: PlanCode;
  displayName: string;
  tagline: string;
  why: string;
};
