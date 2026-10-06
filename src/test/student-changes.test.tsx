import { describe, expect, it } from "vitest";
import { mockApi } from "@/api/mock";
import { mockRegisteredSubjects } from "@/api/mock/data";

describe("Student Changes Verification", () => {
  it("registered subjects dataset contains the exact 6 subjects and 18 credits", async () => {
    const res = await mockApi.getRegisteredSubjects();
    expect(res.totalSubjects).toBe(6);
    expect(res.totalCredits).toBe(18);
    expect(res.subjects).toHaveLength(6);

    const codes = res.subjects.map((s) => s.code);
    expect(codes).toEqual([
      "A13021",
      "CME365",
      "GE3752",
      "GE3791",
      "OBT357",
      "SKILL",
    ]);

    const expectedTitles: Record<string, string> = {
      A13021: "IT in Agricultural System",
      CME365: "Renewable Energy Technologies",
      GE3752: "Total Quality Management",
      GE3791: "Human Values and Ethics",
      OBT357: "Biotechnology in Healthcare",
      SKILL: "Skill Development",
    };

    for (const sub of res.subjects) {
      expect(sub.title).toBe(expectedTitles[sub.code]);
      expect(sub.credits).toBe(3);
    }
  });

  it("timetable returns the complete weekly timetable Monday through Saturday", async () => {
    const tt = await mockApi.getTimetable();
    expect(tt.days).toBeDefined();
    expect(tt.days).toHaveLength(6);

    const dayNames = tt.days?.map((d) => d.dayName);
    expect(dayNames).toEqual([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ]);
  });
});
