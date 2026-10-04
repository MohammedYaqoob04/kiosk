import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Accessibility,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Building2,
  BusFront,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  ExternalLink,
  GraduationCap,
  House,
  Microscope,
  Menu,
  UtensilsCrossed,
  UsersRound,
  X,
} from "lucide-react";

import { useAccessibilityPanel } from "@/lib/accessibility-panel-context";
import { siteContent } from "@/config/siteContent";

const backgroundImages = Object.values(
  import.meta.glob<string>("/src/assets/home/bg-*.{jpg,jpeg,png,webp}", {
    eager: true,
    query: "?url",
    import: "default",
  }),
).sort();
const galleryImages = Object.values(
  import.meta.glob<string>("/src/assets/site/gallery-*.{jpg,jpeg,png,webp}", {
    eager: true,
    query: "?url",
    import: "default",
  }),
).sort();
const galleryPlaceholders = [0, 1, 2, 3];

const quickAccessIcons = [GraduationCap, UsersRound, Building2, CalendarDays];
const facilityIcons = [BookOpen, Microscope, House, BusFront, Dumbbell, UtensilsCrossed];
const aboutImages = Object.values(
  import.meta.glob<string>("/src/assets/site/about.{jpg,jpeg,png,webp,svg}", {
    eager: true,
    query: "?url",
    import: "default",
  }),
).sort();

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.14 },
    );
    observer.observe(element);
    return () => observer.disconnect();
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

function AnimatedStat({ label, value, delay }: { label: string; value: string; delay: number }) {
  const { ref, visible } = useScrollReveal();
  const numericValue = /^\d+$/.test(value) ? Number(value) : null;
  const [count, setCount] = useState(numericValue === null ? value : "0");

  useEffect(() => {
    if (!visible || numericValue === null) return;
    const startedAt = performance.now();
    const duration = 1200;
    let frame = 0;
    const update = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      setCount(String(Math.round(numericValue * progress)));
      if (progress < 1) frame = window.requestAnimationFrame(update);
    };
    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [numericValue, visible]);

  return (
    <div
      ref={ref}
      className={`site-reveal site-stat ${visible ? "is-visible" : ""}`}
      style={{ "--site-reveal-delay": `${delay}ms` } as CSSProperties}
    >
      <strong>{count}</strong>
      <span>{label}</span>
    </div>
  );
}

export function SiteHome() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerSolid, setHeaderSolid] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeBackground, setActiveBackground] = useState(0);
  const [activeGalleryImage, setActiveGalleryImage] = useState<number | null>(null);
  const openAccessibility = useAccessibilityPanel();

  useEffect(() => {
    const onScroll = () => {
      setHeaderSolid(window.scrollY > 24);
      setShowBackToTop(window.scrollY > 600);
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
  }, [activeGalleryImage]);

  useEffect(() => {
    if (backgroundImages.length < 2) return;
    const interval = window.setInterval(() => {
      setActiveBackground((current) => (current + 1) % backgroundImages.length);
    }, 14_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="site-home">
      <header className={`site-header ${headerSolid ? "is-solid" : ""}`}>
        <a className="site-brand" href="#home" aria-label={siteContent.header.homeLabel}>
          <span className="site-brand-mark">{siteContent.projectName}</span>
          <span className="site-brand-name">{siteContent.shortInstitutionName}</span>
        </a>
        <nav className="site-nav" aria-label={siteContent.header.mainNavigationLabel}>
          {siteContent.header.nav.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="site-header-actions">
          <Link className="site-button site-button-primary site-header-login" to="/erp">
            {siteContent.header.erpLabel}
          </Link>
          <button
            type="button"
            className="accessibility-button"
            aria-label={siteContent.header.accessibilityLabel}
            onClick={openAccessibility}
          >
            <Accessibility aria-hidden="true" className="size-6" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="site-menu-toggle"
            aria-label={menuOpen ? siteContent.header.menuCloseLabel : siteContent.header.menuOpenLabel}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X strokeWidth={1.5} /> : <Menu strokeWidth={1.5} />}
          </button>
        </div>
        {menuOpen && (
          <nav className="site-mobile-nav" aria-label={siteContent.header.mobileNavigationLabel}>
            {siteContent.header.nav.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </a>
            ))}
            <Link to="/erp" onClick={() => setMenuOpen(false)}>
              {siteContent.header.erpLabel}
            </Link>
          </nav>
        )}
      </header>

      <div className="site-page-content">
        <section className="site-hero" id="home" aria-labelledby="site-hero-title">
          <div className="site-hero-background" aria-hidden="true">
            {backgroundImages.map((image, index) => (
              <img
                key={image}
                src={image}
                alt=""
                className={index === activeBackground ? "is-active" : ""}
              />
            ))}
          </div>
          <div className="site-hero-content">
            <p className="site-eyebrow site-hero-eyebrow">{siteContent.hero.eyebrow}</p>
            <h1 id="site-hero-title">{siteContent.hero.title}</h1>
            <p className="site-hero-description">{siteContent.hero.description}</p>
            <div className="site-hero-actions">
              <Link className="site-button site-button-cream" to="/erp">
                {siteContent.hero.erpLabel}
                <ArrowRight aria-hidden="true" strokeWidth={1.5} />
              </Link>
              <a className="site-button site-button-outline" href="#about">
                {siteContent.hero.exploreLabel}
              </a>
            </div>
          </div>
          <a className="site-scroll-cue" href="#about" aria-label={siteContent.hero.scrollLabel}>
            <span />
            <ArrowDown aria-hidden="true" strokeWidth={1.5} />
          </a>
        </section>

        <section className="site-quick-access" aria-labelledby="quick-access-title">
          <h2 id="quick-access-title" className="site-visually-hidden">
            {siteContent.quickAccess.title}
          </h2>
          <div className="site-quick-grid">
            {siteContent.quickAccess.items.map((item, index) => {
              const Icon = quickAccessIcons[index] ?? GraduationCap;
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
              return item.href.startsWith("/") ? (
                <Link key={item.title} className="site-quick-card" to="/erp">
                  {content}
                </Link>
              ) : (
                <a key={item.title} className="site-quick-card" href={item.href}>
                  {content}
                </a>
              );
            })}
          </div>
        </section>

        <section className="site-section site-about" id="about" aria-labelledby="site-about-title">
          <div className="site-section-inner site-about-grid">
            <Reveal>
              <p className="site-eyebrow">{siteContent.about.eyebrow}</p>
              <h2 id="site-about-title" className="site-section-title">
                {siteContent.about.title}
              </h2>
              <div className="site-body-copy">
                {siteContent.about.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </Reveal>
            <Reveal delay={80} className="site-about-media">
              {aboutImages[0] ? (
                <img src={aboutImages[0]} alt={siteContent.about.imageAlt} loading="lazy" />
              ) : (
                <div className="site-about-placeholder" role="img" aria-label={siteContent.about.imageFallback}>
                  <Building2 aria-hidden="true" strokeWidth={1.5} />
                  <span>{siteContent.about.imageFallback}</span>
                </div>
              )}
            </Reveal>
          </div>
        </section>

        <section className="site-stats" aria-label={siteContent.about.eyebrow}>
          <div className="site-section-inner site-stats-grid">
            {siteContent.stats.items.map((stat, index) => (
              <AnimatedStat key={stat.label} {...stat} delay={index * 80} />
            ))}
          </div>
        </section>

        <section
          className="site-section site-department"
          id="department"
          aria-labelledby="site-department-title"
        >
          <div className="site-section-inner">
            <Reveal>
              <p className="site-eyebrow">{siteContent.department.eyebrow}</p>
              <h2 id="site-department-title" className="site-section-title">
                {siteContent.department.title}
              </h2>
              <p className="site-section-intro">{siteContent.department.description}</p>
            </Reveal>
            <div className="site-department-grid">
              <Reveal className="site-info-panel">
                <h3>{siteContent.department.programmesTitle}</h3>
                <ul className="site-detail-list">
                  {siteContent.department.programmes.map((programme) => (
                    <li key={programme}>{programme}</li>
                  ))}
                </ul>
                <h3>{siteContent.department.hodLabel}</h3>
                <p>{siteContent.department.hodName}</p>
              </Reveal>
              <Reveal delay={80} className="site-info-panel">
                <h3>{siteContent.department.highlightsTitle}</h3>
                <ul className="site-highlight-list">
                  {siteContent.department.highlights.map((highlight) => (
                    <li key={highlight}>
                      <GraduationCap aria-hidden="true" strokeWidth={1.5} />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

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
            </Reveal>
            <div className="site-facilities-grid">
              {siteContent.facilities.items.map((facility, index) => {
                const Icon = facilityIcons[index] ?? Building2;
                return (
                  <Reveal key={facility.name} delay={(index % 3) * 80} className="site-facility-card">
                    <Icon aria-hidden="true" strokeWidth={1.5} />
                    <h3>{facility.name}</h3>
                    <p>{facility.description}</p>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

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
            </Reveal>
            <div className="site-notice-list">
              {siteContent.notices.items.map((notice, index) => (
                <Reveal key={`${notice.category}-${index}`} delay={index * 80} className="site-notice">
                  <span className="site-notice-date">{notice.date}</span>
                  <div className="site-notice-copy">
                    <span>{notice.category}</span>
                    <h3>{notice.title}</h3>
                  </div>
                  <ArrowRight aria-hidden="true" strokeWidth={1.5} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

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
            <div className="site-gallery-grid">
              {galleryImages.length > 0
                ? galleryImages.map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      className={`site-gallery-tile site-gallery-tile-${index % 4}`}
                      onClick={() => setActiveGalleryImage(index)}
                      aria-label={`${siteContent.gallery.imageAlt} ${index + 1}`}
                    >
                      <img src={image} alt={siteContent.gallery.imageAlt} loading="lazy" />
                    </button>
                  ))
                : galleryPlaceholders.map((placeholder) => (
                    <div
                      key={placeholder}
                      className={`site-gallery-placeholder site-gallery-tile-${placeholder}`}
                      role="img"
                      aria-label={siteContent.gallery.emptyLabel}
                    >
                      <span>{siteContent.gallery.emptyLabel}</span>
                    </div>
                  ))}
            </div>
          </div>
        </section>

        <section
          className="site-section site-contact"
          id="contact"
          aria-labelledby="site-contact-title"
        >
          <div className="site-section-inner site-contact-grid">
            <Reveal>
              <p className="site-eyebrow">{siteContent.contact.eyebrow}</p>
              <h2 id="site-contact-title" className="site-section-title">
                {siteContent.contact.title}
              </h2>
            </Reveal>
            <Reveal delay={80} className="site-contact-details">
              <div>
                <h3>{siteContent.contact.addressLabel}</h3>
                <p>{siteContent.address}</p>
                <a
                  className="site-text-link"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteContent.address)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {siteContent.contact.mapsLabel}
                  <ExternalLink aria-hidden="true" strokeWidth={1.5} />
                </a>
              </div>
              <div>
                <h3>{siteContent.contact.phoneLabel}</h3>
                <p>{siteContent.contact.phone}</p>
              </div>
              <div>
                <h3>{siteContent.contact.emailLabel}</h3>
                <p>{siteContent.contact.email}</p>
              </div>
            </Reveal>
          </div>
        </section>
      </div>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-brand">
            <a href="#home" className="site-footer-wordmark">
              {siteContent.projectName}
            </a>
            <p>{siteContent.shortInstitutionName}</p>
          </div>
          <div className="site-footer-links">
            <h2>{siteContent.footer.quickLinksTitle}</h2>
            <nav aria-label={siteContent.footer.quickLinksTitle}>
              {siteContent.header.nav.map((item) => (
                <a key={item.href} href={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>
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
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
            })
          }
        >
          <ArrowDown aria-hidden="true" strokeWidth={1.5} />
        </button>
      )}

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
            onClick={() => setActiveGalleryImage((activeGalleryImage + 1) % galleryImages.length)}
          >
            <ChevronRight aria-hidden="true" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}
