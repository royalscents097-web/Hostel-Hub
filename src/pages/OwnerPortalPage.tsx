import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Edit3,
  FileCheck2,
  Plus,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ResilientImage } from '../components/ResilientImage';
import {
  AUTHORIZED_PHOTO_GALLERY,
  LAHORE_AREA_NAMES,
  ROOM_SHARING_TYPES,
  STANDARD_FACILITIES,
} from '../constants/lahoreAreas';
import type {
  HostelCategory,
  HostelListing,
  RoomSharingType,
  RoomTypeOffering,
} from '../types/hostel';

const PRESET_OWNERS = [
  { email: 'owner.alnoor@example.com', label: 'Tariq Mahmood (Al-Noor DHA)' },
  { email: 'warden@crescentgirls.pk', label: 'Mrs. Samina Farooq (Crescent JT)' },
];

function formatPkr(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK')}`;
}

export function OwnerPortalPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.includes('/register') ? 'register' : 'dashboard';

  const [ownerEmail, setOwnerEmail] = useState<string>(
    () => localStorage.getItem('hh_owner_email') || 'owner.alnoor@example.com'
  );
  const [listings, setListings] = useState<HostelListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Registration Form State (Steps 3 & 4)
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [publicPhone, setPublicPhone] = useState('');
  const [publicEmail, setPublicEmail] = useState('');
  const [area, setArea] = useState('DHA');
  const [fullAddress, setFullAddress] = useState('');
  const [category, setCategory] = useState<HostelCategory>('boys');
  const [roomTypes, setRoomTypes] = useState<RoomTypeOffering[]>([
    { type: '2-Seater', monthlyRent: 18500, availableBeds: 4 },
  ]);
  const [securityDeposit, setSecurityDeposit] = useState<number>(15000);
  const [facilities, setFacilities] = useState<string[]>([
    'High-Speed Wi-Fi',
    'Generator / UPS Backup',
    '24/7 Security Guard & CCTV',
  ]);
  const [mealArrangements, setMealArrangements] = useState(
    '3-time home-style mess available in dining hall.'
  );
  const [internetAvailability, setInternetAvailability] = useState(
    'Fiber Wi-Fi available across all study and bedroom floors.'
  );
  const [electricityBackup, setElectricityBackup] = useState(
    'Standby generator and UPS lighting backup.'
  );
  const [securityArrangements, setSecurityArrangements] = useState(
    '24/7 gate security guard, visitor register, and CCTV monitoring.'
  );
  const [hostelRules, setHostelRules] = useState(
    'Student ID required on admission. Quiet study hours after 10:30 PM.'
  );
  const [photos, setPhotos] = useState<string[]>([
    '/src/assets/images/hero_lahore_hostel_campus_1794843376764.jpg',
    '/src/assets/images/hostel_boys_study_room_1794843376255.jpg',
  ]);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');

  // Step 3 Owner Consent State
  const [signatoryName, setSignatoryName] = useState('');
  const [authorityRole, setAuthorityRole] = useState<'Owner' | 'Authorized Manager'>(
    'Owner'
  );
  const [authorityConfirmed, setAuthorityConfirmed] = useState(false);
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit Listing Modal/Inline State
  const [editingListing, setEditingListing] = useState<HostelListing | null>(null);
  const [editResponseNote, setEditResponseNote] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    localStorage.setItem('hh_owner_email', ownerEmail);
  }, [ownerEmail]);

  const loadOwnerListings = () => {
    if (!ownerEmail.trim()) return;
    setLoading(true);
    setErrorMessage(null);
    fetch('/api/owner/listings', {
      headers: { 'x-owner-email': ownerEmail.trim() },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load owner listings.');
        return res.json();
      })
      .then((data: { listings: HostelListing[] }) => {
        setListings(data.listings || []);
        setLoading(false);
      })
      .catch((err) => {
        setErrorMessage((err as Error).message);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadOwnerListings();
  }, [ownerEmail]);

  const toggleFacility = (fac: string) => {
    setFacilities((prev) =>
      prev.includes(fac) ? prev.filter((f) => f !== fac) : [...prev, fac]
    );
  };

  const togglePresetPhoto = (url: string) => {
    setPhotos((prev) =>
      prev.includes(url) ? prev.filter((p) => p !== url) : [...prev, url]
    );
  };

  const handleAddRoomRow = () => {
    const unused =
      ROOM_SHARING_TYPES.find((rt) => !roomTypes.some((r) => r.type === rt)) ||
      '3-Seater';
    setRoomTypes((prev) => [
      ...prev,
      { type: unused as RoomSharingType, monthlyRent: 16000, availableBeds: 2 },
    ]);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setBannerMessage(null);

    if (!consentAgreed || !authorityConfirmed || !signatoryName.trim()) {
      setErrorMessage(
        'You must confirm your authority to represent this hostel and agree to the publishing consent terms.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/owner/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-email': ownerEmail.trim(),
        },
        body: JSON.stringify({
          name,
          ownerName,
          managerName,
          publicPhone,
          publicEmail: publicEmail || ownerEmail,
          city: 'Lahore',
          area,
          fullAddress,
          category,
          roomTypes,
          securityDeposit,
          facilities,
          mealArrangements,
          internetAvailability,
          electricityBackup,
          securityArrangements,
          hostelRules,
          photos,
          signatoryName,
          authorityRole,
          authorityConfirmed,
          consentAgreed,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Submission failed.');
      }

      setBannerMessage(
        data.message ||
          'Your hostel information has been submitted and is awaiting review.'
      );
      setName('');
      setFullAddress('');
      setConsentAgreed(false);
      setAuthorityConfirmed(false);
      loadOwnerListings();
      navigate('/owner/dashboard');
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmAvailability = async (listing: HostelListing) => {
    setBannerMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/owner/listings/${listing.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-email': ownerEmail.trim(),
        },
        body: JSON.stringify({
          confirmAvailabilityOnly: true,
          roomTypes: listing.roomTypes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update availability.');
      setBannerMessage(
        `Bed availability timestamp confirmed for ${listing.name}.`
      );
      loadOwnerListings();
    } catch (err) {
      setErrorMessage((err as Error).message);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;
    setSavingEdit(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/owner/listings/${editingListing.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-email': ownerEmail.trim(),
        },
        body: JSON.stringify({
          name: editingListing.name,
          fullAddress: editingListing.fullAddress,
          publicPhone: editingListing.publicPhone,
          securityDeposit: editingListing.securityDeposit,
          roomTypes: editingListing.roomTypes,
          facilities: editingListing.facilities,
          mealArrangements: editingListing.mealArrangements,
          internetAvailability: editingListing.internetAvailability,
          electricityBackup: editingListing.electricityBackup,
          securityArrangements: editingListing.securityArrangements,
          hostelRules: editingListing.hostelRules,
          photos: editingListing.photos,
          ownerResponseNote: editResponseNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed.');

      setBannerMessage(
        data.listing.verificationStatus === 'verification_pending'
          ? 'Your updated hostel information has been submitted and is awaiting review.'
          : 'Hostel details and room availability updated.'
      );
      setEditingListing(null);
      setEditResponseNote('');
      loadOwnerListings();
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Owner Workspace Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold text-[#1D4ED8] mb-1">
              Official Hostel Hub Owner Portal
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F1E36]">
              {activeTab === 'register'
                ? 'Hostel Owner Registration & Consent'
                : 'Owner Listing Dashboard'}
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
              Submit verified residence information, agree to publishing terms, and
              keep room rent and bed availability accurate. Listings require
              administrator approval before going live.
            </p>
          </div>

          {/* Route Tabs */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200 self-start">
            <Link
              to="/owner/dashboard"
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-[#0F1E36] text-white'
                  : 'text-slate-700 hover:text-[#0F1E36]'
              }`}
            >
              My Listings Dashboard
            </Link>
            <Link
              to="/owner/register"
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'register'
                  ? 'bg-[#1D4ED8] text-white'
                  : 'text-slate-700 hover:text-[#0F1E36]'
              }`}
            >
              + Register New Hostel
            </Link>
          </div>
        </div>

        {/* Owner Session Selector */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <label
              htmlFor="owner-session-email"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Active Owner Account Email (Scoped Access)
            </label>
            <input
              id="owner-session-email"
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="owner@yourhostel.pk"
              className="w-full max-w-md h-10 px-3 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Quick switch:</span>
            {PRESET_OWNERS.map((p) => (
              <button
                key={p.email}
                type="button"
                onClick={() => setOwnerEmail(p.email)}
                className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                  ownerEmail.toLowerCase() === p.email.toLowerCase()
                    ? 'bg-blue-50 border-blue-300 text-[#1D4ED8]'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {bannerMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3 text-sm text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <span>{bannerMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 text-sm text-red-800">
            <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: OWNER REGISTRATION & CONSENT FORM */}
        {activeTab === 'register' && (
          <form
            onSubmit={handleRegisterSubmit}
            className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-8"
          >
            {/* Basic & Contact Information */}
            <div>
              <h2 className="font-display text-lg font-bold text-[#0F1E36] pb-3 border-b border-slate-100">
                1. Official Hostel & Contact Information
              </h2>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Official Hostel Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Al-Noor Scholars Boys Hostel"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Boys / Girls Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as HostelCategory)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm"
                  >
                    <option value="boys">Boys Hostel</option>
                    <option value="girls">Girls Hostel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Owner Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Legal owner name"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Authorized Manager / Warden Name
                  </label>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="On-site manager name"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Public Business Phone *
                  </label>
                  <input
                    required
                    type="text"
                    value={publicPhone}
                    onChange={(e) => setPublicPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Public Inquiry Email
                  </label>
                  <input
                    type="email"
                    value={publicEmail}
                    onChange={(e) => setPublicEmail(e.target.value)}
                    placeholder="admissions@hostel.pk"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Lahore Area *
                  </label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm"
                  >
                    {LAHORE_AREA_NAMES.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Hostel Street Address *
                  </label>
                  <input
                    required
                    type="text"
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder="Plot / House #, Block, Street, Area, Lahore"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Room Types, Monthly Rent & Availability */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="font-display text-lg font-bold text-[#0F1E36]">
                  2. Room Types, Monthly Rent & Available Beds
                </h2>
                <button
                  type="button"
                  onClick={handleAddRoomRow}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8] hover:text-blue-800"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Room Type</span>
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {roomTypes.map((room, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-3 rounded-lg border border-slate-200 bg-slate-50/70"
                  >
                    <div className="sm:col-span-4">
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Room Sharing Type
                      </label>
                      <select
                        value={room.type}
                        onChange={(e) => {
                          const next = [...roomTypes];
                          next[idx] = {
                            ...next[idx],
                            type: e.target.value as RoomSharingType,
                          };
                          setRoomTypes(next);
                        }}
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm"
                      >
                        {ROOM_SHARING_TYPES.map((rt) => (
                          <option key={rt} value={rt}>
                            {rt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Monthly Rent (PKR)
                      </label>
                      <input
                        type="number"
                        min={1000}
                        value={room.monthlyRent}
                        onChange={(e) => {
                          const next = [...roomTypes];
                          next[idx] = {
                            ...next[idx],
                            monthlyRent: Number(e.target.value),
                          };
                          setRoomTypes(next);
                        }}
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm tabular-nums"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Available Beds
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={room.availableBeds}
                        onChange={(e) => {
                          const next = [...roomTypes];
                          next[idx] = {
                            ...next[idx],
                            availableBeds: Number(e.target.value),
                          };
                          setRoomTypes(next);
                        }}
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm tabular-nums"
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      {roomTypes.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setRoomTypes((prev) => prev.filter((_, i) => i !== idx))
                          }
                          aria-label="Remove room type"
                          className="h-10 w-10 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="max-w-xs pt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Security Deposit (PKR, if applicable)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm tabular-nums"
                  />
                </div>
              </div>
            </div>

            {/* Facilities & Operations */}
            <div>
              <h2 className="font-display text-lg font-bold text-[#0F1E36] pb-3 border-b border-slate-100">
                3. Facilities, Utilities, Security & Rules
              </h2>
              <div className="mt-4">
                <span className="block text-xs font-semibold text-slate-700 mb-2">
                  Select Provided Facilities
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {STANDARD_FACILITIES.map((fac) => (
                    <label
                      key={fac}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 text-sm cursor-pointer hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={facilities.includes(fac)}
                        onChange={() => toggleFacility(fac)}
                        className="rounded border-slate-300 text-[#1D4ED8]"
                      />
                      <span>{fac}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Meal Arrangements
                  </label>
                  <textarea
                    rows={2}
                    value={mealArrangements}
                    onChange={(e) => setMealArrangements(e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Internet Availability
                  </label>
                  <textarea
                    rows={2}
                    value={internetAvailability}
                    onChange={(e) => setInternetAvailability(e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Electricity & Backup Arrangements
                  </label>
                  <textarea
                    rows={2}
                    value={electricityBackup}
                    onChange={(e) => setElectricityBackup(e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Security Arrangements
                  </label>
                  <textarea
                    rows={2}
                    value={securityArrangements}
                    onChange={(e) => setSecurityArrangements(e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Hostel Rules & Curfew Policy
                  </label>
                  <textarea
                    rows={2}
                    value={hostelRules}
                    onChange={(e) => setHostelRules(e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Authorized Photographs */}
            <div>
              <h2 className="font-display text-lg font-bold text-[#0F1E36] pb-3 border-b border-slate-100">
                4. Authorized Hostel Photographs
              </h2>
              <p className="mt-2 text-xs text-slate-600">
                Select or attach photographs that you own or are legally authorized to
                publish on Hostel Hub.
              </p>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {AUTHORIZED_PHOTO_GALLERY.map((item) => {
                  const selected = photos.includes(item.url);
                  return (
                    <button
                      key={item.url}
                      type="button"
                      onClick={() => togglePresetPhoto(item.url)}
                      className={`text-left rounded-lg border overflow-hidden transition-colors ${
                        selected
                          ? 'border-[#1D4ED8] ring-2 ring-blue-600/20'
                          : 'border-slate-200 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="aspect-[4/3] bg-slate-100">
                        <ResilientImage
                          src={item.url}
                          alt={item.label}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2 text-xs font-medium text-slate-700 flex items-center justify-between gap-1">
                        <span className="truncate">{item.label}</span>
                        {selected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-2 max-w-lg">
                <input
                  type="url"
                  value={customPhotoUrl}
                  onChange={(e) => setCustomPhotoUrl(e.target.value)}
                  placeholder="Optional: Add authorized photo URL"
                  className="flex-1 h-10 px-3 rounded-lg border border-slate-300 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customPhotoUrl.trim()) {
                      setPhotos((prev) => [...prev, customPhotoUrl.trim()]);
                      setCustomPhotoUrl('');
                    }
                  }}
                  className="px-4 h-10 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Attach URL
                </button>
              </div>
            </div>

            {/* Step 3: Mandatory Owner Consent */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#0F1E36]">
                <FileCheck2 className="w-5 h-5 text-[#1D4ED8]" />
                <h2 className="font-display text-base font-bold">
                  5. Owner Consent & Publishing Authorization (Required)
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Authorized Signatory Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                    placeholder="Full legal name"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Role at Hostel *
                  </label>
                  <select
                    value={authorityRole}
                    onChange={(e) =>
                      setAuthorityRole(
                        e.target.value as 'Owner' | 'Authorized Manager'
                      )
                    }
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm"
                  >
                    <option value="Owner">Property Owner</option>
                    <option value="Authorized Manager">Authorized Manager</option>
                  </select>
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-sm text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={authorityConfirmed}
                  onChange={(e) => setAuthorityConfirmed(e.target.checked)}
                  className="mt-1 rounded border-slate-300 text-[#1D4ED8]"
                />
                <span>
                  I confirm that I am the owner or an authorized manager legally
                  permitted to represent this hostel and submit its business details.
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-sm text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentAgreed}
                  onChange={(e) => setConsentAgreed(e.target.checked)}
                  className="mt-1 rounded border-slate-300 text-[#1D4ED8]"
                />
                <span>
                  I agree to the Hostel Hub Listing Terms (v1.0-2026) and grant
                  permission to publish the submitted hostel information and
                  photographs upon administrator verification.
                </span>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <p className="text-xs text-slate-500">
                Note: Owners cannot mark their own listings as verified. An
                administrator will review your submission before public release.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-lg bg-[#0F1E36] hover:bg-[#1E3A5F] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {submitting ? 'Submitting for Review...' : 'Submit Hostel for Verification'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: OWNER DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            {loading && (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-sm text-slate-600">
                Loading your hostel listings...
              </div>
            )}

            {!loading && listings.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                <h2 className="font-display text-lg font-bold text-[#0F1E36]">
                  No hostel submissions found for {ownerEmail}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Register your hostel with publishing consent to submit it for
                  administrator review.
                </p>
                <Link
                  to="/owner/register"
                  className="mt-5 inline-flex px-5 py-2.5 rounded-lg bg-[#1D4ED8] text-white text-sm font-semibold"
                >
                  Register Your Hostel
                </Link>
              </div>
            )}

            {!loading &&
              listings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
                >
                  {/* Status Banner */}
                  {listing.verificationStatus === 'verification_pending' && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-start gap-3 text-sm text-blue-950">
                      <Clock className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">
                          Your hostel information has been submitted and is awaiting review.
                        </p>
                        <p className="text-xs text-blue-800 mt-1">
                          An administrator is reviewing your owner authority, physical
                          address, and authorized photos before publishing.
                        </p>
                      </div>
                    </div>
                  )}

                  {listing.verificationStatus === 'changes_requested' && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 text-sm text-amber-950">
                      <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">
                          Administrator Requested Corrections
                        </p>
                        <p className="text-sm mt-1">
                          {listing.adminChangeRequest ||
                            'Please review and update your listing information.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {listing.verificationStatus === 'approved' && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-emerald-950">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">
                            Approved & Live on Hostel Hub
                          </p>
                          <p className="text-xs text-emerald-800 mt-0.5 tabular-nums">
                            Approved on{' '}
                            {listing.approvedAt
                              ? new Date(listing.approvedAt).toLocaleDateString('en-PK')
                              : 'Verified'}
                            {' · '}Major changes (address, photos, category) will
                            require administrator re-review.
                          </p>
                        </div>
                      </div>
                      <Link
                        to={`/hostels/${listing.slug}`}
                        className="px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold whitespace-nowrap self-start sm:self-auto"
                      >
                        View Public Listing
                      </Link>
                    </div>
                  )}

                  {listing.verificationStatus === 'rejected' && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3 text-sm text-red-900">
                      <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Listing Not Approved</p>
                        <p className="text-xs mt-1">
                          {listing.adminChangeRequest ||
                            'Did not pass verification checks.'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                        <span>
                          {listing.category === 'boys'
                            ? 'Boys Hostel'
                            : 'Girls Hostel'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {listing.area}, {listing.city}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Consent signed by {listing.ownerConsent.signatoryName}
                        </span>
                      </div>
                      <h2 className="mt-1.5 font-display text-xl font-bold text-[#0F1E36]">
                        {listing.name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        {listing.fullAddress}
                      </p>
                      <p className="mt-2 font-mono text-sm font-semibold text-slate-800 tabular-nums">
                        {formatPkr(listing.monthlyRentMin)} –{' '}
                        {formatPkr(listing.monthlyRentMax)} / mo ·{' '}
                        {listing.availableBedsTotal} beds available
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleConfirmAvailability(listing)}
                        className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 inline-flex items-center gap-1.5"
                      >
                        <CalendarCheck className="w-4 h-4 text-[#1D4ED8]" />
                        <span>Confirm Bed Availability</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingListing(listing)}
                        className="px-4 py-2 rounded-lg bg-[#0F1E36] hover:bg-[#1E3A5F] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit Listing / Respond</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Inline Edit Modal for Owner */}
        {editingListing && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
            <form
              onSubmit={handleSaveEdit}
              className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="font-display text-lg font-bold text-[#0F1E36]">
                  Edit {editingListing.name}
                </h2>
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                >
                  Close
                </button>
              </div>

              {editingListing.adminChangeRequest && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <strong>Admin Request:</strong> {editingListing.adminChangeRequest}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Public Phone
                  </label>
                  <input
                    type="text"
                    value={editingListing.publicPhone}
                    onChange={(e) =>
                      setEditingListing({
                        ...editingListing,
                        publicPhone: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Security Deposit (PKR)
                  </label>
                  <input
                    type="number"
                    value={editingListing.securityDeposit}
                    onChange={(e) =>
                      setEditingListing({
                        ...editingListing,
                        securityDeposit: Number(e.target.value),
                      })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Address (Changes trigger admin re-verification)
                </label>
                <input
                  type="text"
                  value={editingListing.fullAddress}
                  onChange={(e) =>
                    setEditingListing({
                      ...editingListing,
                      fullAddress: e.target.value,
                    })
                  }
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Update Room Rent & Available Beds
                </span>
                <div className="space-y-2">
                  {editingListing.roomTypes.map((room, idx) => (
                    <div key={room.type} className="grid grid-cols-3 gap-2 items-center">
                      <span className="text-xs font-medium text-slate-700">
                        {room.type}
                      </span>
                      <input
                        type="number"
                        value={room.monthlyRent}
                        onChange={(e) => {
                          const next = [...editingListing.roomTypes];
                          next[idx] = {
                            ...next[idx],
                            monthlyRent: Number(e.target.value),
                          };
                          setEditingListing({ ...editingListing, roomTypes: next });
                        }}
                        className="h-9 px-2.5 rounded border border-slate-300 text-xs tabular-nums"
                      />
                      <input
                        type="number"
                        value={room.availableBeds}
                        onChange={(e) => {
                          const next = [...editingListing.roomTypes];
                          next[idx] = {
                            ...next[idx],
                            availableBeds: Number(e.target.value),
                          };
                          setEditingListing({ ...editingListing, roomTypes: next });
                        }}
                        className="h-9 px-2.5 rounded border border-slate-300 text-xs tabular-nums"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Response Note to Administrator (Optional)
                </label>
                <textarea
                  rows={2}
                  value={editResponseNote}
                  onChange={(e) => setEditResponseNote(e.target.value)}
                  placeholder="Describe what you updated or clarify any requested details..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-lg bg-[#0F1E36] text-white text-xs font-semibold"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
