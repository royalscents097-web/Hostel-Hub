import { Link } from 'react-router-dom';
import { LAHORE_AREA_NAMES } from '../constants/lahoreAreas';

export function Footer() {
  return (
    <footer className="bg-[#0F1E36] text-slate-300 border-t border-slate-800">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Link
              to="/"
              className="font-display text-lg font-bold tracking-tight text-white"
            >
              Hostel Hub
            </Link>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-xs">
              Lahore student accommodation directory built around owner consent,
              verified residence information, and transparent monthly pricing.
            </p>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold text-white mb-4">
              Discover Hostels
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/hostels?category=boys"
                  className="hover:text-white transition-colors"
                >
                  Boys Hostels in Lahore
                </Link>
              </li>
              <li>
                <Link
                  to="/hostels?category=girls"
                  className="hover:text-white transition-colors"
                >
                  Girls Hostels in Lahore
                </Link>
              </li>
              <li>
                <Link to="/hostels" className="hover:text-white transition-colors">
                  All Verified Listings
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold text-white mb-4">
              Popular Lahore Areas
            </h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {LAHORE_AREA_NAMES.slice(0, 8).map((area) => (
                <li key={area}>
                  <Link
                    to={`/hostels?area=${encodeURIComponent(area)}`}
                    className="hover:text-white transition-colors"
                  >
                    {area}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold text-white mb-4">
              Owners & Verification
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/owner/register"
                  className="hover:text-white transition-colors"
                >
                  Register Your Hostel
                </Link>
              </li>
              <li>
                <Link
                  to="/owner/dashboard"
                  className="hover:text-white transition-colors"
                >
                  Owner Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/acquisition"
                  className="hover:text-white transition-colors"
                >
                  Admin Acquisition & Verification
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} Hostel Hub Lahore. Public listings require
            verified owner consent and administrator approval.
          </p>
          <p>Lahore Student Housing Directory</p>
        </div>
      </div>
    </footer>
  );
}
