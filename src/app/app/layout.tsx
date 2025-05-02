import { DashboardLayout } from "@toolpad/core/DashboardLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout
      defaultSidebarCollapsed
      branding={{ title: "ES-ERP", logo: <div>🚗</div>, homeUrl: "#" }}
    >
      {children}
    </DashboardLayout>
  );
}
