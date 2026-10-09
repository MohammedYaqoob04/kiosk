import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Award,
  BookOpen,
  Building2,
  BusFront,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Compass,
  ExternalLink,
  GraduationCap,
  HardHat,
  Headphones,
  HeartPulse,
  House,
  Image as ImageIcon,
  Landmark,
  Mail,
  MapPin,
  Megaphone,
  Microscope,
  Phone,
  School,
  Sparkles,
  UsersRound,
  Video,
  Wifi,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  collegeInfo,
  institutionalHighlights,
  officialDepartments,
  officialFacilities,
  officialNotices,
  officialContact,
  siteContent,
  type OfficialDepartment,
  type OfficialFacility,
  type OfficialNotice,
} from "@/config/siteContent";
import { SiteHeader } from "@/components/site/SiteHeader";
import {
  HERO_IMAGE_STYLE,
  HERO_IMAGE_CAPTION,
  HOME_BG_DIM,
  HOME_BG_IMAGES,
  HOME_BG_POSITION,
  HOME_BG_ROTATE_SECONDS,
} from "@/config/home";

const quickAccessIcons: Record<string, LucideIcon> = {
  student: GraduationCap,
  counsellor: UsersRound,
  office: Building2,
  map: MapPin,
  departments: School,
  notices: Megaphone,
};

const facilityCategoryIcons: Record<string, LucideIcon> = {
  "Academic & Research": BookOpen,
  "Computing & Labs": Wifi,
  "Student Life & Hostels": House,
  "Campus Amenities": Landmark,
};

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const isInRevealRange = () => {
      const bounds = element.getBoundingClientRect();
      const isAtPageBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2;
      return (
        isAtPageBottom ||
        (bounds.top < window.innerHeight * 0.9 && bounds.bottom > 0)
      );
    };
    const revealIfInRange = () => {
      if (window.scrollY > 0) {
        document.documentElement.classList.add("site-reveal-enabled");
      }
      if (isInRevealRange()) setVisible(true);
    };

    if (isInRevealRange()) setVisible(true);
    else setVisible(false);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(element);
    window.addEventListener("load", revealIfInRange);
    window.addEventListener("resize", revealIfInRange);
    window.addEventListener("scroll", revealIfInRange, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("load", revealIfInRange);
      window.removeEventListener("resize", revealIfInRange);
      window.removeEventListener("scroll", revealIfInRange);
    };
  }, []);

  return { ref, visible };
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`site-reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ "--site-reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

function AnimatedStat({
  label,
  value,
  description,
  delay,
}: {
  label: string;
  value: string;
  description?: string | undefined;
  delay: number;
}) {
  const { ref, visible } = useScrollReveal();
  const numericMatch = value.match(/^(\d[\d,]*)/);
  const matchedStr = numericMatch?.[1];
  const rawNum = matchedStr ? Number(matchedStr.replace(/,/g, "")) : null;
  const suffix = matchedStr ? value.slice(matchedStr.length) : "";
  const [count, setCount] = useState(rawNum === null ? value : "0");

  useEffect(() => {
    if (!visible || rawNum === null) return;
    const startedAt = performance.now();
    const duration = 1200;
    let frame = 0;
    const update = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const current = Math.round(rawNum * progress);
      setCount(`${current.toLocaleString()}${suffix}`);
      if (progress < 1) frame = window.requestAnimationFrame(update);
    };
    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [rawNum, suffix, visible]);

  return (
    <div
      ref={ref}
      className={`site-reveal site-stat ${visible ? "is-visible" : ""}`}
      style={{ "--site-reveal-delay": `${delay}ms` } as CSSProperties}
    >
      <strong>{count}</strong>
      <span>{label}</span>
      {description && (
        <small className="block mt-1 text-xs text-muted-foreground opacity-80">
          {description}
        </small>
      )}
    </div>
  );
}

export function SiteHome() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeBackground, setActiveBackground] = useState(0);
  const [activeGalleryImage, setActiveGalleryImage] = useState<number | null>(null);

  // Filter States
  const [deptCategory, setDeptCategory] = useState<string>("All");
  const [facilityCategory, setFacilityCategory] = useState<string>("All");
  const [noticeCategory, setNoticeCategory] = useState<string>("All");
  const [galleryTab, setGalleryTab] = useState<"All" | "Photos" | "Videos">("All");

  const galleryImages = HOME_BG_IMAGES;

  useEffect(() => {
    const onScroll = () => {
      const footer = document.querySelector(".site-footer");
      const footerIsVisible =
        footer instanceof HTMLElement && footer.getBoundingClientRect().top < window.innerHeight;
      setShowBackToTop(window.scrollY > 600 && !footerIsVisible);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let idleTimer = 0;
    const resetIdleTimer = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        });
      }, 90_000);
    };
    const activityEvents: Array<keyof WindowEventMap> = [
      "pointerdown",
      "touchstart",
      "wheel",
      "scroll",
    ];
    resetIdleTimer();
    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, resetIdleTimer, { passive: true }),
    );
    return () => {
      window.clearTimeout(idleTimer);
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, resetIdleTimer),
      );
    };
  }, []);

  useEffect(() => {
    if (activeGalleryImage === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveGalleryImage(null);
      if (event.key === "ArrowLeft") {
        setActiveGalleryImage((index) =>
          index === null ? null : (index - 1 + galleryImages.length) % galleryImages.length,
        );
      }
      if (event.key === "ArrowRight") {
        setActiveGalleryImage((index) =>
          index === null ? null : (index + 1) % galleryImages.length,
        );
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeGalleryImage, galleryImages.length]);

  useEffect(() => {
    if (HOME_BG_IMAGES.length < 2) return;
    const interval = window.setInterval(() => {
      setActiveBackground((current) => (current + 1) % HOME_BG_IMAGES.length);
    }, HOME_BG_ROTATE_SECONDS * 1000);
    return () => window.clearInterval(interval);
  }, []);

  // Filtered Lists
  const filteredDepts =
    deptCategory === "All"
      ? officialDepartments
      : officialDepartments.filter((d) => d.category === deptCategory);

  const filteredFacilities =
    facilityCategory === "All"
      ? officialFacilities
      : officialFacilities.filter((f) => f.category === facilityCategory);

  const filteredNotices =
    noticeCategory === "All"
      ? officialNotices
      : officialNotices.filter((n) => n.category === noticeCategory);

  return (
    <div className="site-home">
      <SiteHeader />

      <div className="site-page-content">
        {/* =================================================================
            HERO SECTION
            ================================================================= */}
        <section className="site-hero" id="home" aria-labelledby="site-hero-title">
          <svg className="site-architecture" viewBox="0 0 900 720" fill="none" aria-hidden="true">
            <path d="M40 720V290C40 128 172 0 334 0s294 128 294 290v430M108 720V294c0-124 102-224 226-224s226 100 226 224v426M176 720V298c0-86 72-156 158-156s158 70 158 156v422" />
            <path d="M75 290h468M143 294h384M211 298h248M40 374h588M40 458h588M40 542h588M40 626h588M40 720h588M690 720V180m68 540V120m68 600V180" />
          </svg>
          <div
            className={`site-hero-layout${HERO_IMAGE_STYLE === "framed" ? " site-hero-layout-framed" : ""}`}
          >
            <div className="site-hero-content">
              <p className="site-hero-institution">
                {collegeInfo.shortInstitutionName}
                <span>(Autonomous)</span>
              </p>
              <p className="site-hero-location">{collegeInfo.address} – Estd. {collegeInfo.establishedYear}</p>
              <div className="site-hero-lockup">
                <span>{siteContent.hero.wordmark}</span>
                <p>{siteContent.hero.lockupDescription}</p>
              </div>
              <h1 id="site-hero-title">{siteContent.hero.title}</h1>
              <p className="site-hero-description">{siteContent.hero.description}</p>
              <div className="site-hero-actions">
                <Link className="site-button site-button-cream" to="/campus">
                  <MapPin aria-hidden="true" strokeWidth={1.5} />
                  {siteContent.hero.exploreLabel}
                </Link>
                <a className="site-button site-button-outline" href="#departments">
                  {siteContent.hero.departmentsLabel}
                </a>
              </div>
            </div>
            <div
              className={`site-hero-image-frame site-hero-image-frame-${HERO_IMAGE_STYLE}${HOME_BG_IMAGES.length ? "" : " site-hero-image-frame-fallback"}`}
              style={
                {
                  "--home-bg-dim": HOME_BG_DIM * 0.5,
                  "--home-bg-position": HOME_BG_POSITION,
                } as CSSProperties
              }
            >
              <div className="site-hero-image-panel" aria-label={siteContent.hero.imageAlt} role="img">
                {HOME_BG_IMAGES.map((image, index) => (
                  <img
                    key={image}
                    src={image}
                    alt={collegeInfo.institutionName}
                    className={index === activeBackground ? "is-active" : ""}
                    fetchPriority={index === 0 ? "high" : "auto"}
                  />
                ))}
              </div>
              {HERO_IMAGE_STYLE === "framed" &&
                (HERO_IMAGE_CAPTION || HOME_BG_IMAGES.length > 1) && (
                  <div className="site-hero-image-caption">
                    <span>{HERO_IMAGE_CAPTION || "Arunai Engineering College Campus"}</span>
                    {HOME_BG_IMAGES.length > 1 && (
                      <div className="site-hero-image-indicators" aria-label="Campus photos">
                        {HOME_BG_IMAGES.map((image, index) => (
                          <button
                            key={image}
                            type="button"
                            className={index === activeBackground ? "is-active" : ""}
                            aria-label={`Show campus photo ${index + 1}`}
                            aria-current={index === activeBackground ? "true" : undefined}
                            onClick={() => setActiveBackground(index)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
            </div>
          </div>
          <a className="site-scroll-cue" href="#about" aria-label={siteContent.hero.scrollLabel}>
            <span />
            <ArrowDown aria-hidden="true" strokeWidth={1.5} />
          </a>
        </section>

        {/* =================================================================
            QUICK ACCESS SECTION
            ================================================================= */}
        <section className="site-quick-access" aria-labelledby="quick-access-title">
          <h2 id="quick-access-title" className="site-visually-hidden">
            {siteContent.quickAccess.title}
          </h2>
          <div className="site-quick-grid">
            {siteContent.quickAccess.items.map((item) => {
              const Icon = quickAccessIcons[item.icon] ?? GraduationCap;
              const content = (
                <>
                  <Icon aria-hidden="true" className="site-quick-icon" strokeWidth={1.5} />
                  <span className="site-quick-copy">
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                  </span>
                  <ArrowRight aria-hidden="true" className="site-quick-arrow" strokeWidth={1.5} />
                </>
              );
              const cardClassName = "site-quick-card";
              if ("role" in item) {
                return (
                  <Link
                    key={item.title}
                    className={cardClassName}
                    to="/erp/login"
                    search={{ role: item.role as "student" | "staff" | "hod" }}
                  >
                    {content}
                  </Link>
                );
              }
              if (item.href.startsWith("/")) {
                return (
                  <Link key={item.title} className={cardClassName} to={item.href as any}>
                    {content}
                  </Link>
                );
              }
              return (
                <a key={item.title} className={cardClassName} href={item.href}>
                  {content}
                </a>
              );
            })}
          </div>
        </section>

        {/* =================================================================
            1. ABOUT SECTION (Official Institutional Profile, Vision & Mission)
            ================================================================= */}
        <section className="site-section site-about" id="about" aria-labelledby="site-about-title">
          <div className="site-section-inner site-about-grid">
            <Reveal>
              <p className="site-eyebrow">{siteContent.about.eyebrow}</p>
              <h2 id="site-about-title" className="site-section-title">
                {siteContent.about.title}
              </h2>
              <div className="site-body-copy">
                <p>{collegeInfo.profile}</p>
                <p>{collegeInfo.campusOverview}</p>
              </div>

              {/* Vision & Mission Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                <div className="p-4 rounded-xl border border-border bg-surface shadow-xs">
                  <div className="flex items-center gap-2 mb-2 text-accent font-semibold text-base">
                    <Sparkles className="size-5 text-accent" />
                    <span>Vision</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    "{collegeInfo.vision}"
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-surface shadow-xs">
                  <div className="flex items-center gap-2 mb-2 text-accent font-semibold text-base">
                    <Award className="size-5 text-accent" />
                    <span>Mission</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    "{collegeInfo.mission}"
                  </p>
                </div>
              </div>

              <dl className="site-facts-grid">
                {siteContent.about.facts.map((fact) => (
                  <div key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4">
                <a
                  href={collegeInfo.officialWebsite}
                  target="_blank"
                  rel="noreferrer"
                  className="site-source-attribution"
                >
                  <ExternalLink className="size-3.5" />
                  Source: Official Arunai Engineering College Website (arunai.org)
                </a>
              </div>
            </Reveal>

            <Reveal delay={80} className="site-about-media">
              {HOME_BG_IMAGES[0] ? (
                <div className="rounded-2xl overflow-hidden border border-border shadow-md">
                  <img
                    src={HOME_BG_IMAGES[0]}
                    alt={siteContent.about.imageAlt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="site-about-placeholder" role="img" aria-label={siteContent.about.imageFallback}>
                  <Building2 aria-hidden="true" strokeWidth={1.5} />
                  <span>{siteContent.about.imageFallback}</span>
                </div>
              )}
            </Reveal>
          </div>
        </section>

        {/* =================================================================
            2. INSTITUTIONAL HIGHLIGHTS (Key Numerical Metrics)
            ================================================================= */}
        <section className="site-stats" aria-label={siteContent.stats.title}>
          <div className="site-section-inner site-stats-grid">
            {institutionalHighlights.map((stat, index) => (
              <AnimatedStat
                key={stat.label}
                label={stat.label}
                value={stat.value}
                description={stat.description}
                delay={index * 70}
              />
            ))}
          </div>
        </section>

        {/* =================================================================
            3. DEPARTMENTS SECTION (All 13 Official Academic Departments)
            ================================================================= */}
        <section
          className="site-section site-department"
          id="departments"
          aria-labelledby="site-departments-title"
        >
          <div className="site-section-inner">
            <Reveal>
              <p className="site-eyebrow">{siteContent.departments.eyebrow}</p>
              <h2 id="site-departments-title" className="site-section-title">
                {siteContent.departments.title}
              </h2>
              <p className="site-section-intro">{siteContent.departments.description}</p>
            </Reveal>

            {/* Department Category Filter Pills */}
            <div className="site-filter-bar" role="tablist" aria-label="Department categories">
              {["All", "Computing & AI", "Core Engineering", "Specialized Engineering", "Management"].map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={deptCategory === cat}
                    className={`site-pill-button ${deptCategory === cat ? "is-active" : ""}`}
                    onClick={() => setDeptCategory(cat)}
                  >
                    {cat}
                  </button>
                ),
              )}
            </div>

            {/* Department Cards Grid */}
            <div className="site-departments-grid">
              {filteredDepts.map((dept, index) => (
                <Reveal key={dept.id} delay={(index % 3) * 60} className="site-dept-card">
                  <div>
                    <div className="site-dept-header">
                      <span className="site-dept-badge">{dept.code}</span>
                      <span className="site-dept-category">{dept.category}</span>
                    </div>
                    <h3 className="site-dept-title">{dept.name}</h3>
                    <div className="site-dept-degree">{dept.degree}</div>
                    <p className="site-dept-desc">{dept.description}</p>
                  </div>
                  <div className="site-dept-actions">
                    <a
                      href={dept.officialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="site-dept-action"
                    >
                      <span>View Details</span>
                      <ExternalLink className="size-4" strokeWidth={1.5} />
                    </a>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* =================================================================
            4. FACILITIES SECTION (Primary and Additional College Facilities)
            ================================================================= */}
        <section
          className="site-section site-facilities"
          id="facilities"
          aria-labelledby="site-facilities-title"
        >
          <div className="site-section-inner">
            <Reveal>
              <p className="site-eyebrow">{siteContent.facilities.eyebrow}</p>
              <h2 id="site-facilities-title" className="site-section-title">
                {siteContent.facilities.title}
              </h2>
              <p className="site-section-intro">{siteContent.facilities.description}</p>
            </Reveal>

            {/* Facilities Category Filter Pills */}
            <div className="site-filter-bar" role="tablist" aria-label="Facility categories">
              {[
                "All",
                "Academic & Research",
                "Computing & Labs",
                "Student Life & Hostels",
                "Campus Amenities",
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={facilityCategory === cat}
                  className={`site-pill-button ${facilityCategory === cat ? "is-active" : ""}`}
                  onClick={() => setFacilityCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="site-facilities-grid">
              {filteredFacilities.map((facility, index) => {
                const Icon = facilityCategoryIcons[facility.category] ?? Building2;
                return (
                  <Reveal key={facility.id} delay={(index % 4) * 60} className="site-facility-card">
                    <div className="flex items-center justify-between mb-3">
                      <Icon aria-hidden="true" strokeWidth={1.5} />
                      {facility.isPrimary && (
                        <span className="site-facility-primary-badge">Primary</span>
                      )}
                    </div>
                    <span className="site-facility-tag">{facility.category}</span>
                    <h3>{facility.name}</h3>
                    <p>{facility.description}</p>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* =================================================================
            5. NOTICES / NEWS SECTION (Official Verified Updates)
            ================================================================= */}
        <section
          className="site-section site-notices"
          id="notices"
          aria-labelledby="site-notices-title"
        >
          <div className="site-section-inner">
            <Reveal>
              <p className="site-eyebrow">{siteContent.notices.eyebrow}</p>
              <h2 id="site-notices-title" className="site-section-title">
                {siteContent.notices.title}
              </h2>
              <p className="site-section-intro">{siteContent.notices.description}</p>
            </Reveal>

            {/* Notice Category Filter Pills */}
            <div className="site-filter-bar" role="tablist" aria-label="Notice categories">
              {["All", "Examinations", "Collaborations", "Events", "FDP & Workshops"].map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={noticeCategory === cat}
                    className={`site-pill-button ${noticeCategory === cat ? "is-active" : ""}`}
                    onClick={() => setNoticeCategory(cat)}
                  >
                    {cat}
                  </button>
                ),
              )}
            </div>

            {filteredNotices.length > 0 ? (
              <div className="site-notice-list">
                {filteredNotices.map((notice, index) => (
                  <Reveal key={notice.id} delay={index * 60} className="site-notice">
                    <span className="site-notice-date font-mono font-medium">
                      {new Intl.DateTimeFormat("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(notice.date))}
                    </span>
                    <div className="site-notice-copy">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-accent">{notice.category}</span>
                        {notice.sourceRef && (
                          <span className="text-xs text-muted-foreground">• {notice.sourceRef}</span>
                        )}
                      </div>
                      <h3>{notice.title}</h3>
                      <p className="site-notice-desc">{notice.description}</p>
                    </div>
                    {notice.officialUrl && (
                      <a
                        href={notice.officialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-accent p-2"
                        aria-label="View official circular"
                      >
                        <ExternalLink className="size-5" strokeWidth={1.5} />
                      </a>
                    )}
                  </Reveal>
                ))}
              </div>
            ) : (
              <div className="site-empty-box">
                <CalendarDays />
                <h3>No Notices Available</h3>
                <p>There are no active notices published in this category at present.</p>
              </div>
            )}
          </div>
        </section>

        {/* =================================================================
            6. GALLERY PREVIEW SECTION (Official Media & Videos Filter)
            ================================================================= */}
        <section
          className="site-section site-gallery"
          id="gallery"
          aria-labelledby="site-gallery-title"
        >
          <div className="site-section-inner">
            <Reveal>
              <p className="site-eyebrow">{siteContent.gallery.eyebrow}</p>
              <h2 id="site-gallery-title" className="site-section-title">
                {siteContent.gallery.title}
              </h2>
            </Reveal>

            {/* Gallery Category Filter Tabs */}
            <div className="site-filter-bar" role="tablist" aria-label="Gallery media types">
              {(["All", "Photos", "Videos"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={galleryTab === tab}
                  className={`site-pill-button ${galleryTab === tab ? "is-active" : ""}`}
                  onClick={() => setGalleryTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {galleryTab === "Videos" ? (
              <div className="site-empty-box">
                <Video />
                <h3>Official Video Gallery</h3>
                <p>Gallery content will be updated soon.</p>
              </div>
            ) : galleryImages.length > 0 ? (
              <div className="site-gallery-grid">
                {galleryImages.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    className={`site-gallery-tile site-gallery-tile-${index % 4}`}
                    onClick={() => setActiveGalleryImage(index)}
                    aria-label={`${siteContent.gallery.imageAlt} ${index + 1}`}
                  >
                    <img
                      src={image}
                      alt={siteContent.gallery.imageAlt}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="site-empty-box">
                <ImageIcon />
                <h3>Official Media Gallery</h3>
                <p>Gallery content will be updated soon.</p>
              </div>
            )}
          </div>
        </section>

        {/* =================================================================
            7. CONTACT SECTION (Official Institutional Contact Channels)
            ================================================================= */}
        <section
          className="site-section site-contact"
          id="contact"
          aria-labelledby="site-contact-title"
        >
          <div className="site-section-inner">
            <Reveal>
              <p className="site-eyebrow">{siteContent.contact.eyebrow}</p>
              <h2 id="site-contact-title" className="site-section-title">
                {siteContent.contact.title}
              </h2>
            </Reveal>

            <div className="site-contact-blocks">
              {/* Box 1: Address & Campus Map */}
              <Reveal delay={40} className="site-contact-box">
                <h3>
                  <MapPin />
                  <span>Campus Address</span>
                </h3>
                <p>
                  <strong>{officialContact.institutionName}</strong>
                  <br />
                  {officialContact.addressLine1}
                  <br />
                  {officialContact.addressLine2} – {officialContact.pincode}
                </p>
                <div className="site-action-links">
                  <Link to="/campus" className="site-action-btn">
                    <Compass className="size-4" />
                    <span>Open Campus Map</span>
                  </Link>
                  <a
                    href={officialContact.officialWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="site-action-btn site-action-btn-outline"
                  >
                    <ExternalLink className="size-4" />
                    <span>arunai.org</span>
                  </a>
                </div>
              </Reveal>

              {/* Box 2: General Enquiry */}
              <Reveal delay={80} className="site-contact-box">
                <h3>
                  <Phone />
                  <span>General Enquiry</span>
                </h3>
                <p>
                  For administrative and academic inquiries, reach our central campus exchange:
                  <br />
                  <strong className="text-foreground text-base">
                    {officialContact.enquiryDisplay}
                  </strong>
                </p>
                <div className="site-action-links">
                  {officialContact.generalEnquiryPhones.map((ph) => (
                    <a
                      key={ph}
                      href={`tel:${ph.replace(/-/g, "")}`}
                      className="site-action-btn site-action-btn-outline"
                    >
                      <Phone className="size-4" />
                      <span>Call {ph}</span>
                    </a>
                  ))}
                </div>
              </Reveal>

              {/* Box 3: Admission Desk */}
              <Reveal delay={120} className="site-contact-box">
                <h3>
                  <GraduationCap />
                  <span>Admission Desk</span>
                </h3>
                <p>
                  Direct admission helplines for undergraduate and postgraduate degree admissions:
                </p>
                <div className="site-action-links">
                  {officialContact.admissionPhones.map((ph) => (
                    <a
                      key={ph}
                      href={`tel:${ph}`}
                      className="site-action-btn site-action-btn-outline"
                    >
                      <Phone className="size-4" />
                      <span>{ph}</span>
                    </a>
                  ))}
                </div>
              </Reveal>

              {/* Box 4: Official Emails */}
              <Reveal delay={160} className="site-contact-box">
                <h3>
                  <Mail />
                  <span>Official Emails</span>
                </h3>
                <p>
                  <strong>General Communication:</strong>
                  <br />
                  <a
                    href={`mailto:${officialContact.email}`}
                    className="text-accent underline font-medium"
                  >
                    {officialContact.email}
                  </a>
                  <br />
                  <br />
                  <strong>Student Verification & COE:</strong>
                  <br />
                  <a
                    href={`mailto:${officialContact.studentVerificationEmail}`}
                    className="text-accent underline font-medium"
                  >
                    {officialContact.studentVerificationEmail}
                  </a>
                </p>
                <div className="site-action-links">
                  <a
                    href={`mailto:${officialContact.email}`}
                    className="site-action-btn"
                  >
                    <Mail className="size-4" />
                    <span>Compose Email</span>
                  </a>
                </div>
              </Reveal>
            </div>

            {/* Source Attribution Badge */}
            <div className="mt-8 text-center sm:text-left">
              <a
                href={collegeInfo.officialWebsite}
                target="_blank"
                rel="noreferrer"
                className="site-source-attribution"
              >
                <ExternalLink className="size-3.5" />
                Source: Official Arunai Engineering College Website (arunai.org)
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* =================================================================
          FOOTER
          ================================================================= */}
      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-brand">
            <a href="#home" className="site-footer-wordmark">
              {siteContent.projectName}
            </a>
            <p>{collegeInfo.shortInstitutionName}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Autonomous – Velu Nagar, Tiruvannamalai
            </p>
          </div>
          <div className="site-footer-links">
            <h2>{siteContent.footer.quickLinksTitle}</h2>
            <nav aria-label={siteContent.footer.quickLinksTitle}>
              <Link to="/campus">Campus Map</Link>
              <a href="#about">About</a>
              <a href="#departments">Departments</a>
              <a href="#facilities">Facilities</a>
              <a href="#notices">Notices</a>
              <a href="#contact">Contact</a>
            </nav>
            <a
              className="site-footer-official-link"
              href={collegeInfo.officialWebsite}
              target="_blank"
              rel="noreferrer"
            >
              {siteContent.footer.officialSiteLabel}
              <ExternalLink aria-hidden="true" strokeWidth={1.5} />
            </a>
          </div>
          <a className="site-footer-top" href="#home">
            {siteContent.footer.backToTop}
            <ArrowUp aria-hidden="true" strokeWidth={1.5} />
          </a>
          <p className="site-copyright">{siteContent.footer.copyright}</p>
        </div>
      </footer>

      {showBackToTop && (
        <button
          type="button"
          className="site-back-to-top"
          aria-label={siteContent.footer.backToTop}
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "auto"
                : "smooth",
            })
          }
        >
          <ArrowDown aria-hidden="true" strokeWidth={1.5} />
        </button>
      )}

      {/* Lightbox for Gallery */}
      {activeGalleryImage !== null && galleryImages[activeGalleryImage] && (
        <div
          className="site-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={siteContent.gallery.imageAlt}
          onClick={(event) => {
            if (event.target === event.currentTarget) setActiveGalleryImage(null);
          }}
        >
          <button
            type="button"
            className="site-lightbox-close"
            aria-label={siteContent.gallery.closeLabel}
            onClick={() => setActiveGalleryImage(null)}
          >
            <X aria-hidden="true" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="site-lightbox-control site-lightbox-previous"
            aria-label={siteContent.gallery.previousLabel}
            onClick={() =>
              setActiveGalleryImage(
                (activeGalleryImage - 1 + galleryImages.length) % galleryImages.length,
              )
            }
          >
            <ChevronLeft aria-hidden="true" strokeWidth={1.5} />
          </button>
          <img
            src={galleryImages[activeGalleryImage]}
            alt={siteContent.gallery.imageAlt}
          />
          <button
            type="button"
            className="site-lightbox-control site-lightbox-next"
            aria-label={siteContent.gallery.nextLabel}
            onClick={() =>
              setActiveGalleryImage((activeGalleryImage + 1) % galleryImages.length)
            }
          >
            <ChevronRight aria-hidden="true" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}
