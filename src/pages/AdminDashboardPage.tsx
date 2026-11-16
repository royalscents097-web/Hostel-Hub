import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Lock,
  Plus,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ResilientImage } from '../components/ResilientImage';
import { CONTACT_STATUSES, LAHORE_AREA_NAMES } from '../constants/lahoreAreas';
import type {
  AcquisitionContactRecord,
  ContactMethod,
  ContactStatus,
  HostelCategory,
  HostelListing,
} from '../types/hostel';

interface PipelineTab {
  key: string;
  label: string;
  statusMatch: ContactStatus;
}

const PIPELINE_TABS: PipelineTab[] = [
  { key: 'potential', label: 'Potential Hostels', statusMatch: 'Not Contacted' },
  { key: 'contacted', label: 'Contacted Hostels', statusMatch: 'Contacted' },
  { key: 'interested', label: 'Interested Owners', statusMatch: 'Interested' },
  {
    key: 'awaiting',
    label: 'Awaiting Information',
    statusMatch: 'Awaiting Information',
  },
  {
    key: 'pending',
    label: 'Verification Pending',
    statusMatch: 'Verification Pending',
  },
  { key: 'approved', label: 'Approved Hostels', statusMatch: 'Approved' },
  { key: 'rejected', label: 'Rejected Hostels', statusMatch: 'Rejected' },
];

export function AdminDashboardPage() {
  const [adminAuthorized, setAdminAuthorized] = useState(true);
  const [acquisitions, setAcquisitions] = useState<AcquisitionContactRecord[]>([]);
  const [hostels, setHostels] = useState<HostelListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>('pending');
  const [searchQ, setSearchQ] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusOverride, setStatusOverride] = useState('');

  // Selected Record Drawer
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Add Potential Hostel Modal
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHostelName, setNewHostelName] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newArea, setNewArea] = useState('DHA');
  const [newCategory, setNewCategory] = useState<HostelCategory>('boys');
  const [newSource, setNewSource] = useState<
    'Public Directory' | 'Campus Notice' | 'Direct Inquiry' | 'Referral'
  >('Public Directory');
  const [newStatus, setNewStatus] = useState<ContactStatus>('Not Contacted');
  const [newMethod, setNewMethod] = useState<ContactMethod>('Phone Call');
  const [newContactDate, setNewContactDate] = useState('');
  const [newFollowUpDate, setNewFollowUpDate] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Contact Log & Verification Review State
  const [outreachSummary, setOutreachSummary] = useState('');
  const [manualStatus, setManualStatus] = useState<ContactStatus>('Contacted');
  const [manualFollowUp, setManualFollowUp] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');

  const [authChecked, setAuthChecked] = useState(false);
  const [addrChecked, setAddrChecked] = useState(false);
  const [photosChecked, setPhotosChecked] = useState(false);
  const [changeRequestMsg, setChangeRequestMsg] = useState('');
  const [adminReviewNote, setAdminReviewNote] = useState('');

  const fetchAdminData = () => {
    setLoading(true);
    setError(null);
    fetch('/api/admin/acquisition', {
      headers: adminAuthorized ? { 'x-role': 'admin' } : {},
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Admin access denied.');
        }
        return data;
      })
      .then(
        (data: {
          acquisitions: AcquisitionContactRecord[];
          hostels: HostelListing[];
        }) => {
          setAcquisitions(data.acquisitions || []);
          setHostels(data.hostels || []);
          setLoading(false);
        }
      )
      .catch((err) => {
        setError((err as Error).message);
        setAcquisitions([]);
        setHostels([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAdminData();
  }, [adminAuthorized]);

  const currentTabStatus =
    PIPELINE_TABS.find((t) => t.key === activeTab)?.statusMatch ||
    'Verification Pending';

  const filteredRecords = useMemo(() => {
    return acquisitions.filter((rec) => {
      const targetStatus = statusOverride || currentTabStatus;
      if (targetStatus !== 'ALL' && rec.contactStatus !== targetStatus) return false;
      if (areaFilter && rec.area !== areaFilter) return false;
      if (categoryFilter && rec.category !== categoryFilter) return false;
      if (searchQ.trim()) {
        const q = searchQ.toLowerCase();
        const hit =
          rec.hostelName.toLowerCase().includes(q) ||
          rec.area.toLowerCase().includes(q) ||
          rec.publicBusinessContact.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [
    acquisitions,
    activeTab,
    statusOverride,
    currentTabStatus,
    areaFilter,
    categoryFilter,
    searchQ,
  ]);

  const selectedRecord = useMemo(
    () => acquisitions.find((a) => a.id === selectedRecordId) || null,
    [acquisitions, selectedRecordId]
  );

  const linkedHostel = useMemo(() => {
    if (!selectedRecord?.linkedHostelId) return null;
    return hostels.find((h) => h.id === selectedRecord.linkedHostelId) || null;
  }, [selectedRecord, hostels]);

  useEffect(() => {
    if (selectedRecord) {
      setManualStatus(selectedRecord.contactStatus);
      setManualFollowUp(selectedRecord.followUpDate || '');
      setPrivateNotes(selectedRecord.notes || '');
      setOutreachSummary('');
    }
    if (linkedHostel) {
      setAuthChecked(linkedHostel.verificationChecklist.authorityVerified);
      setAddrChecked(linkedHostel.verificationChecklist.addressReviewed);
      setPhotosChecked(linkedHostel.verificationChecklist.photosReviewed);
      setAdminReviewNote(linkedHostel.adminNotes || '');
      setChangeRequestMsg('');
    }
  }, [selectedRecordId, linkedHostel]);

  const handleAddPotentialHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/acquisition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-role': 'admin',
        },
        body: JSON.stringify({
          hostelName: newHostelName,
          publicBusinessContact: newContact,
          area: newArea,
          category: newCategory,
          sourceType: newSource,
          contactStatus: newStatus,
          contactMethod: newMethod,
          contactDate: newContactDate,
          followUpDate: newFollowUpDate,
          notes: newNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add record.');

      setFeedback(`Added "${data.record.hostelName}" to ${data.record.contactStatus}.`);
      setShowAddForm(false);
      setNewHostelName('');
      setNewContact('');
      setNewNotes('');
      const matchingTab = PIPELINE_TABS.find(
        (t) => t.statusMatch === data.record.contactStatus
      );
      if (matchingTab) setActiveTab(matchingTab.key);
      fetchAdminData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleUpdateContactRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setFeedback(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/acquisition/${selectedRecord.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-role': 'admin',
        },
        body: JSON.stringify({
          contactStatus: manualStatus,
          followUpDate: manualFollowUp,
          notes: privateNotes,
          logNewOutreach: Boolean(outreachSummary.trim()),
          outreachSummary,
          contactDate: new Date().toISOString().slice(0, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update contact record.');
      setFeedback(`Updated status & contact notes for ${selectedRecord.hostelName}.`);
      setOutreachSummary('');
      fetchAdminData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleVerificationDecision = async (
    action: 'approve' | 'request_changes' | 'reject'
  ) => {
    if (!linkedHostel) return;
    setFeedback(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/verify/${linkedHostel.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-role': 'admin',
        },
        body: JSON.stringify({
          action,
          authorityVerified: authChecked,
          addressReviewed: addrChecked,
          photosReviewed: photosChecked,
          adminNotes: adminReviewNote,
          changeRequestMessage: changeRequestMsg,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification action failed.');

      if (action === 'approve') {
        setFeedback(
          `${linkedHostel.name} is now Approved and published to /hostels!`
        );
        setActiveTab('approved');
      } else if (action === 'request_changes') {
        setFeedback(
          `Corrections requested from ${linkedHostel.ownerName}. Status moved to Awaiting Information.`
        );
        setActiveTab('awaiting');
      } else {
        setFeedback(`${linkedHostel.name} has been rejected.`);
        setActiveTab('rejected');
      }
      setSelectedRecordId(null);
      fetchAdminData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header & Security Controls */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8] mb-1">
              <Lock className="w-3.5 h-3.5" />
              <span>Admin-Restricted Workflow</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F1E36]">
              Hostel Acquisition & Verification
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Manage direct hostel outreach, owner consent records, and verification
              approvals. Internal contact notes and unapproved submissions are never
              exposed publicly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setAdminAuthorized((prev) => !prev)}
              className={`px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                adminAuthorized
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : 'border-red-300 bg-red-50 text-red-900'
              }`}
            >
              {adminAuthorized
                ? 'Session Role: Authorized Admin'
                : 'Session Role: Public Visitor (Test 403)'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              disabled={!adminAuthorized}
              className="px-4 py-2 rounded-lg bg-[#0F1E36] hover:bg-[#1E3A5F] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Identify Potential Hostel</span>
            </button>
          </div>
        </div>

        {feedback && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-2.5 text-sm text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-2.5 text-sm text-red-900">
            <AlertCircle className="w-5 h-5 text-red-700 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 7 Pipeline Tabs */}
        <div className="bg-white border border-slate-200 rounded-xl p-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {PIPELINE_TABS.map((tab) => {
              const count = acquisitions.filter(
                (a) => a.contactStatus === tab.statusMatch
              ).length;
              const active = activeTab === tab.key && !statusOverride;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setStatusOverride('');
                    setActiveTab(tab.key);
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap inline-flex items-center gap-2 ${
                    active
                      ? 'bg-[#0F1E36] text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`font-mono tabular-nums ${
                      active ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white border border-slate-200 rounded-xl p-4">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search hostel name, phone, or area..."
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div className="sm:col-span-3">
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm"
            >
              <option value="">All Lahore Areas</option>
              {LAHORE_AREA_NAMES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm"
            >
              <option value="">All Categories</option>
              <option value="boys">Boys Hostels</option>
              <option value="girls">Girls Hostels</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <select
              value={statusOverride}
              onChange={(e) => setStatusOverride(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm"
            >
              <option value="">Filter: Current Tab</option>
              <option value="ALL">All Statuses</option>
              {CONTACT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Acquisition & Verification Records Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="py-3 px-4">Hostel Name</th>
                  <th className="py-3 px-4">Area</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Public Contact</th>
                  <th className="py-3 px-4">Method & Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Follow-Up</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={8} className="py-8 px-4 text-center text-slate-500">
                      Loading acquisition and verification records...
                    </td>
                  </tr>
                )}
                {!loading && filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 px-4 text-center text-slate-500">
                      No records match this stage and filter selection.
                    </td>
                  </tr>
                )}
                {!loading &&
                  filteredRecords.map((rec) => (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-[#0F1E36]">
                        {rec.hostelName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{rec.area}</td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {rec.category === 'boys' ? 'Boys' : 'Girls'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700 tabular-nums">
                        {rec.publicBusinessContact}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 tabular-nums">
                        {rec.contactDate
                          ? `${rec.contactMethod} · ${rec.contactDate}`
                          : 'Not yet contacted'}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-800">
                        {rec.contactStatus}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600 tabular-nums">
                        {rec.followUpDate || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedRecordId(rec.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#0F1E36] hover:bg-[#1E3A5F] text-white text-xs font-semibold whitespace-nowrap"
                        >
                          {rec.linkedHostelId ? 'Inspect & Verify' : 'Open Record'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Potential Hostel Modal */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
            <form
              onSubmit={handleAddPotentialHostel}
              className="bg-white rounded-xl border border-slate-200 max-w-xl w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="font-display text-lg font-bold text-[#0F1E36]">
                  Step 1 & 2: Identify Potential Hostel & Log Contact
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Record only publicly displayed business contact details. Do not copy
                third-party website descriptions, reviews, or photos.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hostel Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={newHostelName}
                    onChange={(e) => setNewHostelName(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Public Business Contact *
                  </label>
                  <input
                    required
                    type="text"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    placeholder="+92 3XX XXXXXXX"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Area *
                  </label>
                  <select
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as HostelCategory)
                    }
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm"
                  >
                    <option value="boys">Boys Hostel</option>
                    <option value="girls">Girls Hostel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Identification Source
                  </label>
                  <select
                    value={newSource}
                    onChange={(e) =>
                      setNewSource(e.target.value as typeof newSource)
                    }
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm"
                  >
                    <option value="Public Directory">Public Directory</option>
                    <option value="Campus Notice">Campus Notice</option>
                    <option value="Direct Inquiry">Direct Inquiry</option>
                    <option value="Referral">Referral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ContactStatus)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm"
                  >
                    {CONTACT_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Method
                  </label>
                  <select
                    value={newMethod}
                    onChange={(e) => setNewMethod(e.target.value as ContactMethod)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm"
                  >
                    <option value="Phone Call">Phone Call</option>
                    <option value="WhatsApp Business">WhatsApp Business</option>
                    <option value="In-Person Visit">In-Person Visit</option>
                    <option value="Email">Email</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Date
                  </label>
                  <input
                    type="date"
                    value={newContactDate}
                    onChange={(e) => setNewContactDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Follow-Up Date
                  </label>
                  <input
                    type="date"
                    value={newFollowUpDate}
                    onChange={(e) => setNewFollowUpDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Internal Admin Notes
                  </label>
                  <textarea
                    rows={2}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0F1E36] text-white text-xs font-semibold"
                >
                  Save Acquisition Record
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Detailed Hostel Record & Verification Drawer */}
        {selectedRecord && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 flex justify-end">
            <div className="bg-white w-full max-w-3xl h-full overflow-y-auto p-6 sm:p-8 space-y-6 border-l border-slate-200">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-semibold text-[#1D4ED8]">
                    Detailed Hostel Record · {selectedRecord.area} ·{' '}
                    {selectedRecord.category === 'boys' ? 'Boys' : 'Girls'}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-[#0F1E36]">
                    {selectedRecord.hostelName}
                  </h2>
                  <p className="mt-1 font-mono text-xs text-slate-600">
                    Public Contact: {selectedRecord.publicBusinessContact}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecordId(null)}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                  aria-label="Close record"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Manual Contact Status & Follow-up Update */}
              <form
                onSubmit={handleUpdateContactRecord}
                className="rounded-xl border border-slate-200 p-5 space-y-4 bg-slate-50/70"
              >
                <h3 className="font-display text-sm font-bold text-[#0F1E36]">
                  Contact Management & Status Update (Human-Verified)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Status
                    </label>
                    <select
                      value={manualStatus}
                      onChange={(e) =>
                        setManualStatus(e.target.value as ContactStatus)
                      }
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm"
                    >
                      {CONTACT_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Follow-Up Date
                    </label>
                    <input
                      type="date"
                      value={manualFollowUp}
                      onChange={(e) => setManualFollowUp(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Private Admin Notes (Never Exposed Publicly)
                  </label>
                  <textarea
                    rows={2}
                    value={privateNotes}
                    onChange={(e) => setPrivateNotes(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Log New Outreach Interaction (Optional)
                  </label>
                  <input
                    type="text"
                    value={outreachSummary}
                    onChange={(e) => setOutreachSummary(e.target.value)}
                    placeholder="e.g., Called owner; agreed to complete registration form."
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0F1E36] hover:bg-[#1E3A5F] text-white text-xs font-semibold"
                >
                  Save Contact Update
                </button>
              </form>

              {/* Step 5 & 6: Admin Verification Review (when owner submitted listing) */}
              {linkedHostel && (
                <div className="rounded-xl border border-blue-200 bg-white p-5 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-[#1D4ED8]" />
                      <h3 className="font-display text-base font-bold text-[#0F1E36]">
                        Step 5 & 6: Owner Submission Verification
                      </h3>
                    </div>
                    <span className="text-xs font-semibold text-[#1D4ED8]">
                      Status: {linkedHostel.verificationStatus}
                    </span>
                  </div>

                  {/* Submitted Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">Owner / Manager</span>
                      <span className="font-semibold text-slate-900">
                        {linkedHostel.ownerName} / {linkedHostel.managerName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Full Address</span>
                      <span className="font-semibold text-slate-900">
                        {linkedHostel.fullAddress}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Consent Signed</span>
                      <span className="font-semibold text-emerald-700">
                        {linkedHostel.ownerConsent.signed
                          ? `Yes · ${linkedHostel.ownerConsent.signatoryName} (${linkedHostel.ownerConsent.authorityRole})`
                          : 'Missing'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Rent & Availability</span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        PKR {linkedHostel.monthlyRentMin.toLocaleString()} –{' '}
                        {linkedHostel.monthlyRentMax.toLocaleString()} ·{' '}
                        {linkedHostel.availableBedsTotal} beds
                      </span>
                    </div>
                  </div>

                  {/* Submitted Photos */}
                  <div>
                    <span className="block text-xs font-semibold text-slate-700 mb-2">
                      Submitted Authorized Photographs
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      {linkedHostel.photos.map((photo, idx) => (
                        <div
                          key={idx}
                          className="aspect-[4/3] rounded-lg overflow-hidden border border-slate-200"
                        >
                          <ResilientImage
                            src={photo}
                            alt={`${linkedHostel.name} submitted photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Verification Checkboxes */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100 text-sm">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={authChecked}
                        onChange={(e) => setAuthChecked(e.target.checked)}
                        className="rounded border-slate-300 text-[#1D4ED8]"
                      />
                      <span>
                        Verified owner or authorized manager authority to represent
                        this hostel
                      </span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addrChecked}
                        onChange={(e) => setAddrChecked(e.target.checked)}
                        className="rounded border-slate-300 text-[#1D4ED8]"
                      />
                      <span>Reviewed full physical street address in Lahore</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={photosChecked}
                        onChange={(e) => setPhotosChecked(e.target.checked)}
                        className="rounded border-slate-300 text-[#1D4ED8]"
                      />
                      <span>
                        Reviewed authorized photographs and verified facilities
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Correction Request / Rejection Message (Visible to Owner if
                      Sent)
                    </label>
                    <textarea
                      rows={2}
                      value={changeRequestMsg}
                      onChange={(e) => setChangeRequestMsg(e.target.value)}
                      placeholder="Specify missing documents, clearer street address, or photo updates..."
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Private Admin Review Note (Internal Only)
                    </label>
                    <input
                      type="text"
                      value={adminReviewNote}
                      onChange={(e) => setAdminReviewNote(e.target.value)}
                      placeholder="Internal verification note..."
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => handleVerificationDecision('approve')}
                      className="px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Approve & Publish Listing</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerificationDecision('request_changes')}
                      className="px-4 py-2.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold"
                    >
                      Request Corrections
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerificationDecision('reject')}
                      className="px-4 py-2.5 rounded-lg border border-red-300 bg-red-50 hover:bg-red-100 text-red-900 text-xs font-semibold"
                    >
                      Reject Listing
                    </button>
                  </div>
                </div>
              )}

              {/* Contact & Verification Audit Timeline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 p-4">
                  <h4 className="font-display text-xs font-bold text-[#0F1E36] mb-3">
                    Contact History
                  </h4>
                  {selectedRecord.contactHistory.length === 0 ? (
                    <p className="text-xs text-slate-500">No outreach logged yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {selectedRecord.contactHistory.map((log) => (
                        <li
                          key={log.id}
                          className="text-xs border-b border-slate-100 pb-2 last:border-0"
                        >
                          <p className="font-semibold text-slate-800 tabular-nums">
                            {log.date} · {log.method} ({log.status})
                          </p>
                          <p className="text-slate-600 mt-0.5">{log.summary}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <h4 className="font-display text-xs font-bold text-[#0F1E36] mb-3">
                    Verification Progress Timeline
                  </h4>
                  {selectedRecord.verificationHistory.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No verification events recorded yet.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {selectedRecord.verificationHistory.map((vh) => (
                        <li
                          key={vh.id}
                          className="text-xs border-b border-slate-100 pb-2 last:border-0"
                        >
                          <p className="font-semibold text-slate-800">
                            {vh.action}
                          </p>
                          <p className="text-slate-500 tabular-nums">
                            {new Date(vh.timestamp).toLocaleString('en-PK')} ·{' '}
                            {vh.actor}
                          </p>
                          <p className="text-slate-600 mt-0.5">{vh.detail}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
