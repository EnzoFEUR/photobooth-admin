import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Monitor, 
  Receipt, 
  Image, 
  DollarSign,
  ChevronLeft,
  Sparkles
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/booths', label: 'Booths', icon: Monitor },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/frames', label: 'Frames', icon: Image },
  { to: '/pricing', label: 'Pricing', icon: DollarSign },
];

export default function Sidebar({ isOpen, onClose, isSuper }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-50 w-[260px]
        bg-[#0c0c0e]/95 backdrop-blur-2xl border-r border-white/[0.06]
        flex flex-col
        transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand */}
        <div className="px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight leading-none">Photobooth</h1>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em] mt-0.5">
                {isSuper ? 'Super Admin' : 'Dashboard'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-white transition-colors">
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
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                transition-all duration-200
                ${isActive 
                  ? 'bg-white/[0.08] text-white shadow-lg shadow-black/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                }
              `}
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-6 border-t border-white/[0.06]">
          <p className="text-[10px] text-gray-600 font-medium tracking-wider uppercase">
            Photobooth v1.0
          </p>
        </div>
      </aside>
    </>
  );
}
