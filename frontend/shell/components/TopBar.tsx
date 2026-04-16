"use client";

import { Bell, User } from "lucide-react";

export function TopBar() {
  return (
    <header className="h-14 bg-white border-b border-ekap-border flex items-center justify-between px-6 shrink-0">
      <div />

      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors text-sm font-medium">
          <div className="w-7 h-7 rounded-full bg-ekap-primary flex items-center justify-center text-white text-xs">
            A
          </div>
          Admin
        </button>
      </div>
    </header>
  );
}
