export {
  QUIZ_STORAGE_KEY,
  QUESTIONS,
  SCORED_QUESTION_IDS,
  RISK_AREAS_MAPPING,
  BANDS,
  RISK_AREA_COPY,
} from "./config";

export type {
  Question,
  SingleChoiceQuestion,
  NumericQuestion,
  SingleChoiceOption,
  Band,
  RiskAreaResult,
  RiskAreaSeverity,
  RecommendedPlan,
  PlanCode,
} from "./config";

export {
  computeScore,
  getBand,
  getRiskAreas,
  getRecommendedPlan,
  getTotalSteps,
  getQuestionAt,
} from "./scoring";

export type { QuizAnswers } from "./scoring";
