import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  MapPin,
  Phone,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ResilientImage } from '../components/ResilientImage';
import type { PublicHostelListing } from '../types/hostel';

function formatPkr(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK')}`;
}

function formatDate(iso?: string): string {
  if (!iso) return 'Not available';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Not available';
  return d.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function HostelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const includeDevSample = searchParams.get('devSample') === 'true';

  const [hostel, setHostel] = useState<PublicHostelListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const qs = includeDevSample ? '?includeDevSample=true' : '';
    fetch(`/api/hostels/${encodeURIComponent(id)}${qs}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Listing not found or awaiting verification.');
        return res.json();
      })
      .then((data: { listing: PublicHostelListing }) => {
        setHostel(data.listing);
        setLoading(false);
      })
      .catch((err) => {
        setError((err as Error).message);
        setLoading(false);
      });
  }, [id, includeDevSample]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-[1160px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to={includeDevSample ? '/hostels?devSample=true' : '/hostels'}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D4ED8] hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explore Hostels</span>
        </Link>

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 animate-pulse space-y-4">
            <div className="h-7 bg-slate-100 rounded w-1/2" />
            <div className="h-64 bg-slate-100 rounded" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <h1 className="font-display text-xl font-bold text-[#0F1E36]">
              Verified Hostel Listing Unavailable
            </h1>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
            <Link
              to="/hostels"
              className="mt-5 inline-flex px-5 py-2.5 rounded-lg bg-[#0F1E36] text-white text-sm font-semibold"
            >
              Browse Verified Hostels
            </Link>
          </div>
        )}

        {!loading && hostel && (
          <div className="space-y-8">
            {hostel.isDevSample && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3 text-sm text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                <span>
                  <strong>Dev Sample Listing:</strong> This record is an unverified
                  layout preview fixture and not a real public business listing.
                </span>
              </div>
            )}

            {/* Header Block */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                    <span>
                      {hostel.category === 'boys' ? 'Boys Hostel' : 'Girls Hostel'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {hostel.area}, {hostel.city}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {hostel.isDevSample
                        ? 'Dev Sample Preview'
                        : 'Verified & Consented Listing'}
                    </span>
                  </div>
                  <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#0F1E36]">
                    {hostel.name}
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{hostel.fullAddress}</span>
                  </p>
                </div>

                <div className="lg:text-right shrink-0">
                  <span className="text-xs text-slate-500 block">
                    Published Monthly Rent Range
                  </span>
                  <p className="font-mono text-2xl font-bold text-[#0F1E36] tabular-nums">
                    {formatPkr(hostel.monthlyRentMin)}
                    {hostel.monthlyRentMax > hostel.monthlyRentMin
                      ? ` – ${formatPkr(hostel.monthlyRentMax)}`
                      : ''}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 tabular-nums">
                    Security Deposit: {formatPkr(hostel.securityDeposit)}
                  </p>
                </div>
              </div>

              {/* Photo Gallery */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {hostel.photos.map((photo, idx) => (
                  <div
                    key={`${photo}-${idx}`}
                    className="aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
                  >
                    <ResilientImage
                      src={photo}
                      alt={`${hostel.name} photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                      fallbackLabel={hostel.name}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Details & Direct Contact Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-6">
                {/* Room Sharing & Rent Table */}
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                  <h2 className="font-display text-lg font-bold text-[#0F1E36] mb-4">
                    Room Sharing & Monthly Rent
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                          <th className="py-2.5 pr-4">Room Type</th>
                          <th className="py-2.5 px-4 text-right">Monthly Rent</th>
                          <th className="py-2.5 pl-4 text-right">Available Beds</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {hostel.roomTypes.map((room) => (
                          <tr key={room.type}>
                            <td className="py-3 pr-4 font-medium text-[#0F1E36]">
                              {room.type}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                              {formatPkr(room.monthlyRent)}
                            </td>
                            <td className="py-3 pl-4 text-right font-mono tabular-nums text-slate-700">
                              {room.availableBeds}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Facilities */}
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                  <h2 className="font-display text-lg font-bold text-[#0F1E36] mb-4">
                    Confirmed Facilities
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
                    {hostel.facilities.map((facility) => (
                      <div key={facility} className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#1D4ED8] shrink-0" />
                        <span>{facility}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Living Arrangements & Rules */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
                  <h2 className="font-display text-lg font-bold text-[#0F1E36]">
                    Residence Operations & Rules
                  </h2>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                    <div>
                      <dt className="text-xs font-semibold text-slate-500">
                        Meal Arrangements
                      </dt>
                      <dd className="mt-1 text-slate-800 leading-relaxed">
                        {hostel.mealArrangements}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-slate-500">
                        Internet Availability
                      </dt>
                      <dd className="mt-1 text-slate-800 leading-relaxed">
                        {hostel.internetAvailability}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-slate-500">
                        Electricity & Backup
                      </dt>
                      <dd className="mt-1 text-slate-800 leading-relaxed">
                        {hostel.electricityBackup}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-slate-500">
                        Security Arrangements
                      </dt>
                      <dd className="mt-1 text-slate-800 leading-relaxed">
                        {hostel.securityArrangements}
                      </dd>
                    </div>
                  </dl>
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-semibold text-slate-500">Hostel Rules</h3>
                    <p className="mt-1 text-sm text-slate-800 leading-relaxed">
                      {hostel.hostelRules}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Verification & Public Contact */}
              <aside className="lg:col-span-4 space-y-5">
                <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <span>
                      {hostel.isDevSample
                        ? 'Dev Sample Preview'
                        : 'Verified Hostel Listing'}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-600 tabular-nums">
                    <div className="flex items-center justify-between">
                      <span>Approved Date</span>
                      <span className="font-medium text-slate-900">
                        {formatDate(hostel.approvedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Last Info Update</span>
                      <span className="font-medium text-slate-900">
                        {formatDate(hostel.lastUpdatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Availability Confirmed</span>
                      <span className="font-medium text-slate-900 inline-flex items-center gap-1">
                        <CalendarCheck className="w-3.5 h-3.5 text-[#1D4ED8]" />
                        {formatDate(hostel.lastAvailabilityUpdateAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                  <h2 className="font-display text-base font-bold text-[#0F1E36]">
                    Public Hostel Contact
                  </h2>
                  <div className="space-y-2.5 text-sm text-slate-700">
                    <div className="flex items-center gap-2.5">
                      <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>
                        {hostel.ownerName}
                        {hostel.managerName && hostel.managerName !== hostel.ownerName
                          ? ` / Manager: ${hostel.managerName}`
                          : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 font-mono">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{hostel.publicPhone}</span>
                    </div>
                    {hostel.publicEmail && (
                      <p className="text-xs text-slate-500 pl-6">{hostel.publicEmail}</p>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
                    Contact the hostel office directly to schedule a physical tour
                    before paying any admission deposit.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
