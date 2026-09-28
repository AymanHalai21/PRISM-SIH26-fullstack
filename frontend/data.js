/* ===========================================================
   PRISM — Mock Data & State Layer
   Frontend-only prototype. State persists in localStorage.
   Hashing uses the real Web Crypto SHA-256 (works on any
   HTTPS host, e.g. Netlify, or a local dev server).
   =========================================================== */

const STORAGE_KEY = 'prism_prototype_state_v1';

/* ---------- Hashing ---------- */

async function sha256Hex(str) {
  if (window.crypto && crypto.subtle && crypto.subtle.digest && window.isSecureContext !== false) {
    try {
      const enc = new TextEncoder().encode(str);
      const buf = await crypto.subtle.digest('SHA-256', enc);
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) { /* fall through */ }
  }
  // Fallback (non-cryptographic) for insecure contexts (e.g. plain file:// viewing).
  // Clearly distinguishable so it is never mistaken for a real hash.
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = (h1 ^ (h1 >>> 16)) >>> 0;
  h2 = (h2 ^ (h2 >>> 16)) >>> 0;
  return 'demo-' + h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}

/* ---------- Seed data ---------- */

const DEMO_USERS = {
  police:   { userId: 'U-1001', name: 'Inspector Arjun Patil', role: 'police',   email: 'police@prism.demo',   department: 'Central Cyber Crime Police Station' },
  judge:    { userId: 'U-2001', name: 'Hon. Justice A. Sharma', role: 'judge',    email: 'judge@prism.demo',    department: 'Mumbai Sessions Court' },
  lawyer:   { userId: 'U-3001', name: 'Adv. Rahul Mehta',       role: 'lawyer',   email: 'lawyer@prism.demo',   department: 'Bar Council of Maharashtra' },
  forensic: { userId: 'U-4001', name: 'Dr. Anjali Rao',         role: 'forensic', email: 'forensic@prism.demo', department: 'State Forensic Science Laboratory' },
};

const ROLE_LABEL = { police: 'Police Officer', judge: 'Judge', lawyer: 'Lawyer', forensic: 'Forensic Expert' };

function seedState() {
  const now = Date.now();
  const iso = (offsetMin) => new Date(now - offsetMin * 60000).toISOString();

  return {
    session: null,
    pendingMfaRole: null,
    ui: { screen: 'login', selectedCaseId: null, activeTab: 'overview', sidebarOpen: false, notifOpen: false, reviewRequestId: null, selectedExamId: null },
    toasts: [],

    cases: [
      {
        caseId: 'PRISM-2026-001245', firNumber: 'FIR/MUM/2026/00871', title: 'Digital Fraud Investigation',
        policeStation: 'Central Cyber Crime Police Station', area: 'Mumbai Central', year: 2026,
        registrationDate: '2026-09-02', status: 'Under Investigation',
        investigatingOfficer: 'Inspector Arjun Patil', assignedJudge: 'Hon. Justice A. Sharma',
        complainant: 'Meera Kulkarni', accused: 'Unidentified (IP traced, under investigation)',
        sections: 'BNS 318(4), IT Act Sec. 66C, 66D', incidentDate: '2026-08-29', incidentLocation: 'Andheri East, Mumbai',
      },
      {
        caseId: 'PRISM-2026-001180', firNumber: 'FIR/MUM/2026/00799', title: 'Cyber Stalking Complaint',
        policeStation: 'Bandra Cyber Cell', area: 'Bandra', year: 2026,
        registrationDate: '2026-07-14', status: 'Court Proceeding',
        investigatingOfficer: 'Inspector Arjun Patil', assignedJudge: 'Hon. Justice R. Iyer',
        complainant: 'S. Nair', accused: 'K. Deshmukh',
        sections: 'BNS 78, IT Act Sec. 67', incidentDate: '2026-07-01', incidentLocation: 'Bandra West, Mumbai',
      },
      {
        caseId: 'PRISM-2026-001299', firNumber: 'FIR/MUM/2026/00902', title: 'Financial Data Breach',
        policeStation: 'Central Cyber Crime Police Station', area: 'Mumbai Central', year: 2026,
        registrationDate: '2026-09-10', status: 'Forensic Pending',
        investigatingOfficer: 'Inspector S. Kadam', assignedJudge: 'Hon. Justice A. Sharma',
        complainant: 'FinTrust Bank Ltd.', accused: 'Under investigation',
        sections: 'BNS 317(4), IT Act Sec. 43, 66', incidentDate: '2026-09-05', incidentLocation: 'Nariman Point, Mumbai',
      },
    ],

    documents: [
      { documentId: 'DOC-0001', caseId: 'PRISM-2026-001245', name: 'FIR_MUM_2026_00871.pdf', type: 'FIR', uploadedBy: 'Inspector Arjun Patil', role: 'police', uploadedAt: '2026-09-02', version: 1, trustedHash: '', integrityStatus: 'PENDING', signatureStatus: 'Signed', accessLevel: 'Case Team' },
      { documentId: 'DOC-0002', caseId: 'PRISM-2026-001245', name: 'Investigation_Report_v2.pdf', type: 'Investigation Report', uploadedBy: 'Inspector Arjun Patil', role: 'police', uploadedAt: '2026-09-10', version: 2, trustedHash: '', integrityStatus: 'PENDING', signatureStatus: 'Signed', accessLevel: 'Case Team' },
      { documentId: 'DOC-0003', caseId: 'PRISM-2026-001245', name: 'Forensic_Report_1245.pdf', type: 'Forensic Report', uploadedBy: 'Dr. Anjali Rao', role: 'forensic', uploadedAt: '2026-09-15', version: 2, trustedHash: '', integrityStatus: 'PENDING', signatureStatus: 'Signed', accessLevel: 'Judge + Authorized Lawyer', tampered: false },
      { documentId: 'DOC-0004', caseId: 'PRISM-2026-001180', name: 'FIR_MUM_2026_00799.pdf', type: 'FIR', uploadedBy: 'Inspector Arjun Patil', role: 'police', uploadedAt: '2026-07-14', version: 1, trustedHash: '', integrityStatus: 'PENDING', signatureStatus: 'Signed', accessLevel: 'Case Team' },
    ],

    evidence: [
      { evidenceId: 'Evidence-884', caseId: 'PRISM-2026-001245', type: 'Digital — Laptop', description: 'Dell Latitop laptop seized from accused residence, 512GB SSD', collectedAt: '2026-09-03', collectedBy: 'Inspector Arjun Patil', currentCustodian: 'State Forensic Science Laboratory', trustedHash: '', integrityStatus: 'PENDING' },
      { evidenceId: 'Evidence-885', caseId: 'PRISM-2026-001245', type: 'Digital — Mobile Phone', description: 'Samsung Galaxy device, IMEI recorded, screen-locked', collectedAt: '2026-09-03', collectedBy: 'Inspector Arjun Patil', currentCustodian: 'State Forensic Science Laboratory', trustedHash: '', integrityStatus: 'PENDING' },
    ],

    forensicExams: [
      {
        examinationId: 'EX-2026-0091', caseId: 'PRISM-2026-001245', evidenceId: 'Evidence-884', expertId: 'U-4001',
        examinationType: 'Digital Forensic Imaging & Data Recovery',
        startDate: '2026-09-05', endDate: '2026-09-15',
        methods: 'Write-blocked disk imaging, file carving, transaction log analysis',
        equipment: 'Tableau T8-R2 write blocker, FTK Imager, Autopsy',
        findings: 'Recovered deleted transaction records and browser artifacts consistent with unauthorized fund transfers.',
        observations: 'Timestamps on 14 recovered files predate the incident report by 2-6 hours.',
        results: 'Confirmed presence of automated transfer scripts and 3 proxy VPN configuration files.',
        conclusion: 'Evidence is consistent with a scripted, premeditated fraud operation.',
        status: 'Completed',
      },
    ],

    // Lawyer case authorizations — starts empty; created only via judge approval during the demo.
    authorizations: [],

    // Access requests raised by lawyers, routed to the case's assigned judge.
    accessRequests: [],

    chainOfCustody: {
      'Evidence-884': [
        { step: 'Collected', timestamp: iso(60 * 24 * 12), user: 'Inspector Arjun Patil', role: 'police', note: 'Seized under panchnama at accused residence' },
        { step: 'Registered', timestamp: iso(60 * 24 * 12 - 40), user: 'Inspector Arjun Patil', role: 'police', note: 'Logged into evidence register, Case PRISM-2026-001245' },
        { step: 'Transferred to Forensic Department', timestamp: iso(60 * 24 * 11), user: 'Inspector Arjun Patil', role: 'police', note: 'Sealed transfer to State FSL' },
        { step: 'Received by Forensic Expert', timestamp: iso(60 * 24 * 10), user: 'Dr. Anjali Rao', role: 'forensic', note: 'Seal verified intact on receipt' },
        { step: 'Examination Started', timestamp: iso(60 * 24 * 10 - 30), user: 'Dr. Anjali Rao', role: 'forensic', note: 'Write-blocked imaging initiated' },
        { step: 'Examination Completed', timestamp: iso(60 * 24 * 2), user: 'Dr. Anjali Rao', role: 'forensic', note: 'Findings and results finalized' },
        { step: 'Report Generated', timestamp: iso(60 * 24 * 2 - 20), user: 'Dr. Anjali Rao', role: 'forensic', note: 'Forensic_Report_1245.pdf v2 finalized' },
        { step: 'Report Verified', timestamp: iso(60 * 24 * 1), user: 'Dr. Anjali Rao', role: 'forensic', note: 'SHA-256 hash generated and recorded' },
      ],
    },

    notifications: {
      police: [
        { id: 'N-P1', text: 'New forensic report uploaded for Case PRISM-2026-001245.', time: iso(60 * 24), read: false },
        { id: 'N-P2', text: 'Case PRISM-2026-001299 flagged: forensic examination pending.', time: iso(60 * 40), read: false },
      ],
      judge: [
        { id: 'N-J1', text: '18 cases currently assigned to your docket.', time: iso(60 * 30), read: true },
      ],
      lawyer: [],
      forensic: [
        { id: 'N-F1', text: 'Evidence-885 awaiting examination assignment.', time: iso(60 * 20), read: false },
      ],
    },

    auditEvents: [], // populated by seedAuditChain()
  };
}

/* ---------- Audit hash-chain ---------- */

async function seedAuditChain(state) {
  const seedEvents = [
    { userId: 'U-1001', user: 'Inspector Arjun Patil', role: 'police', action: 'Case Created', resource: 'PRISM-2026-001245', result: 'SUCCESS' },
    { userId: 'U-1001', user: 'Inspector Arjun Patil', role: 'police', action: 'FIR Registered', resource: 'PRISM-2026-001245', result: 'SUCCESS' },
    { userId: 'U-1001', user: 'Inspector Arjun Patil', role: 'police', action: 'Evidence Registered', resource: 'Evidence-884', result: 'SUCCESS' },
    { userId: 'U-1001', user: 'Inspector Arjun Patil', role: 'police', action: 'Evidence Transferred to Forensic Dept.', resource: 'Evidence-884', result: 'SUCCESS' },
    { userId: 'U-4001', user: 'Dr. Anjali Rao', role: 'forensic', action: 'Examination Started', resource: 'EX-2026-0091', result: 'SUCCESS' },
    { userId: 'U-4001', user: 'Dr. Anjali Rao', role: 'forensic', action: 'Forensic Report Uploaded', resource: 'Forensic_Report_1245.pdf', result: 'SUCCESS' },
    { userId: 'U-4001', user: 'Dr. Anjali Rao', role: 'forensic', action: 'Document Hash Generated (SHA-256)', resource: 'Forensic_Report_1245.pdf', result: 'SUCCESS' },
  ];
  let prevHash = '0'.repeat(64);
  const baseTime = Date.now() - seedEvents.length * 55 * 60000;
  for (let i = 0; i < seedEvents.length; i++) {
    const ev = seedEvents[i];
    const timestamp = new Date(baseTime + i * 55 * 60000).toISOString();
    const payload = JSON.stringify({ ...ev, timestamp, previousEventHash: prevHash });
    const eventHash = await sha256Hex(payload);
    state.auditEvents.push({
      eventId: 'AUD-' + (1000 + i), timestamp, ...ev, previousEventHash: prevHash, eventHash,
    });
    prevHash = eventHash;
  }
  // Compute document / evidence trusted hashes from their (fictional) canonical descriptors.
  for (const doc of state.documents) {
    doc.trustedHash = await sha256Hex(`${doc.name}|v${doc.version}|${doc.caseId}|${doc.uploadedAt}`);
    doc.integrityStatus = 'VERIFIED';
  }
  for (const ev of state.evidence) {
    ev.trustedHash = await sha256Hex(`${ev.evidenceId}|${ev.type}|${ev.caseId}|${ev.collectedAt}`);
    ev.integrityStatus = 'VERIFIED';
  }
}

async function appendAudit(state, { userId, user, role, action, resource, result }) {
  const prevHash = state.auditEvents.length ? state.auditEvents[state.auditEvents.length - 1].eventHash : '0'.repeat(64);
  const timestamp = new Date().toISOString();
  const payload = JSON.stringify({ userId, user, role, action, resource, result, timestamp, previousEventHash: prevHash });
  const eventHash = await sha256Hex(payload);
  const entry = {
    eventId: 'AUD-' + Math.floor(1000 + Math.random() * 8999) + '-' + state.auditEvents.length,
    timestamp, userId, user, role, action, resource, result, previousEventHash: prevHash, eventHash,
  };
  state.auditEvents.push(entry);
  return entry;
}

async function verifyAuditChain(state) {
  let prevHash = '0'.repeat(64);
  for (let i = 0; i < state.auditEvents.length; i++) {
    const ev = state.auditEvents[i];
    if (ev.previousEventHash !== prevHash) return { valid: false, brokenAt: i };
    const payload = JSON.stringify({
      userId: ev.userId, user: ev.user, role: ev.role, action: ev.action,
      resource: ev.resource, result: ev.result, timestamp: ev.timestamp, previousEventHash: ev.previousEventHash,
    });
    const recomputed = await sha256Hex(payload);
    if (recomputed !== ev.eventHash) return { valid: false, brokenAt: i };
    prevHash = ev.eventHash;
  }
  return { valid: true, brokenAt: -1 };
}

/* ---------- Persistence ---------- */

let state = null;

function saveState() {
  try {
    const { toasts, ...persisted } = state; // don't persist ephemeral toasts
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  } catch (e) { console.warn('PRISM: could not save state', e); }
}

async function loadOrInitState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = JSON.parse(raw);
      state.toasts = [];
      state.ui = state.ui || { screen: 'login', selectedCaseId: null, activeTab: 'overview', sidebarOpen: false, notifOpen: false };
      if (!state.session) state.ui.screen = 'login';
      return state;
    }
  } catch (e) { console.warn('PRISM: could not load saved state, reseeding', e); }
  state = seedState();
  await seedAuditChain(state);
  saveState();
  return state;
}

function resetDemoData() {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

/* ---------- Lookups ---------- */

function getCase(caseId) { return state.cases.find(c => c.caseId === caseId); }
function docsForCase(caseId) { return state.documents.filter(d => d.caseId === caseId); }
function evidenceForCase(caseId) { return state.evidence.filter(e => e.caseId === caseId); }
function examsForCase(caseId) { return state.forensicExams.filter(x => x.caseId === caseId); }
function examForEvidence(evidenceId) { return state.forensicExams.find(x => x.evidenceId === evidenceId); }
function authForLawyerCase(lawyerId, caseId) {
  return state.authorizations.find(a => a.lawyerId === lawyerId && a.caseId === caseId && a.status === 'ACTIVE');
}
function pendingRequestFor(lawyerId, caseId) {
  return state.accessRequests.find(r => r.lawyerId === lawyerId && r.caseId === caseId && r.status === 'PENDING');
}
function requestsForJudge(judgeName) {
  return state.accessRequests.filter(r => {
    const c = getCase(r.caseId);
    return c && c.assignedJudge === judgeName;
  });
}
