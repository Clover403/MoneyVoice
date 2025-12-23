import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Camera, Calculator, History, User, Volume2, VolumeX } from 'lucide-react';
import { useUIStore, useAuthStore } from '../store';

function Layout() {
  const location = useLocation();
  const { voiceEnabled, toggleVoice } = useUIStore();
  const { user } = useAuthStore();

  const navItems = [
    { path: '/', icon: Home, label: 'Beranda' },
    { path: '/scan', icon: Camera, label: 'Scan' },
    { path: '/calculate', icon: Calculator, label: 'Hitung' },
    { path: '/history', icon: History, label: 'Riwayat' },
    { path: '/profile', icon: User, label: 'Profil' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        Langsung ke konten utama
      </a>

      {/* Header */}
      <header className="bg-blue-600 text-white py-4 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">
            Scan Tunai
          </h1>
          
          <div className="flex items-center gap-4">
            {/* Voice toggle button */}
            <button
              onClick={toggleVoice}
              className="p-3 rounded-full bg-blue-700 hover:bg-blue-800 transition-colors"
              aria-label={voiceEnabled ? 'Matikan suara' : 'Nyalakan suara'}
              aria-pressed={voiceEnabled}
            >
              {voiceEnabled ? (
                <Volume2 size={24} aria-hidden="true" />
              ) : (
                <VolumeX size={24} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main 
        id="main-content" 
        className="flex-1 overflow-auto pb-24"
        role="main"
        aria-label="Konten utama"
      >
        <div className="max-w-4xl mx-auto p-4">
          <Outlet />
        </div>
      </main>

      {/* Bottom navigation */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg"
        role="navigation"
        aria-label="Navigasi utama"
      >
        <div className="max-w-4xl mx-auto">
          <ul className="flex justify-around items-center">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? 'active' : ''}`
                  }
                  aria-current={location.pathname === item.path ? 'page' : undefined}
                >
                  <item.icon 
                    size={28} 
                    aria-hidden="true"
                    strokeWidth={location.pathname === item.path ? 2.5 : 2}
                  />
                  <span className="text-sm mt-1 font-medium">
                    {item.label}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Live region for screen reader announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        id="announcer"
      />
    </div>
  );
}

export default Layout;
