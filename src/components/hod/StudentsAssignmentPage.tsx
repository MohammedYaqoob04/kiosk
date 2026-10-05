import { useState } from "react";
import { UsersRound } from "lucide-react";

import { PageBanner } from "@/components/erp/PageBanner";
import { api } from "@/api";
import { useApi } from "@/api/use-api";
import type { HodStudent } from "@/api/types";

export function StudentsAssignmentPage() {
  const [revision, setRevision] = useState(0);
  const [selectedCounsellor, setSelectedCounsellor] = useState("");
  const [message, setMessage] = useState("");
  const refresh = () => setRevision((value) => value + 1);

  const counsellorsQuery = useApi(["hodCounsellors"], () => api.getHodCounsellors());
  const studentsQuery = useApi(["hodStudents", revision], () => api.getHodStudents());

  const counsellorsList = counsellorsQuery.data ?? [];
  const studentsList = studentsQuery.data ?? [];
  const currentCounsellorId =
    selectedCounsellor || counsellorsList[0]?.staffId || counsellorsList[0]?.id || "";

  const onAssignSection = async (section: string) => {
    if (!currentCounsellorId) return;
    try {
      const res = await api.assignSection(currentCounsellorId, section);
      setMessage(`Section ${section} assigned (${res.updated} students).`);
      refresh();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Assignment failed.");
    }
  };

  const onAssignStudent = async (student: HodStudent) => {
    if (!currentCounsellorId) return;
    try {
      await api.assignStudents(currentCounsellorId, [student.registerNo]);
      setMessage(`${student.name} assigned.`);
      refresh();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Assignment failed.");
    }
  };

  const onUnassignStudent = async (student: HodStudent) => {
    try {
      await api.unassignStudent(student.registerNo);
      setMessage(`${student.name} unassigned.`);
      refresh();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unassignment failed.");
    }
  };

  return (
    <div className="staff-portal-page">
      <PageBanner
        title="Students & Assignment"
        subtitle="Manage counsellor student assignments"
        icon={UsersRound}
      />
      <section className="erp-surface flex flex-wrap items-end gap-3 p-4">
        <label className="grid min-w-64 flex-1 gap-2 text-sm font-semibold">
          Counsellor
          <select
            value={currentCounsellorId}
            onChange={(event) => setSelectedCounsellor(event.target.value)}
            className="min-h-14 rounded-lg border border-border bg-surface px-3"
          >
            {counsellorsList.map((counsellor) => {
              const cid = counsellor.staffId || counsellor.id;
              return (
                <option key={cid} value={cid}>
                  {counsellor.name}
                </option>
              );
            })}
          </select>
        </label>
        {(["A", "B"] as const).map((section) => (
          <button
            key={section}
            type="button"
            onClick={() => void onAssignSection(section)}
            className="min-h-14 rounded-lg border border-border px-4"
          >
            Assign Section {section}
          </button>
        ))}
        {message && (
          <p role="status" className="w-full text-sm text-muted-foreground">
            {message}
          </p>
        )}
      </section>
      <section className="erp-surface min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[800px] text-left">
          <thead className="sticky top-0 bg-surface-2">
            <tr>
              {["Reg No", "Name", "Section", "Attendance %", "Counsellor", "Assignment"].map(
                (heading) => (
                  <th key={heading} className="border-b border-border p-3">
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {studentsList.map((student) => {
              const assignedCounsellor = student.counsellor;
              return (
                <tr key={student.registerNo} className="border-b border-border">
                  <td className="p-3">{student.registerNo}</td>
                  <td className="p-3">{student.name}</td>
                  <td className="p-3">{student.section}</td>
                  <td className="p-3">{student.attendancePercentage}%</td>
                  <td className="p-3">
                    {assignedCounsellor ? assignedCounsellor.name : "Unassigned"}
                  </td>
                  <td className="p-2">
                    {assignedCounsellor ? (
                      <button
                        type="button"
                        onClick={() => void onUnassignStudent(student)}
                        className="min-h-14 rounded-lg border border-border px-3"
                      >
                        Unassign
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void onAssignStudent(student)}
                        className="min-h-14 rounded-lg border border-border px-3"
                      >
                        Assign
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
