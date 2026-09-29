import { Plus, Check, Clock, Calendar } from "lucide-react";

export default function TasksPage() {
  const tasks = [
    { title: "Review Operating Systems Chapter 3", subject: "Operating Systems", due: "Today, 5:00 PM", priority: "high", status: "pending" },
    { title: "Complete Database Normalization Quiz", subject: "Database Systems", due: "Tomorrow, 10:00 AM", priority: "medium", status: "pending" },
    { title: "Read Machine Learning Notes", subject: "Machine Learning", due: "Friday, 2:00 PM", priority: "low", status: "pending" },
    { title: "Write B-Tree Implementation", subject: "Data Structures", due: "Yesterday", priority: "high", status: "completed" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Organize your study schedule and assignments.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 border-b border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-500 bg-slate-50 dark:bg-white/5">
          <div className="w-6"></div>
          <div>Task Name</div>
          <div className="hidden md:block w-32">Due Date</div>
          <div className="w-24 text-right">Priority</div>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {tasks.map((task, index) => (
            <div key={index} className={`grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 items-center transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${task.status === 'completed' ? 'opacity-50' : ''}`}>
              <button className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'completed' ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500'}`}>
                {task.status === 'completed' && <Check className="w-4 h-4" />}
              </button>
              
              <div>
                <p className={`font-medium ${task.status === 'completed' ? 'line-through text-slate-500' : ''}`}>{task.title}</p>
                <p className="text-xs text-slate-500 mt-1">{task.subject}</p>
              </div>
              
              <div className="hidden md:flex items-center gap-1.5 text-sm text-slate-500">
                {task.due.includes("Today") || task.due.includes("Tomorrow") ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
                {task.due}
              </div>
              
              <div className="text-right">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getPriorityColor(task.priority)} capitalize`}>
                  {task.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
