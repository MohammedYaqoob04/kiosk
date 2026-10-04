import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

import { AppAccessibilityButton } from "@/components/AppShell";
import { campusServices, type HomeService } from "@/content/home";

const highlights: readonly HomeService[] = [
  campusServices[0]!,
  campusServices[1]!,
  campusServices[2]!,
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
  const [activeHighlight, setActiveHighlight] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveHighlight((current) => (current + 1) % highlights.length);
    }, 6000);
    return () => window.clearInterval(interval);
  }, []);

  const active = highlights[activeHighlight]!;
  const HighlightIcon = active.icon;

  return (
    <div className="home-screen">
      <div aria-hidden="true" className="home-bottom-shade" />
      <div className="home-welcome-layout">
        <section className="home-welcome">
          <div aria-hidden="true" className="home-left-shade" />
          <div className="home-welcome-copy">
            <p className="home-eyebrow">WELCOME TO</p>
            <h1 className="home-title">
              <span>Arunai Engineering</span> <span>College</span>
            </h1>
            <p className="home-autonomous">(Autonomous)</p>
            <p className="home-location">
              <MapPin aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />
              Velu Nagar, Tiruvannamalai
            </p>
            <div className="home-divider" />
            <a href="/menu" className="primary-gradient home-start-button">
              Touch to start
            </a>
          </div>

          <div className="home-essentials">
            {["Est. -- add from college", "-- add from college", "Velu Nagar, Tiruvannamalai"].map(
              (item) => (
                <span key={item} className="home-essential-chip">
                  {item}
                </span>
              ),
            )}
          </div>
        </section>

        <aside className="home-highlight-column">
          <div className="home-highlight-accessibility">
            <AppAccessibilityButton />
          </div>
          <section className="home-highlight-card" aria-label="College highlights">
            <div className="home-highlight-content" key={active.title}>
              <p className="home-highlight-eyebrow">CAMPUS HIGHLIGHT</p>
              <div className="home-highlight-icon">
                <HighlightIcon aria-hidden="true" className="size-6" strokeWidth={1.5} />
              </div>
              <h2 className="font-display text-2xl font-semibold text-foreground">
                {active.title}
              </h2>
              <p className="mt-2 text-lg text-muted-foreground">{active.description}</p>
            </div>
            <div className="home-highlight-dots" aria-label="Choose a highlight">
              {highlights.map((highlight, index) => (
                <button
                  key={highlight.title}
                  type="button"
                  aria-label={`Show highlight ${index + 1}: ${highlight.title}`}
                  aria-pressed={index === activeHighlight}
                  onClick={() => setActiveHighlight(index)}
                  className="home-highlight-dot-hit"
                >
                  <span
                    className={`home-highlight-dot ${index === activeHighlight ? "is-active" : ""}`}
                  />
                </button>
              ))}
            </div>
          </section>
        </aside>

        <div className="home-mobile-essentials">
          {["Est. -- add from college", "-- add from college", "Velu Nagar, Tiruvannamalai"].map(
            (item) => (
              <span key={item} className="home-essential-chip">
                {item}
              </span>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
