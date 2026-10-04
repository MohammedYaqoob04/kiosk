import { createContext, useContext } from "react";

export const PortalChooserContext = createContext<(() => void) | null>(null);

export function usePortalChooser(): () => void {
  const openPortalChooser = useContext(PortalChooserContext);
  if (!openPortalChooser) throw new Error("usePortalChooser must be used within KioskShell.");
  return openPortalChooser;
}
