import React from "react";
import { SidebarProvider } from "../components/shadcn-components/ui/sidebar";

export default function PublicLayout({ children }) {
  return (
    <SidebarProvider
      defaultOpen={true}
      style={{
        // defines expanded width
        "--sidebar-width": "16rem",
        "--sidebar-width-mobile": "16rem",
      }}
    >
      {children}
    </SidebarProvider>
  );
}
