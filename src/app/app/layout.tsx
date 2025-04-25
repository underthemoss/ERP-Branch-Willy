import { LicenseInfo } from "@mui/x-license";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";

// This feels wrong but the key is designed to be public
// and is expected to be exposed in the bundled JS
// See: https://mui.com/x/introduction/licensing/#license-key-security
LicenseInfo.setLicenseKey("37f2944bfb6ce3381dd3702f9a035a96Tz0xMTE1NzYsRT0xNzc2NDcwMzk5MDAwLFM9cHJvLExNPXN1YnNjcmlwdGlvbixQVj1RMy0yMDI0LEtWPTI=");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout defaultSidebarCollapsed branding={{ title: "ES-ERP", logo: <div>🚗</div>, homeUrl: "#" }}>
      {children}
    </DashboardLayout>
  );
}
