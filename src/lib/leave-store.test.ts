import { beforeEach, describe, expect, it } from "vitest";

import { nextStatus } from "@/lib/leave-store";
import {
  counsellorApprove,
  counsellorReject,
  getRequestsSnapshot,
  hodApprove,
  hodReject,
  listForCounsellor,
  listForHod,
  resetRequests,
  submitRequest,
} from "@/lib/leaveStore";

const leaveInput = {
  studentRegNo: "510423243001",
  studentName: "Test Student",
  kind: "LEAVE" as const,
  category: "Medical" as const,
  fromDate: "2026-10-10",
  toDate: "2026-10-11",
  reason: "Medical appointment",
};

beforeEach(() => {
  window.localStorage.clear();
  resetRequests();
});

describe("nextStatus", () => {
  it("advances approvals through counsellor and HOD", () => {
    expect(nextStatus("PENDING_COUNSELLOR", "APPROVE")).toBe("PENDING_HOD");
    expect(nextStatus("PENDING_HOD", "APPROVE")).toBe("APPROVED");
  });

  describe("leave request store", () => {
    it("persists valid requests and lists them for the counsellor", () => {
      const request = submitRequest(leaveInput);

      expect(listForCounsellor()).toEqual([request]);
      expect(window.localStorage.getItem("arunai-erp-leave-requests")).toContain(request.id);
    });

    it("rejects invalid dates and short leave reasons", () => {
      expect(() => submitRequest({ ...leaveInput, toDate: "2026-10-09" })).toThrow(
        "To date must be the same as or after the from date.",
      );
      expect(() => submitRequest({ ...leaveInput, reason: "Medical" })).toThrow(
        "Leave reason must be at least 10 characters.",
      );
    });

    it("requires a rejection reason and keeps counsellor rejections out of HOD", () => {
      const request = submitRequest(leaveInput);

      expect(() => counsellorReject(request.id, "Counsellor Demo", "Too short")).toThrow(
        "Rejection reason must be at least 10 characters.",
      );
      counsellorReject(request.id, "Counsellor Demo", "Please provide more details.");

      expect(listForHod()).toHaveLength(0);
      expect(getRequestsSnapshot()[0]?.status).toBe("REJECTED_BY_COUNSELLOR");
      expect(() => counsellorApprove(request.id, "Counsellor Demo")).toThrow(
        "Cannot update a request in REJECTED_BY_COUNSELLOR status.",
      );
    });

    it("routes counsellor approvals to HOD and records the final decision", () => {
      const request = submitRequest(leaveInput);
      const forwarded = counsellorApprove(request.id, "Counsellor Demo");

      expect(forwarded.status).toBe("PENDING_HOD");
      expect(listForCounsellor()).toHaveLength(0);
      expect(listForHod()).toHaveLength(1);
      expect(hodApprove(request.id, "HOD Demo").status).toBe("APPROVED");
      expect(listForHod()).toHaveLength(0);
    });

    it("requires an OD event and stores its supported official letter", () => {
      const request = submitRequest({
        studentRegNo: "510423243001",
        studentName: "Test Student",
        kind: "OD",
        category: "Sports",
        fromDate: "2026-10-10",
        toDate: "2026-10-11",
        eventName: "Demo sports meet",
        organizer: "Demo sports department",
        venue: "Demo campus",
        letter: {
          name: "demo-letter.pdf",
          type: "application/pdf",
          size: 12,
          dataUrl: "data:application/pdf;base64,ZmFrZQ==",
        },
      });

      expect(request.kind === "OD" && request.letter.name).toBe("demo-letter.pdf");
    });

    it("requires a valid HOD rejection reason", () => {
      const request = submitRequest(leaveInput);
      counsellorApprove(request.id, "Counsellor Demo");

      expect(() => hodReject(request.id, "HOD Demo", "Not clear")).toThrow(
        "Rejection reason must be at least 10 characters.",
      );
      expect(hodReject(request.id, "HOD Demo", "Please correct the dates.").status).toBe(
        "REJECTED_BY_HOD",
      );
    });
  });

  it("makes rejection terminal at either approval stage", () => {
    expect(nextStatus("PENDING_COUNSELLOR", "REJECT")).toBe("REJECTED");
    expect(nextStatus("PENDING_HOD", "REJECT")).toBe("REJECTED");
    expect(nextStatus("APPROVED", "REJECT")).toBe("APPROVED");
    expect(nextStatus("REJECTED", "APPROVE")).toBe("REJECTED");
  });
});
