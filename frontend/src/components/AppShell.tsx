import { useEffect, useState, type ReactNode } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Accessibility, ArrowLeft, House, UserRound } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  AccessibilityPanelContext,
  useAccessibilityPanel,
} from "@/lib/accessibility-panel-context";
import { useAuth } from "@/lib/auth-context";

interface AppShellProps {
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  footer?: ReactNode;
}

export function AppShell({ leftSlot, rightSlot, footer }: AppShellProps) {
  const {
    warningOpen,
    staySignedIn,
    logout,
    largeText,
    highContrast,
    extendedTimeout,
    setLargeText,
    setHighContrast,
    setExtendedTimeout,
  } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    const updateTime = () => setTime(new Date());
    updateTime();
    const interval = window.setInterval(updateTime, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const openAccessibility = () => setAccessibilityOpen(true);
  const isMenu = pathname === "/menu";
  const isHome = pathname === "/";
  const isLogin = pathname === "/erp/login";
  const isErpChooser = pathname === "/erp";
  const isErpWorkspace = pathname.startsWith("/erp/") && !isLogin;
  const isPassword = pathname === "/erp/password";
  const isCampus = pathname.startsWith("/campus");

  useEffect(() => {
    document.documentElement.classList.toggle("idle-warning", warningOpen);
    return () => document.documentElement.classList.remove("idle-warning");
  }, [warningOpen]);

  const goBack = () => void navigate({ to: "/", replace: true });

  return (
    <AccessibilityPanelContext.Provider value={openAccessibility}>
      <div
        className={`app-shell ${isMenu ? "app-shell-menu" : ""} ${isHome ? "app-shell-home" : ""} ${isCampus ? "app-shell-campus" : ""}`}
      >
        {!isErpWorkspace && !isHome && !isLogin && !isErpChooser && !isCampus && (
          <header className="app-header">
            <div className="app-header-left">
              {leftSlot ??
                (isLogin ? (
                  <Link
                    to="/erp"
                    onClick={(event) => {
                      event.preventDefault();
                      logout();
                    }}
                    className="login-header-hit login-header-back text-lg font-semibold text-foreground"
                  >
                    <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={1.5} />
                    Back
                  </Link>
                ) : isMenu ? (
                  <Link to="/" replace aria-label="Home" className="header-home-hit">
                    <House aria-hidden="true" className="size-6" strokeWidth={1.5} />
                  </Link>
                ) : (
                  <Link to="/erp" className="login-header-hit">
                    <span className="primary-action inline-flex h-10 items-center gap-2 rounded-full px-4 text-base font-semibold">
                      <UserRound aria-hidden="true" className="size-5" strokeWidth={1.5} />
                      Login
                    </span>
                  </Link>
                ))}
            </div>

            <div className="app-header-brand">
              {isMenu ? (
                <span className="menu-header-title">How can we help you?</span>
              ) : (
                <>
                  <span>ARUNAI ENGINEERING COLLEGE</span>
                  <span className="app-kiosk-badge">KIOSK</span>
                </>
              )}
            </div>

            <div className="app-header-right">
              {rightSlot ?? (
                <div className="flex items-center gap-3">
                  <div className="text-right" aria-live="off">
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {time?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) ??
                        "--:--"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {time?.toLocaleDateString([], { day: "numeric", month: "short" }) ?? ""}
                    </p>
                  </div>
                  <LanguageToggle />
                </div>
              )}
            </div>
          </header>
        )}

        <main
          id="main-content"
          className={`app-main ${isLogin ? "app-main-login" : ""} ${isPassword ? "app-main-password" : ""} ${isHome ? "app-main-home" : ""}`}
        >
          <Outlet />
        </main>

        {isLogin || isPassword || isErpWorkspace || isErpChooser || isCampus ? null : footer ? (
          <footer className="app-footer">{footer}</footer>
        ) : (
          !isHome && (
            <footer className="app-footer inner-footer">
              <button type="button" onClick={goBack} className="inner-footer-button">
                <ArrowLeft aria-hidden="true" className="size-[22px]" strokeWidth={1.5} />
                <span>Back</span>
              </button>
              <Link to="/" replace reloadDocument className="inner-footer-button">
                <House aria-hidden="true" className="size-[22px]" strokeWidth={1.5} />
                <span>Home</span>
              </Link>
              <button type="button" onClick={openAccessibility} className="inner-footer-button">
                <Accessibility aria-hidden="true" className="size-[22px]" strokeWidth={1.5} />
                <span>Accessibility</span>
              </button>
            </footer>
          )
        )}

        <Sheet open={accessibilityOpen} onOpenChange={setAccessibilityOpen}>
          <SheetContent
            side="bottom"
            className="mx-auto w-full max-w-2xl rounded-t-3xl border-border bg-popover px-5 pb-8 pt-8"
          >
            <SheetTitle className="mb-5 flex items-center gap-3 pr-14 font-display text-2xl text-foreground">
              <Accessibility aria-hidden="true" className="size-7 text-accent" strokeWidth={1.5} />
              Accessibility
            </SheetTitle>
            <div className="grid gap-2">
              <label
                htmlFor="large-text"
                className="flex min-h-14 items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-4 text-lg"
              >
                <span>Large text</span>
                <Switch id="large-text" checked={largeText} onCheckedChange={setLargeText} />
              </label>
              <label
                htmlFor="high-contrast"
                className="flex min-h-14 items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-4 text-lg"
              >
                <span>High contrast</span>
                <Switch
                  id="high-contrast"
                  checked={highContrast}
                  onCheckedChange={setHighContrast}
                />
              </label>
              <label
                htmlFor="extended-timeout"
                className="flex min-h-14 items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-4 text-lg"
              >
                <span>Extended timeout</span>
                <Switch
                  id="extended-timeout"
                  checked={extendedTimeout}
                  onCheckedChange={setExtendedTimeout}
                />
              </label>
            </div>
          </SheetContent>
        </Sheet>

        <AlertDialog open={warningOpen}>
          <AlertDialogContent className="border-border bg-popover text-foreground">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">Still there?</AlertDialogTitle>
              <AlertDialogDescription className="text-lg text-muted-foreground">
                Your session will end soon due to inactivity.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  staySignedIn();
                }}
                className="primary-action min-h-14 text-lg"
              >
                Stay signed in
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AccessibilityPanelContext.Provider>
  );
}

function LanguageToggle() {
  const [language, setLanguage] = useState<"en" | "ta">("en");

  return (
    <div className="flex items-center" role="group" aria-label="Language">
      <button
        type="button"
        aria-pressed={language === "en"}
        onClick={() => setLanguage("en")}
        className="language-hit"
      >
        <span className={`language-segment ${language === "en" ? "is-active" : ""}`}>EN</span>
      </button>
      <span aria-hidden="true" className="language-separator">
        |
      </span>
      <button
        type="button"
        aria-pressed={language === "ta"}
        onClick={() => setLanguage("ta")}
        className="language-hit"
      >
        <span className={`language-segment ${language === "ta" ? "is-active" : ""}`}>த</span>
      </button>
    </div>
  );
}

export function AppAccessibilityButton() {
  const openAccessibility = useAccessibilityPanel();

  return (
    <button
      type="button"
      onClick={openAccessibility}
      aria-label="Accessibility settings"
      className="accessibility-button"
    >
      <Accessibility aria-hidden="true" className="size-6" strokeWidth={1.5} />
    </button>
  );
}
