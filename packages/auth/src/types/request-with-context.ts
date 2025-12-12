import type { Request } from "express";
import type { AuthContext } from "./auth-context";
import { PATHWAY_CONTEXT_PROPERTY } from "../constants";

export type RequestWithAuthContext = Request & {
  [PATHWAY_CONTEXT_PROPERTY]?: AuthContext;
};

