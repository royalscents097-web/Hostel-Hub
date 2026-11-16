import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  Filter,
  MapPin,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ResilientImage } from '../components/ResilientImage';
import {
  LAHORE_AREA_NAMES,
  ROOM_SHARING_TYPES,
  STANDARD_FACILITIES,
} from '../constants/lahoreAreas';
import type { PublicHostelListing } from '../types/hostel';

function formatPkr(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK')}`;
}

function formatShortDate(iso?: string): string {
  if (!iso) return 'Not recorded';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Not recorded';
  return d.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function ExploreHostelsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const city = searchParams.get('city') || 'Lahore';
  const area = searchParams.get('area') || '';
  const category = (searchParams.get('category') || '') as '' | 'boys' | 'girls';
  const q = searchParams.get('q') || '';
  const minRent = searchParams.get('minRent') || '';
  const maxRent = searchParams.get('maxRent') || '';
  const roomType = searchParams.get('roomType') || '';
  const facilitiesParam = searchParams.get('facilities') || '';
  const confirmedRecently = searchParams.get('confirmedRecently') === 'true';
  const verificationStatus = searchParams.get('verificationStatus') || 'all_approved';
  const sort = searchParams.get('sort') || 'updated_desc';
  const includeDevSample = searchParams.get('devSample') === 'true';

  const selectedFacilities = useMemo(
    () =>
      facilitiesParam
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean),
    [facilitiesParam]
  );

  const [listings, setListings] = useState<PublicHostelListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  const toggleFacility = (facility: string) => {
    const exists = selectedFacilities.includes(facility);
    const updated = exists
      ? selectedFacilities.filter((f) => f !== facility)
      : [...selectedFacilities, facility];
    updateParam('facilities', updated.length ? updated.join(',') : null);
  };

  const clearAllFilters = () => {
    const next = new URLSearchParams();
    if (includeDevSample) next.set('devSample', 'true');
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const apiParams = new URLSearchParams();
    if (city) apiParams.set('city', city);
    if (area) apiParams.set('area', area);
    if (category) apiParams.set('category', category);
    if (q) apiParams.set('q', q);
    if (minRent) apiParams.set('minRent', minRent);
    if (maxRent) apiParams.set('maxRent', maxRent);
    if (roomType) apiParams.set('roomType', roomType);
    if (facilitiesParam) apiParams.set('facilities', facilitiesParam);
    if (confirmedRecently) apiParams.set('confirmedRecently', 'true');
    if (verificationStatus) apiParams.set('verificationStatus', verificationStatus);
    if (sort) apiParams.set('sort', sort);
    if (includeDevSample) apiParams.set('includeDevSample', 'true');

    fetch(`/api/hostels?${apiParams.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error('Unable to load verified hostels.');
        return res.json();
      })
      .then((data: { listings: PublicHostelListing[] }) => {
        setListings(data.listings || []);
        setLoading(false);
      })
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') {
          setError('Unable to fetch verified hostel listings right now.');
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [
    city,
    area,
    category,
    q,
    minRent,
    maxRent,
    roomType,
    facilitiesParam,
    confirmedRecently,
    verificationStatus,
    sort,
    includeDevSample,
  ]);

  const hasActiveFilters = Boolean(
    area ||
      category ||
      q ||
      minRent ||
      maxRent ||
      roomType ||
      selectedFacilities.length > 0 ||
      confirmedRecently ||
      verificationStatus !== 'all_approved'
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1">
        {/* Top Discovery Header */}
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 mb-2">
                  <span>{city}</span>
                  <span aria-hidden="true">·</span>
                  <span>{area ? area : 'All Lahore Areas'}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {category === 'boys'
                      ? 'Boys Hostels Only'
                      : category === 'girls'
                      ? 'Girls Hostels Only'
                      : 'Select Boys or Girls Category'}
                  </span>
                </div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0F1E36]">
                  Find Your Perfect Hostel
                </h1>
              </div>

              {/* Category Quick Switcher (strict Boys / Girls separation) */}
              <div className="flex flex-wrap items-center gap-3">
                <div
                  role="group"
                  aria-label="Hostel Category"
                  className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200"
                >
                  <button
                    type="button"
                    onClick={() => updateParam('category', null)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      !category
                        ? 'bg-white text-[#0F1E36] shadow-xs'
                        : 'text-slate-600 hover:text-[#0F1E36]'
                    }`}
                  >
                    All Categories
                  </button>
                  <button
                    type="button"
                    onClick={() => updateParam('category', 'boys')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      category === 'boys'
                        ? 'bg-[#0F1E36] text-white'
                        : 'text-slate-600 hover:text-[#0F1E36]'
                    }`}
                  >
                    Boys Hostels
                  </button>
                  <button
                    type="button"
                    onClick={() => updateParam('category', 'girls')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      category === 'girls'
                        ? 'bg-[#1D4ED8] text-white'
                        : 'text-slate-600 hover:text-[#0F1E36]'
                    }`}
                  >
                    Girls Hostels
                  </button>
                </div>
              </div>
            </div>

            {/* Search, Sort & Mobile Filter Bar */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-6 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => updateParam('q', e.target.value || null)}
                  placeholder="Search approved hostel name, street, or facility..."
                  aria-label="Search approved hostels"
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  value={sort}
                  onChange={(e) => updateParam('sort', e.target.value)}
                  aria-label="Sort hostels"
                  className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="updated_desc">Sort: Recently Updated</option>
                  <option value="rent_asc">Sort: Rent (Low to High)</option>
                  <option value="rent_desc">Sort: Rent (High to Low)</option>
                  <option value="availability_desc">Sort: Most Available Beds</option>
                </select>
              </div>

              <div className="md:col-span-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen((prev) => !prev)}
                  className="lg:hidden flex-1 h-11 px-3 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 inline-flex items-center justify-center gap-2"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filters</span>
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="h-11 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Active filters:</span>
                {area && (
                  <button
                    type="button"
                    onClick={() => updateParam('area', null)}
                    className="px-2.5 py-1 rounded-md bg-blue-50 text-[#1D4ED8] border border-blue-200 font-medium hover:bg-blue-100"
                  >
                    Area: {area} ×
                  </button>
                )}
                {category && (
                  <button
                    type="button"
                    onClick={() => updateParam('category', null)}
                    className="px-2.5 py-1 rounded-md bg-blue-50 text-[#1D4ED8] border border-blue-200 font-medium hover:bg-blue-100"
                  >
                    {category === 'boys' ? 'Boys Hostels' : 'Girls Hostels'} ×
                  </button>
                )}
                {roomType && (
                  <button
                    type="button"
                    onClick={() => updateParam('roomType', null)}
                    className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-medium"
                  >
                    Room: {roomType} ×
                  </button>
                )}
                {(minRent || maxRent) && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = new URLSearchParams(searchParams);
                      next.delete('minRent');
                      next.delete('maxRent');
                      setSearchParams(next, { replace: true });
                    }}
                    className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-medium tabular-nums"
                  >
                    Rent: {minRent || '0'} – {maxRent || 'Any'} PKR ×
                  </button>
                )}
                {confirmedRecently && (
                  <button
                    type="button"
                    onClick={() => updateParam('confirmedRecently', null)}
                    className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-medium"
                  >
                    Recently Confirmed Availability ×
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Dev Sample Mode Warning Banner (Only if explicitly toggled) */}
        {includeDevSample && (
          <div className="bg-amber-50 border-b border-amber-200">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  <strong>Development Sample Preview Enabled:</strong> Listings marked{' '}
                  <code>[DEV SAMPLE]</code> are unverified UI fixtures and are never shown
                  in production.
                </span>
              </div>
              <button
                type="button"
                onClick={() => updateParam('devSample', null)}
                className="px-3 py-1.5 rounded-md bg-amber-900 text-white text-xs font-semibold whitespace-nowrap self-start sm:self-auto"
              >
                Exit Sample Preview
              </button>
            </div>
          </div>
        )}

        {/* Main Content Grid: Filter Sidebar + Results */}
        <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Filter Sidebar */}
            <aside
              className={`lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 space-y-6 ${
                mobileFiltersOpen ? 'block' : 'hidden lg:block'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="font-display text-sm font-bold text-[#0F1E36] inline-flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#1D4ED8]" />
                  <span>Filter Hostels</span>
                </h2>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs font-semibold text-[#1D4ED8] hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* City */}
              <div>
                <label
                  htmlFor="filter-city"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  City
                </label>
                <select
                  id="filter-city"
                  value={city}
                  onChange={(e) => updateParam('city', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900"
                >
                  <option value="Lahore">Lahore</option>
                </select>
              </div>

              {/* Area */}
              <div>
                <label
                  htmlFor="filter-area"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Area
                </label>
                <select
                  id="filter-area"
                  value={area}
                  onChange={(e) => updateParam('area', e.target.value || null)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900"
                >
                  <option value="">All Lahore Areas</option>
                  {LAHORE_AREA_NAMES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Boys / Girls Category */}
              <div>
                <span className="block text-xs font-semibold text-slate-700 mb-2">
                  Hostel Category
                </span>
                <div className="space-y-1.5 text-sm">
                  {[
                    { value: '', label: 'All Categories' },
                    { value: 'boys', label: 'Boys Hostels' },
                    { value: 'girls', label: 'Girls Hostels' },
                  ].map((opt) => (
                    <label key={opt.label} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="category-filter"
                        checked={category === opt.value}
                        onChange={() => updateParam('category', opt.value || null)}
                        className="text-[#1D4ED8] focus:ring-blue-600"
                      />
                      <span className="text-slate-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Monthly Rent Range */}
              <div>
                <span className="block text-xs font-semibold text-slate-700 mb-2">
                  Monthly Rent (PKR)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={minRent}
                    onChange={(e) => updateParam('minRent', e.target.value || null)}
                    placeholder="Min"
                    aria-label="Minimum monthly rent"
                    className="w-full h-10 px-2.5 rounded-lg border border-slate-300 text-sm tabular-nums"
                  />
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={maxRent}
                    onChange={(e) => updateParam('maxRent', e.target.value || null)}
                    placeholder="Max"
                    aria-label="Maximum monthly rent"
                    className="w-full h-10 px-2.5 rounded-lg border border-slate-300 text-sm tabular-nums"
                  />
                </div>
              </div>

              {/* Room Sharing Type */}
              <div>
                <label
                  htmlFor="filter-room-type"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Room Sharing Type
                </label>
                <select
                  id="filter-room-type"
                  value={roomType}
                  onChange={(e) => updateParam('roomType', e.target.value || null)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900"
                >
                  <option value="">Any Room Type</option>
                  {ROOM_SHARING_TYPES.map((rt) => (
                    <option key={rt} value={rt}>
                      {rt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Facilities */}
              <div>
                <span className="block text-xs font-semibold text-slate-700 mb-2">
                  Facilities
                </span>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {STANDARD_FACILITIES.map((facility) => (
                    <label
                      key={facility}
                      className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFacilities.includes(facility)}
                        onChange={() => toggleFacility(facility)}
                        className="rounded border-slate-300 text-[#1D4ED8] focus:ring-blue-600"
                      />
                      <span>{facility}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Availability Confirmation */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmedRecently}
                    onChange={(e) =>
                      updateParam('confirmedRecently', e.target.checked ? 'true' : null)
                    }
                    className="mt-0.5 rounded border-slate-300 text-[#1D4ED8] focus:ring-blue-600"
                  />
                  <span>
                    <strong className="font-medium text-slate-900">
                      Recently Confirmed Availability
                    </strong>
                    <span className="block text-xs text-slate-500">
                      Vacant beds verified within the last 14 days
                    </span>
                  </span>
                </label>
              </div>

              {/* Verification Status */}
              <div>
                <label
                  htmlFor="filter-verification"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Verification Status
                </label>
                <select
                  id="filter-verification"
                  value={verificationStatus}
                  onChange={(e) => updateParam('verificationStatus', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900"
                >
                  <option value="all_approved">Approved Public Listings</option>
                  <option value="verified_only">
                    Full Verification Checklist Passed
                  </option>
                </select>
              </div>
            </aside>

            {/* Right Results Column */}
            <div className="lg:col-span-9 space-y-5">
              {/* Results Count Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-5 py-3.5">
                <p className="text-sm font-medium text-slate-700 tabular-nums">
                  {loading
                    ? 'Loading verified listings...'
                    : `${listings.length} ${
                        listings.length === 1 ? 'verified hostel' : 'verified hostels'
                      } found`}
                </p>
                <span className="text-xs text-slate-500">
                  Public listings strictly require owner consent & admin approval
                </span>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
                  {error}
                </div>
              )}

              {/* Loading Skeleton */}
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[1, 2].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-slate-200 bg-white overflow-hidden animate-pulse"
                    >
                      <div className="aspect-[4/3] bg-slate-100" />
                      <div className="p-5 space-y-3">
                        <div className="h-5 bg-slate-100 rounded w-2/3" />
                        <div className="h-4 bg-slate-100 rounded w-1/2" />
                        <div className="h-4 bg-slate-100 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State (No random filler cards) */}
              {!loading && !error && listings.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-8 sm:p-12 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-4">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-[#0F1E36]">
                    No verified hostels found for your selected filters.
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                    We only display hostels after the owner has signed publishing consent
                    and our administrator team has verified the property details. Try
                    broadening your filters or exploring another Lahore area.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="px-5 py-2.5 rounded-lg bg-[#0F1E36] hover:bg-[#1E3A5F] text-white text-sm font-semibold transition-colors"
                      >
                        Change Filters
                      </button>
                    )}
                    <Link
                      to="/#areas"
                      className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors"
                    >
                      Explore Other Areas
                    </Link>
                    <Link
                      to="/owner/register"
                      className="px-5 py-2.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] text-sm font-semibold transition-colors"
                    >
                      Are You a Hostel Owner? Register
                    </Link>
                  </div>

                  {/* Separated Dev Sample Preview Toggle */}
                  {!includeDevSample && (
                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <p className="text-xs text-slate-500 mb-2">
                        Testing or reviewing card layouts before approving live owner submissions?
                      </p>
                      <button
                        type="button"
                        onClick={() => updateParam('devSample', 'true')}
                        className="text-xs font-semibold text-slate-700 underline underline-offset-4 hover:text-[#1D4ED8]"
                      >
                        Preview Dev Sample Listings (Unverified Demo Only)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Verified Hostel Cards Grid */}
              {!loading && !error && listings.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {listings.map((hostel) => (
                    <article
                      key={hostel.id}
                      className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col"
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                        <ResilientImage
                          src={hostel.photos[0] || ''}
                          alt={`${hostel.name} authorized photograph`}
                          className="w-full h-full object-cover"
                          fallbackLabel={hostel.name}
                        />
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          {hostel.isDevSample && (
                            <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-3">
                              DEV SAMPLE — NOT A VERIFIED PRODUCTION BUSINESS
                            </p>
                          )}

                          {/* Quiet 1-line text metadata with separators */}
                          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                            <span>
                              {hostel.category === 'boys'
                                ? 'Boys Hostel'
                                : 'Girls Hostel'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {hostel.area}, {hostel.city}
                            </span>
                          </div>

                          <h3 className="mt-1.5 font-display text-lg font-bold text-[#0F1E36]">
                            {hostel.name}
                          </h3>
                          <p className="mt-1 text-xs text-slate-600 line-clamp-1">
                            {hostel.fullAddress}
                          </p>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between gap-3">
                            <div>
                              <span className="text-xs text-slate-500 block">
                                Published Monthly Rent
                              </span>
                              <span className="font-mono text-base font-semibold text-[#0F1E36] tabular-nums">
                                {formatPkr(hostel.monthlyRentMin)}
                                {hostel.monthlyRentMax > hostel.monthlyRentMin
                                  ? ` – ${formatPkr(hostel.monthlyRentMax)}`
                                  : ''}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-slate-500 block">
                                Available Beds
                              </span>
                              <span className="font-mono text-sm font-semibold text-slate-800 tabular-nums">
                                {hostel.availableBedsTotal} beds
                              </span>
                            </div>
                          </div>

                          {/* Facilities summary */}
                          <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                            {hostel.facilities.slice(0, 4).join(' · ')}
                            {hostel.facilities.length > 4
                              ? ` · +${hostel.facilities.length - 4} more`
                              : ''}
                          </p>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                          <div className="space-y-0.5 text-xs text-slate-600">
                            <div className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                              <ShieldCheck className="w-4 h-4 shrink-0" />
                              <span>
                                {hostel.isDevSample
                                  ? 'Sample Layout Preview'
                                  : 'Admin Verified & Consented'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500 tabular-nums">
                              <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                Updated {formatShortDate(hostel.lastUpdatedAt)}
                              </span>
                            </div>
                          </div>

                          <Link
                            to={`/hostels/${hostel.slug}${
                              hostel.isDevSample ? '?devSample=true' : ''
                            }`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F1E36] hover:bg-[#1E3A5F] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                          >
                            <span>View Details</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
