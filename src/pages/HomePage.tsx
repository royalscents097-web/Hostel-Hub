import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  MapPin,
  Search,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ResilientImage } from '../components/ResilientImage';
import { LAHORE_AREAS } from '../constants/lahoreAreas';
import type { HostelCategory } from '../types/hostel';

const FAQS = [
  {
    q: 'Why do I select my area and Boys or Girls category before viewing hostels?',
    a: 'Students and families look for accommodation near specific Lahore campuses and within separate Boys or Girls residences. Choosing your area and category upfront ensures you never see mixed or irrelevant listings.',
  },
  {
    q: 'Are listings on Hostel Hub verified before going live?',
    a: 'Yes. Every public hostel listing requires direct owner or authorized manager registration, signed publishing consent, physical address review, authorized photographs, and administrator approval before appearing in search results.',
  },
  {
    q: 'Why might a specific Lahore area show zero hostels right now?',
    a: 'We never display unverified, scraped, or placeholder listings. If no hostel in an area has completed owner consent and admin verification yet, you will see an honest empty state rather than fake advertisements.',
  },
  {
    q: 'How can a hostel owner list their property on Hostel Hub?',
    a: 'Owners or authorized managers can register through our Owner Registration page, agree to publishing terms, submit full room, rent, facility, and photo details, and await administrator verification.',
  },
  {
    q: 'Can owners update bed availability and monthly rent?',
    a: 'Yes. Verified owners can log into their Owner Dashboard to confirm available beds and update monthly rent. Major structural or photo changes undergo administrator review prior to public display.',
  },
];

const VERIFIED_STEPS = [
  {
    num: '01',
    title: 'Identify Hostel',
    desc: 'Potential residences across Lahore are identified strictly through publicly displayed business contacts or direct owner inquiries.',
  },
  {
    num: '02',
    title: 'Direct Owner Contact',
    desc: 'Our team records outreach dates, contact methods, and owner interest manually without automated spam.',
  },
  {
    num: '03',
    title: 'Owner Consent & Authority',
    desc: 'Interested owners register officially, confirm their authority to represent the property, and sign publishing consent.',
  },
  {
    num: '04',
    title: 'Complete Hostel Information',
    desc: 'Owners submit room types, monthly rent, deposits, utilities, security arrangements, rules, and authorized photos.',
  },
  {
    num: '05',
    title: 'Admin Verification Review',
    desc: 'Administrators inspect owner authority, physical Lahore address, and photos, requesting corrections if anything is missing.',
  },
  {
    num: '06',
    title: 'Approved Public Listing',
    desc: 'Only after all checks pass is a hostel published with its approval date and verified availability timestamp.',
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<HostelCategory | ''>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const buildExploreUrl = (areaOverride?: string, categoryOverride?: HostelCategory | '') => {
    const params = new URLSearchParams();
    const areaToUse = areaOverride !== undefined ? areaOverride : selectedArea;
    const catToUse = categoryOverride !== undefined ? categoryOverride : selectedCategory;
    if (areaToUse) params.set('area', areaToUse);
    if (catToUse) params.set('category', catToUse);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    const qs = params.toString();
    return qs ? `/hostels?${qs}` : '/hostels';
  };

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(buildExploreUrl());
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      {/* 1. Professional Hostel Hub Navigation */}
      <Navbar />

      <main className="flex-1">
        {/* 2. Hero Section with Search and Category Selection */}
        <section className="border-b border-slate-200 bg-slate-50/70">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              <div className="lg:col-span-7 flex flex-col justify-center">
                <p className="text-sm font-medium text-[#1D4ED8] mb-3">
                  Lahore Student Accommodation Directory
                </p>
                <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#0F1E36] leading-[1.12] [text-wrap:balance]">
                  Find Verified Boys and Girls Hostels in Lahore
                </h1>
                <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                  Choose your preferred Lahore neighborhood and hostel category first.
                  Every published residence undergoes direct owner consent and
                  administrator verification before appearing in public search results.
                </p>

                {/* Location & Category Search Form */}
                <form
                  onSubmit={handleHeroSearch}
                  className="mt-8 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4"
                >
                  {/* Boys / Girls Category Selection */}
                  <div>
                    <span className="block text-xs font-semibold text-slate-700 mb-2">
                      1. Select Hostel Category
                    </span>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCategory((prev) => (prev === 'boys' ? '' : 'boys'))
                        }
                        className={`px-4 py-2.5 text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${
                          selectedCategory === 'boys'
                            ? 'bg-[#0F1E36] text-white'
                            : 'text-slate-700 hover:text-[#0F1E36] hover:bg-white/70'
                        }`}
                      >
                        Boys Hostels
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCategory((prev) => (prev === 'girls' ? '' : 'girls'))
                        }
                        className={`px-4 py-2.5 text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${
                          selectedCategory === 'girls'
                            ? 'bg-[#1D4ED8] text-white'
                            : 'text-slate-700 hover:text-[#0F1E36] hover:bg-white/70'
                        }`}
                      >
                        Girls Hostels
                      </button>
                    </div>
                  </div>

                  {/* Area & Keyword Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-5">
                      <label
                        htmlFor="hero-area"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        2. Select Area in Lahore
                      </label>
                      <select
                        id="hero-area"
                        value={selectedArea}
                        onChange={(e) => setSelectedArea(e.target.value)}
                        className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                      >
                        <option value="">All Lahore Areas</option>
                        {LAHORE_AREAS.map((area) => (
                          <option key={area.name} value={area.name}>
                            {area.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-4">
                      <label
                        htmlFor="hero-keyword"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Keyword or Facility
                      </label>
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="hero-keyword"
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Wi-Fi, Mess, LUMS..."
                          className="w-full h-11 pl-9 pr-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3 flex items-end">
                      <button
                        type="submit"
                        className="w-full h-11 px-4 rounded-lg bg-[#1D4ED8] hover:bg-blue-800 text-white text-sm font-semibold transition-colors whitespace-nowrap flex items-center justify-center gap-2"
                      >
                        <span>Find Hostels</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </form>

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
                  <span>13 Lahore student areas</span>
                  <span aria-hidden="true">·</span>
                  <span>Strict Boys & Girls separation</span>
                  <span aria-hidden="true">·</span>
                  <span>Owner-consented listings only</span>
                </div>
              </div>

              <div className="lg:col-span-5 flex">
                <div className="w-full rounded-xl overflow-hidden border border-slate-200 bg-white">
                  <ResilientImage
                    src="/src/assets/images/hero_lahore_hostel_campus_1794843376764.jpg"
                    alt="Modern verified student hostel residence courtyard in Lahore"
                    className="w-full h-72 lg:h-full object-cover"
                    fallbackLabel="Lahore Verified Student Residences"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Popular Student Areas in Lahore */}
        <section id="areas" className="py-16 lg:py-20 bg-white border-b border-slate-200">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F1E36]">
                  Popular Student Areas in Lahore
                </h2>
                <p className="mt-2 text-slate-600 max-w-2xl">
                  Select a neighborhood to explore verified hostels in that area.
                  {selectedCategory
                    ? ` Filtering for ${selectedCategory === 'boys' ? 'Boys Hostels' : 'Girls Hostels'}.`
                    : ' You can choose Boys or Girls hostels on the next screen.'}
                </p>
              </div>
              <Link
                to={buildExploreUrl('')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D4ED8] hover:text-blue-800 whitespace-nowrap shrink-0"
              >
                <span>Open Full Discovery Page</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {LAHORE_AREAS.map((area) => (
                <Link
                  key={area.name}
                  to={buildExploreUrl(area.name)}
                  className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-[#1D4ED8] hover:bg-blue-50/30 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-base font-semibold text-[#0F1E36] group-hover:text-[#1D4ED8] transition-colors">
                        {area.name}
                      </h3>
                      <MapPin className="w-4 h-4 text-slate-400 group-hover:text-[#1D4ED8] shrink-0 mt-0.5" />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                      {area.nearbyCampuses}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600 group-hover:text-[#1D4ED8]">
                    <span>{area.corridor}</span>
                    <span className="inline-flex items-center gap-1">
                      Explore <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Boys Hostels / Girls Hostels Discovery Calls to Action */}
        <section className="py-16 lg:py-20 bg-slate-50 border-b border-slate-200">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-10">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F1E36]">
                Browse by Residence Category
              </h2>
              <p className="mt-2 text-slate-600">
                Boys and Girls hostels are strictly separated across search and filters
                so students and parents always review relevant options.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Boys Hostels Card */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col">
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  <ResilientImage
                    src="/src/assets/images/hostel_boys_study_room_1794843376255.jpg"
                    alt="Clean twin-sharing boys hostel study bedroom"
                    className="w-full h-full object-cover"
                    fallbackLabel="Boys Hostels in Lahore"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-xl font-bold text-[#0F1E36]">
                      Boys Hostels in Lahore
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      Single private, twin-sharing, and triple-sharing rooms near LUMS,
                      Punjab University, FAST, UET, and UMT with verified utility backup
                      and internet details.
                    </p>
                  </div>
                  <div className="mt-6">
                    <Link
                      to={buildExploreUrl(selectedArea, 'boys')}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F1E36] hover:bg-[#1E3A5F] text-white text-sm font-semibold transition-colors whitespace-nowrap"
                    >
                      <span>Explore Boys Hostels</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Girls Hostels Card */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col">
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  <ResilientImage
                    src="/src/assets/images/hostel_girls_residence_1794843376853.jpg"
                    alt="Bright modern girls hostel residence study lounge"
                    className="w-full h-full object-cover"
                    fallbackLabel="Girls Hostels in Lahore"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-xl font-bold text-[#0F1E36]">
                      Girls Hostels in Lahore
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      Secure female student residences with warden supervision, mess
                      arrangements, biometric entry details, and guardian-transparent rules
                      verified by our team.
                    </p>
                  </div>
                  <div className="mt-6">
                    <Link
                      to={buildExploreUrl(selectedArea, 'girls')}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1D4ED8] hover:bg-blue-800 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                    >
                      <span>Explore Girls Hostels</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. How Hostel Hub Works */}
        <section id="how-it-works" className="py-16 lg:py-20 bg-white border-b border-slate-200">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-10">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F1E36]">
                How Hostel Hub Works
              </h2>
              <p className="mt-2 text-slate-600">
                A structured discovery workflow designed for university students and
                parents relocating to Lahore.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-slate-200 p-6 bg-white">
                <p className="font-mono text-sm font-semibold text-[#1D4ED8] mb-2">01</p>
                <h3 className="font-display text-lg font-bold text-[#0F1E36]">
                  Choose Location & Category
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Start with your campus neighborhood in Lahore and select Boys Hostels
                  or Girls Hostels before viewing any listings.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-6 bg-white">
                <p className="font-mono text-sm font-semibold text-[#1D4ED8] mb-2">02</p>
                <h3 className="font-display text-lg font-bold text-[#0F1E36]">
                  Filter by Verified Details
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Narrow results by monthly rent, room sharing type, backup power, meals,
                  and recently confirmed bed availability.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-6 bg-white">
                <p className="font-mono text-sm font-semibold text-[#1D4ED8] mb-2">03</p>
                <h3 className="font-display text-lg font-bold text-[#0F1E36]">
                  Contact Verified Residences
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Connect directly with the verified owner or authorized warden using
                  confirmed business contact details.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Why Choose Hostel Hub */}
        <section className="py-16 lg:py-20 bg-slate-50 border-b border-slate-200">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6">
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F1E36]">
                  Why Students & Families Trust Hostel Hub
                </h2>
                <p className="mt-3 text-slate-600 leading-relaxed">
                  Most hostel directories copy outdated phone numbers or display
                  placeholder photos. Hostel Hub publishes information only when an
                  owner has explicitly consented and our verification team has reviewed
                  the residence.
                </p>

                <ul className="mt-6 space-y-3.5 text-sm text-slate-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-semibold text-[#0F1E36]">
                        Zero Fake or Scraped Listings:
                      </strong>{' '}
                      No third-party copied photos or unverified placeholder cards on public pages.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-semibold text-[#0F1E36]">
                        Transparent Rent & Security Deposits:
                      </strong>{' '}
                      Clear monthly rent per room sharing category plus refundable deposit terms.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-semibold text-[#0F1E36]">
                        Fresh Availability Timestamps:
                      </strong>{' '}
                      See exactly when an owner last confirmed vacant beds and hostel facilities.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-semibold text-[#0F1E36]">
                        Direct Owner Accountability:
                      </strong>{' '}
                      Owners cannot self-verify; administrator review is mandatory for publishing.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-6">
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                  <ResilientImage
                    src="/src/assets/images/hostel_dining_commons_1794843378031.jpg"
                    alt="Clean student hostel dining commons and kitchen"
                    className="w-full aspect-[4/3] object-cover"
                    fallbackLabel="Verified Hostel Standards"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Verified Listing Process */}
        <section className="py-16 lg:py-20 bg-white border-b border-slate-200">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-10">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#1D4ED8] mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Our 6-Step Verification Standard</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F1E36]">
                Verified Listing Process
              </h2>
              <p className="mt-2 text-slate-600">
                Every hostel on Hostel Hub follows a documented onboarding and review
                lifecycle before becoming visible to students.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {VERIFIED_STEPS.map((step) => (
                <div
                  key={step.num}
                  className="rounded-xl border border-slate-200 p-5 bg-white"
                >
                  <span className="font-mono text-xs font-semibold text-[#1D4ED8]">
                    Step {step.num}
                  </span>
                  <h3 className="mt-1.5 font-display text-base font-bold text-[#0F1E36]">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. List Your Hostel Section */}
        <section className="py-16 lg:py-20 bg-[#0F1E36] text-white">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-blue-300 mb-3">
                  <Building2 className="w-4 h-4" />
                  <span>For Lahore Hostel Owners & Authorized Managers</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white [text-wrap:balance]">
                  Own or Manage a Student Hostel in Lahore?
                </h2>
                <p className="mt-3 text-slate-300 leading-relaxed">
                  Register through the official Hostel Hub Owner Registration portal,
                  provide publishing consent, and share accurate room availability and
                  authorized photographs directly with students searching in your area.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  to="/owner/register"
                  className="px-6 py-3 rounded-lg bg-[#2563EB] hover:bg-blue-500 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  Register Your Hostel
                </Link>
                <Link
                  to="/owner/dashboard"
                  className="px-6 py-3 rounded-lg border border-slate-600 hover:border-slate-400 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  Owner Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 9. FAQ Section */}
        <section className="py-16 lg:py-20 bg-white">
          <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F1E36] mb-8">
              Frequently Asked Questions
            </h2>
            <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
              {FAQS.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={item.q} className="py-4">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-4 text-left py-1"
                    >
                      <span className="font-display text-base font-semibold text-[#0F1E36]">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-500 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="mt-2.5 text-sm text-slate-600 leading-relaxed pr-8">
                        {item.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* 10. Professional Footer */}
      <Footer />
    </div>
  );
}
