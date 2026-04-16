"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, FileText, Home, Users } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Name Change", href: "/hr/name-change", icon: Users },
  { label: "Documents", href: "/documents", icon: FileText },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <nav className="w-56 bg-white border-r border-ekap-border flex flex-col py-6 px-3 shrink-0">
      {/* Logo */}
      <div className="px-3 mb-8">
        <span className="text-xl font-bold text-ekap-primary">EKAP</span>
        <p className="text-xs text-slate-400 mt-0.5">HR Platform</p>
      </div>

      {/* Nav links */}
      <ul className="flex flex-col gap-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <li key={href}>
              <Link
                href={href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-ekap-primary text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Footer */}
      <div className="mt-auto px-3 text-xs text-slate-400">
        v1.0.0 &mdash; EKAP MFE
      </div>
    </nav>
  );
}
