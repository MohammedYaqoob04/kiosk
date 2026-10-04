import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AppAccessibilityButton } from "@/components/AppShell";
import { department } from "@/config/department";

const logoImages = Object.values(
  import.meta.glob<string>("/src/assets/logo.{svg,png,jpg,jpeg,webp}", {
    eager: true,
    query: "?url",
    import: "default",
  }),
);
const backgroundImages = Object.values(
  import.meta.glob<string>("/src/assets/home/bg-*.{jpg,jpeg,png,webp}", {
    eager: true,
    query: "?url",
    import: "default",
  }),
).sort();
const highlights = [
  "Admissions open - details at the office",
  "Please contact the office for campus services",
  "Welcome to Arunai Engineering College",
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KIOSK | Arunai Engineering College" },
      { name: "description", content: "Welcome to Arunai Engineering College." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [now, setNow] = useState(() => new Date());
  const [activeHighlight, setActiveHighlight] = useState(0);
  const [activeBackground, setActiveBackground] = useState(0);
  const [language, setLanguage] = useState<"en" | "ta">("en");

  useEffect(() => {
    const clockInterval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    const tickerInterval = window.setInterval(() => {
      setActiveHighlight((current) => (current + 1) % highlights.length);
    }, 6000);
    return () => window.clearInterval(tickerInterval);
  }, []);

  useEffect(() => {
    if (backgroundImages.length < 2) return;
    const backgroundInterval = window.setInterval(() => {
      setActiveBackground((current) => (current + 1) % backgroundImages.length);
    }, 8000);
    return () => window.clearInterval(backgroundInterval);
  }, []);

  const date = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  const time = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);

  return (
    <div className="home-screen">
      <div className="home-backdrop" aria-hidden="true">
        <div className="home-backdrop-glow home-backdrop-glow-one" />
        <div className="home-backdrop-glow home-backdrop-glow-two" />
        <div className="home-backdrop-glow home-backdrop-glow-three" />
        {backgroundImages.map((image, index) => (
          <img
            key={image}
            src={image}
            alt=""
            className={`home-backdrop-image ${index === activeBackground ? "is-visible" : ""}`}
          />
        ))}
      </div>

      <div className="home-corner home-corner-left">
        <Link to="/erp" className="home-login-pill">
          Login
        </Link>
      </div>
      <div className="home-corner home-corner-right">
        <AppAccessibilityButton />
        <div className="home-language-pill" role="group" aria-label="Language">
          <button type="button" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>
            EN
          </button>
          <span aria-hidden="true">|</span>
          <button type="button" aria-pressed={language === "ta"} onClick={() => setLanguage("ta")}>
            த
          </button>
        </div>
      </div>

      <section className="home-content">
        <div className="home-center-stack">
          {logoImages[0] && (
            <img
              className="home-college-logo"
              src={logoImages[0]}
              alt="Arunai Engineering College logo"
            />
          )}
          <h1 className="home-title">Arunai Engineering College</h1>
          <p className="home-subtitle">(Autonomous) - Velu Nagar, Tiruvannamalai - 606603</p>
          <p className="home-department">Department of {department.name}</p>
          <div className="home-start-stack">
            <Link to="/menu" className="home-start-button">
              Touch to start
            </Link>
            <p lang="ta" className="home-start-tamil">
              தொடங்க தொடவும்
            </p>
          </div>
          <p className="home-clock" aria-live="off">
            {date} | {time}
          </p>
        </div>
      </section>

      <div className="home-highlights" aria-live="polite" aria-atomic="true">
        {highlights.map((highlight, index) => (
          <p
            key={highlight}
            aria-hidden={index !== activeHighlight}
            className={`home-highlight-line ${index === activeHighlight ? "is-visible" : ""}`}
          >
            {highlight}
          </p>
        ))}
      </div>
    </div>
  );
}
