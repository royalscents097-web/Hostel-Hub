import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Explore Hostels', to: '/hostels' },
    { label: 'Student Areas', to: '/#areas' },
    { label: 'How It Works', to: '/#how-it-works' },
    { label: 'Owner Portal', to: '/owner/dashboard' },
    { label: 'Admin Console', to: '/admin/acquisition' },
  ];

  const isActive = (to: string) => {
    if (to.startsWith('/#')) return false;
    return location.pathname.startsWith(to);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single clean wordmark */}
        <Link
          to="/"
          className="font-display text-lg font-bold tracking-tight text-[#0F1E36] whitespace-nowrap shrink-0"
        >
          Hostel Hub
        </Link>

        {/* Zone 2: 5 concise single-line nav links */}
        <nav
          aria-label="Primary"
          className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          {navLinks.map((item) =>
            item.to.startsWith('/#') ? (
              <a
                key={item.label}
                href={item.to}
                className="hover:text-[#0F1E36] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                to={item.to}
                className={`transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4 ${
                  isActive(item.to)
                    ? 'text-[#1D4ED8] font-semibold'
                    : 'text-slate-600 hover:text-[#0F1E36]'
                }`}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* Zone 3: 1 primary CTA + mobile menu toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/owner/register"
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-[#0F1E36] hover:bg-[#1E3A5F] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            List Your Hostel
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          {navLinks.map((item) =>
            item.to.startsWith('/#') ? (
              <a
                key={item.label}
                href={item.to}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive(item.to)
                    ? 'bg-blue-50 text-[#1D4ED8] font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </Link>
            )
          )}
          <div className="pt-2 border-t border-slate-100">
            <Link
              to="/owner/register"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-[#0F1E36] rounded-lg"
            >
              List Your Hostel
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
