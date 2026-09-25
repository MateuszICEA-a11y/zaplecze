"use client";

/* Stan paska bocznego z TailAdmina: rozwinięty / zwinięty (desktop, pamiętany),
   hover na zwiniętym i wysuwany panel na mobile. */
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

type SidebarContextType = {
  isExpanded: boolean;
  isMobileOpen: boolean;
  isHovered: boolean;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  setIsHovered: (isHovered: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider");
  return context;
};

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsExpanded(localStorage.getItem("dash-sidebar") !== "collapsed");
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleSidebar = () =>
    setIsExpanded((prev) => {
      localStorage.setItem("dash-sidebar", prev ? "collapsed" : "expanded");
      return !prev;
    });

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        isMobileOpen,
        isHovered,
        toggleSidebar,
        toggleMobileSidebar: () => setIsMobileOpen((prev) => !prev),
        setIsHovered,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
