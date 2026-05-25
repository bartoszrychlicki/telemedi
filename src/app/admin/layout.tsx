import { AppShell } from "@/components/telemedi/app-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell mode="admin">{children}</AppShell>;
}
