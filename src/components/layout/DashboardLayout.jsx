import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, LogOut, User } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, isSuper, signOut } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-[#09090b]">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isSuper={isSuper}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-zinc-800 bg-[#09090b] shrink-0">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-zinc-400 hover:text-zinc-50 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="lg:flex-1" />

          <div className="flex items-center gap-4">
            {/* User Pill */}
            <div className="flex items-center gap-3 bg-[#111113] border border-zinc-800 rounded-full pl-3 pr-4 py-1.5">
              <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-zinc-50 leading-none">
                  {profile?.full_name || 'Admin'}
                </p>
                <p className="text-[10px] text-zinc-500 font-medium mt-0.5 capitalize">
                  {profile?.role?.replace('_', ' ') || 'User'}
                </p>
              </div>
            </div>

            {/* Sign Out */}
            <button 
              onClick={signOut}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-2 rounded-lg hover:bg-zinc-800/50"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
