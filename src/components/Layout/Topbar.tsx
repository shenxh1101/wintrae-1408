import { Bell, Search, User } from 'lucide-react';

export default function Topbar({ title }: { title: string }) {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-warm-100 flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="text-xl font-bold text-warm-800">{title}</h1>
      
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
          <input
            type="text"
            placeholder="搜索..."
            className="w-56 h-9 pl-9 pr-4 rounded-full bg-warm-50 border border-warm-100 text-sm focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all"
          />
        </div>
        
        <button className="relative w-9 h-9 rounded-full bg-warm-50 flex items-center justify-center text-warm-500 hover:bg-warm-100 hover:text-primary-500 transition-colors btn-press">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full"></span>
        </button>
        
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warm-50 hover:bg-warm-100 transition-colors btn-press">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm">
            <User size={14} />
          </div>
          <span className="text-sm font-medium text-warm-700 hidden sm:inline">团长</span>
        </button>
      </div>
    </header>
  );
}
