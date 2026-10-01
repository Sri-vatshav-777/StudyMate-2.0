"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { 
  LayoutDashboard, 
  Library, 
  BookOpen, 
  CheckSquare, 
  Bot, 
  Settings, 
  FileText, 
  HelpCircle, 
  Layers, 
  BarChart3, 
  Timer, 
  Users,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Subjects", href: "/subjects", icon: Library },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Notes", href: "/notes", icon: BookOpen },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Focus Timer", href: "/focus", icon: Timer },
  { name: "AI Tutor", href: "/ai-tutor", icon: Bot },
  { name: "Quizzes", href: "/quizzes", icon: HelpCircle },
  { name: "Flashcards", href: "/flashcards", icon: Layers },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Community Hub", href: "/community", icon: Users },
];

const bottomNavItems = [
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const renderLink = (item: typeof navItems[0]) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    const Icon = item.icon;
    
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
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
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-sm">
            S
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">StudyMate</span>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* Responsive Sidebar Drawer */}
      <aside
        className={`w-64 h-screen border-r border-slate-200 dark:border-white/10 bg-white dark:bg-[#020617] md:bg-white/50 md:dark:bg-[#020617]/50 md:backdrop-blur-xl flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg shadow-md">
              S
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">StudyMate</span>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 px-4 py-2 flex flex-col gap-1.5 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 px-4">Menu</div>
          {navItems.map(renderLink)}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-white/10 space-y-2">
          {bottomNavItems.map(renderLink)}
          
          {/* Real user info from Clerk */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl mt-2">
            <UserButton />
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                {user?.firstName ?? "Loading..."}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
