import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { GraduationCap } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const STORAGE_KEY = "kiosk-staff-active-class";

// Available department classes for counsellor view
export const AVAILABLE_CLASSES = ["IV-A", "III-A", "II-A"] as const;
const DEFAULT_CLASS = "IV-A";

export interface StaffClassContextType {
  activeClass: string;
  setActiveClass: (className: string) => void;
  assignedClasses: string[];
  hasMultipleClasses: boolean;
  isAuthorizedClass: (className: string) => boolean;
}

const StaffClassContext = createContext<StaffClassContextType | null>(null);

export function getAssignedClassesForStaff(_identifierOrId?: string): string[] {
  return [...AVAILABLE_CLASSES];
}

export function StaffClassProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const assignedClasses = useMemo(() => {
    return getAssignedClassesForStaff(user?.identifier || user?.id);
  }, [user]);

  const [activeClass, setActiveClassState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (stored && assignedClasses.includes(stored)) {
        return stored;
      }
    }
    return assignedClasses[0] ?? DEFAULT_CLASS;
  });

  // Ensure active class stays authorized if assignedClasses changes
  useEffect(() => {
    if (!assignedClasses.includes(activeClass)) {
      const fallback = assignedClasses[0] ?? DEFAULT_CLASS;
      setActiveClassState(fallback);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(STORAGE_KEY, fallback);
      }
    }
  }, [assignedClasses, activeClass]);

  const setActiveClass = useCallback(
    (newClass: string) => {
      // Authorization check: only allow classes the staff member is assigned to
      if (assignedClasses.includes(newClass)) {
        setActiveClassState(newClass);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(STORAGE_KEY, newClass);
        }
      }
    },
    [assignedClasses],
  );

  const isAuthorizedClass = useCallback(
    (className: string) => assignedClasses.includes(className),
    [assignedClasses],
  );

  const value = useMemo<StaffClassContextType>(
    () => ({
      activeClass,
      setActiveClass,
      assignedClasses,
      hasMultipleClasses: assignedClasses.length > 1,
      isAuthorizedClass,
    }),
    [activeClass, setActiveClass, assignedClasses, isAuthorizedClass],
  );

  return (
    <StaffClassContext.Provider value={value}>
      {children}
    </StaffClassContext.Provider>
  );
}

export function useStaffClass(): StaffClassContextType {
  const context = useContext(StaffClassContext);
  if (!context) {
    // Fallback when rendered outside provider
    return {
      activeClass: DEFAULT_CLASS,
      setActiveClass: () => {},
      assignedClasses: [...AVAILABLE_CLASSES],
      hasMultipleClasses: true,
      isAuthorizedClass: (cls: string) => (AVAILABLE_CLASSES as readonly string[]).includes(cls),
    };
  }
  return context;
}

export function StaffClassSelector({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { activeClass, setActiveClass, assignedClasses, hasMultipleClasses } = useStaffClass();

  if (!hasMultipleClasses) {
    return (
      <div className={`inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground ${className}`}>
        <GraduationCap className="size-4 text-accent" strokeWidth={1.5} />
        <span>Class: {activeClass}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {!compact && (
        <label
          htmlFor="staff-class-select"
          className="text-sm font-semibold text-foreground flex items-center gap-1.5"
        >
          <GraduationCap className="size-4 text-accent" strokeWidth={1.5} />
          <span>Active Class:</span>
        </label>
      )}
      <select
        id="staff-class-select"
        value={activeClass}
        onChange={(e) => setActiveClass(e.target.value)}
        aria-label="Select active class"
        className="min-h-12 rounded-lg border border-border bg-surface px-3 py-2 text-base font-semibold text-foreground shadow-xs focus:outline-hidden focus:ring-2 focus:ring-accent"
      >
        {assignedClasses.map((cls) => (
          <option key={cls} value={cls}>
            Class {cls}
          </option>
        ))}
      </select>
    </div>
  );
}
