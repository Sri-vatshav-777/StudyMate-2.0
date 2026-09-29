import { Plus, Search, FileText, Tag } from "lucide-react";

export default function NotesPage() {
  const notes = [
    { title: "B-Trees vs Red-Black Trees", preview: "A B-tree is a self-balancing tree data structure that maintains sorted data...", subject: "Data Structures", date: "Oct 12, 2026" },
    { title: "ACID Properties in SQL", preview: "Atomicity, Consistency, Isolation, Durability are the four key properties...", subject: "Database Systems", date: "Oct 10, 2026" },
    { title: "Gradient Descent Optimization", preview: "Gradient descent is a first-order iterative optimization algorithm...", subject: "Machine Learning", date: "Oct 8, 2026" },
    { title: "Process Scheduling Algorithms", preview: "Round Robin, FCFS, Shortest Job First. The scheduler is responsible for...", subject: "Operating Systems", date: "Oct 5, 2026" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">All your written and generated study notes.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Note
        </button>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search notes..." 
          className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
        />
      </div>

      <div className="space-y-4">
        {notes.map((note, index) => (
          <div key={index} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-xl shadow-sm hover:border-indigo-500/50 transition-colors cursor-pointer flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-lg font-bold">{note.title}</h3>
                <span className="text-xs text-slate-400 whitespace-nowrap ml-4">{note.date}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-3 line-clamp-2">{note.preview}</p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/10 text-xs font-medium text-slate-600 dark:text-slate-300">
                <Tag className="w-3 h-3" />
                {note.subject}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
