"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Library, 
  BookOpen, 
  CheckSquare, 
  Bot, 
  Settings, 
  UserCircle 
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Subjects", href: "/subjects", icon: Library },
  { name: "Notes", href: "/notes", icon: BookOpen },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "AI Tutor", href: "/ai-tutor", icon: Bot },
];

const bottomNavItems = [
  { name: "Profile", href: "/profile", icon: UserCircle },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const renderLink = (item: typeof navItems[0]) => {
    // Check if the current route matches the link
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    const Icon = item.icon;
    
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
          isActive 
            ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium border border-indigo-500/20 shadow-sm" 
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
        }`}
      >
        <Icon className={`w-5 h-5 ${isActive ? "text-indigo-600 dark:text-indigo-400" : ""}`} />
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <aside className="w-64 h-screen border-r border-slate-200 dark:border-white/10 bg-white/50 dark:bg-[#020617]/50 backdrop-blur-xl flex flex-col fixed left-0 top-0 z-40">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg shadow-md">
          S
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">StudyMate</span>
      </div>

      <div className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4">Menu</div>
        {navItems.map(renderLink)}
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-white/10">
        <div className="flex flex-col gap-2">
          {bottomNavItems.map(renderLink)}
        </div>
      </div>
    </aside>
  );
}
