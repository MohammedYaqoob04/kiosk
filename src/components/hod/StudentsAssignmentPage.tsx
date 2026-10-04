import { useState } from "react";
import { UsersRound } from "lucide-react";

import { PageBanner } from "@/components/erp/PageBanner";
import { assignSection, assignStudents, counsellorOf, counsellors, listAllStudents, unassign } from "@/lib/staffData";

export function StudentsAssignmentPage() {
  const [revision, setRevision] = useState(0);
  const [selectedCounsellor, setSelectedCounsellor] = useState(counsellors[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const refresh = () => setRevision((value) => value + 1);
  void revision;
  const students = listAllStudents();

  return (
    <div className="staff-portal-page">
      <PageBanner title="Students & Assignment" subtitle="Manage counsellor student assignments" icon={UsersRound} />
      <section className="erp-surface flex flex-wrap items-end gap-3 p-4">
        <label className="grid min-w-64 flex-1 gap-2 text-sm font-semibold">
          Counsellor
          <select
            value={selectedCounsellor}
            onChange={(event) => setSelectedCounsellor(event.target.value)}
            className="min-h-14 rounded-lg border border-border bg-surface px-3"
          >
            {counsellors.map((counsellor) => (
              <option key={counsellor.id} value={counsellor.id}>{counsellor.name}</option>
            ))}
          </select>
        </label>
        {(["A", "B"] as const).map((section) => (
          <button
            key={section}
            type="button"
            onClick={() => {
              try {
                assignSection(selectedCounsellor, section);
                setMessage(`Section ${section} assigned.`);
                refresh();
              } catch (cause) {
                setMessage(cause instanceof Error ? cause.message : "Assignment failed.");
              }
            }}
            className="min-h-14 rounded-lg border border-border px-4"
          >
            Assign Section {section}
          </button>
        ))}
        {message && <p role="status" className="w-full text-sm text-muted-foreground">{message}</p>}
      </section>
      <section className="erp-surface min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[800px] text-left">
          <thead className="sticky top-0 bg-surface-2">
            <tr>
              {["Reg No", "Name", "Section", "Attendance %", "Counsellor", "Assignment"].map((heading) => (
                <th key={heading} className="border-b border-border p-3">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const assignedTo = counsellorOf(student.regNo);
              return (
                <tr key={student.regNo} className="border-b border-border">
                  <td className="p-3">{student.regNo}</td>
                  <td className="p-3">{student.name}</td>
                  <td className="p-3">{student.section}</td>
                  <td className="p-3">{student.attendancePercentage}%</td>
                  <td className="p-3">{counsellors.find((item) => item.id === assignedTo)?.name ?? "Unassigned"}</td>
                  <td className="p-2">
                    {assignedTo ? (
                      <button
                        type="button"
                        onClick={() => {
                          unassign(student.regNo);
                          setMessage(`${student.name} unassigned.`);
                          refresh();
                        }}
                        className="min-h-14 rounded-lg border border-border px-3"
                      >
                        Unassign
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            assignStudents(selectedCounsellor, [student.regNo]);
                            setMessage(`${student.name} assigned.`);
                            refresh();
                          } catch (cause) {
                            setMessage(cause instanceof Error ? cause.message : "Assignment failed.");
                          }
                        }}
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
