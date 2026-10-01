import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-50">
      {/* We render the Sidebar component here once, so it appears on all pages in this group */}
      <Sidebar />
      
      {/* The main content area with mobile responsive padding */}
      <main className="md:pl-64 min-h-screen pt-16 md:pt-0">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
