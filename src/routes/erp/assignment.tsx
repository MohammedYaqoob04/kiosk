import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { KeypadInput } from "@/components/KeypadInput";
import { TouchTextInput } from "@/components/TouchTextInput";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/erp/assignment")({
  component: AssignmentFrontPage,
  head: () => ({ meta: [{ title: "Assignment front page | Student ERP" }] }),
});

function AssignmentFrontPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [studentName, setStudentName] = useState(user?.name ?? "");
  const [registerNumber, setRegisterNumber] = useState(user?.identifier ?? "");
  const [department, setDepartment] = useState(user?.department ?? "");
  const [submittedTo, setSubmittedTo] = useState("");

  const fields = [
    { id: "assignment-title", label: "Assignment title", value: title, setValue: setTitle },
    { id: "assignment-subject", label: "Subject", value: subject, setValue: setSubject },
    { id: "assignment-code", label: "Course code", value: courseCode, setValue: setCourseCode },
    { id: "student-name", label: "Student name", value: studentName, setValue: setStudentName },
    {
      id: "register-number",
      label: "Register number",
      value: registerNumber,
      setValue: setRegisterNumber,
    },
    { id: "department", label: "Department", value: department, setValue: setDepartment },
    { id: "submitted-to", label: "Submitted to", value: submittedTo, setValue: setSubmittedTo },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="assignment-page-heading">
        <PageHeader
          title="Assignment cover page generator"
          description="Create and print an assignment front page. This does not submit your assignment."
        />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="assignment-form rounded-2xl border border-border bg-card p-5 sm:p-7">
          <h2 className="mb-4 font-display text-2xl font-semibold text-foreground">
            Front page details
          </h2>
          <div className="grid gap-4">
            {fields.map(({ id, label, value, setValue }) => (
              <div key={id} className="grid gap-2 text-lg font-medium text-foreground">
                {id === "register-number" ? (
                  <KeypadInput
                    label={label}
                    value={value}
                    onChange={setValue}
                    maxLength={16}
                    placeholder="Use the on-screen keypad"
                  />
                ) : (
                  <TouchTextInput
                    label={label}
                    value={value}
                    onChange={setValue}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    maxLength={100}
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="assignment-preview-wrap">
          <div className="assignment-toolbar mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold text-foreground">A4 preview</h2>
            <Button
              type="button"
              onClick={() => window.print()}
              className="min-h-14 px-5 text-lg font-semibold"
            >
              Print / Save PDF
            </Button>
          </div>
          <article className="assignment-print-page mx-auto flex min-h-[720px] w-full max-w-[560px] flex-col items-center border border-border bg-card p-8 text-center shadow-card sm:p-12">
            <p className="mt-6 text-lg font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Arunai Engineering College (Autonomous)
            </p>
            <p className="mt-2 text-lg text-muted-foreground">Department of</p>
            <p className="mt-1 min-h-8 text-xl font-semibold text-foreground">
              {department || "Department name"}
            </p>
            <div className="my-12 w-full border-y border-border py-10">
              <p className="text-lg font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Assignment
              </p>
              <h3 className="mt-4 min-h-16 font-display text-2xl font-bold text-foreground">
                {title || "Assignment title"}
              </h3>
              <p className="mt-4 text-lg text-muted-foreground">
                {subject || "Subject"} {courseCode && `· ${courseCode}`}
              </p>
            </div>
            <div className="mt-auto w-full space-y-4 text-left">
              <p className="text-lg text-foreground">
                <span className="font-semibold">Submitted by:</span> {studentName || "Student name"}
              </p>
              <p className="text-lg text-foreground">
                <span className="font-semibold">Register number:</span>{" "}
                {registerNumber || "Register number"}
              </p>
              <p className="text-lg text-foreground">
                <span className="font-semibold">Submitted to:</span> {submittedTo || "Faculty name"}
              </p>
            </div>
            <p className="mt-12 text-base text-muted-foreground">Sample cover sheet</p>
          </article>
        </section>
      </div>
    </div>
  );
}
