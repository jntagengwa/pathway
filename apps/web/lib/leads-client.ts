const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export type CreateDemoLeadPayload = {
  name: string;
  email: string;
  organisation?: string;
  role?: string;
  sector?: string;
  message?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
};

export type CreateToolkitLeadPayload = {
  email: string;
  name?: string;
  organisation?: string;
  role?: string;
  sector?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
};

export type CreateTrialLeadPayload = {
  email: string;
  name?: string;
  organisation?: string;
  sector?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
};

export async function createDemoLead(
  payload: CreateDemoLeadPayload,
): Promise<{ success: boolean; id: string }> {
  const res = await fetch(`${API_BASE_URL}/leads/demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Unable to submit demo request");
  }

  return (await res.json()) as { success: boolean; id: string };
}

export async function createToolkitLead(
  payload: CreateToolkitLeadPayload,
): Promise<{ success: boolean; id: string }> {
  const res = await fetch(`${API_BASE_URL}/leads/toolkit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Unable to submit toolkit request");
  }

  return (await res.json()) as { success: boolean; id: string };
}

export async function createTrialLead(
  payload: CreateTrialLeadPayload,
): Promise<{ success: boolean; id: string }> {
  const res = await fetch(`${API_BASE_URL}/leads/trial`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Unable to join waitlist");
  }

  return (await res.json()) as { success: boolean; id: string };
}
