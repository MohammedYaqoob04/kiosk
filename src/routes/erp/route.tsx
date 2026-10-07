import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, GraduationCap, Grid2X2, LogOut, UserRound, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/api";
import { useApi } from "@/api/use-api";

export const Route = createFileRoute("/erp")({
  component: ErpRoute,
});

const studentNavigation = [
  { label: "Dashboard", to: "/erp/dashboard" },
  { label: "Timetable", to: "/erp/timetable" },
  { label: "Registered Subjects", to: "/erp/subjects" },
  { label: "Leave & OD", to: "/erp/leave" },
  { label: "Notices", to: "/erp/notices" },
  { label: "Assignment Front Page", to: "/erp/assignment" },
  { label: "Fees", to: "/erp/fees" },
  { label: "Results", to: "/erp/results" },
  { label: "Profile", to: "/erp/profile" },
  { label: "Change Password", to: "/erp/password" },
] as const;

const studentOnlyPaths = new Set([
  "/erp/dashboard",
  "/erp/timetable",
  "/erp/subjects",
  "/erp/assignment",
  "/erp/book-verification-form",
  "/erp/results",
  "/erp/fees",
  "/erp/leave",
  "/erp/profile",
  "/erp/notices",
]);

const staffOnlyPaths = new Set(["/erp/leave-requests"]);
const counsellorOnlyPaths = new Set([
  "/erp/staff",
  "/erp/staff/students",
  "/erp/staff/marks",
  "/erp/staff/attendance",
  "/erp/staff/timetable",
  "/erp/staff/timetable-upload",
  "/erp/staff/leave",
  "/erp/staff/announcements",
  "/erp/staff/password",
  "/erp/staff/history",
]);
function ErpRoute() {
  return <ErpLayout />;
}

function ErpLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === "/erp/login";
  const isStaffRoute =
    location.pathname === "/erp/staff" ||
    location.pathname.startsWith("/erp/staff/") ||
    staffOnlyPaths.has(location.pathname);
  const isStudentOnlyRoute = studentOnlyPaths.has(location.pathname);

  const unreadCountQuery = useApi(
    ["notices", "unread-count"],
    api.getUnreadNoticeCount,
    { enabled: user?.role === "STUDENT" },
  );


  useEffect(() => {
    if (isLogin) return;
    if (!user) {
      return;
    }
    if (user.mustChangePassword && location.pathname !== "/erp/password") {
      void navigate({ to: "/erp/password", replace: true });
      return;
    }
    if (isStaffRoute && user.role === "STUDENT") {
      void navigate({ to: "/erp/dashboard", replace: true });
      return;
    }
    if (location.pathname === "/erp/hod" && user.role === "COUNSELLOR") {
      void navigate({ to: "/erp/staff", replace: true });
      return;
    }
    if (counsellorOnlyPaths.has(location.pathname) && user.role === "HOD") {
      void navigate({ to: "/erp/hod", replace: true });
      return;
    }
    if (isStudentOnlyRoute && user.role !== "STUDENT") {
      void navigate({ to: "/erp/staff", replace: true });
      return;
    }
  }, [isLogin, isStaffRoute, isStudentOnlyRoute, location.pathname, navigate, user]);

  if (isLogin) return <Outlet />;
  if (location.pathname === "/erp") return <PortalChooser />;
  if (!user) {
    return (
      <div className="grid min-h-[60svh] place-items-center px-5 text-lg text-muted-foreground">
        Opening secure portal…
      </div>
    );
  }

  function PortalChooser() {
    const portals = [
      {
        role: "student",
        label: "Student",
        description: "Attendance, marks and more",
        icon: UserRound,
      },
      {
        role: "staff",
        label: "Staff",
        description: "Student requests and tools",
        icon: UsersRound,
      },
      {
        role: "hod",
        label: "HOD",
        description: "Department approvals",
        icon: GraduationCap,
      },
    ] as const;

    return (
      <section className="portal-chooser-page">
        <Link
          to="/"
          replace
          className="mb-5 inline-flex min-h-14 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-base font-semibold text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={1.5} />
          Back
        </Link>
        <h1 className="font-display text-3xl font-semibold text-foreground">ERP Login</h1>
        {user && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-lg font-medium text-foreground">Signed in as {user.name}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                to={user.role === "STUDENT" ? "/erp/dashboard" : "/erp/staff"}
                className="inline-flex min-h-14 items-center justify-center rounded-xl bg-primary px-5 text-lg font-semibold text-primary-foreground"
              >
                Open dashboard
              </Link>
              <Button
                type="button"
                variant="outline"
                onClick={logout}
                className="min-h-14 px-5 text-lg"
              >
                Logout
              </Button>
            </div>
          </div>
        )}
        <div className="portal-chooser-grid">
          {portals.map(({ role, label, description, icon: Icon }) => (
            <Link key={role} to="/erp/login" search={{ role }} className="portal-chooser-card">
              <Icon aria-hidden="true" className="size-12" strokeWidth={1.5} />
              <span className="mt-3 font-display text-[22px] font-semibold">{label}</span>
              <span className="mt-2 text-center text-sm text-muted-foreground">{description}</span>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  if (
    (isStaffRoute && user.role === "STUDENT") ||
    (isStudentOnlyRoute && user.role !== "STUDENT")
  ) {
    return (
      <div className="grid min-h-[60svh] place-items-center px-5 text-lg text-muted-foreground">
        Opening your dashboard…
      </div>
    );
  }

  const navigation =
    user.role === "STUDENT"
      ? studentNavigation
      : user.role === "COUNSELLOR"
        ? ([
            { label: "Dashboard", to: "/erp/staff" },
            { label: "Student Details", to: "/erp/staff/students" },
            { label: "Marks Showcase", to: "/erp/staff/marks" },
            { label: "Attendance", to: "/erp/staff/attendance" },
            { label: "Timetable", to: "/erp/staff/timetable" },
            { label: "Timetable Upload", to: "/erp/staff/timetable-upload" },
            { label: "Leave & Approvals", to: "/erp/staff/leave" },
            { label: "Announcements", to: "/erp/staff/announcements" },
            { label: "Change Password", to: "/erp/staff/password" },
          ] as const)
        : ([
            { label: "Dashboard", to: "/erp/hod" },
            { label: "Approvals", to: "/erp/hod/approvals" },
            { label: "Students & Assignment", to: "/erp/hod/students" },
            { label: "Upload Students", to: "/erp/hod/students/upload" },
            { label: "Notices", to: "/erp/hod/notices" },
            { label: "Reports", to: "/erp/hod/reports" },
            { label: "Activity Log", to: "/erp/hod/activity" },
          ] as const);
  return (
    <div className="erp-app-shell">
      <div className="erp-brand-heading">
        <div>
          <p className="font-semibold text-foreground">Arunai Engineering College (Autonomous)</p>
          <p className="text-sm text-muted-foreground">Velunagar - Tiruvannamalai - 606603</p>
        </div>
        <p className="text-lg font-semibold text-foreground">Arunai ERP</p>
      </div>
      <header className="erp-topbar">
        {!user.mustChangePassword && (
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-haspopup="dialog"
            className="erp-menu-trigger"
          >
            <Grid2X2 aria-hidden="true" className="size-5" strokeWidth={1.5} />
            <span>Menu</span>
          </button>
        )}
        <div className="erp-user-actions">
          {!user.mustChangePassword && user.role !== "STUDENT" && (
            <>
              <span className="erp-user-name" title={user.name}>
                {user.name}
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={logout}
                className="min-h-14 gap-2 px-4 text-base"
              >
                <LogOut aria-hidden="true" className="size-4" strokeWidth={1.5} />
                Logout
              </Button>
            </>
          )}
        </div>
      </header>
      <main className="erp-route-content">
        <Outlet />
      </main>
      <footer className="erp-brand-footer">
        <span>© 2026 Arunai Engineering College (Autonomous)</span>
        <span>ERP Student Module</span>
      </footer>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="left"
          className="h-full w-[min(88vw,24rem)] overflow-y-auto border-r border-border bg-surface p-5"
        >
          <SheetTitle className="mb-5 pr-14 text-xl text-foreground">Arunai ERP Menu</SheetTitle>
          <nav aria-label="ERP sections" className="grid gap-2">
            {navigation.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                activeProps={{ className: "is-active" }}
                className="erp-menu-item"
              >
                <span>{label}</span>
                {user.role === "STUDENT" && label === "Notices" && (
                  <span className="ml-auto rounded-full border border-border px-3 py-1 text-sm">
                    {unreadCountQuery.data?.unread ?? 0}
                  </span>
                )}
              </Link>
            ))}
            <button type="button" onClick={logout} className="erp-menu-item text-left">
              Logout
            </button>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
