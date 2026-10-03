import { describe, expect, it } from "vitest";

import { nextStatus } from "@/lib/leave-store";

describe("nextStatus", () => {
  it("advances approvals through counsellor and HOD", () => {
    expect(nextStatus("PENDING_COUNSELLOR", "APPROVE")).toBe("PENDING_HOD");
    expect(nextStatus("PENDING_HOD", "APPROVE")).toBe("APPROVED");
  });

  it("makes rejection terminal at either approval stage", () => {
    expect(nextStatus("PENDING_COUNSELLOR", "REJECT")).toBe("REJECTED");
    expect(nextStatus("PENDING_HOD", "REJECT")).toBe("REJECTED");
    expect(nextStatus("APPROVED", "REJECT")).toBe("APPROVED");
    expect(nextStatus("REJECTED", "APPROVE")).toBe("REJECTED");
  });
});
