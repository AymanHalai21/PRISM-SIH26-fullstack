/* ===========================================================
   PRISM — API Client
   Talks to the real FastAPI backend for: auth, cases, FIR,
   documents, evidence, chain-of-custody.

   NOT yet backend-connected (Phase 3/4/5 of the backend are not
   built yet) and still handled locally by data.js exactly as
   before: lawyer access-request / judge-approval workflow,
   forensic examination creation, the audit-log viewer, and
   search. This file does not touch any of that.
   =========================================================== */

// Change this if the API isn't on localhost:8000 (e.g. after deploying
// the backend somewhere else). Can also be set before this script loads
// via: <script>window.PRISM_API_BASE = 'https://your-api.example.com';</script>
const API_BASE = window.PRISM_API_BASE || 'http://localhost:8000';

/* ---------- Demo-only fixed MFA secrets ----------
   Matches DEMO_MFA_SECRETS in the backend's app/db/seed.py.
   This lets the login screen show a real, currently-valid 6-digit
   code (computed client-side) instead of a static placeholder.
   This is a hackathon-demo shortcut, not how real MFA works — a
   production system must never let a client compute or see the
   secret. Real per-user secrets must be provisioned server-side
   and never transmitted to the browser. */
const DEMO_MFA_SECRETS = {
  'police@prism.demo': 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
  'judge@prism.demo': 'KRSXG5CTMVRXEZLUKRSXG5CTMVRXEZLU',
  'lawyer@prism.demo': 'MFRGGZDFMZTWQ2LKMFRGGZDFMZTWQ2LK',
  'forensic@prism.demo': 'NBSWY3DPEB3W64TMNBSWY3DPEB3W64TM',
};

/* ---------- TOTP (RFC 6238) using the browser's real Web Crypto ---------- */

function base32Decode(b32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of b32.toUpperCase().replace(/=+$/, '')) {
    const val = alphabet.indexOf(c);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return new Uint8Array(bytes);
}

async function computeTotp(secretB32, step = 30, digits = 6) {
  const key = await crypto.subtle.importKey('raw', base32Decode(secretB32), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const counter = Math.floor(Date.now() / 1000 / step);
  const buf = new ArrayBuffer(8);
  new DataView(buf).setUint32(4, counter);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, buf));
  const offset = mac[mac.length - 1] & 0x0f;
  const code = ((mac[offset] & 0x7f) << 24 | (mac[offset + 1] & 0xff) << 16 | (mac[offset + 2] & 0xff) << 8 | (mac[offset + 3] & 0xff)) % 10 ** digits;
  return String(code).padStart(digits, '0');
}

function secondsUntilNextTotpWindow(step = 30) {
  return step - (Math.floor(Date.now() / 1000) % step);
}

/* ---------- Token storage (separate from the data.js demo-state key) ---------- */

const TOKEN_KEY = 'prism_api_tokens_v1';

function getTokens() {
  try { return JSON.parse(localStorage.getItem(TOKEN_KEY)); } catch (e) { return null; }
}
function setTokens(t) {
  try { localStorage.setItem(TOKEN_KEY, JSON.stringify(t)); } catch (e) { /* ignore */ }
}
function clearTokens() {
  try { localStorage.removeItem(TOKEN_KEY); } catch (e) { /* ignore */ }
}
function isLoggedIn() {
  return !!(getTokens() && getTokens().access_token);
}

/* ---------- Core request helper ---------- */

class ApiError extends Error {
  constructor(status, body) {
    super((body && body.error && body.error.message) || 'Request failed');
    this.status = status;
    this.code = body && body.error && body.error.code;
    this.details = body && body.error && body.error.details;
  }
}

async function request(path, { method = 'GET', body, isForm = false, auth = true, retry = true } = {}) {
  const headers = {};
  if (!isForm && body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const tokens = getTokens();
    if (tokens && tokens.access_token) headers['Authorization'] = `Bearer ${tokens.access_token}`;
  }
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method, headers,
      body: isForm ? body : (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch (networkErr) {
    throw new ApiError(0, { error: { code: 'NETWORK_ERROR', message: 'Could not reach the PRISM backend. Is it running?' } });
  }
  if (res.status === 401 && auth && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return request(path, { method, body, isForm, auth, retry: false });
  }
  if (!res.ok) {
    let payload = null;
    try { payload = await res.json(); } catch (e) { /* non-JSON error body */ }
    throw new ApiError(res.status, payload);
  }
  if (res.status === 204) return null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return res; // caller handles binary (e.g. document download)
}

async function tryRefresh() {
  const tokens = getTokens();
  if (!tokens || !tokens.refresh_token) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    });
    if (!res.ok) { clearTokens(); return false; }
    const data = await res.json();
    setTokens({ access_token: data.access_token, refresh_token: data.refresh_token });
    return true;
  } catch (e) {
    clearTokens();
    return false;
  }
}

/* ---------- Auth ---------- */

async function apiLogin(email, password) {
  return request('/auth/login', { method: 'POST', body: { email, password }, auth: false });
}

async function apiVerifyMfa(email, challengeId) {
  const secret = DEMO_MFA_SECRETS[email];
  const code = await computeTotp(secret);
  const data = await request('/auth/mfa/verify', { method: 'POST', body: { challenge_id: challengeId, code }, auth: false });
  setTokens({ access_token: data.access_token, refresh_token: data.refresh_token });
  return data;
}

async function apiMe() {
  return request('/auth/me');
}

async function apiLogout() {
  const tokens = getTokens();
  if (tokens && tokens.refresh_token) {
    try { await request('/auth/logout', { method: 'POST', body: { refresh_token: tokens.refresh_token } }); }
    catch (e) { /* best-effort */ }
  }
  clearTokens();
}

/* ---------- Cases / FIR / Documents / Evidence ---------- */

async function apiListCases() { return request('/cases?limit=100'); }
async function apiGetCase(id) { return request(`/cases/${id}`); }

async function apiGetFir(caseBackendId) {
  try { return await request(`/cases/${caseBackendId}/fir`); }
  catch (e) { if (e instanceof ApiError && e.status === 404) return null; throw e; }
}

async function apiListDocuments(caseBackendId) { return request(`/cases/${caseBackendId}/documents?limit=100`); }
async function apiVerifyDocumentIntegrity(documentId) { return request(`/documents/${documentId}/verify-integrity`, { method: 'POST' }); }

async function apiListEvidence(caseBackendId) { return request(`/cases/${caseBackendId}/evidence?limit=100`); }
async function apiVerifyEvidenceIntegrity(evidenceId) { return request(`/evidence/${evidenceId}/verify-integrity`, { method: 'POST' }); }
async function apiChainOfCustody(evidenceId) { return request(`/evidence/${evidenceId}/chain-of-custody?limit=100`); }

/* =====================================================================
   Adapters — reshape backend JSON into exactly the object shape the
   existing render functions in app.js / data.js already expect, so
   those functions need no changes.
   ===================================================================== */

const ROLE_FROM_BACKEND = { POLICE: 'police', JUDGE: 'judge', LAWYER: 'lawyer', FORENSIC: 'forensic' };

const CASE_STATUS_LABEL = {
  UNDER_INVESTIGATION: 'Under Investigation', FORENSIC_PENDING: 'Forensic Pending',
  COURT_PROCEEDING: 'Court Proceeding', CLOSED: 'Closed',
};

function adaptCase(c, fir) {
  return {
    _backendId: c.id,
    caseId: c.case_number,
    firNumber: (fir && fir.fir_number) || '—',
    title: c.title,
    policeStation: c.police_station,
    area: c.area,
    year: c.year,
    registrationDate: c.registration_date,
    status: CASE_STATUS_LABEL[c.status] || c.status,
    investigatingOfficer: c.investigating_officer_name || '—',
    assignedJudge: c.assigned_judge_name || '—',
    complainant: (fir && fir.complainant) || '—',
    accused: (fir && fir.accused) || '—',
    sections: (fir && fir.legal_sections) || '—',
    incidentDate: c.incident_date,
    incidentLocation: c.incident_location,
  };
}

const DOC_TYPE_LABEL = {
  FIR: 'FIR', INVESTIGATION_REPORT: 'Investigation Report', FORENSIC_REPORT: 'Forensic Report',
  LEGAL_DOCUMENT: 'Legal Document', OTHER: 'Other',
};

function adaptDocument(d, caseNumber) {
  const version = d.current_version || {};
  return {
    _backendId: d.id, _live: true,
    documentId: d.id, caseId: caseNumber, name: d.display_name,
    type: DOC_TYPE_LABEL[d.document_type] || d.document_type,
    uploadedBy: d.created_by_name || '—', uploadedAt: d.created_at,
    version: version.version_number || 1, trustedHash: version.sha256 || '',
    integrityStatus: 'PENDING', // real status only known after Verify Integrity is run
    signatureStatus: d.signature_status === 'SIGNED' ? 'Signed' : 'Unsigned',
    accessLevel: d.access_scope,
  };
}

function adaptEvidence(e, caseNumber) {
  return {
    _backendId: e.id, _live: true,
    evidenceId: e.evidence_number, caseId: caseNumber, type: e.evidence_type,
    description: e.description, collectedAt: e.collected_at, collectedBy: e.collected_by_name || '—',
    currentCustodian: e.current_custodian_name || '—', trustedHash: e.integrity_sha256 || '',
    integrityStatus: e.integrity_status,
  };
}

const CUSTODY_STEP_LABEL = { REGISTERED: 'Registered', TRANSFERRED: 'Transferred', RECEIVED: 'Received', EXAMINED: 'Examined' };

function adaptCustodyEvent(ev) {
  const noteParts = [];
  if (ev.notes) noteParts.push(ev.notes);
  if (ev.event_type === 'TRANSFERRED' && ev.new_custodian_name) noteParts.push(`Transferred to ${ev.new_custodian_name}`);
  if (ev.location) noteParts.push(ev.location);
  if (ev.reason) noteParts.push(ev.reason);
  return {
    step: CUSTODY_STEP_LABEL[ev.event_type] || ev.event_type,
    timestamp: ev.occurred_at,
    user: ev.actor_name || '—',
    role: '',
    note: noteParts.join(' · '),
  };
}

/* ---------- High-level helpers used by app.js ---------- */

// Fetches everything needed to render a case's tabs in one go.
async function apiLoadCaseBundle(backendCaseId, caseNumber) {
  const [fir, docsPage, evidencePage] = await Promise.all([
    apiGetFir(backendCaseId),
    apiListDocuments(backendCaseId),
    apiListEvidence(backendCaseId),
  ]);
  const documents = docsPage.items.map(d => adaptDocument(d, caseNumber));
  const evidenceItems = evidencePage.items.map(e => adaptEvidence(e, caseNumber));
  const chainEntries = await Promise.all(evidencePage.items.map(async e => {
    const chain = await apiChainOfCustody(e.id);
    return [e.evidence_number, chain.items.map(adaptCustodyEvent)];
  }));
  return { fir, documents, evidence: evidenceItems, chainOfCustody: Object.fromEntries(chainEntries) };
}

window.PrismApi = {
  API_BASE, DEMO_MFA_SECRETS, ROLE_FROM_BACKEND,
  computeTotp, secondsUntilNextTotpWindow,
  isLoggedIn, clearTokens, ApiError,
  apiLogin, apiVerifyMfa, apiMe, apiLogout,
  apiListCases, apiGetCase, apiGetFir, apiListDocuments, apiVerifyDocumentIntegrity,
  apiListEvidence, apiVerifyEvidenceIntegrity, apiChainOfCustody,
  adaptCase, adaptDocument, adaptEvidence, adaptCustodyEvent,
  apiLoadCaseBundle,
};
