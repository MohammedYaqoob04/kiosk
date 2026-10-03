import { useEffect } from "react";
import { useState } from "react";
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Home, LogOut, Menu, X } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { AuthProvider } from "@/lib/auth";

export const Route = createFileRoute("/erp")({
  component: ErpRoute,
});

const studentNavigation = [
  { label: "Dashboard", to: "/erp/dashboard" },
  { label: "Today Timetable", to: "/erp/timetable" },
  { label: "Assignment", to: "/erp/assignment" },
  { label: "Book Verification Form", to: "/erp/book-verification-form" },
  { label: "University Result", to: "/erp/results" },
  { label: "Fee Details", to: "/erp/fees" },
  { label: "Change Password", to: "/erp/password" },
  { label: "Leave / OD", to: "/erp/leave" },
  { label: "Profile", to: "/erp/profile" },
] as const;

const staffTabs = [
  { label: "Dashboard", to: "/erp/staff" },
  { label: "Leave Requests", to: "/erp/staff/leave" },
] as const;

const studentOnlyPaths = new Set([
  "/erp/dashboard",
  "/erp/timetable",
  "/erp/assignment",
  "/erp/book-verification-form",
  "/erp/results",
  "/erp/fees",
  "/erp/leave",
  "/erp/password",
  "/erp/profile",
]);

const staffOnlyPaths = new Set(["/erp/leave-requests"]);

function ErpRoute() {
  return (
    <AuthProvider>
      <ErpLayout />
    </AuthProvider>
  );
}

function ErpLayout() {
  const { user, logout, warningOpen, staySignedIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [studentMenuOpen, setStudentMenuOpen] = useState(false);
  const isLogin = location.pathname === "/erp/login";
  const isStaff = user?.role !== "STUDENT";
  const isStaffRoute =
    location.pathname === "/erp/staff" ||
    location.pathname.startsWith("/erp/staff/") ||
    staffOnlyPaths.has(location.pathname);
  const isStudentOnlyRoute = studentOnlyPaths.has(location.pathname);

  useEffect(() => {
    if (isLogin) return;
    if (!user) {
      void navigate({ to: "/erp/login", search: { role: "student" }, replace: true });
      return;
    }
    if (isStaffRoute && user.role === "STUDENT") {
      void navigate({ to: "/erp/dashboard", replace: true });
      return;
    }
    if (isStudentOnlyRoute && user.role !== "STUDENT") {
      void navigate({ to: "/erp/staff", replace: true });
      return;
    }
    if (location.pathname === "/erp") {
      void navigate({ to: isStaff ? "/erp/staff" : "/erp/dashboard", replace: true });
    }
  }, [isLogin, isStaff, isStaffRoute, isStudentOnlyRoute, location.pathname, navigate, user]);

  if (isLogin) return <Outlet />;
  if (!user) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-5 text-lg text-muted-foreground">
        Opening secure demo portal…
      </div>
    );
  }

  if (
    (isStaffRoute && user.role === "STUDENT") ||
    (isStudentOnlyRoute && user.role !== "STUDENT")
  ) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-5 text-lg text-muted-foreground">
        Opening your dashboard…
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="erp-student-app min-h-dvh bg-background text-foreground">
        <header className="flex min-h-20 items-center gap-4 border-b border-border bg-card px-4 py-3 shadow-sm sm:px-8">
          <Button
            type="button"
            variant="outline"
            aria-label={
              studentMenuOpen ? "Close dashboard navigation" : "Open dashboard navigation"
            }

            aria-expanded={studentMenuOpen}
            onClick={() => setStudentMenuOpen((open) => !open)}
            className="min-h-14 min-w-14 shrink-0 p-3 lg:hidden"
          >
            {studentMenuOpen ? (
              <X aria-hidden="true" className="size-6" />
            ) : (
              <Menu aria-hidden="true" className="size-6" />
            )}
          </Button>
          <h1 className="min-w-0 flex-1 font-display text-lg font-bold leading-tight text-foreground sm:text-2xl">
            Arunai Engineering College (Autonomous) – Arunai ERP
          </h1>
          <Link
            to="/"
            reloadDocument
            className="hidden min-h-14 shrink-0 items-center gap-2 rounded-xl border border-border bg-secondary px-4 text-lg font-semibold text-foreground active:bg-accent sm:inline-flex"
          >
            <Home aria-hidden="true" className="size-5" />
            Home
          </Link>
        </header>
        <section
          aria-label="Signed-in student"
          className="border-b border-border bg-secondary/70 px-4 py-3 sm:px-8"
        >
          <div className="mx-auto flex w-full max-w-screen-2xl flex-wrap items-center gap-x-6 gap-y-3">
            <div className="min-w-0 flex-1">
              <p className="text-base font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Signed in as
              </p>
              <p className="truncate text-lg font-semibold text-foreground">{user.name}</p>
            </div>
            <div>
              <p className="text-base text-muted-foreground">Register number</p>
              <p className="text-lg font-semibold text-foreground">{user.identifier}</p>
            </div>
            <div className="hidden md:block">
              <p className="text-base text-muted-foreground">Department · Batch</p>
              <p className="text-lg font-semibold text-foreground">
                {user.department} · {user.year}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={logout}
              className="min-h-14 shrink-0 gap-2 px-4 text-lg"
            >
              <LogOut aria-hidden="true" className="size-5" />
              Logout
            </Button>
          </div>
        </section>
        <div className="relative mx-auto flex w-full max-w-screen-2xl items-start lg:gap-6 lg:px-6">
          {studentMenuOpen && (
            <button
              type="button"
              aria-label="Close dashboard navigation"
              onClick={() => setStudentMenuOpen(false)}
              className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
            />
          )}
          <aside
            aria-label="Student dashboard navigation"
            className={`z-40 w-80 max-w-[88vw] shrink-0 border-r border-border bg-card p-4 shadow-card lg:sticky lg:top-6 lg:mt-6 lg:block lg:rounded-2xl lg:border lg:shadow-sm ${
              studentMenuOpen
                ? "fixed inset-y-0 left-0 block overflow-y-auto"
                : "fixed inset-y-0 left-0 hidden lg:static lg:block"
            }`}
          >
            <div className="mb-5 flex items-center justify-between border-b border-border px-2 pb-4 lg:hidden">
              <span className="font-display text-lg font-semibold text-foreground">
                Student navigation
              </span>
              <Button
                type="button"
                variant="ghost"
                aria-label="Close dashboard navigation"
                onClick={() => setStudentMenuOpen(false)}
                className="min-h-14 min-w-14 p-3"
              >
                <X aria-hidden="true" className="size-6" />
              </Button>
            </div>
            <nav className="grid gap-2">
              {studentNavigation.map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setStudentMenuOpen(false)}
                  activeProps={{ className: "border-primary bg-primary/10 text-primary" }}
                  className="flex min-h-14 items-center rounded-xl border border-transparent px-4 text-lg font-medium text-muted-foreground active:bg-secondary"
                >
                  {label}
                </Link>
              ))}
              <Link
                to="/"
                reloadDocument
                onClick={() => setStudentMenuOpen(false)}
                className="flex min-h-14 items-center gap-3 rounded-xl border border-transparent px-4 text-lg font-medium text-muted-foreground active:bg-secondary"
              >
                <ArrowLeft aria-hidden="true" className="size-5" />
                Back to Home
              </Link>
              <button
                type="button"
                onClick={logout}
                className="flex min-h-14 items-center gap-3 rounded-xl border border-transparent px-4 text-left text-lg font-medium text-muted-foreground active:bg-secondary"
              >
                <LogOut aria-hidden="true" className="size-5" />
                Logout
              </button>
            </nav>
          </aside>
          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
        <AlertDialog open={warningOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">Still there?</AlertDialogTitle>
              <AlertDialogDescription className="text-lg">
                Your demo session will end in 10 seconds due to inactivity.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  staySignedIn();
                }}
                className="min-h-14 text-lg"
              >
                Stay signed in
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <>
      <section className="mx-auto w-full max-w-screen-2xl px-4 pt-5 sm:px-8 sm:pt-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-8">
            <div>
              <p className="text-lg text-muted-foreground">
                {isStaff ? "Staff member" : "Student"}
              </p>
              <p className="text-lg font-semibold text-foreground">{user.name}</p>
            </div>
            <div>
              <p className="text-lg text-muted-foreground">
                {isStaff ? "Staff ID" : "Register number"}
              </p>
              <p className="text-lg font-semibold text-foreground">{user.identifier}</p>
            </div>
            <div>
              <p className="text-lg text-muted-foreground">Department</p>
              <p className="text-lg font-semibold text-foreground">{user.department}</p>
            </div>
            <div>
              <p className="text-lg text-muted-foreground">Year</p>
              <p className="text-lg font-semibold text-foreground">{user.year}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={logout}
            className="min-h-14 shrink-0 gap-2 px-5 text-lg"
          >
            <LogOut aria-hidden="true" className="size-5" />
            Log out
          </Button>
        </div>
        <nav
          aria-label="ERP sections"
          className="mt-4 flex min-h-14 gap-2 overflow-x-auto border-b border-border"
        >
          {staffTabs.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              activeProps={{ className: "border-primary text-foreground" }}
              className="flex min-h-14 shrink-0 items-center border-b-2 border-transparent px-4 text-lg font-medium text-muted-foreground active:bg-secondary"
            >
              {label}
            </Link>
          ))}
        </nav>
      </section>
      <Outlet />
      <AlertDialog open={warningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Still there?</AlertDialogTitle>
            <AlertDialogDescription className="text-lg">
              Your demo session will end in 10 seconds due to inactivity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                staySignedIn();
              }}
              className="min-h-14 text-lg"
            >
              Stay signed in
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
