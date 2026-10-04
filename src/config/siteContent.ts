import { department } from "@/config/department";

export interface SiteNavItem {
  label: string;
  href: string;
}

export interface SiteStat {
  label: string;
  value: string;
}

export interface SiteNotice {
  title: string;
  date: string;
  category: string;
}

export interface SiteFacility {
  name: string;
  description: string;
}

export const siteContent = {
  institutionName: "Arunai Engineering College (Autonomous)",
  shortInstitutionName: "Arunai Engineering College",
  projectName: "KIOSK",
  address: "Velu Nagar, Tiruvannamalai - 606603",
  departmentName: department.name,
  header: {
    mainNavigationLabel: "Main navigation",
    mobileNavigationLabel: "Mobile navigation",
    homeLabel: "Home",
    menuOpenLabel: "Open navigation menu",
    menuCloseLabel: "Close navigation menu",
    accessibilityLabel: "Accessibility settings",
    erpLabel: "ERP Login",
    nav: [
      { label: "Home", href: "#home" },
      { label: "About", href: "#about" },
      { label: "Department", href: "#department" },
      { label: "Facilities", href: "#facilities" },
      { label: "Notices", href: "#notices" },
      { label: "Gallery", href: "#gallery" },
      { label: "Contact", href: "#contact" },
    ] satisfies SiteNavItem[],
  },
  hero: {
    eyebrow: "ARUNAI ENGINEERING COLLEGE (AUTONOMOUS)",
    title: "KIOSK",
    description:
      "Department of AI & Data Science - Student ERP, Counsellor Desk and HOD Office",
    erpLabel: "ERP Login",
    exploreLabel: "Explore campus",
    scrollLabel: "Scroll to explore",
  },
  quickAccess: {
    title: "Quick access",
    items: [
      {
        title: "Student ERP",
        description: "Access student services and information.",
        href: "/erp",
        icon: "student",
      },
      {
        title: "Counsellor Desk",
        description: "Open the counsellor workspace.",
        href: "/erp",
        icon: "counsellor",
      },
      {
        title: "HOD Office",
        description: "Open the department office workspace.",
        href: "/erp",
        icon: "office",
      },
      {
        title: "Notices & Events",
        description: "View campus notices and events.",
        href: "#notices",
        icon: "notices",
      },
    ],
  },
  about: {
    eyebrow: "About the college",
    title: "A campus for learning and discovery",
    paragraphs: [
      "-- add from college",
      "Affiliation: -- add from college",
      "Approvals: -- add from college",
      "Accreditation: -- add from college",
      "Founded: -- add from college",
    ],
    imageAlt: "Arunai Engineering College campus",
    imageFallback: "Campus image",
  },
  stats: {
    items: [
      { label: "Students", value: "-- add from college" },
      { label: "Programmes", value: "-- add from college" },
      { label: "Faculty", value: "-- add from college" },
      { label: "Established", value: "-- add from college" },
    ] satisfies SiteStat[],
  },
  department: {
    eyebrow: "Academic department",
    title: department.name,
    description: "-- add from college",
    programmesTitle: "Programmes",
    programmes: ["-- add from college"],
    hodLabel: "Head of Department",
    hodName: "-- add from college",
    highlightsTitle: "Department highlights",
    highlights: ["-- add from college", "-- add from college", "-- add from college"],
  },
  facilities: {
    eyebrow: "Campus facilities",
    title: "Spaces to learn, connect and grow",
    items: [
      { name: "Library", description: "-- add from college" },
      { name: "Laboratories", description: "-- add from college" },
      { name: "Hostel", description: "-- add from college" },
      { name: "Transport", description: "-- add from college" },
      { name: "Sports", description: "-- add from college" },
      { name: "Cafeteria", description: "-- add from college" },
    ] satisfies SiteFacility[],
  },
  notices: {
    eyebrow: "Campus updates",
    title: "Notices & Events",
    items: [
      { title: "-- add from college", date: "-- add from college", category: "Notice" },
      { title: "-- add from college", date: "-- add from college", category: "Event" },
      { title: "-- add from college", date: "-- add from college", category: "Notice" },
      { title: "-- add from college", date: "-- add from college", category: "Event" },
    ] satisfies SiteNotice[],
  },
  gallery: {
    eyebrow: "Campus moments",
    title: "Gallery",
    imageAlt: "Arunai Engineering College campus gallery image",
    emptyLabel: "Campus images",
    closeLabel: "Close image",
    previousLabel: "Previous image",
    nextLabel: "Next image",
  },
  contact: {
    eyebrow: "Get in touch",
    title: "Contact",
    addressLabel: "Address",
    phoneLabel: "Phone",
    phone: "-- add from college",
    emailLabel: "Email",
    email: "-- add from college",
    mapsLabel: "Open in Maps",
  },
  footer: {
    quickLinksTitle: "Quick links",
    copyright: "© 2026 Arunai Engineering College (Autonomous)",
    backToTop: "Back to top",
  },
} as const;
