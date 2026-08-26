'use client';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Navbar({ searchQuery, onSearchChange }: NavbarProps) {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 text-sm">
          UC
        </div>
        <div>
          <h1 className="text-xs font-bold tracking-wide uppercase text-slate-100">
            Universal Collections
          </h1>
          <p className="text-[10px] text-slate-500 font-mono">v0.1.0 • Supabase Live</p>
        </div>
      </div>

      {/* Top Search Filter */}
      <div className="w-96 relative">
        <span className="absolute left-3 top-2.5 text-xs text-slate-500">🔍</span>
        <input
          type="text"
          placeholder="Search items by name or attributes (e.g. mint, rare)..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-slate-950/80 border border-slate-800 rounded-full pl-8 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-2 text-xs text-slate-500 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Right User Indicator */}
      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-medium text-slate-400">Database Connected</span>
      </div>
    </header>
  );
}