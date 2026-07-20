import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Monitor, 
  Receipt, 
  Image, 
  DollarSign,
  ChevronLeft,
  Camera,
  Users
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/booths', label: 'Booths', icon: Monitor },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/frames', label: 'Frames', icon: Image },
  { to: '/pricing', label: 'Pricing', icon: DollarSign },
  { to: '/franchisees', label: 'Franchisees', icon: Users },
];

export default function Sidebar({ isOpen, onClose, isSuper }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-50 w-[260px]
        bg-[#0c0c0e] border-r border-zinc-800
        flex flex-col
        transition-transform duration-200 ease-out
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand */}
        <div className="px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center">
              <Camera className="w-5 h-5 text-zinc-50" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-50 tracking-tight leading-none">Photobooth</h1>
              <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-[0.2em] mt-0.5">
                {isSuper ? 'Super Admin' : 'Dashboard'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-zinc-500 hover:text-zinc-300 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${isActive 
                  ? 'bg-zinc-800/60 text-zinc-50' 
                  : 'text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/40'
                }
              `}
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-6 border-t border-zinc-800">
          <p className="text-[10px] text-zinc-600 font-medium tracking-wider uppercase">
            Photobooth v1.0
          </p>
        </div>
      </aside>
    </>
  );
}
