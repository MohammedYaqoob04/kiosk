import { createContext, useContext } from "react";

export const AccessibilityPanelContext = createContext<(() => void) | null>(null);

export function useAccessibilityPanel(): () => void {
  const openPanel = useContext(AccessibilityPanelContext);
  if (!openPanel) throw new Error("useAccessibilityPanel must be used within AppShell.");
  return openPanel;
}
