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

export interface CollegeFact {
  label: string;
  value: string;
  needsVerification?: true;
}

export const siteContent = {
  institutionName: "Arunai Engineering College (Autonomous)",
  shortInstitutionName: "Arunai Engineering College",
  projectName: "KIOSK",
  address: "Velu Nagar, Tiruvannamalai - 606603",
  officialSite: "https://www.arunai.org",
  departmentName: department.name,
  header: {
    mainNavigationLabel: "Main navigation",
    mobileNavigationLabel: "Mobile navigation",
    homeLabel: "Home",
    backLabel: "Back",
    menuOpenLabel: "Open navigation menu",
    menuCloseLabel: "Close navigation menu",
    accessibilityLabel: "Accessibility settings",
    erpLabel: "ERP Login",
    nav: [
      { label: "Home", href: "#home" },
      { label: "Campus", href: "/campus" },
      { label: "About", href: "#about" },
      { label: "Department", href: "#department" },
      { label: "Facilities", href: "#facilities" },
      { label: "Notices", href: "#notices" },
      { label: "Gallery", href: "#gallery" },
      { label: "Contact", href: "#contact" },
    ] satisfies SiteNavItem[],
  },
  hero: {
    eyebrow: "AUTONOMOUS - ESTD. 1993",
    wordmark: "KIOSK",
    lockupDescription: "Campus information and ERP",
    title: "Everything on campus, one touch away.",
    description: "Find campus information, explore facilities and access essential ERP services.",
    exploreLabel: "Explore campus",
    departmentsLabel: "Departments",
    scrollLabel: "Explore more",
    serviceSummary: ["Attendance", "Leave & OD", "Fees", "Results"],
    imageAlt: "Campus photograph",
    imageFallback: "Campus",
  },
  quickAccess: {
    title: "Quick access",
    items: [
      {
        title: "Student ERP",
        description: "Access student services and information.",
        href: "/erp/login",
        role: "student",
        icon: "student",
      },
      {
        title: "Counsellor Desk",
        description: "Open the counsellor workspace.",
        href: "/erp/login",
        role: "staff",
        icon: "counsellor",
      },
      {
        title: "HOD Office",
        description: "Open the department office workspace.",
        href: "/erp/login",
        role: "hod",
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
    eyebrow: "01  About",
    title: "A campus for learning and discovery",
    paragraphs: [
      "Arunai Engineering College is an autonomous engineering institution in Velu Nagar, Tiruvannamalai. Established in 1993, it is affiliated to Anna University, Chennai, and approved by AICTE.",
    ],
    facts: [
      { label: "Established", value: "1993" },
      { label: "Affiliation", value: "Anna University, Chennai" },
      { label: "Approval", value: "AICTE" },
      { label: "Accreditation", value: "NAAC" },
      { label: "NAAC grade", value: "-- add from college" },
      // needsVerification: true; confirm the counselling code with the college before publication.
      { label: "Counselling code", value: "1504", needsVerification: true },
      // needsVerification: true; confirm this certification with the college before publication.
      { label: "Certification", value: "DNV ISO 9001", needsVerification: true },
    ] satisfies CollegeFact[],
    imageAlt: "Arunai Engineering College campus",
    imageFallback: "Campus image",
  },
  stats: {
    title: "College at a glance",
    items: [
      {
        label: "Years of excellence",
        value: String(new Date().getFullYear() - 1993),
      },
      { label: "Counselling code", value: "1504" },
      { label: "Students", value: "-- add from college" },
      { label: "Programmes", value: "-- add from college" },
    ] satisfies SiteStat[],
  },
  department: {
    eyebrow: "02  Department",
    title: "B.Tech Artificial Intelligence & Data Science",
    description: "-- add from college",
    batchLabel: "Current final-year batch",
    batch: "2023-2027",
    programmesTitle: "Programmes",
    programmes: ["-- add from college"],
    hodLabel: "Head of Department",
    hodName: "-- add from college",
    highlightsTitle: "Department highlights",
    highlights: ["-- add from college", "-- add from college", "-- add from college"],
  },
  facilities: {
    eyebrow: "03  Facilities",
    title: "Spaces to learn, connect and grow",
    items: [
      { name: "Library", description: "-- add from college" },
      { name: "Laboratories", description: "-- add from college" },
      { name: "Hostel", description: "-- add from college" },
      { name: "Sports", description: "-- add from college" },
      { name: "Transport", description: "-- add from college" },
      { name: "Cafeteria", description: "-- add from college" },
      { name: "Medical Support", description: "-- add from college" },
      { name: "Wi-Fi", description: "-- add from college" },
    ] satisfies SiteFacility[],
  },
  notices: {
    eyebrow: "04  Campus updates",
    title: "Notices & Events",
    items: [
      { title: "-- add from college", date: "-- add from college", category: "Notice" },
      { title: "-- add from college", date: "-- add from college", category: "Event" },
      { title: "-- add from college", date: "-- add from college", category: "Notice" },
      { title: "-- add from college", date: "-- add from college", category: "Event" },
    ] satisfies SiteNotice[],
  },
  gallery: {
    eyebrow: "05  Gallery",
    title: "Gallery",
    imageAlt: "Arunai Engineering College campus gallery image",
    emptyLabel: "Campus images",
    closeLabel: "Close image",
    previousLabel: "Previous image",
    nextLabel: "Next image",
  },
  contact: {
    eyebrow: "06  Contact",
    title: "Contact",
    addressLabel: "Address",
    phoneLabel: "Phone",
    phone: "-- add from college",
    emailLabel: "Email",
    email: "-- add from college",
    mapsLabel: "Open in Maps",
    officialSiteLabel: "Official website",
  },
  footer: {
    quickLinksTitle: "Quick links",
    copyright: "© 2026 Arunai Engineering College (Autonomous)",
    backToTop: "Back to top",
    officialSiteLabel: "www.arunai.org",
  },
  campusPage: {
    title: "Explore campus",
    searchLabel: "Search a building or department",
    listLabel: "Campus locations",
    noResults: "No campus locations match your search.",
    mapTitle: "Campus map",
    emptyMapTitle: "Interactive campus map goes here",
    noMapData: "-- add verified campus map data to enable navigation",
    directionsLabel: "Get directions",
  },
} as const;
