import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { DEV_SAMPLE_HOSTELS } from './server/devFixtures.ts';
import { readDb, toPublicHostel, writeDb } from './server/store.ts';
import type {
  AcquisitionContactRecord,
  ContactStatus,
  HostelListing,
  RoomTypeOffering,
} from './src/types/hostel.ts';

const PORT = 3000;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function isRecentlyConfirmed(isoDate: string, days = 14): boolean {
  const ts = Date.parse(isoDate);
  if (Number.isNaN(ts)) return false;
  const diffDays = (Date.now() - ts) / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}

function computeRentBounds(roomTypes: RoomTypeOffering[]): {
  min: number;
  max: number;
  beds: number;
} {
  if (!roomTypes.length) {
    return { min: 0, max: 0, beds: 0 };
  }
  const rents = roomTypes.map((r) => Number(r.monthlyRent) || 0);
  const beds = roomTypes.reduce((sum, r) => sum + (Number(r.availableBeds) || 0), 0);
  return {
    min: Math.min(...rents),
    max: Math.max(...rents),
    beds,
  };
}

function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const role = req.header('x-role');
  if (role !== 'admin') {
    res.status(403).json({
      error: 'Administrator authorization required for acquisition and verification records.',
    });
    return;
  }
  next();
}

function requireOwnerEmail(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const ownerEmail = req.header('x-owner-email')?.trim().toLowerCase();
  if (!ownerEmail) {
    res.status(401).json({
      error: 'Owner session email is required.',
    });
    return;
  }
  (req as express.Request & { ownerEmail: string }).ownerEmail = ownerEmail;
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // =========================================================
  // PUBLIC HOSTEL DISCOVERY API (Approved & Consented Only)
  // =========================================================
  app.get('/api/hostels', (req, res) => {
    const db = readDb();
    const includeDevSample = req.query.includeDevSample === 'true';

    // Strict public publishing criteria
    let results: HostelListing[] = db.hostels.filter(
      (h) =>
        h.verificationStatus === 'approved' &&
        h.ownerConsent.signed === true &&
        h.isActive === true
    );

    if (includeDevSample) {
      results = [...results, ...DEV_SAMPLE_HOSTELS];
    }

    const city = typeof req.query.city === 'string' ? req.query.city.trim() : '';
    const area = typeof req.query.area === 'string' ? req.query.area.trim() : '';
    const category =
      typeof req.query.category === 'string' ? req.query.category.trim().toLowerCase() : '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    const minRent = req.query.minRent ? Number(req.query.minRent) : undefined;
    const maxRent = req.query.maxRent ? Number(req.query.maxRent) : undefined;
    const roomType = typeof req.query.roomType === 'string' ? req.query.roomType.trim() : '';
    const facilitiesRaw =
      typeof req.query.facilities === 'string' ? req.query.facilities.trim() : '';
    const confirmedRecently = req.query.confirmedRecently === 'true';
    const verificationStatusFilter =
      typeof req.query.verificationStatus === 'string'
        ? req.query.verificationStatus.trim()
        : '';
    const sort = typeof req.query.sort === 'string' ? req.query.sort : 'updated_desc';

    if (city && city.toLowerCase() !== 'all') {
      results = results.filter((h) => h.city.toLowerCase() === city.toLowerCase());
    }

    if (area && area.toLowerCase() !== 'all') {
      results = results.filter((h) => h.area.toLowerCase() === area.toLowerCase());
    }

    // Never mix boys and girls hostel results when a category filter is selected
    if (category === 'boys' || category === 'girls') {
      results = results.filter((h) => h.category === category);
    }

    if (q) {
      results = results.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.area.toLowerCase().includes(q) ||
          h.fullAddress.toLowerCase().includes(q) ||
          h.facilities.some((f) => f.toLowerCase().includes(q))
      );
    }

    if (minRent !== undefined && !Number.isNaN(minRent) && minRent > 0) {
      results = results.filter((h) => h.monthlyRentMax >= minRent);
    }

    if (maxRent !== undefined && !Number.isNaN(maxRent) && maxRent > 0) {
      results = results.filter((h) => h.monthlyRentMin <= maxRent);
    }

    if (roomType && roomType.toLowerCase() !== 'all') {
      results = results.filter((h) =>
        h.roomTypes.some((r) => r.type.toLowerCase() === roomType.toLowerCase())
      );
    }

    if (facilitiesRaw) {
      const requiredFacilities = facilitiesRaw
        .split(',')
        .map((f) => f.trim().toLowerCase())
        .filter(Boolean);
      if (requiredFacilities.length > 0) {
        results = results.filter((h) => {
          const hostFacs = h.facilities.map((f) => f.toLowerCase());
          return requiredFacilities.every((rf) => hostFacs.includes(rf));
        });
      }
    }

    if (confirmedRecently) {
      results = results.filter(
        (h) => h.availableBedsTotal > 0 && isRecentlyConfirmed(h.lastAvailabilityUpdateAt, 14)
      );
    }

    if (verificationStatusFilter === 'verified_only') {
      results = results.filter(
        (h) =>
          h.verificationChecklist.authorityVerified &&
          h.verificationChecklist.addressReviewed &&
          h.verificationChecklist.photosReviewed
      );
    }

    results.sort((a, b) => {
      switch (sort) {
        case 'rent_asc':
          return a.monthlyRentMin - b.monthlyRentMin;
        case 'rent_desc':
          return b.monthlyRentMin - a.monthlyRentMin;
        case 'availability_desc':
          return b.availableBedsTotal - a.availableBedsTotal;
        case 'updated_desc':
        default:
          return Date.parse(b.lastUpdatedAt) - Date.parse(a.lastUpdatedAt);
      }
    });

    res.json({
      total: results.length,
      listings: results.map(toPublicHostel),
    });
  });

  app.get('/api/hostels/:id', (req, res) => {
    const db = readDb();
    const includeDevSample = req.query.includeDevSample === 'true';
    const { id } = req.params;

    const prodMatch = db.hostels.find(
      (h) =>
        (h.id === id || h.slug === id) &&
        h.verificationStatus === 'approved' &&
        h.ownerConsent.signed === true &&
        h.isActive === true
    );

    if (prodMatch) {
      res.json({ listing: toPublicHostel(prodMatch) });
      return;
    }

    if (includeDevSample) {
      const sampleMatch = DEV_SAMPLE_HOSTELS.find((h) => h.id === id || h.slug === id);
      if (sampleMatch) {
        res.json({ listing: toPublicHostel(sampleMatch) });
        return;
      }
    }

    res.status(404).json({ error: 'Verified hostel listing not found.' });
  });

  // =========================================================
  // OWNER PORTAL API (Scoped to ownerEmail, never self-verifies)
  // =========================================================
  app.get('/api/owner/listings', requireOwnerEmail, (req, res) => {
    const ownerEmail = (req as express.Request & { ownerEmail: string }).ownerEmail;
    const db = readDb();
    const owned = db.hostels
      .filter((h) => h.ownerEmail.toLowerCase() === ownerEmail)
      .map(({ adminNotes: _privateNotes, ...ownerSafe }) => ownerSafe);

    res.json({ listings: owned });
  });

  app.post('/api/owner/register', requireOwnerEmail, (req, res) => {
    const ownerEmail = (req as express.Request & { ownerEmail: string }).ownerEmail;
    const body = req.body as Partial<HostelListing> & {
      signatoryName?: string;
      authorityRole?: 'Owner' | 'Authorized Manager';
      authorityConfirmed?: boolean;
      consentAgreed?: boolean;
    };

    if (!body.name || !body.ownerName || !body.publicPhone || !body.area || !body.fullAddress) {
      res.status(400).json({
        error: 'Official hostel name, owner name, public phone, area, and full address are required.',
      });
      return;
    }

    if (body.category !== 'boys' && body.category !== 'girls') {
      res.status(400).json({ error: 'Category must be either boys or girls.' });
      return;
    }

    if (!body.consentAgreed || !body.authorityConfirmed || !body.signatoryName?.trim()) {
      res.status(400).json({
        error:
          'Owner consent agreement, authority confirmation, and signatory name are required before submission.',
      });
      return;
    }

    const roomTypes: RoomTypeOffering[] = Array.isArray(body.roomTypes) ? body.roomTypes : [];
    if (roomTypes.length === 0) {
      res.status(400).json({ error: 'At least one room type with monthly rent is required.' });
      return;
    }

    const db = readDb();
    const now = new Date().toISOString();
    const id = `hst-${Date.now()}`;
    const slug = `${slugify(body.name)}-${Date.now().toString().slice(-4)}`;
    const { min, max, beds } = computeRentBounds(roomTypes);

    // Server strictly forces verificationStatus = 'verification_pending' and isActive = false.
    const newListing: HostelListing = {
      id,
      slug,
      name: body.name.trim(),
      ownerName: body.ownerName.trim(),
      managerName: body.managerName?.trim() || body.ownerName.trim(),
      ownerEmail,
      publicPhone: body.publicPhone.trim(),
      publicEmail: body.publicEmail?.trim() || ownerEmail,
      city: body.city?.trim() || 'Lahore',
      area: body.area.trim(),
      fullAddress: body.fullAddress.trim(),
      category: body.category,
      roomTypes,
      monthlyRentMin: min,
      monthlyRentMax: max,
      securityDeposit: Number(body.securityDeposit) || 0,
      availableBedsTotal: beds,
      facilities: Array.isArray(body.facilities) ? body.facilities : [],
      mealArrangements: body.mealArrangements?.trim() || 'Not specified',
      internetAvailability: body.internetAvailability?.trim() || 'Not specified',
      electricityBackup: body.electricityBackup?.trim() || 'Not specified',
      securityArrangements: body.securityArrangements?.trim() || 'Not specified',
      hostelRules: body.hostelRules?.trim() || 'Standard student conduct rules apply.',
      photos:
        Array.isArray(body.photos) && body.photos.length > 0
          ? body.photos
          : ['/src/assets/images/hero_lahore_hostel_campus_1794843376764.jpg'],
      ownerConsent: {
        signed: true,
        authorityConfirmed: true,
        signatoryName: body.signatoryName.trim(),
        authorityRole: body.authorityRole === 'Authorized Manager' ? 'Authorized Manager' : 'Owner',
        consentTimestamp: now,
        termsVersion: 'v1.0-2026',
      },
      verificationStatus: 'verification_pending',
      verificationChecklist: {
        authorityVerified: false,
        addressReviewed: false,
        photosReviewed: false,
        consentConfirmed: true,
      },
      lastUpdatedAt: now,
      lastAvailabilityUpdateAt: now,
      isActive: false,
    };

    db.hostels.unshift(newListing);

    // Link or create corresponding Acquisition & Verification pipeline record for Admin review
    const existingAcq = db.acquisitions.find(
      (a) =>
        a.hostelName.toLowerCase() === newListing.name.toLowerCase() &&
        a.area.toLowerCase() === newListing.area.toLowerCase()
    );

    if (existingAcq) {
      existingAcq.contactStatus = 'Verification Pending';
      existingAcq.linkedHostelId = newListing.id;
      existingAcq.updatedAt = now;
      existingAcq.verificationHistory.unshift({
        id: `vh-${Date.now()}`,
        timestamp: now,
        action: 'Owner Submitted Listing',
        actor: `${newListing.ownerConsent.signatoryName} (${newListing.ownerConsent.authorityRole})`,
        detail: 'Completed Owner Registration, consented to publishing terms, and submitted details.',
      });
    } else {
      const acqRecord: AcquisitionContactRecord = {
        id: `acq-${Date.now()}`,
        hostelName: newListing.name,
        publicBusinessContact: newListing.publicPhone,
        area: newListing.area,
        category: newListing.category,
        sourceType: 'Direct Inquiry',
        contactDate: now.slice(0, 10),
        contactMethod: 'Email',
        contactStatus: 'Verification Pending',
        followUpDate: now.slice(0, 10),
        notes: 'Self-registered via Official Hostel Hub Owner Registration page.',
        linkedHostelId: newListing.id,
        contactHistory: [],
        verificationHistory: [
          {
            id: `vh-${Date.now()}`,
            timestamp: now,
            action: 'Owner Submitted Listing',
            actor: `${newListing.ownerConsent.signatoryName} (${newListing.ownerConsent.authorityRole})`,
            detail: 'Signed publishing consent v1.0-2026 and submitted hostel for admin verification.',
          },
        ],
        createdAt: now,
        updatedAt: now,
      };
      db.acquisitions.unshift(acqRecord);
    }

    writeDb(db);
    const { adminNotes: _n, ...ownerSafe } = newListing;
    res.status(201).json({
      message: 'Your hostel information has been submitted and is awaiting review.',
      listing: ownerSafe,
    });
  });

  app.patch('/api/owner/listings/:id', requireOwnerEmail, (req, res) => {
    const ownerEmail = (req as express.Request & { ownerEmail: string }).ownerEmail;
    const db = readDb();
    const idx = db.hostels.findIndex(
      (h) => h.id === req.params.id && h.ownerEmail.toLowerCase() === ownerEmail
    );

    if (idx === -1) {
      res.status(404).json({ error: 'Hostel listing not found for your owner account.' });
      return;
    }

    const current = db.hostels[idx];
    const body = req.body as Partial<HostelListing> & {
      confirmAvailabilityOnly?: boolean;
      ownerResponseNote?: string;
    };
    const now = new Date().toISOString();

    const updatedRoomTypes = Array.isArray(body.roomTypes) ? body.roomTypes : current.roomTypes;
    const { min, max, beds } = computeRentBounds(updatedRoomTypes);

    // Check if major details changed (requires admin re-review if already approved)
    const majorChanged =
      (body.name && body.name.trim() !== current.name) ||
      (body.fullAddress && body.fullAddress.trim() !== current.fullAddress) ||
      (body.area && body.area.trim() !== current.area) ||
      (body.category && body.category !== current.category) ||
      (Array.isArray(body.photos) &&
        JSON.stringify(body.photos) !== JSON.stringify(current.photos));

    let nextStatus = current.verificationStatus;
    let nextActive = current.isActive;

    // Never allow owner to set verificationStatus = 'approved'
    if (current.verificationStatus === 'changes_requested' && !body.confirmAvailabilityOnly) {
      nextStatus = 'verification_pending';
      nextActive = false;
    } else if (current.verificationStatus === 'approved' && majorChanged) {
      nextStatus = 'verification_pending';
      nextActive = false;
    }

    const updated: HostelListing = {
      ...current,
      name: body.name?.trim() || current.name,
      managerName: body.managerName?.trim() || current.managerName,
      publicPhone: body.publicPhone?.trim() || current.publicPhone,
      publicEmail: body.publicEmail?.trim() || current.publicEmail,
      area: body.area?.trim() || current.area,
      fullAddress: body.fullAddress?.trim() || current.fullAddress,
      category:
        body.category === 'boys' || body.category === 'girls' ? body.category : current.category,
      roomTypes: updatedRoomTypes,
      monthlyRentMin: min,
      monthlyRentMax: max,
      securityDeposit:
        body.securityDeposit !== undefined ? Number(body.securityDeposit) : current.securityDeposit,
      availableBedsTotal: beds,
      facilities: Array.isArray(body.facilities) ? body.facilities : current.facilities,
      mealArrangements: body.mealArrangements?.trim() || current.mealArrangements,
      internetAvailability: body.internetAvailability?.trim() || current.internetAvailability,
      electricityBackup: body.electricityBackup?.trim() || current.electricityBackup,
      securityArrangements: body.securityArrangements?.trim() || current.securityArrangements,
      hostelRules: body.hostelRules?.trim() || current.hostelRules,
      photos:
        Array.isArray(body.photos) && body.photos.length > 0 ? body.photos : current.photos,
      verificationStatus: nextStatus,
      isActive: nextActive,
      lastUpdatedAt: now,
      lastAvailabilityUpdateAt: now,
    };

    db.hostels[idx] = updated;

    // Update linked acquisition audit trail if present
    const linkedAcq = db.acquisitions.find((a) => a.linkedHostelId === updated.id);
    if (linkedAcq) {
      if (nextStatus === 'verification_pending') {
        linkedAcq.contactStatus = 'Verification Pending';
      }
      linkedAcq.updatedAt = now;
      linkedAcq.verificationHistory.unshift({
        id: `vh-${Date.now()}`,
        timestamp: now,
        action: body.confirmAvailabilityOnly
          ? 'Availability Confirmed by Owner'
          : 'Owner Updated Listing',
        actor: updated.ownerName,
        detail: body.ownerResponseNote?.trim()
          ? `Owner response: ${body.ownerResponseNote.trim()}`
          : `Updated room availability (${beds} beds) and listing details.`,
      });
    }

    writeDb(db);
    const { adminNotes: _n, ...ownerSafe } = updated;
    res.json({ listing: ownerSafe });
  });

  // =========================================================
  // ADMIN ACQUISITION & VERIFICATION API (Admin Role Only)
  // =========================================================
  app.get('/api/admin/acquisition', requireAdmin, (_req, res) => {
    const db = readDb();
    res.json({
      acquisitions: db.acquisitions,
      hostels: db.hostels,
    });
  });

  app.post('/api/admin/acquisition', requireAdmin, (req, res) => {
    const body = req.body as Partial<AcquisitionContactRecord>;
    if (!body.hostelName || !body.publicBusinessContact || !body.area) {
      res.status(400).json({
        error: 'Hostel name, public business contact, and area are required.',
      });
      return;
    }

    const db = readDb();
    const now = new Date().toISOString();
    const status: ContactStatus = body.contactStatus || 'Not Contacted';

    const record: AcquisitionContactRecord = {
      id: `acq-${Date.now()}`,
      hostelName: body.hostelName.trim(),
      publicBusinessContact: body.publicBusinessContact.trim(),
      area: body.area.trim(),
      category: body.category === 'girls' ? 'girls' : 'boys',
      sourceType: body.sourceType || 'Public Directory',
      contactDate: body.contactDate || '',
      contactMethod: body.contactMethod || 'Phone Call',
      contactStatus: status,
      followUpDate: body.followUpDate || '',
      notes: body.notes?.trim() || '',
      contactHistory: body.contactDate
        ? [
            {
              id: `cl-${Date.now()}`,
              date: body.contactDate,
              method: body.contactMethod || 'Phone Call',
              status,
              summary: body.notes?.trim() || 'Initial outreach recorded.',
              recordedBy: 'Platform Admin',
            },
          ]
        : [],
      verificationHistory: [
        {
          id: `vh-${Date.now()}`,
          timestamp: now,
          action: 'Record Created',
          actor: 'Platform Admin',
          detail: `Added to ${status} queue via ${body.sourceType || 'Public Directory'}.`,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    db.acquisitions.unshift(record);
    writeDb(db);
    res.status(201).json({ record });
  });

  app.patch('/api/admin/acquisition/:id', requireAdmin, (req, res) => {
    const db = readDb();
    const idx = db.acquisitions.findIndex((a) => a.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Acquisition record not found.' });
      return;
    }

    const current = db.acquisitions[idx];
    const body = req.body as Partial<AcquisitionContactRecord> & {
      logNewOutreach?: boolean;
      outreachSummary?: string;
    };
    const now = new Date().toISOString();
    const nextStatus = body.contactStatus || current.contactStatus;

    const contactHistory = [...current.contactHistory];
    if (body.logNewOutreach && body.outreachSummary?.trim()) {
      contactHistory.unshift({
        id: `cl-${Date.now()}`,
        date: body.contactDate || now.slice(0, 10),
        method: body.contactMethod || current.contactMethod,
        status: nextStatus,
        summary: body.outreachSummary.trim(),
        recordedBy: 'Platform Admin',
      });
    }

    const verificationHistory = [...current.verificationHistory];
    if (nextStatus !== current.contactStatus) {
      verificationHistory.unshift({
        id: `vh-${Date.now()}`,
        timestamp: now,
        action: `Status Changed to ${nextStatus}`,
        actor: 'Platform Admin',
        detail: body.outreachSummary?.trim() || `Manual contact status update from ${current.contactStatus}.`,
      });
    }

    const updated: AcquisitionContactRecord = {
      ...current,
      hostelName: body.hostelName?.trim() || current.hostelName,
      publicBusinessContact:
        body.publicBusinessContact?.trim() || current.publicBusinessContact,
      area: body.area?.trim() || current.area,
      category:
        body.category === 'boys' || body.category === 'girls'
          ? body.category
          : current.category,
      contactDate: body.contactDate !== undefined ? body.contactDate : current.contactDate,
      contactMethod: body.contactMethod || current.contactMethod,
      contactStatus: nextStatus,
      followUpDate: body.followUpDate !== undefined ? body.followUpDate : current.followUpDate,
      notes: body.notes !== undefined ? body.notes : current.notes,
      contactHistory,
      verificationHistory,
      updatedAt: now,
    };

    db.acquisitions[idx] = updated;
    writeDb(db);
    res.json({ record: updated });
  });

  app.post('/api/admin/verify/:hostelId', requireAdmin, (req, res) => {
    const db = readDb();
    const idx = db.hostels.findIndex((h) => h.id === req.params.hostelId);
    if (idx === -1) {
      res.status(404).json({ error: 'Submitted hostel listing not found.' });
      return;
    }

    const current = db.hostels[idx];
    const body = req.body as {
      action: 'approve' | 'request_changes' | 'reject';
      authorityVerified?: boolean;
      addressReviewed?: boolean;
      photosReviewed?: boolean;
      adminNotes?: string;
      changeRequestMessage?: string;
    };

    const now = new Date().toISOString();
    const checklist = {
      authorityVerified: body.authorityVerified ?? current.verificationChecklist.authorityVerified,
      addressReviewed: body.addressReviewed ?? current.verificationChecklist.addressReviewed,
      photosReviewed: body.photosReviewed ?? current.verificationChecklist.photosReviewed,
      consentConfirmed: current.ownerConsent.signed,
    };

    if (body.action === 'approve') {
      if (
        !checklist.authorityVerified ||
        !checklist.addressReviewed ||
        !checklist.photosReviewed ||
        !checklist.consentConfirmed
      ) {
        res.status(400).json({
          error:
            'All verification checks (owner authority, address review, authorized photos, and signed consent) must be confirmed before approval.',
        });
        return;
      }

      db.hostels[idx] = {
        ...current,
        verificationChecklist: checklist,
        verificationStatus: 'approved',
        adminNotes: body.adminNotes ?? current.adminNotes,
        adminChangeRequest: undefined,
        approvedAt: now,
        lastUpdatedAt: now,
        isActive: true,
      };
    } else if (body.action === 'request_changes') {
      if (!body.changeRequestMessage?.trim()) {
        res.status(400).json({ error: 'Please specify what corrections the owner needs to provide.' });
        return;
      }
      db.hostels[idx] = {
        ...current,
        verificationChecklist: checklist,
        verificationStatus: 'changes_requested',
        adminChangeRequest: body.changeRequestMessage.trim(),
        adminNotes: body.adminNotes ?? current.adminNotes,
        lastUpdatedAt: now,
        isActive: false,
      };
    } else if (body.action === 'reject') {
      db.hostels[idx] = {
        ...current,
        verificationChecklist: checklist,
        verificationStatus: 'rejected',
        adminChangeRequest: body.changeRequestMessage?.trim() || 'Listing did not meet verification requirements.',
        adminNotes: body.adminNotes ?? current.adminNotes,
        lastUpdatedAt: now,
        isActive: false,
      };
    } else {
      res.status(400).json({ error: 'Invalid verification action.' });
      return;
    }

    // Sync linked acquisition record
    const linkedAcq = db.acquisitions.find((a) => a.linkedHostelId === current.id);
    if (linkedAcq) {
      linkedAcq.contactStatus =
        body.action === 'approve'
          ? 'Approved'
          : body.action === 'reject'
          ? 'Rejected'
          : 'Awaiting Information';
      linkedAcq.updatedAt = now;
      linkedAcq.verificationHistory.unshift({
        id: `vh-${Date.now()}`,
        timestamp: now,
        action:
          body.action === 'approve'
            ? 'Approved & Published'
            : body.action === 'reject'
            ? 'Listing Rejected'
            : 'Corrections Requested',
        actor: 'Platform Admin',
        detail:
          body.action === 'approve'
            ? 'Owner authority, physical address, authorized photos, and signed consent verified. Published to public directory.'
            : body.changeRequestMessage?.trim() || body.adminNotes?.trim() || 'Reviewed by administrator.',
      });
    }

    writeDb(db);
    res.json({
      hostel: db.hostels[idx],
      acquisition: linkedAcq || null,
    });
  });

  // =========================================================
  // VITE / STATIC SERVING
  // =========================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hostel Hub server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
