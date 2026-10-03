import { useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { demoSemesterResults } from "@/mock/erp";

export function SemesterResults({ eyebrow = "Student ERP · Sample data" }: { eyebrow?: string }) {
  const [selectedSemester, setSelectedSemester] = useState(demoSemesterResults[0]?.semester ?? 1);
  const result = demoSemesterResults.find((semester) => semester.semester === selectedSemester);

  return (
    <>
      <PageHeader title="Results" eyebrow={eyebrow} description="Semester results · Sample data" />
      <section aria-label="Select semester" className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {demoSemesterResults.map(({ semester }) => (
            <button
              key={semester}
              type="button"
              onClick={() => setSelectedSemester(semester)}
              aria-pressed={selectedSemester === semester}
              className={`min-h-14 shrink-0 rounded-xl border px-5 text-lg font-semibold ${
                selectedSemester === semester
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground active:bg-secondary"
              }`}
            >
              Semester {semester}
            </button>
          ))}
        </div>
      </section>
      {result && (
        <>
          <section
            aria-label={`Semester ${result.semester} GPA`}
            className="mb-6 flex min-h-32 items-center justify-between gap-4 rounded-2xl border border-border bg-card p-6 sm:p-8"
          >
            <div>
              <p className="text-lg text-muted-foreground">Semester {result.semester}</p>
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Grade point average
              </h2>
              <p className="mt-1 text-lg text-muted-foreground">Sample result</p>
            </div>
            <p className="font-display text-4xl font-bold text-primary">{result.gpa.toFixed(1)}</p>
          </section>
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            <h2 className="mb-4 font-display text-2xl font-semibold text-foreground">
              Marks · Semester {result.semester}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border text-lg text-muted-foreground">
                    <th scope="col" className="py-3 pr-4 font-medium">
                      Subject
                    </th>
                    <th scope="col" className="py-3 pr-4 font-medium">
                      Course code
                    </th>
                    <th scope="col" className="py-3 font-medium">
                      Internal marks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.marks.map((mark) => (
                    <tr key={mark.code} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4 text-lg text-foreground">{mark.subject}</td>
                      <td className="py-3 pr-4 text-lg text-muted-foreground">{mark.code}</td>
                      <td className="py-3 text-lg font-semibold text-foreground">
                        {mark.internal} / {mark.internalMaximum}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
