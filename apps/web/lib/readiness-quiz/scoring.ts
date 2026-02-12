/**
 * Nexsteps Readiness Score quiz logic.
 * Computes score, band, risk areas, and recommended plan from answers.
 */

import {
  QUESTIONS,
  SCORED_QUESTION_IDS,
  RISK_AREAS_MAPPING,
  BANDS,
  RISK_AREA_COPY,
  type Question,
  type Band,
  type RiskAreaResult,
  type RecommendedPlan,
} from "./config";

export type QuizAnswers = Record<string, string | number | string[]>;

export function computeScore(answers: QuizAnswers): number {
  let total = 0;
  let count = 0;

  for (const qid of SCORED_QUESTION_IDS) {
    const q = QUESTIONS.find((qu) => qu.id === qid);
    if (!q || q.type !== "single_choice") continue;
    const scoring = q.scoring;
    if (scoring && "type" in scoring && scoring.type === "non_scoring") continue;

    const val = answers[qid];
    if (val === undefined || val === null) continue;

    const strVal = String(val);
    const score =
      scoring && !("type" in scoring) ? (scoring as Record<string, number>)[strVal] : undefined;
    if (typeof score === "number") {
      total += score;
      count++;
    }
  }

  if (count === 0) return 0;

  const raw = (total / (count * 4)) * 100;
  return Math.round(raw);
}

export function getBand(score: number): Band {
  for (const band of BANDS) {
    if (score >= band.min && score <= band.max) {
      return band.label as Band;
    }
  }
  return "Developing";
}

export function getRiskAreas(answers: QuizAnswers): RiskAreaResult[] {
  const results: RiskAreaResult[] = [];

  for (const [area, questionIds] of Object.entries(RISK_AREAS_MAPPING)) {
    const info = RISK_AREA_COPY[area];
    if (!info) continue;

    let areaScore = 0;
    let maxScore = 0;

    for (const qid of questionIds) {
    const q = QUESTIONS.find((qu) => qu.id === qid);
    if (!q || q.type !== "single_choice") continue;
    const scoring = q.scoring;
    if (scoring && "type" in scoring && scoring.type === "non_scoring") continue;

    const val = answers[qid];
    const strVal = val !== undefined ? String(val) : "";
    const score =
      scoring && !("type" in scoring)
        ? (typeof (scoring as Record<string, number>)[strVal] === "number"
          ? (scoring as Record<string, number>)[strVal]
          : 0)
        : 0;
      areaScore += score;
      maxScore += 4;
    }

    const pct = maxScore > 0 ? (areaScore / maxScore) * 100 : 0;

    // Low score = risk area to address
    if (pct < 70) {
      results.push({
        area,
        severity: pct < 35 ? "high" : "medium",
        copy: info.copy,
        nextSteps: info.nextSteps,
      });
    }
  }

  return results;
}

export function getRecommendedPlan(answers: QuizAnswers): RecommendedPlan {
  const primaryGoal = answers.primary_goal as string | undefined;
  const sitesCount = answers.sites_count as string | undefined;
  const orgSize = answers.org_size_people as number | undefined;
  const safeguarding = answers.safeguarding_logging as string | undefined;
  const rota = answers.rota_visibility as string | undefined;

  const isSmallOrg = typeof orgSize === "number" && orgSize < 100;
  const isSingleSite = sitesCount === "1";
  const isMultiSite = sitesCount === "2_3" || sitesCount === "4_plus";

  const safeguardingLow =
    safeguarding === "not_recorded" ||
    safeguarding === "messages" ||
    safeguarding === "docs";
  const rotaLow =
    rota === "no" || rota === "partial";

  // If primary goal is stop paper AND single site AND small org -> Core
  if (
    primaryGoal === "stop_paper" &&
    isSingleSite &&
    isSmallOrg
  ) {
    return {
      code: "core",
      displayName: "Core",
      tagline: "Attendance only",
      why: "You're focused on replacing paper and spreadsheets. Core gives you digital attendance for a single site.",
    };
  }

  // If safeguarding or rota is low -> Starter
  if (safeguardingLow || rotaLow) {
    return {
      code: "starter",
      displayName: "Starter",
      tagline: "Run your organisation properly",
      why: "You need to strengthen safeguarding recording and rota visibility. Starter includes both, plus parent communication.",
    };
  }

  // If multi-site -> Growth
  if (isMultiSite) {
    return {
      code: "growth",
      displayName: "Growth",
      tagline: "Operate at scale",
      why: "You operate across multiple sites. Growth is designed for multi-site management.",
    };
  }

  // Default to Starter
  return {
    code: "starter",
    displayName: "Starter",
    tagline: "Run your organisation properly",
    why: "Starter covers attendance, rotas, safeguarding, and parent communication for single-site organisations.",
  };
}

export function getTotalSteps(): number {
  return QUESTIONS.length;
}

export function getQuestionAt(index: number): Question | undefined {
  return QUESTIONS[index];
}
