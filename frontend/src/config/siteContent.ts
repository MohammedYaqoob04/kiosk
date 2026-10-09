/**
 * Official Arunai Engineering College Information & Institutional Data Architecture
 * Sourced authoritatively from the official college website: https://arunai.org/
 *
 * Centralized data structures for collegeInfo, departments, facilities, notices, gallery, contact.
 */

export interface SiteNavItem {
  label: string;
  href: string;
}

export interface InstitutionalHighlight {
  label: string;
  value: string;
  description?: string;
}

export interface OfficialDepartment {
  id: string;
  code: string;
  name: string;
  category: "Computing & AI" | "Core Engineering" | "Specialized Engineering" | "Management";
  degree: string;
  description: string;
  officialUrl: string;
}

export interface OfficialFacility {
  id: string;
  name: string;
  category: "Academic & Research" | "Computing & Labs" | "Student Life & Hostels" | "Campus Amenities";
  isPrimary: boolean;
  description: string;
}

export interface OfficialNotice {
  id: string;
  title: string;
  date: string; // ISO format: YYYY-MM-DD
  category: "Academics" | "Examinations" | "Collaborations" | "Events" | "FDP & Workshops";
  description: string;
  sourceRef?: string;
  image?: string;
  officialUrl?: string;
}

export interface GalleryMediaItem {
  id: string;
  type: "photo" | "video";
  title: string;
  src?: string;
  caption?: string;
}

export interface OfficialContact {
  institutionName: string;
  autonomousStatus: string;
  addressLine1: string;
  addressLine2: string;
  pincode: string;
  fullAddress: string;
  generalEnquiryPhones: string[];
  enquiryDisplay: string;
  email: string;
  studentVerificationEmail: string;
  admissionPhones: string[];
  officialWebsite: string;
  mapRoute: string;
}

/* ==========================================================================
   1. Institutional Profile & Highlights (Configurable)
   ========================================================================== */

export const collegeInfo = {
  institutionName: "Arunai Engineering College (Autonomous)",
  shortInstitutionName: "Arunai Engineering College",
  acronym: "AEC",
  tagline: "Autonomous – Estd. 1993",
  establishedYear: 1993,
  counsellingCode: "1504",
  nature: "Co-educational Institution",
  affiliation: "Anna University, Chennai",
  approval: "AICTE, New Delhi",
  accreditation: "NAAC Accredited",
  trust: "Saranathan Educational Trust",
  address: "Velu Nagar, Tiruvannamalai, Tamil Nadu – 606603",
  officialWebsite: "https://arunai.org/",

  profile:
    "Arunai Engineering College (AEC), established in 1993 by the Saranathan Educational Trust, is a renowned autonomous co-educational institution situated in Velu Nagar, Tiruvannamalai. Spread over a lush 25,000+ sq. m green campus, AEC has been at the forefront of providing exceptional technical education, progressive research capabilities, and ethical mentorship for over three decades.",

  vision:
    "We, Shape and Transform youth with utmost care, innovative and dedicated service for the cause of morals and Education - A Deal which needs no applauses but our products are our ambassadors.",

  mission:
    "We, at Arunai Engineering College, will bring out and enlighten the hidden technical skills and abilities of youth with the highest quality technical education and proper discipline.",

  campusOverview:
    "Located along the serene foothills of Tiruvannamalai, the 25,000+ sq. m campus features modern digital classrooms, high-speed Wi-Fi connectivity, cutting-edge engineering laboratories, the Arunai Gateway Central Computing Centre, extensive sports complexes, separate residential hostels, and the Anna Bio Research Foundation.",
} as const;

export const institutionalHighlights: InstitutionalHighlight[] = [
  { label: "Established", value: "1993", description: "30+ years of educational excellence" },
  { label: "Green Campus Area", value: "25,000+ sq. m", description: "Lush eco-friendly academic environment" },
  { label: "Students Enrolled", value: "20,000+", description: "Vibrant learning community" },
  { label: "Academic Departments", value: "13+", description: "Industry-aligned undergraduate & postgraduate branches" },
  { label: "Publications", value: "500+", description: "Peer-reviewed research and patents" },
  { label: "Successful Alumni", value: "50,000+", description: "Global network of leaders and innovators" },
];

/* ==========================================================================
   2. Academic Departments (All 13 Official Departments)
   ========================================================================== */

export const officialDepartments: OfficialDepartment[] = [
  {
    id: "civil",
    code: "CIVIL",
    name: "Civil Engineering",
    category: "Core Engineering",
    degree: "B.E. Civil Engineering",
    description:
      "Equips students with comprehensive expertise in structural design, geotechnical engineering, surveying, environmental hydraulics, and sustainable construction technologies.",
    officialUrl: "https://arunai.org/",
  },
  {
    id: "cse",
    code: "CSE",
    name: "Computer Science & Engineering",
    category: "Computing & AI",
    degree: "B.E. Computer Science & Engineering",
    description:
      "Focuses on core computing fundamentals, algorithmic thinking, software engineering, cloud architecture, and cutting-edge system designs.",
    officialUrl: "https://arunai.org/",
  },
  {
    id: "cse-cs",
    code: "CSE-CS",
    name: "CSE – Cyber Security",
    category: "Computing & AI",
    degree: "B.E. Computer Science & Engineering (Cyber Security)",
    description:
      "Dedicated to network defense, cryptography, digital forensics, ethical hacking, secure coding, and threat intelligence to safeguard global digital infrastructure.",
    officialUrl: "https://arunai.org/",
  },
  {
    id: "cse-aiml",
    code: "CSE-AIML",
    name: "CSE – Artificial Intelligence & Machine Learning",
    category: "Computing & AI",
    degree: "B.E. CSE (Artificial Intelligence & Machine Learning)",
    description:
      "Imparts deep knowledge in neural networks, computer vision, natural language processing, intelligent autonomous systems, and predictive modeling.",
    officialUrl: "https://arunai.org/",
  },
  {
    id: "ece",
    code: "ECE",
    name: "Electronics & Communication Engineering",
    category: "Core Engineering",
    degree: "B.E. Electronics & Communication Engineering",
    description:
      "Covers VLSI design, embedded systems, wireless communications, signal processing, RF engineering, and Internet of Things (IoT).",
    officialUrl: "https://arunai.org/",
  },
  {
    id: "eee",
    code: "EEE",
    name: "Electrical & Electronics Engineering",
    category: "Core Engineering",
    degree: "B.E. Electrical & Electronics Engineering",
    description:
      "Prepares future engineers in power systems, smart electrical grids, renewable energy, electric vehicle tech, and industrial control automation.",
    officialUrl: "https://arunai.org/",
  },
  {
    id: "mech",
    code: "MECH",
    name: "Mechanical Engineering",
    category: "Core Engineering",
    degree: "B.E. Mechanical Engineering",
    description:
      "Offers rigorous training in thermal science, fluid dynamics, computer-aided design & manufacturing (CAD/CAM), robotics, and materials science.",
    officialUrl: "https://arunai.org/",
  },
  {
    id: "agri",
    code: "AGRI",
    name: "Agricultural Engineering",
    category: "Specialized Engineering",
    degree: "B.Tech Agricultural Engineering",
    description:
      "Integrates agricultural science with modern engineering principles, covering precision irrigation, farm machinery, food processing, and soil-water conservation.",
    officialUrl: "https://arunai.org/",
  },
  {
    id: "aids",
    code: "AIDS",
    name: "Artificial Intelligence & Data Science",
    category: "Computing & AI",
    degree: "B.Tech Artificial Intelligence & Data Science",
    description:
      "Specializes in big data engineering, advanced machine learning, statistical computing, deep learning, and data-driven intelligent decision systems.",
    officialUrl: "https://arunai.org/",
  },
  {
    id: "bio",
    code: "BIO",
    name: "Biotechnology",
    category: "Specialized Engineering",
    degree: "B.Tech Biotechnology",
    description:
      "Fosters innovative research in genetic engineering, bioprocess technology, molecular biology, bioinformatics, and pharmaceutical biotechnology.",
    officialUrl: "https://arunai.org/",
  },
  {
    id: "chem",
    code: "CHEM",
    name: "Chemical Engineering",
    category: "Specialized Engineering",
    degree: "B.Tech Chemical Engineering",
    description:
      "Covers chemical reaction engineering, transport phenomena, process optimization, petrochemicals, polymer science, and industrial pollution control.",
    officialUrl: "https://arunai.org/",
  },
  {
    id: "it",
    code: "IT",
    name: "Information Technology",
    category: "Computing & AI",
    degree: "B.Tech Information Technology",
    description:
      "Focuses on enterprise web architecture, database management, cloud systems, mobile application development, and distributed computing.",
    officialUrl: "https://arunai.org/",
  },
  {
    id: "mba",
    code: "MBA",
    name: "Management Studies / MBA",
    category: "Management",
    degree: "Master of Business Administration (MBA)",
    description:
      "Develops strategic leadership, financial analysis, marketing management, human resource dynamics, and entrepreneurial capability.",
    officialUrl: "https://arunai.org/",
  },
];

/* ==========================================================================
   3. Facilities (Primary and Additional Official College Facilities)
   ========================================================================== */

export const officialFacilities: OfficialFacility[] = [
  // Primary Facilities
  {
    id: "digital-classrooms",
    name: "Digital Classrooms",
    category: "Academic & Research",
    isPrimary: true,
    description:
      "Acoustically treated smart lecture halls equipped with multimedia interactive projectors, visualizers, and digital teaching podiums.",
  },
  {
    id: "digital-library",
    name: "Digital Library with E-Resources",
    category: "Academic & Research",
    isPrimary: true,
    description:
      "Automated e-library offering online access to IEEE, Springer, ScienceDirect, DELNET, NPTEL courseware, and national digital repositories.",
  },
  {
    id: "transportation",
    name: "Transportation Facilities",
    category: "Campus Amenities",
    isPrimary: true,
    description:
      "Extensive fleet of college buses operating across Tiruvannamalai, Polur, Chetpet, Arani, Gingee, and surrounding rural and urban areas.",
  },
  {
    id: "hostels",
    name: "Separate Hostels",
    category: "Student Life & Hostels",
    isPrimary: true,
    description:
      "Secure and comfortable on-campus residential hostels for boys and girls with RO purified drinking water, Wi-Fi, study halls, and nutritious dining.",
  },
  {
    id: "wifi-campus",
    name: "Wi-Fi Campus / High-Speed Internet",
    category: "Computing & Labs",
    isPrimary: true,
    description:
      "High-speed campus-wide fiber-optic connectivity providing seamless uninterrupted internet access across classrooms, hostels, and laboratories.",
  },
  {
    id: "sports-facilities",
    name: "Sports Facilities",
    category: "Student Life & Hostels",
    isPrimary: true,
    description:
      "Spacious outdoor athletic tracks, cricket ground, football arena, basketball and volleyball courts encouraging active physical development.",
  },

  // Additional Officially Published Facilities
  {
    id: "laboratories",
    name: "Advanced Laboratories",
    category: "Academic & Research",
    isPrimary: false,
    description:
      "Specialized departmental labs fitted with modern industrial apparatus, testing equipment, and simulated research tools.",
  },
  {
    id: "workshops",
    name: "Engineering Workshops",
    category: "Academic & Research",
    isPrimary: false,
    description:
      "Comprehensive machine shops, fitting, welding, carpentry, and foundry sections for hands-on manufacturing skills.",
  },
  {
    id: "central-library",
    name: "AC Central Library",
    category: "Academic & Research",
    isPrimary: false,
    description:
      "Centrally air-conditioned repository housing over 50,000+ volumes, international print journals, reference volumes, and quiet study reading rooms.",
  },
  {
    id: "sports-centre",
    name: "Sports Centre",
    category: "Student Life & Hostels",
    isPrimary: false,
    description:
      "Indoor sports complex facilitating table tennis, badminton, chess, and carrom tournaments throughout the academic year.",
  },
  {
    id: "gym",
    name: "Gym & Fitness Centre",
    category: "Student Life & Hostels",
    isPrimary: false,
    description:
      "Equipped fitness gymnasium with modern cardiovascular and resistance training equipment for resident and day scholars.",
  },
  {
    id: "medical-centre",
    name: "Medical Centre",
    category: "Campus Amenities",
    isPrimary: false,
    description:
      "24/7 on-campus health clinic staffed with qualified medical personnel, basic diagnostic equipment, and tie-up with Arunai Hospital for emergency care.",
  },
  {
    id: "arunai-gateway",
    name: "Arunai Gateway Central Computing Centre",
    category: "Computing & Labs",
    isPrimary: false,
    description:
      "State-of-the-art centralized computer facility with high-end workstations, enterprise software licenses, and dedicated servers for hackathons and coding labs.",
  },
  {
    id: "language-lab",
    name: "Language Research Lab",
    category: "Computing & Labs",
    isPrimary: false,
    description:
      "Interactive audio-visual communication lab designed to train students in soft skills, phonetics, IELTS/TOEFL preparation, and campus placement interviews.",
  },
  {
    id: "anna-bio-foundation",
    name: "Anna Bio Research Foundation",
    category: "Academic & Research",
    isPrimary: false,
    description:
      "Dedicated biotechnology and bioscience research wing supporting collaborative industry research, bio-processing, and funded academic projects.",
  },
  {
    id: "auditoriums",
    name: "AC Auditoriums",
    category: "Campus Amenities",
    isPrimary: false,
    description:
      "Air-conditioned auditoriums equipped with acoustic surround sound and stage lighting for national conferences, graduation ceremonies, and symposiums.",
  },
  {
    id: "conference-halls",
    name: "Conference Halls",
    category: "Campus Amenities",
    isPrimary: false,
    description:
      "Professional meeting venues equipped with video conferencing infrastructure for board meetings, faculty workshops, and industry seminars.",
  },
  {
    id: "bank-branch",
    name: "Indian Bank Campus Branch & ATM",
    category: "Campus Amenities",
    isPrimary: false,
    description:
      "Full-service Indian Bank on-campus branch and 24-hour ATM offering convenient financial transactions for students and faculty.",
  },
  {
    id: "temple",
    name: "Sri Vidya Ganapathi Temple",
    category: "Campus Amenities",
    isPrimary: false,
    description:
      "Serene on-campus temple dedicated to Sri Vidya Ganapathi, providing a peaceful spiritual ambiance for students, staff, and visitors.",
  },
  {
    id: "campus-transport",
    name: "Campus Transportation",
    category: "Campus Amenities",
    isPrimary: false,
    description:
      "Dedicated eco-friendly transit arrangements and scheduled shuttles ensuring safe, timely connectivity across all campus zones.",
  },
];

/* ==========================================================================
   4. Notices & Announcements (Official College Updates - Sorted Latest First)
   ========================================================================== */

export const officialNotices: OfficialNotice[] = [
  {
    id: "not-01",
    title: "AWS Academy Collaboration & Cloud Certifications",
    date: "2026-03-20",
    category: "Collaborations",
    description:
      "Arunai Engineering College has officially collaborated with AWS Academy to offer industry-standard cloud computing curriculum, hands-on lab environments, and accredited cloud certification pathways for engineering students.",
    sourceRef: "Office of Academic Partnerships",
    officialUrl: "https://arunai.org/",
  },
  {
    id: "not-02",
    title: "Continuous Internal Assessment (CIA Test–II) Schedule & Guidelines",
    date: "2026-03-12",
    category: "Examinations",
    description:
      "Continuous Internal Assessment (CIA Test–II) timetable, hall allocations, and examination regulations have been announced for all undergraduate and postgraduate engineering semesters.",
    sourceRef: "Office of the Controller of Examinations",
    officialUrl: "https://arunai.org/",
  },
  {
    id: "not-03",
    title: "End Semester Examination Fees Payment Schedule",
    date: "2026-02-28",
    category: "Examinations",
    description:
      "Circular regarding online submission of examination applications and payment of End Semester Autonomous Examination fees for both regular and arrear courses without fine.",
    sourceRef: "Autonomous Examination Wing",
    officialUrl: "https://arunai.org/",
  },
  {
    id: "not-04",
    title: "Autonomous End Semester Theory & Practical Examination Schedules",
    date: "2026-02-15",
    category: "Examinations",
    description:
      "Official schedule for the forthcoming autonomous end semester practical and theory examinations published for all 13 academic engineering departments.",
    sourceRef: "Controller of Examinations",
    officialUrl: "https://arunai.org/",
  },
  {
    id: "not-05",
    title: "National Level Student Technical Symposiums & Association Events",
    date: "2026-02-05",
    category: "Events",
    description:
      "Annual technical associations across all departments are organizing national-level paper presentations, innovative project exhibitions, hackathons, and technical competitions.",
    sourceRef: "Student Association Affairs",
    officialUrl: "https://arunai.org/",
  },
  {
    id: "not-06",
    title: "AICTE Sponsored Faculty Development Programme (FDP) & Hands-on Workshops",
    date: "2026-01-22",
    category: "FDP & Workshops",
    description:
      "National workshops and Faculty Development Programmes on emerging technologies including Artificial Intelligence, Cyber Security, and Renewable Energy for faculty and research scholars.",
    sourceRef: "Centre for Academic Research & Training",
    officialUrl: "https://arunai.org/",
  },
];

/* ==========================================================================
   5. Official Contact Details
   ========================================================================== */

export const officialContact: OfficialContact = {
  institutionName: "Arunai Engineering College (Autonomous)",
  autonomousStatus: "Autonomous Institution – Approved by AICTE, Affiliated to Anna University",
  addressLine1: "Velu Nagar,",
  addressLine2: "Tiruvannamalai, Tamil Nadu",
  pincode: "606603",
  fullAddress: "Velu Nagar, Tiruvannamalai, Tamil Nadu – 606603",
  generalEnquiryPhones: ["04175-222001", "04175-222002"],
  enquiryDisplay: "04175-222001 / 222002",
  email: "aectvm1993@gmail.com",
  studentVerificationEmail: "coearunai@gmail.com",
  admissionPhones: ["9597374446", "9443576270", "9600653288"],
  officialWebsite: "https://arunai.org/",
  mapRoute: "/campus",
};

/* ==========================================================================
   6. Official Gallery Architecture
   ========================================================================== */

export const officialGallery = {
  categories: ["All", "Photos", "Videos"] as const,
  emptyMessage: "Gallery content will be updated soon.",
  emptyVideosMessage: "Gallery content will be updated soon.",
  sourceAttribution: "Source: Official Arunai Engineering College Media",
};

/* ==========================================================================
   7. Source Attribution
   ========================================================================== */

export const officialSourceAttribution = {
  text: "Source: Official Arunai Engineering College Website",
  url: "https://arunai.org/",
};

/* ==========================================================================
   8. Consolidated siteContent export (maintains full compatibility)
   ========================================================================== */

export const siteContent = {
  institutionName: collegeInfo.institutionName,
  shortInstitutionName: collegeInfo.shortInstitutionName,
  projectName: "KIOSK",
  address: collegeInfo.address,
  officialSite: collegeInfo.officialWebsite,
  departmentName: "Artificial Intelligence & Data Science",
  sourceAttribution: officialSourceAttribution,

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
      { label: "Departments", href: "#departments" },
      { label: "Facilities", href: "#facilities" },
      { label: "Notices", href: "#notices" },
      { label: "Gallery", href: "#gallery" },
      { label: "Contact", href: "#contact" },
    ] satisfies SiteNavItem[],
  },

  hero: {
    eyebrow: "AUTONOMOUS – ESTD. 1993",
    wordmark: "KIOSK",
    lockupDescription: "Campus Information & ERP Portal",
    title: "Everything on campus, one touch away.",
    description:
      "Official interactive kiosk for Arunai Engineering College. Explore academic departments, campus facilities, verified announcements, and access comprehensive student & faculty ERP services.",
    exploreLabel: "Explore Campus",
    departmentsLabel: "Departments",
    scrollLabel: "Explore more",
    serviceSummary: ["Attendance", "Leave & OD", "Fees", "Results"],
    imageAlt: "Arunai Engineering College Campus",
    imageFallback: "AEC Campus",
  },

  quickAccess: {
    title: "Quick Access Services",
    items: [
      {
        title: "Student ERP",
        description: "Attendance, marks, leave & timetable services.",
        href: "/erp/login",
        role: "student",
        icon: "student",
      },
      {
        title: "Counsellor Desk",
        description: "Student mentorship & request management.",
        href: "/erp/login",
        role: "staff",
        icon: "counsellor",
      },
      {
        title: "HOD Office",
        description: "Department oversight & approvals workspace.",
        href: "/erp/login",
        role: "hod",
        icon: "office",
      },
      {
        title: "Campus Map",
        description: "Interactive navigation and campus directions.",
        href: "/campus",
        icon: "map",
      },
      {
        title: "Departments",
        description: "Explore 13+ academic engineering branches.",
        href: "#departments",
        icon: "departments",
      },
      {
        title: "Notices & News",
        description: "Official institutional updates and circulars.",
        href: "#notices",
        icon: "notices",
      },
    ],
  },

  about: {
    eyebrow: "01  About Arunai Engineering College",
    title: "Three decades of academic distinction and technical innovation",
    profile: collegeInfo.profile,
    vision: collegeInfo.vision,
    mission: collegeInfo.mission,
    paragraphs: [
      collegeInfo.profile,
      collegeInfo.campusOverview,
    ],
    facts: [
      { label: "Established", value: "1993" },
      { label: "Status", value: "Autonomous" },
      { label: "Affiliation", value: "Anna University, Chennai" },
      { label: "Approval", value: "AICTE, New Delhi" },
      { label: "Accreditation", value: "NAAC Accredited" },
      { label: "Counselling Code", value: "1504" },
      { label: "Institution Type", value: "Co-educational" },
    ],
    imageAlt: "Arunai Engineering College campus aerial view",
    imageFallback: "AEC Campus",
  },

  stats: {
    title: "Institutional Highlights",
    items: institutionalHighlights,
  },

  departments: {
    eyebrow: "02  Academic Departments",
    title: "13+ Industry-Aligned Engineering & Management Disciplines",
    description:
      "Arunai Engineering College offers comprehensive undergraduate and postgraduate programmes designed with autonomous curriculum aligned to industry advancements.",
    items: officialDepartments,
  },

  facilities: {
    eyebrow: "03  Campus Facilities",
    title: "State-of-the-Art Infrastructure for Learning & Life",
    description:
      "Spanning over 25,000+ sq. m, our campus integrates advanced learning environments, computing hubs, residential complexes, and recreation centers.",
    items: officialFacilities,
  },

  notices: {
    eyebrow: "04  Official Announcements",
    title: "Latest Campus Notices & Circulars",
    description:
      "Direct announcements and official circulars from Arunai Engineering College administrative wings and examination cells.",
    items: officialNotices,
    emptyMessage: "No official notices available at this time.",
  },

  gallery: {
    eyebrow: "05  Campus Gallery",
    title: "Life & Learning at Arunai",
    imageAlt: "Arunai Engineering College campus photo",
    emptyLabel: "Official campus photographs",
    emptyMessage: "Gallery content will be updated soon.",
    closeLabel: "Close preview",
    previousLabel: "Previous image",
    nextLabel: "Next image",
  },

  contact: {
    eyebrow: "06  Contact Us",
    title: "Get in Touch with Arunai Engineering College",
    details: officialContact,
    addressLabel: "Campus Location",
    phoneLabel: "General Enquiry",
    admissionLabel: "Admission Desk",
    verificationLabel: "Student Verification",
    emailLabel: "Official Email",
    mapsLabel: "Open Campus Map",
    officialSiteLabel: "Visit Official Website",
  },

  footer: {
    quickLinksTitle: "Quick Links",
    copyright: "© 2026 Arunai Engineering College (Autonomous). All rights reserved.",
    backToTop: "Back to top",
    officialSiteLabel: "arunai.org",
  },
};
