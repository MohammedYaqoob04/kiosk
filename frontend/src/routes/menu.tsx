import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, CalendarDays, CircleHelp, GraduationCap, Map, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useAuth } from "@/lib/auth-context";

const menuItems: Array<{
  title: string;
  description: string;
  to: "/campus" | "/departments" | "/faculty" | "/notices" | "/erp" | "/contact";
  icon: LucideIcon;
}> = [
  {
    title: "Explore Campus",
    description: "Map and facilities",
    to: "/campus",
    icon: Map,
  },
  {
    title: "Departments",
    description: "Academic departments",
    to: "/departments",
    icon: Building2,
  },
  {
    title: "Faculty Directory",
    description: "Find faculty",
    to: "/faculty",
    icon: UsersRound,
  },
  {
    title: "Notices & Events",
    description: "Updates and events",
    to: "/notices",
    icon: CalendarDays,
  },
  {
    title: "ERP Login",
    description: "Attendance, marks, leave",
    to: "/erp",
    icon: GraduationCap,
  },
  {
    title: "Help & Contact",
    description: "Get help and contact us",
    to: "/contact",
    icon: CircleHelp,
  },
];

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [{ title: "Services | KIOSK" }],
  }),
  component: MenuPage,
});

function MenuPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) return;

    let timeout: number;
    const resetIdleTimeout = () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        void navigate({ to: "/", replace: true });
      }, 90_000);
    };

    resetIdleTimeout();
    window.addEventListener("pointerdown", resetIdleTimeout, { passive: true });
    window.addEventListener("keydown", resetIdleTimeout);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("pointerdown", resetIdleTimeout);
      window.removeEventListener("keydown", resetIdleTimeout);
    };
  }, [navigate, user]);

  return (
    <div className="menu-page">
      <div className="menu-grid">
        {menuItems.map(({ title, description, to, icon: Icon }) => (
          <Link key={title} to={to} className="menu-tile">
            <span className="menu-icon-circle">
              <Icon aria-hidden="true" className="size-7" strokeWidth={1.5} />
            </span>
            <span className="menu-tile-copy">
              <span className="menu-tile-title">{title}</span>
              <span className="menu-tile-description">{description}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
