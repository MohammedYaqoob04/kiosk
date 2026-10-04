import { useEffect } from "react";
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { GraduationCap, LogOut, UserRound, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/erp")({
  component: ErpRoute,
});

const studentNavigation = [
  { label: "Dashboard", to: "/erp/dashboard" },
  { label: "Timetable", to: "/erp/timetable" },
  { label: "Assignment", to: "/erp/assignment" },
  { label: "Results", to: "/erp/results" },
  { label: "Fees", to: "/erp/fees" },
  { label: "Leave", to: "/erp/leave" },
  { label: "Profile", to: "/erp/profile" },
] as const;

const studentOnlyPaths = new Set([
  "/erp/dashboard",
  "/erp/timetable",
  "/erp/assignment",
  "/erp/book-verification-form",
  "/erp/results",
  "/erp/fees",
  "/erp/leave",
  "/erp/profile",
]);

const staffOnlyPaths = new Set(["/erp/leave-requests"]);

function ErpRoute() {
  return <ErpLayout />;
}

function ErpLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === "/erp/login";
  const isStaffRoute =
    location.pathname === "/erp/staff" ||
    location.pathname.startsWith("/erp/staff/") ||
    staffOnlyPaths.has(location.pathname);
  const isStudentOnlyRoute = studentOnlyPaths.has(location.pathname);

  useEffect(() => {
    if (isLogin) return;
    if (!user) {
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
  }, [isLogin, isStaffRoute, isStudentOnlyRoute, location.pathname, navigate, user]);

  if (isLogin) return <Outlet />;
  if (location.pathname === "/erp") return <PortalChooser />;
  if (!user) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-5 text-lg text-muted-foreground">
        Opening secure demo portal…
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
        color: "portal-student",
      },
      {
        role: "staff",
        label: "Staff",
        description: "Student requests and tools",
        icon: UsersRound,
        color: "portal-staff",
      },
      {
        role: "hod",
        label: "HOD",
        description: "Department approvals",
        icon: GraduationCap,
        color: "portal-hod",
      },
    ] as const;

    return (
      <section className="portal-chooser-page">
        <h1 className="font-display text-3xl font-semibold text-foreground">Choose your portal</h1>
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
          {portals.map(({ role, label, description, icon: Icon, color }) => (
            <Link
              key={role}
              to="/erp/login"
              search={{ role }}
              className={`portal-chooser-card ${color}`}
            >
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
      <div className="grid min-h-[60vh] place-items-center px-5 text-lg text-muted-foreground">
        Opening your dashboard…
      </div>
    );
  }

  const navigation =
    user.role === "STUDENT"
      ? studentNavigation
      : user.role === "COUNSELLOR"
        ? ([
            { label: "Approvals", to: "/erp/staff" },
            { label: "My Students", to: "/erp/staff/students" },
            { label: "History", to: "/erp/staff/history" },
          ] as const)
        : ([
            { label: "Dashboard", to: "/erp/hod" },
            { label: "Leave", to: "/erp/staff/leave" },
          ] as const);

  return (
    <div className="erp-app-shell">
      <header className="erp-topbar">
        <nav aria-label="ERP sections" className="erp-tabbar">
          {!user.mustChangePassword &&
            navigation.map(({ label, to }) => (
              <Link key={to} to={to} activeProps={{ className: "is-active" }} className="erp-tab">
                {label}
              </Link>
            ))}
        </nav>
        <div className="erp-user-actions">
          {!user.mustChangePassword && (
            <>
              <span className="erp-user-name" title={user.name}>
                {user.name}
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={logout}
                className="min-h-11 gap-2 px-4 text-base"
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
    </div>
  );
}
