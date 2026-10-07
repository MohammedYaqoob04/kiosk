import {
  Building2,
  CalendarCheck,
  CalendarDays,
  CircleHelp,
  Clock3,
  ContactRound,
  FileText,
  Landmark,
  Map,
  UserRound,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type HomeRoute =
  | "/campus-navigation"
  | "/notices"
  | "/departments"
  | "/faculty-directory"
  | "/facilities"
  | "/contact"
  | "/erp/dashboard"
  | "/erp/timetable"
  | "/erp/results"
  | "/erp/leave"
  | "/erp/fees"
  | "/erp/profile";

export interface HomeService {
  title: string;
  description: string;
  icon: LucideIcon;
  to: HomeRoute;
}

export const campusServices: readonly HomeService[] = [
  {
    title: "Campus Map",
    description: "Find places around campus",
    icon: Map,
    to: "/campus-navigation",
  },
  {
    title: "Notices & Events",
    description: "Campus updates and events",
    icon: CalendarDays,
    to: "/notices",
  },
  {
    title: "Departments",
    description: "Explore academic departments",
    icon: Building2,
    to: "/departments",
  },
  {
    title: "Faculty Directory",
    description: "Find faculty contact details",
    icon: ContactRound,
    to: "/faculty-directory",
  },
  {
    title: "Facilities",
    description: "Explore campus facilities",
    icon: Landmark,
    to: "/facilities",
  },
  {
    title: "Help & Contact",
    description: "Get help or contact the college",
    icon: CircleHelp,
    to: "/contact",
  },
];

export const studentServices: readonly HomeService[] = [
  {
    title: "Attendance",
    description: "View your attendance",
    icon: CalendarCheck,
    to: "/erp/dashboard",
  },
  {
    title: "Timetable",
    description: "View your timetable",
    icon: Clock3,
    to: "/erp/timetable",
  },
  {
    title: "Results & Exams",
    description: "View results and exam information",
    icon: FileText,
    to: "/erp/results",
  },
  {
    title: "Leave & OD",
    description: "Submit or review leave and OD",
    icon: CalendarDays,
    to: "/erp/leave",
  },
  {
    title: "Fees",
    description: "View your fee details",
    icon: WalletCards,
    to: "/erp/fees",
  },
  {
    title: "Profile",
    description: "View your profile",
    icon: UserRound,
    to: "/erp/profile",
  },
];
