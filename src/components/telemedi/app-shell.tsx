"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Gauge,
  LogOut,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  Users,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/client-api";
import { initials, roleLabels } from "@/components/telemedi/format";
import { ErrorState, LoadingState } from "@/components/telemedi/ui";
import type { MeResponse } from "@/components/telemedi/types";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  coordinatorOnly?: boolean;
};

const portalItems: NavItem[] = [
  { href: "/portal/dashboard", label: "Przegląd", icon: Gauge },
  { href: "/portal/employees", label: "Pracownicy", icon: Users },
  { href: "/portal/referrals", label: "Skierowania", icon: ClipboardList },
  { href: "/portal/hazards", label: "Czynniki", icon: SlidersHorizontal },
  { href: "/portal/templates", label: "Szablony", icon: FileText },
  {
    href: "/portal/settings",
    label: "Ustawienia",
    icon: Settings,
    coordinatorOnly: true,
  },
];

const adminItems: NavItem[] = [
  { href: "/admin", label: "Firmy", icon: Building2 },
];

export function AppShell({
  mode,
  children,
}: {
  mode: "portal" | "admin";
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let active = true;
    apiFetch<MeResponse>("/api/me")
      .then((data) => {
        if (!active) {
          return;
        }
        setMe(data);
        if (mode === "portal" && data.permissions.isSuperAdmin) {
          router.replace("/admin");
        }
        if (mode === "admin" && !data.permissions.isSuperAdmin) {
          router.replace("/portal/dashboard");
        }
      })
      .catch(() => {
        if (active) {
          router.replace("/login");
        }
      });
    return () => {
      active = false;
    };
  }, [mode, router]);

  async function signOut() {
    setError("");
    await authClient.signOut().catch(() => null);
    router.replace("/login");
  }

  if (!me) {
    return (
      <main className="page">
        <LoadingState label="Sprawdzam sesję" />
      </main>
    );
  }

  const navItems =
    mode === "admin"
      ? adminItems
      : portalItems.filter(
          (item) => !item.coordinatorOnly || me.user.appRole === "COORDINATOR",
        );

  const workspaceTitle =
    mode === "admin" ? "Telemedi Admin" : me.company?.name ?? "Firma";
  const workspaceMeta =
    mode === "admin"
      ? "Panel systemowy"
      : me.company
        ? `NIP ${me.company.nip}`
        : "Brak firmy";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
        <div className="sidebar-inner">
          <div className="brand">
            <div className="brand-mark">T</div>
            <div className="hide-when-collapsed">
              <div className="brand-name">Telemedi</div>
              <div className="brand-sub">Medycyna pracy</div>
            </div>
            <button
              className="btn btn-ghost btn-sm hide-when-collapsed"
              onClick={() => setCollapsed(true)}
              type="button"
              title="Zwiń menu"
            >
              <ChevronLeft size={16} />
            </button>
            {collapsed ? (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setCollapsed(false)}
                type="button"
                title="Rozwiń menu"
              >
                <ChevronRight size={16} />
              </button>
            ) : null}
          </div>

          <div className="workspace">
            {mode === "admin" ? <ShieldCheck size={18} /> : <Building2 size={18} />}
            <div className="hide-when-collapsed">
              <div className="workspace-name">{workspaceTitle}</div>
              <div className="workspace-meta">{workspaceMeta}</div>
            </div>
          </div>

          <nav className="col gap-sm">
            <div className="nav-section-label hide-when-collapsed">
              {mode === "admin" ? "Administracja" : "Portal HR"}
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/admin"
                  ? pathname === "/admin" || pathname.startsWith("/admin/")
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  className={`nav-item ${active ? "active" : ""}`}
                  href={item.href}
                  key={item.href}
                  title={item.label}
                >
                  <Icon size={19} />
                  <span className="hide-when-collapsed">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-foot">
          <div className="row">
            <div className="avatar">{initials(me.user.name)}</div>
            <div className="hide-when-collapsed grow">
              <div className="medium t-sm">{me.user.name}</div>
              <div className="muted t-xs">{roleLabels[me.user.appRole]}</div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={signOut}
              type="button"
              title="Wyloguj"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <main className="main">
        <div className="topbar">
          <div className="row">
            <UserRound size={20} />
            <span className="medium">{workspaceTitle}</span>
          </div>
          <div className="row">
            <span className="badge badge-outline">{roleLabels[me.user.appRole]}</span>
            <span className="muted t-sm">{me.user.email}</span>
          </div>
        </div>
        {error ? (
          <div className="page">
            <ErrorState message={error} />
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
