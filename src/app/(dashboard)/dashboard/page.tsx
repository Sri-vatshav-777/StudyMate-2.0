import { BookOpen, CheckCircle2, Clock, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, Developer!</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Here is an overview of your study progress today.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-full font-medium transition-colors shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Resume Study
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Study Time", value: "4h 20m", icon: Clock, trend: "+12% this week", color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Notes Created", value: "24", icon: BookOpen, trend: "4 new today", color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "Tasks Completed", value: "12", icon: CheckCircle2, trend: "3 pending", color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Avg. Quiz Score", value: "85%", icon: TrendingUp, trend: "+5% vs last week", color: "text-orange-500", bg: "bg-orange-500/10" }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mb-1">{stat.label}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column (Documents/Activity) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm min-h-[300px]">
            <h2 className="text-xl font-bold mb-4">Recent Documents</h2>
            <div className="flex items-center justify-center h-48 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl">
              <p className="text-sm text-slate-500 text-center">
                No documents uploaded yet. <br/>
                <span className="text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline">Upload your first PDF</span>
              </p>
            </div>
          </div>
        </div>
        
        {/* Right Column (Tasks/Upcoming) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm min-h-[300px]">
            <h2 className="text-xl font-bold mb-4">Upcoming Tasks</h2>
            <div className="space-y-3">
              {[
                { title: "Review Operating Systems Chapter 3", due: "Today, 5:00 PM" },
                { title: "Complete Database Normalization Quiz", due: "Tomorrow, 10:00 AM" },
                { title: "Read Machine Learning Notes", due: "Friday, 2:00 PM" }
              ].map((task, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-white/5 cursor-pointer">
                  <div className="mt-0.5 w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{task.due}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
