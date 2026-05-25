import { AppShell } from "@/components/telemedi/app-shell";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <AppShell mode="portal">{children}</AppShell>;
}
