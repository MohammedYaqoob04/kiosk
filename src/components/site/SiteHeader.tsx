import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Accessibility, ArrowLeft, Menu, X } from "lucide-react";

import { useAccessibilityPanel } from "@/lib/accessibility-panel-context";
import { SHOW_PLACEHOLDERS } from "@/config/home";
import { siteContent } from "@/config/siteContent";

export function SiteHeader({ campus = false }: { campus?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerSolid, setHeaderSolid] = useState(campus);
  const openAccessibility = useAccessibilityPanel();
  const navItems = siteContent.header.nav.filter(
    (item) =>
      SHOW_PLACEHOLDERS ||
      item.href !== "#notices" ||
      siteContent.notices.items.some((notice) => !notice.title.startsWith("-- add from college")),
  );

  useEffect(() => {
    if (campus) return;
    const onScroll = () => setHeaderSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [campus]);

  const navHref = (href: string) =>
    campus && href.startsWith("#") ? `/${href}` : href;

  return (
    <header className={`site-header ${headerSolid ? "is-solid" : ""} ${campus ? "site-header-campus" : ""}`}>
      {campus ? (
        <Link to="/" replace className="site-header-back">
          <ArrowLeft aria-hidden="true" strokeWidth={1.5} />
          {siteContent.header.backLabel}
        </Link>
      ) : (
        <a className="site-brand" href="#home" aria-label={siteContent.header.homeLabel}>
          <span className="site-brand-mark">{siteContent.projectName}</span>
          <span className="site-brand-name">{siteContent.shortInstitutionName}</span>
        </a>
      )}

      {campus ? (
        <div className="site-header-campus-title">
          {siteContent.shortInstitutionName} Kiosk
        </div>
      ) : (
        <nav className="site-nav" aria-label={siteContent.header.mainNavigationLabel}>
          {navItems.map((item) =>
            item.href === "/campus" ? (
              <Link key={item.href} to="/campus" activeProps={{ className: "is-active" }}>
                {item.label}
              </Link>
            ) : (
              <a key={item.href} href={navHref(item.href)}>
                {item.label}
              </a>
            ),
          )}
        </nav>
      )}

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
        {!campus && (
          <button
            type="button"
            className="site-menu-toggle"
            aria-label={menuOpen ? siteContent.header.menuCloseLabel : siteContent.header.menuOpenLabel}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X strokeWidth={1.5} /> : <Menu strokeWidth={1.5} />}
          </button>
        )}
      </div>

      {!campus && menuOpen && (
        <nav className="site-mobile-nav" aria-label={siteContent.header.mobileNavigationLabel}>
          {navItems.map((item) =>
            item.href === "/campus" ? (
              <Link key={item.href} to="/campus" onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href}
                href={navHref(item.href)}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ),
          )}
        </nav>
      )}
    </header>
  );
}
