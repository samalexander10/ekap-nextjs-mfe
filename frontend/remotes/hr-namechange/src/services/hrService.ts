const HR_SERVICE_URL =
  process.env.NEXT_PUBLIC_HR_SERVICE_URL || "http://localhost:8082";

export interface NameChangeRequest {
  id: string;
  userId: string;
  oldFullName: string;
  newFullName: string;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  reviewerId?: string;
  reviewerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitNameChangePayload {
  userId: string;
  oldFullName: string;
  newFullName: string;
  reason?: string;
}

export const hrService = {
  async submitNameChange(
    payload: SubmitNameChangePayload
  ): Promise<NameChangeRequest> {
    const res = await fetch(`${HR_SERVICE_URL}/api/hr/name-change`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: payload.userId,
        oldFullName: payload.oldFullName,
        newFullName: payload.newFullName,
        reason: payload.reason,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        (err as { message?: string }).message || `HR Service error: ${res.status}`
      );
    }

    return res.json() as Promise<NameChangeRequest>;
  },

  async getNameChangeRequest(requestId: string): Promise<NameChangeRequest> {
    const res = await fetch(
      `${HR_SERVICE_URL}/api/hr/name-change/${requestId}`
    );

    if (!res.ok) {
      throw new Error(`Request not found: ${requestId}`);
    }

    return res.json() as Promise<NameChangeRequest>;
  },

  async getUserRequests(userId: string): Promise<NameChangeRequest[]> {
    const res = await fetch(
      `${HR_SERVICE_URL}/api/hr/name-change/user/${userId}`
    );

    if (!res.ok) {
      throw new Error(`Failed to load requests for user ${userId}`);
    }

    return res.json() as Promise<NameChangeRequest[]>;
  },
};
