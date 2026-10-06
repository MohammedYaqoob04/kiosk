import { useMemo, useState } from "react";
import { Award, BookOpen, ChevronDown, ChevronRight, FileSpreadsheet, Search, User } from "lucide-react";

import { PageBanner } from "@/components/erp/PageBanner";
import { TouchTextInput } from "@/components/TouchTextInput";
import { useStaffClass, StaffClassSelector } from "@/lib/staff-class-context";
import { getClassStudentsMarks, type StudentMarksRecord } from "@/lib/marks-store";

export function MarksShowcasePage() {
  const { activeClass } = useStaffClass();
  const [search, setSearch] = useState("");
  const [expandedRegNo, setExpandedRegNo] = useState<string | null>(null);

  // Retrieve marks data for the active class
  const classMarks = useMemo(() => {
    return getClassStudentsMarks(activeClass);
  }, [activeClass]);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredMarks = useMemo(() => {
    return classMarks.filter(
      (record) =>
        !normalizedSearch ||
        record.name.toLowerCase().includes(normalizedSearch) ||
        record.registerNo.includes(normalizedSearch),
    );
  }, [classMarks, normalizedSearch]);

  // Set default expanded student if none selected
  const activeStudent = useMemo(() => {
    if (expandedRegNo) {
      return filteredMarks.find((s) => s.registerNo === expandedRegNo) ?? filteredMarks[0] ?? null;
    }
    return filteredMarks[0] ?? null;
  }, [filteredMarks, expandedRegNo]);

  return (
    <div className="staff-portal-page flex flex-col gap-4 p-4">
      {/* Banner */}
      <PageBanner
        title={`Marks Showcase · Class ${activeClass}`}
        subtitle="View-only assessment records (Assignments, CIA, Model Exam)"
        icon={Award}
        chip={
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground">
            {classMarks.length} Students in {activeClass}
          </span>
        }
      />

      {/* Class Context Selector & Read-Only Notice */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3">
        <StaffClassSelector />
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            Read-Only Showcase
          </span>
          <span className="text-xs text-muted-foreground">
            (Counsellor view mode: Marks cannot be modified)
          </span>
        </div>
      </section>

      {/* Search Bar */}
      <section className="max-w-md">
        <TouchTextInput
          label="Search student by name or register number"
          value={search}
          onChange={setSearch}
          placeholder="Tap to search students..."
          maxLength={40}
        />
      </section>

      {/* Main Showcase Layout: Student Selector Tabs + Subject Assessment Cards */}
      {filteredMarks.length === 0 ? (
        <div className="grid min-h-48 place-items-center rounded-xl border border-border bg-surface p-8 text-center text-muted-foreground">
          <p className="text-base font-semibold text-foreground">No students found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No students matching your search in Class {activeClass}.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Left: Student Selection List */}
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3 max-h-[600px] overflow-y-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
              Select Student ({filteredMarks.length})
            </span>
            {filteredMarks.map((student) => {
              const isSelected = activeStudent?.registerNo === student.registerNo;
              return (
                <button
                  key={student.registerNo}
                  type="button"
                  onClick={() => setExpandedRegNo(student.registerNo)}
                  className={`flex min-h-14 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? "border-accent bg-accent/5 text-foreground font-semibold shadow-xs"
                      : "border-border bg-surface hover:bg-surface-2 text-foreground"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{student.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{student.registerNo}</p>
                  </div>
                  <ChevronRight
                    className={`size-4 shrink-0 transition-transform ${
                      isSelected ? "text-accent translate-x-0.5" : "text-muted-foreground"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Right: Selected Student's Subject-by-Subject Assessment Breakdown */}
          {activeStudent && (
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[700px]">
              {/* Student Header Card */}
              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{activeStudent.name}</h2>
                    <p className="font-mono text-xs text-muted-foreground">
                      Register No: {activeStudent.registerNo} · Class: {activeClass}
                    </p>
                  </div>
                  <span className="rounded-md border border-border bg-surface-2 px-3 py-1 text-xs font-bold text-accent">
                    {activeStudent.subjects.length} Registered Subjects
                  </span>
                </div>
              </div>

              {/* Subject Breakdown Cards */}
              <div className="grid gap-4">
                {activeStudent.subjects.map((subject) => (
                  <div
                    key={subject.code}
                    className="rounded-xl border border-border bg-surface p-4 shadow-xs"
                  >
                    {/* Subject Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="size-4 text-accent" strokeWidth={1.5} />
                        <h3 className="text-base font-bold text-foreground">
                          {subject.code} - {subject.name}
                        </h3>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {subject.credits} Credits · Internal: {subject.totalInternal}/{subject.maxInternal}
                      </span>
                    </div>

                    {/* Assessment Structure: ASSIGNMENTS / CIA / MODEL EXAM */}
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {/* ASSIGNMENTS BOX */}
                      <div className="rounded-lg border border-border bg-surface-2 p-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                          ASSIGNMENTS
                        </span>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">Assignment 1 (Max 20)</span>
                            <span className="font-mono font-bold text-foreground">
                              {subject.assignments.asmt1.obtainedMarks ?? "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-t border-border/60 pt-1.5">
                            <span className="font-medium text-foreground">Assignment 2 (Max 20)</span>
                            <span className="font-mono font-bold text-foreground">
                              {subject.assignments.asmt2.obtainedMarks ?? "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-t border-border/60 pt-1.5">
                            <span className="font-medium text-foreground">Assignment 3 (Max 40)</span>
                            <span className="font-mono font-bold text-foreground">
                              {subject.assignments.asmt3.obtainedMarks ?? "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* CIA BOX */}
                      <div className="rounded-lg border border-border bg-surface-2 p-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                          CIA (Continuous Internal)
                        </span>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">CIA 1 (Max 60)</span>
                            <span className="font-mono font-bold text-foreground">
                              {subject.cia.cia1.obtainedMarks ?? "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-t border-border/60 pt-1.5">
                            <span className="font-medium text-foreground">CIA 2 (Max 60)</span>
                            <span className="font-mono font-bold text-foreground">
                              {subject.cia.cia2.obtainedMarks ?? "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-t border-border/60 pt-1.5 text-muted-foreground">
                            <span>Status</span>
                            <span className="font-semibold text-ok">Evaluated</span>
                          </div>
                        </div>
                      </div>

                      {/* MODEL EXAM BOX */}
                      <div className="rounded-lg border border-border bg-surface-2 p-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                          MODEL EXAM
                        </span>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">Model Exam (Max 100)</span>
                            <span className="font-mono font-bold text-accent text-sm">
                              {subject.modelExam.obtainedMarks ?? "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-t border-border/60 pt-1.5">
                            <span className="text-muted-foreground">Scaled Internal Equivalent</span>
                            <span className="font-mono font-bold text-foreground">
                              {subject.totalInternal}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
