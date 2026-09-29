import { Plus, BookOpen, Clock, MoreVertical } from "lucide-react";

export default function SubjectsPage() {
  const subjects = [
    { name: "Data Structures", topics: 12, progress: 75, lastStudied: "2 hours ago", color: "bg-blue-500" },
    { name: "Database Systems", topics: 8, progress: 45, lastStudied: "Yesterday", color: "bg-purple-500" },
    { name: "Machine Learning", topics: 15, progress: 20, lastStudied: "3 days ago", color: "bg-pink-500" },
    { name: "Operating Systems", topics: 10, progress: 90, lastStudied: "1 week ago", color: "bg-green-500" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your courses and study materials.</p>
        </div>
        <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg font-medium transition-colors hover:bg-slate-800 dark:hover:bg-slate-200 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject, index) => (
          <div key={index} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl ${subject.color}/20 flex items-center justify-center`}>
                <BookOpen className={`w-6 h-6 text-${subject.color.split('-')[1]}-500`} />
              </div>
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            
            <h3 className="text-xl font-bold mb-2">{subject.name}</h3>
            
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-6">
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" /> {subject.topics} topics
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {subject.lastStudied}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Progress</span>
                <span>{subject.progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${subject.color} rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${subject.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
