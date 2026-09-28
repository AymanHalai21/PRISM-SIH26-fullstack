/* ===========================================================
   PRISM — Application Logic
   Vanilla JS SPA. render() rebuilds #app from `state`.
   Forms are uncontrolled (read on submit) to avoid re-render
   focus loss; navigation/state changes trigger full re-render.
   =========================================================== */

/* ---------- Icons (original geometric SVGs, no external assets) ---------- */

function svg(inner, vb = '0 0 20 20') {
  return `<svg viewBox="${vb}" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}
const ICONS = {
  grid: svg('<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="3" width="6" height="6" rx="1"/><rect x="3" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/>'),
  folder: svg('<path d="M3 6a1 1 0 011-1h4l2 2h6a1 1 0 011 1v7a1 1 0 01-1 1H4a1 1 0 01-1-1V6z"/>'),
  file: svg('<path d="M6 2.5h6l3 3V17a.5.5 0 01-.5.5h-9A.5.5 0 015 17V3a.5.5 0 011-.5z"/><path d="M12 2.5V6h3.5"/><line x1="7.5" y1="10" x2="12.5" y2="10"/><line x1="7.5" y1="13" x2="12.5" y2="13"/>'),
  box: svg('<path d="M10 2l7 4v8l-7 4-7-4V6z"/><path d="M3 6l7 4 7-4M10 10v8"/>'),
  flask: svg('<path d="M8 2.5h4M8.5 3v5L4.5 15a1.4 1.4 0 001.2 2h8.6a1.4 1.4 0 001.2-2L11.5 8V3"/><line x1="6" y1="12" x2="14" y2="12"/>'),
  search: svg('<circle cx="8.5" cy="8.5" r="5.5"/><line x1="16.5" y1="16.5" x2="12.6" y2="12.6"/>'),
  list: svg('<line x1="4" y1="5" x2="16" y2="5"/><line x1="4" y1="10" x2="16" y2="10"/><line x1="4" y1="15" x2="12" y2="15"/><circle cx="16.3" cy="15" r="0.9" fill="currentColor"/>'),
  shield: svg('<path d="M10 2.5l6 2.2v4.6c0 4.3-2.6 7.5-6 8.7-3.4-1.2-6-4.4-6-8.7V4.7z"/>'),
  shieldCheck: svg('<path d="M10 2.5l6 2.2v4.6c0 4.3-2.6 7.5-6 8.7-3.4-1.2-6-4.4-6-8.7V4.7z"/><polyline points="7.3,10 9.2,11.8 13,7.8"/>'),
  briefcase: svg('<rect x="2.5" y="6.5" width="15" height="10" rx="1.2"/><path d="M7 6.5V5a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0113 5v1.5"/><line x1="2.5" y1="11" x2="17.5" y2="11"/>'),
  plus: svg('<circle cx="10" cy="10" r="7"/><line x1="10" y1="6.7" x2="10" y2="13.3"/><line x1="6.7" y1="10" x2="13.3" y2="10"/>'),
  bell: svg('<path d="M6 8a4 4 0 018 0c0 4 1.5 5 1.5 5h-11S6 12 6 8z"/><path d="M8.3 15.5a1.8 1.8 0 003.4 0"/>'),
  power: svg('<line x1="10" y1="3" x2="10" y2="10"/><path d="M6 5.5a6 6 0 108 0"/>'),
  chevron: svg('<polyline points="7.5,4 13,10 7.5,16"/>'),
  x: svg('<line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/>'),
  check: svg('<polyline points="4,10.5 8,14.5 16,5.5"/>'),
  alert: svg('<path d="M10 2.5l8.2 14.2a1 1 0 01-.87 1.5H2.67a1 1 0 01-.87-1.5L10 2.5z"/><line x1="10" y1="8" x2="10" y2="11.7"/><circle cx="10" cy="14.3" r="0.9" fill="currentColor"/>'),
  lock: svg('<rect x="4.5" y="9" width="11" height="8" rx="1.3"/><path d="M6.5 9V6.5a3.5 3.5 0 017 0V9"/>'),
  user: svg('<circle cx="10" cy="7" r="3.2"/><path d="M3.5 17c0-3.5 3-5.8 6.5-5.8s6.5 2.3 6.5 5.8"/>'),
  hash: svg('<line x1="7" y1="3" x2="5.5" y2="17"/><line x1="14" y1="3" x2="12.5" y2="17"/><line x1="3.5" y1="7.5" x2="16.5" y2="7.5"/><line x1="3" y1="12.5" x2="16" y2="12.5"/>'),
  upload: svg('<path d="M10 13V4M6.5 7.5L10 4l3.5 3.5"/><path d="M4 14v1.5A1.5 1.5 0 005.5 17h9a1.5 1.5 0 001.5-1.5V14"/>'),
  download: svg('<path d="M10 4v9M6.5 9.5L10 13l3.5-3.5"/><path d="M4 14v1.5A1.5 1.5 0 005.5 17h9a1.5 1.5 0 001.5-1.5V14"/>'),
  clock: svg('<circle cx="10" cy="10" r="7"/><polyline points="10,6 10,10 13,12"/>'),
  key: svg('<circle cx="7" cy="13" r="3.2"/><path d="M9.2 10.8L16 4M13 8l2 2M16 4l1.5 1.5"/>'),
  link: svg('<path d="M8.5 11.5l3-3"/><path d="M7 13L4.8 15.2a2.3 2.3 0 003.3 3.3L10.3 16"/><path d="M13 7l2.2-2.2a2.3 2.3 0 00-3.3-3.3L9.7 3.7"/>'),
};
function ic(name, cls = '') { return `<span class="ic ${cls}">${ICONS[name] || ''}</span>`; }
function bigIcon(name) { return (ICONS[name] || '').replace('width="16" height="16"', 'width="34" height="34"'); }

/* ---------- Formatting helpers ---------- */

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
    dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
function shortHash(h) { return h ? (h.length > 18 ? h.slice(0, 10) + '…' + h.slice(-8) : h) : '—'; }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function statusBadge(status) {
  const map = {
    'Active': 'badge-active', 'Under Investigation': 'badge-investigation', 'Forensic Pending': 'badge-forensic',
    'Court Proceeding': 'badge-court', 'Closed': 'badge-closed', 'Completed': 'badge-success', 'In Progress': 'badge-investigation',
    'ACTIVE': 'badge-success', 'PENDING': 'badge-pending', 'REJECTED': 'badge-danger', 'APPROVED': 'badge-success',
    'VERIFIED': 'badge-success', 'MISMATCH': 'badge-danger', 'DENIED': 'badge-danger', 'SUCCESS': 'badge-success',
  };
  const cls = map[status] || 'badge-active';
  return `<span class="badge ${cls}"><span class="dot"></span>${esc(status)}</span>`;
}

function toast(msg, kind = '') {
  const id = 't' + Date.now() + Math.random().toString(16).slice(2);
  state.toasts.push({ id, msg, kind });
  render();
  setTimeout(() => { state.toasts = state.toasts.filter(t => t.id !== id); render(); }, 3400);
}

/* ---------- Boot ---------- */

window.addEventListener('DOMContentLoaded', async () => {
  await loadOrInitState();
  document.addEventListener('click', handleClick);
  document.addEventListener('submit', handleSubmit);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.ui.modal) { state.ui.modal = null; render(); }
  });
  await restoreLiveSessionIfAny();
  render();
});

/* ---------- Live backend session restore ---------- */

async function restoreLiveSessionIfAny() {
  if (!window.PrismApi || !PrismApi.isLoggedIn()) return;
  try {
    const me = await PrismApi.apiMe();
    const role = PrismApi.ROLE_FROM_BACKEND[me.roles[0]] || 'police';
    state.session = { userId: me.id, name: me.full_name, role, email: me.email, department: me.department };
    state.ui = { screen: 'dashboard', selectedCaseId: null, activeTab: 'overview', sidebarOpen: false, notifOpen: false, modal: null };
    await loadLiveCases();
  } catch (e) {
    // Stale/expired session — fall back to the login screen rather than crashing.
    PrismApi.clearTokens();
    state.session = null;
  }
}

async function loadLiveCases() {
  if (!window.PrismApi) return;
  try {
    const casesPage = await PrismApi.apiListCases();
    const adapted = [];
    for (const c of casesPage.items) {
      const fir = await PrismApi.apiGetFir(c.id).catch(() => null);
      adapted.push(PrismApi.adaptCase(c, fir));
    }
    state.cases = adapted;
  } catch (e) {
    toast('Could not load cases from the server: ' + e.message, 't-danger');
  }
}

/* ---------- Event delegation ---------- */

async function handleClick(e) {
  const el = e.target.closest('[data-action]');
  if (!el) {
    // click-away closes notif panel
    if (state.ui.notifOpen && !e.target.closest('.notif-panel') && !e.target.closest('[data-action="toggle-notif"]')) {
      state.ui.notifOpen = false; render();
    }
    return;
  }
  const action = el.dataset.action;
  const d = el.dataset;

  switch (action) {
    case 'demo-select-role':
      state.pendingSelectedRole = d.role; render(); break;
    case 'do-login': {
      const role = state.pendingSelectedRole || 'police';
      if (window.PrismApi) {
        try {
          const { email } = DEMO_USERS[role];
          const { challenge_id } = await PrismApi.apiLogin(email, 'PrismDemo!2026');
          state.pendingChallengeId = challenge_id;
        } catch (err) {
          toast('Could not reach the PRISM backend: ' + err.message, 't-danger');
          break;
        }
      }
      state.pendingMfaRole = role;
      state.ui.screen = 'mfa';
      render();
      startMfaCodeRefresh(role);
      break;
    }
    case 'back-to-login':
      stopMfaCodeRefresh();
      state.pendingMfaRole = null; state.pendingChallengeId = null; state.ui.screen = 'login'; render(); break;
    case 'do-mfa-verify': {
      const role = state.pendingMfaRole;
      const user = DEMO_USERS[role];
      if (window.PrismApi) {
        try {
          const session = await PrismApi.apiVerifyMfa(user.email, state.pendingChallengeId);
          state.session = { userId: session.user.id, name: session.user.full_name, role, email: session.user.email, department: session.user.department };
        } catch (err) {
          toast('MFA verification failed: ' + err.message, 't-danger');
          break;
        }
      } else {
        state.session = { ...user };
      }
      stopMfaCodeRefresh();
      state.pendingMfaRole = null;
      state.pendingChallengeId = null;
      state.ui = { screen: 'dashboard', selectedCaseId: null, activeTab: 'overview', sidebarOpen: false, notifOpen: false, modal: null };
      await appendAudit(state, { userId: state.session.userId, user: state.session.name, role: state.session.role, action: 'Login (MFA Verified)', resource: '—', result: 'SUCCESS' });
      if (window.PrismApi) await loadLiveCases();
      saveState();
      render();
      toast(`Welcome, ${state.session.name}`, 't-success');
      break;
    }
    case 'logout': {
      if (state.session) {
        await appendAudit(state, { userId: state.session.userId, user: state.session.name, role: state.session.role, action: 'Logout', resource: '—', result: 'SUCCESS' });
      }
      if (window.PrismApi) await PrismApi.apiLogout();
      state.session = null;
      state.pendingSelectedRole = null;
      state.ui = { screen: 'login', selectedCaseId: null, activeTab: 'overview', sidebarOpen: false, notifOpen: false, modal: null };
      saveState(); render();
      break;
    }
    case 'nav':
      state.ui.screen = d.screen; state.ui.sidebarOpen = false; state.ui.modal = null;
      if (d.screen === 'dashboard') state.ui.selectedCaseId = null;
      render(); break;
    case 'toggle-sidebar':
      state.ui.sidebarOpen = !state.ui.sidebarOpen; render(); break;
    case 'close-sidebar':
      state.ui.sidebarOpen = false; render(); break;
    case 'toggle-notif':
      state.ui.notifOpen = !state.ui.notifOpen; render(); break;
    case 'open-case': {
      state.ui.screen = 'case'; state.ui.selectedCaseId = d.case; state.ui.activeTab = 'overview'; state.ui.modal = null;
      const c = getCase(d.case);
      if (window.PrismApi && c && c._backendId) {
        state.ui.caseLoading = true;
        render();
        try {
          const bundle = await PrismApi.apiLoadCaseBundle(c._backendId, c.caseId);
          state.documents = state.documents.filter(doc => doc.caseId !== c.caseId).concat(bundle.documents);
          state.evidence = state.evidence.filter(ev => ev.caseId !== c.caseId).concat(bundle.evidence);
          Object.assign(state.chainOfCustody, bundle.chainOfCustody);
        } catch (err) {
          toast('Could not load case details from the server: ' + err.message, 't-danger');
        }
        state.ui.caseLoading = false;
      }
      render();
      break;
    }
    case 'set-tab':
      state.ui.activeTab = d.tab; render(); break;
    case 'verify-integrity': {
      const btn = el; btn.textContent = 'Verifying…';
      const item = d.doc ? state.documents.find(x => x.documentId === d.doc) : state.evidence.find(x => x.evidenceId === d.evidence);
      if (item._live && window.PrismApi) {
        try {
          const result = d.doc
            ? await PrismApi.apiVerifyDocumentIntegrity(item._backendId)
            : await PrismApi.apiVerifyEvidenceIntegrity(item._backendId);
          item.integrityStatus = result.status;
          item.lastChecked = result.checked_at;
        } catch (err) {
          if (err instanceof PrismApi.ApiError && err.code === 'EVIDENCE_OBJECT_UNAVAILABLE') {
            toast('This evidence has no stored file to verify against.', 't-danger');
          } else {
            toast('Verification failed: ' + err.message, 't-danger');
          }
          render();
          break;
        }
      } else {
        const recomputed = d.doc
          ? await sha256Hex(`${item.name}|v${item.version}|${item.caseId}|${item.uploadedAt}${item.tampered ? '|EDITED' : ''}`)
          : await sha256Hex(`${item.evidenceId}|${item.type}|${item.caseId}|${item.collectedAt}${item.tampered ? '|EDITED' : ''}`);
        item.integrityStatus = recomputed === item.trustedHash ? 'VERIFIED' : 'MISMATCH';
        item.lastChecked = new Date().toISOString();
      }
      await appendAudit(state, {
        userId: state.session.userId, user: state.session.name, role: state.session.role,
        action: 'Verified Document/Evidence Integrity', resource: d.doc || d.evidence,
        result: item.integrityStatus === 'VERIFIED' || item.integrityStatus === 'NOT_APPLICABLE' ? 'SUCCESS' : 'MISMATCH DETECTED',
      });
      saveState(); render();
      const ok = item.integrityStatus === 'VERIFIED' || item.integrityStatus === 'NOT_APPLICABLE';
      toast(ok ? 'Integrity verified.' : 'Integrity MISMATCH detected.', ok ? 't-success' : 't-danger');
      break;
    }
    case 'simulate-edit': {
      const item = d.doc ? state.documents.find(x => x.documentId === d.doc) : state.evidence.find(x => x.evidenceId === d.evidence);
      item.tampered = true; item.integrityStatus = 'PENDING';
      saveState(); render();
      toast('Content modified after hashing — re-run Verify Integrity to see the mismatch.', 't-danger');
      break;
    }
    case 'restore-item': {
      const item = d.doc ? state.documents.find(x => x.documentId === d.doc) : state.evidence.find(x => x.evidenceId === d.evidence);
      item.tampered = false; item.integrityStatus = 'VERIFIED';
      saveState(); render();
      toast('Restored to original content.', 't-success');
      break;
    }
    case 'toggle-tl':
      state.ui.tlOpen = state.ui.tlOpen === d.evidence ? null : d.evidence; render(); break;
    case 'open-review-request':
      state.ui.modal = { type: 'reviewRequest', reqId: d.req, perms: null }; render(); break;
    case 'close-modal':
      // Only close when the backdrop itself (or an explicit close control) was the actual
      // click target — not when a blank area inside .modal bubbled up to the backdrop's
      // data-action via closest().
      if (e.target === el || el.classList.contains('modal-close')) { state.ui.modal = null; render(); }
      break;
    case 'toggle-perm': {
      const m = state.ui.modal;
      if (m && m.type === 'reviewRequest') {
        m.perms = m.perms || defaultPerms();
        m.perms[d.perm] = !m.perms[d.perm];
        render();
      }
      break;
    }
    case 'approve-request': await approveRequest(d.req); break;
    case 'open-reject': state.ui.modal = { type: 'rejectRequest', reqId: d.req }; render(); break;
    case 'confirm-reject': await rejectRequest(d.req); break;
    case 'attempt-restricted': {
      await appendAudit(state, {
        userId: state.session.userId, user: state.session.name, role: state.session.role,
        action: 'Attempted Unauthorized Action (Modify Evidence)', resource: d.case, result: 'DENIED',
      });
      saveState();
      state.ui.modal = { type: 'accessDenied', resource: d.case };
      render();
      break;
    }
    case 'go-request-access':
      state.ui.screen = 'requestAccess'; render(); break;
    case 'start-exam':
      state.ui.screen = 'forensicExam'; state.ui.selectedExamId = null; state.ui.examEvidence = d.evidence; state.ui.examCase = d.case; render(); break;
    case 'open-exam':
      state.ui.screen = 'forensicExam'; state.ui.selectedExamId = d.exam; render(); break;
    case 'run-verification': runExamVerification(); break;
    case 'finalize-exam': await finalizeExam(); break;
    case 'run-search': runSearch(); break;
    case 'reset-demo':
      state.ui.modal = { type: 'confirmReset' }; render(); break;
    case 'confirm-reset-demo':
      resetDemoData(); break;
    case 'mark-read':
      if (state.session) { const list = state.notifications[state.session.role] || []; const n = list.find(x => x.id === d.id); if (n) n.read = true; saveState(); render(); }
      break;
    default: break;
  }
}

function defaultPerms() {
  return { viewCaseInfo: true, viewFIR: true, viewDocuments: true, viewForensicReports: true, downloadDocuments: false, uploadLegalDocuments: false };
}

async function handleSubmit(e) {
  const form = e.target;
  if (!form.dataset || !form.dataset.form) return;
  e.preventDefault();
  if (form.dataset.form === 'request-access') {
    const caseId = document.getElementById('ra-caseid').value.trim().toUpperCase();
    const reason = document.getElementById('ra-reason').value.trim();
    const wantDocs = document.getElementById('ra-docs').checked;
    const wantForensic = document.getElementById('ra-forensic').checked;
    const errBox = document.getElementById('ra-error');
    const c = getCase(caseId);
    if (!c) { errBox.textContent = 'No case found with that Case ID.'; errBox.style.display = 'block'; return; }
    const existingActive = authForLawyerCase(state.session.userId, caseId);
    if (existingActive) { errBox.textContent = 'You already have active authorization for this case.'; errBox.style.display = 'block'; return; }
    const existingPending = pendingRequestFor(state.session.userId, caseId);
    if (existingPending) { errBox.textContent = 'You already have a pending request for this case.'; errBox.style.display = 'block'; return; }
    const reqId = 'REQ-2026-' + Math.floor(1000 + Math.random() * 8999);
    const req = {
      requestId: reqId, caseId, lawyerId: state.session.userId, lawyerName: state.session.name,
      assignedJudge: c.assignedJudge, reason: reason || 'Representation in ongoing proceeding',
      requestedAccess: [wantDocs ? 'Case Documents' : null, wantForensic ? 'Forensic Reports' : null].filter(Boolean),
      status: 'PENDING', requestedOn: new Date().toISOString(),
    };
    state.accessRequests.push(req);
    await appendAudit(state, { userId: state.session.userId, user: state.session.name, role: 'lawyer', action: 'Requested Case Access', resource: caseId, result: 'SUCCESS' });
    state.notifications.judge.unshift({ id: 'N-' + reqId, text: `New lawyer access request for Case ${caseId} from ${state.session.name}.`, time: new Date().toISOString(), read: false });
    saveState();
    state.ui.screen = 'dashboard';
    render();
    toast('Access request submitted — routed to the assigned judge.', 't-success');
  }
}

/* ---------- Judge review actions ---------- */

async function approveRequest(reqId) {
  const req = state.accessRequests.find(r => r.requestId === reqId);
  if (!req) return;
  const m = state.ui.modal;
  const perms = (m && m.perms) ? m.perms : defaultPerms();
  req.status = 'APPROVED';
  req.decidedOn = new Date().toISOString();
  const authId = 'AUTH-2026-' + Math.floor(1000 + Math.random() * 8999);
  state.authorizations.push({
    authorizationId: authId, lawyerId: req.lawyerId, lawyerName: req.lawyerName, caseId: req.caseId,
    approvedByJudge: state.session.name, status: 'ACTIVE', permissions: perms,
    createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 90 * 86400000).toISOString(),
  });
  await appendAudit(state, { userId: state.session.userId, user: state.session.name, role: 'judge', action: 'Approved Lawyer Access', resource: req.caseId, result: 'SUCCESS' });
  state.notifications.lawyer.unshift({ id: 'N-A-' + authId, text: `Your access request for Case ${req.caseId} has been approved.`, time: new Date().toISOString(), read: false });
  state.ui.modal = null;
  saveState(); render();
  toast(`Access approved for ${req.lawyerName} — case-specific authorization created.`, 't-success');
}

async function rejectRequest(reqId) {
  const req = state.accessRequests.find(r => r.requestId === reqId);
  if (!req) return;
  const reasonEl = document.getElementById('reject-reason');
  const reason = reasonEl ? reasonEl.value.trim() : '';
  req.status = 'REJECTED'; req.decidedOn = new Date().toISOString(); req.rejectReason = reason || 'Not specified';
  await appendAudit(state, { userId: state.session.userId, user: state.session.name, role: 'judge', action: 'Rejected Lawyer Access', resource: req.caseId, result: 'SUCCESS' });
  state.notifications.lawyer.unshift({ id: 'N-R-' + reqId, text: `Your access request for Case ${req.caseId} was rejected.`, time: new Date().toISOString(), read: false });
  state.ui.modal = null;
  saveState(); render();
  toast('Request rejected. No access granted.', 't-danger');
}

/* ---------- Forensic exam flow ---------- */

function runExamVerification() {
  const fields = ['ex-type', 'ex-methods', 'ex-equipment', 'ex-findings', 'ex-observations', 'ex-results', 'ex-conclusion'];
  const missing = fields.filter(id => !document.getElementById(id) || !document.getElementById(id).value.trim());
  state.ui.examChecks = {
    fieldsComplete: missing.length === 0, missing,
    formatValid: true,
  };
  render();
}

async function finalizeExam() {
  const evidenceId = state.ui.examEvidence;
  const caseId = state.ui.examCase;
  const ev = state.evidence.find(x => x.evidenceId === evidenceId);
  const get = id => document.getElementById(id) ? document.getElementById(id).value.trim() : '';
  const examId = 'EX-2026-' + Math.floor(1000 + Math.random() * 8999);
  const exam = {
    examinationId: examId, caseId, evidenceId, expertId: state.session.userId,
    examinationType: get('ex-type'), startDate: get('ex-start') || fmtISODate(new Date()), endDate: fmtISODate(new Date()),
    methods: get('ex-methods'), equipment: get('ex-equipment'), findings: get('ex-findings'),
    observations: get('ex-observations'), results: get('ex-results'), conclusion: get('ex-conclusion'),
    status: 'Completed',
  };
  state.forensicExams.push(exam);

  const docName = `Forensic_Report_${evidenceId.replace('Evidence-', '')}.pdf`;
  const trustedHash = await sha256Hex(`${docName}|v1|${caseId}|${exam.endDate}`);
  const docId = 'DOC-' + Math.floor(1000 + Math.random() * 8999);
  state.documents.push({
    documentId: docId, caseId, name: docName, type: 'Forensic Report', uploadedBy: state.session.name, role: 'forensic',
    uploadedAt: exam.endDate, version: 1, trustedHash, integrityStatus: 'VERIFIED', signatureStatus: 'Signed', accessLevel: 'Judge + Authorized Lawyer',
  });

  ev.trustedHash = ev.trustedHash || await sha256Hex(`${ev.evidenceId}|${ev.type}|${ev.caseId}|${ev.collectedAt}`);

  const nowIso = new Date().toISOString();
  state.chainOfCustody[evidenceId] = state.chainOfCustody[evidenceId] || [];
  state.chainOfCustody[evidenceId].push(
    { step: 'Examination Completed', timestamp: nowIso, user: state.session.name, role: 'forensic', note: 'Findings and results finalized' },
    { step: 'Report Generated', timestamp: nowIso, user: state.session.name, role: 'forensic', note: `${docName} finalized` },
    { step: 'Report Verified', timestamp: nowIso, user: state.session.name, role: 'forensic', note: 'SHA-256 hash generated and recorded' },
  );

  await appendAudit(state, { userId: state.session.userId, user: state.session.name, role: 'forensic', action: 'Forensic Report Uploaded', resource: docName, result: 'SUCCESS' });
  await appendAudit(state, { userId: state.session.userId, user: state.session.name, role: 'forensic', action: 'Document Hash Generated (SHA-256)', resource: docName, result: 'SUCCESS' });

  state.ui.examChecks = null;
  state.ui.selectedExamId = examId; state.ui.examEvidence = null; state.ui.examCase = null;
  saveState(); render();
  toast('Examination finalized — report hashed and stored.', 't-success');
}

function fmtISODate(d) { return d.toISOString().slice(0, 10); }

/* ---------- Live MFA code (real TOTP, refreshed every second) ---------- */

let _mfaRefreshTimer = null;

function startMfaCodeRefresh(role) {
  stopMfaCodeRefresh();
  if (!window.PrismApi) return;
  const tick = async () => {
    const email = DEMO_USERS[role].email;
    const secret = PrismApi.DEMO_MFA_SECRETS[email];
    state.ui.mfaCode = await PrismApi.computeTotp(secret);
    state.ui.mfaSecondsLeft = PrismApi.secondsUntilNextTotpWindow();
    if (state.ui.screen === 'mfa') render();
  };
  tick();
  _mfaRefreshTimer = setInterval(tick, 1000);
}
function stopMfaCodeRefresh() {
  if (_mfaRefreshTimer) { clearInterval(_mfaRefreshTimer); _mfaRefreshTimer = null; }
}

/* ---------- Search ---------- */

function runSearch() {
  const q = (document.getElementById('search-q').value || '').trim().toLowerCase();
  const status = document.getElementById('search-status').value;
  state.ui.searchResults = null; state.ui.searchNote = null;

  if (state.session.role === 'lawyer') {
    const authorizedCaseIds = state.authorizations.filter(a => a.lawyerId === state.session.userId && a.status === 'ACTIVE').map(a => a.caseId);
    let results = state.cases.filter(c => authorizedCaseIds.includes(c.caseId));
    if (q) results = results.filter(c => c.caseId.toLowerCase().includes(q) || c.firNumber.toLowerCase().includes(q) || c.title.toLowerCase().includes(q));
    if (status) results = results.filter(c => c.status === status);
    if (q && results.length === 0) {
      state.ui.searchNote = 'No authorized record found.';
    }
    state.ui.searchResults = results;
  } else {
    let results = state.cases.slice();
    if (q) results = results.filter(c =>
      c.caseId.toLowerCase().includes(q) || c.firNumber.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) || c.policeStation.toLowerCase().includes(q) || c.area.toLowerCase().includes(q));
    if (status) results = results.filter(c => c.status === status);
    state.ui.searchResults = results;
  }
  render();
}

/* =====================================================================
   RENDER
   ===================================================================== */

function render() {
  const root = document.getElementById('app');
  if (!state.session) {
    root.innerHTML = state.ui.screen === 'mfa' ? renderMfaScreen() : renderLoginScreen();
  } else {
    root.innerHTML = renderShell();
  }
  renderToastLayer();
}

function renderToastLayer() {
  let wrap = document.getElementById('toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toast-wrap';
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  wrap.innerHTML = state.toasts.map(t => `<div class="toast ${t.kind}">${ic(t.kind === 't-danger' ? 'alert' : 'check')}${esc(t.msg)}</div>`).join('');
}

/* ---------- Login / MFA ---------- */

function renderLoginScreen() {
  const roles = [
    { role: 'police', label: 'Police Officer', icon: 'shield' },
    { role: 'judge', label: 'Judge', icon: 'briefcase' },
    { role: 'lawyer', label: 'Lawyer', icon: 'file' },
    { role: 'forensic', label: 'Forensic Expert', icon: 'flask' },
  ];
  const sel = state.pendingSelectedRole || 'police';
  return `
  <div class="login-wrap">
    <div class="login-side">
      <div class="brand" style="border:none;padding:0;margin-bottom:26px;">
        <div class="brand-mark">SIH</div>
        <div class="brand-text"><div class="name">PRISM</div><div class="sub">SECURE · DIGITAL · ACCOUNTABLE</div></div>
      </div>
      <h1>Police Records &amp;<br/>Investigation Security<br/>Management</h1>
      <p class="tag">One case. One secure digital record. Controlled access. Complete traceability — from FIR to forensic report to court.</p>
      <div class="principles">
        <div class="principle">${ic('shieldCheck')}<span>Authentication is not authorization — every action is checked against role and case-specific authorization.</span></div>
        <div class="principle">${ic('link')}<span>Every document and evidence item is SHA-256 hashed and chain-of-custody tracked.</span></div>
        <div class="principle">${ic('list')}<span>Every important action is written to a hash-chained, tamper-evident audit trail.</span></div>
      </div>
    </div>
    <div class="login-main">
      <div class="login-card">
        <h2>Secure Login</h2>
        <div class="sub">Demo Accounts — select a role to sign in as</div>
        <div class="demo-select">
          ${roles.map(r => `
            <button type="button" class="demo-role-btn ${sel === r.role ? 'selected' : ''}" data-action="demo-select-role" data-role="${r.role}">
              <span class="ic-wrap ${sel === r.role ? '' : ''}">${ic(r.icon)}</span><br/>${r.label}
            </button>`).join('')}
        </div>
        <div class="field">
          <label>Email / User ID</label>
          <input type="text" value="${DEMO_USERS[sel].email}" readonly />
        </div>
        <div class="field">
          <label>Password</label>
          <input type="password" value="••••••••••" readonly />
        </div>
        <div class="checkbox-row"><input type="checkbox" id="remember" checked/> <label for="remember" style="margin:0;font-weight:400;">Remember this device</label></div>
        <button class="btn btn-primary btn-block" style="margin-top:16px;" data-action="do-login">Login</button>
        <div class="mfa-badge">${ic('lock')} Protected by Multi-Factor Authentication</div>
      </div>
    </div>
  </div>`;
}

function renderMfaScreen() {
  const role = state.pendingMfaRole;
  const user = DEMO_USERS[role];
  const live = !!window.PrismApi;
  const codeDigits = live && state.ui.mfaCode ? state.ui.mfaCode.split('') : ['4', '1', '9', '2', '7', '0'];
  const secondsLeft = live ? (state.ui.mfaSecondsLeft != null ? state.ui.mfaSecondsLeft : '…') : '45';
  return `
  <div class="login-wrap">
    <div class="login-side">
      <div class="brand" style="border:none;padding:0;margin-bottom:26px;">
        <div class="brand-mark">SIH</div>
        <div class="brand-text"><div class="name">PRISM</div><div class="sub">SECURE · DIGITAL · ACCOUNTABLE</div></div>
      </div>
      <h1>Verify Your<br/>Identity</h1>
      <p class="tag">Signing in as <strong style="color:#fff;">${esc(user.name)}</strong> (${ROLE_LABEL[role]}). Login alone only establishes identity — role and case authorization are checked separately on every action.</p>
    </div>
    <div class="login-main">
      <div class="login-card">
        <h2>Multi-Factor Authentication</h2>
        <div class="sub">${live ? 'Live TOTP code, verified by the PRISM backend' : 'Enter the 6-digit verification code sent to your registered device'}</div>
        <div class="otp-row">
          ${[0, 1, 2, 3, 4, 5].map(i => `<input maxlength="1" value="${codeDigits[i] || ''}" readonly />`).join('')}
        </div>
        <div class="small faint" style="margin-bottom:16px;">${live ? `Code refreshes in ${secondsLeft}s` : 'Code expires in 00:45 (demo — pre-filled)'}</div>
        <button class="btn btn-primary btn-block" data-action="do-mfa-verify">Verify &amp; Continue</button>
        <button class="btn btn-ghost btn-block" style="margin-top:8px;" data-action="back-to-login">Cancel</button>
      </div>
    </div>
  </div>`;
}

/* ---------- Shell ---------- */

function navItemsFor(role) {
  const common = [{ s: 'dashboard', label: 'Dashboard', i: 'grid' }];
  if (role === 'police') return [...common,
    { s: 'search', label: 'Search', i: 'search' },
    { s: 'auditLog', label: 'Audit Logs', i: 'list' }];
  if (role === 'judge') return [...common,
    { s: 'accessRequests', label: 'Access Requests', i: 'shieldCheck' },
    { s: 'search', label: 'Search', i: 'search' },
    { s: 'auditLog', label: 'Audit Logs', i: 'list' }];
  if (role === 'lawyer') return [...common,
    { s: 'requestAccess', label: 'Request Case Access', i: 'plus' },
    { s: 'search', label: 'Search', i: 'search' }];
  if (role === 'forensic') return [...common,
    { s: 'search', label: 'Search', i: 'search' },
    { s: 'auditLog', label: 'Audit Logs', i: 'list' }];
  return common;
}

function renderShell() {
  const s = state.session;
  const nav = navItemsFor(s.role);
  const initials = s.name.split(' ').filter(w => w[0] === w[0].toUpperCase()).slice(-2).map(w => w[0]).join('').slice(0, 2);
  const notifList = state.notifications[s.role] || [];
  const unread = notifList.filter(n => !n.read).length;

  return `
  <div class="shell">
    <div class="sidebar-scrim ${state.ui.sidebarOpen ? 'show' : ''}" data-action="close-sidebar"></div>
    <aside class="sidebar ${state.ui.sidebarOpen ? 'open' : ''}">
      <div class="brand">
        <div class="brand-mark">SIH</div>
        <div class="brand-text"><div class="name">PRISM</div><div class="sub">${ROLE_LABEL[s.role].toUpperCase()}</div></div>
      </div>
      <div class="nav-group">
        <div class="nav-label">Navigate</div>
        ${nav.map(n => `<div class="nav-item ${state.ui.screen === n.s ? 'active' : ''}" data-action="nav" data-screen="${n.s}">${ic(n.i)}<span>${n.label}</span></div>`).join('')}
      </div>
      <div class="sidebar-foot">
        Case ID identifies a case; it is never a bearer token. Access always requires a matching authorization.
        <div style="margin-top:10px;"><button class="btn btn-sm btn-ghost" style="color:#9fb3d6;border-color:rgba(255,255,255,0.15);" data-action="reset-demo">Reset Demo Data</button></div>
      </div>
    </aside>
    <header class="topbar">
      <div class="topbar-left">
        <button class="hamburger" data-action="toggle-sidebar">${ic('grid')}</button>
        <div class="topbar-title">${screenTitle()}</div>
      </div>
      <div class="topbar-right">
        <button class="bell-btn" data-action="toggle-notif">${ic('bell')}${unread ? '<span class="bell-dot"></span>' : ''}</button>
        <div class="user-chip" data-action="logout" title="Logout">
          <div class="user-meta"><div class="u-name">${esc(s.name)}</div><div class="u-role">${ROLE_LABEL[s.role]}</div></div>
          <div class="avatar">${initials}</div>
        </div>
      </div>
      ${state.ui.notifOpen ? renderNotifPanel(notifList) : ''}
    </header>
    <main class="content">${screenContent()}</main>
  </div>
  ${state.ui.modal ? renderModal() : ''}`;
}

function screenTitle() {
  const map = {
    dashboard: 'Dashboard', case: getCase(state.ui.selectedCaseId) ? getCase(state.ui.selectedCaseId).caseId : 'Case',
    requestAccess: 'Request Case Access', accessRequests: 'Access Requests', forensicExam: 'Forensic Examination',
    auditLog: 'Audit Logs', search: 'Secure Search',
  };
  return map[state.ui.screen] || 'PRISM';
}

function renderNotifPanel(list) {
  return `<div class="notif-panel">
    <div class="notif-panel-head">Notifications</div>
    ${list.length === 0 ? `<div class="notif-empty">No notifications yet.</div>` :
      list.map(n => `<div class="notif-item" data-action="mark-read" data-id="${n.id}" style="${n.read ? 'opacity:.6' : ''}">${esc(n.text)}<div class="n-time">${fmtDateTime(n.time)}</div></div>`).join('')}
  </div>`;
}

/* ---------- Screen dispatcher ---------- */

function screenContent() {
  switch (state.ui.screen) {
    case 'dashboard': return renderDashboard();
    case 'case': return renderCaseDetail();
    case 'requestAccess': return renderRequestAccess();
    case 'accessRequests': return renderAccessRequestsScreen();
    case 'forensicExam': return renderForensicExamScreen();
    case 'auditLog': return renderAuditLogScreen();
    case 'search': return renderSearchScreen();
    default: return renderDashboard();
  }
}

/* ---------- Dashboards ---------- */

function renderDashboard() {
  const role = state.session.role;
  if (role === 'police') return dashPolice();
  if (role === 'judge') return dashJudge();
  if (role === 'lawyer') return dashLawyer();
  if (role === 'forensic') return dashForensic();
  return '';
}

function caseRow(c, extraCell) {
  return `<tr class="clickable" data-action="open-case" data-case="${c.caseId}">
    <td data-label="Case ID" class="mono">${c.caseId}</td>
    <td data-label="FIR" class="mono">${c.firNumber}</td>
    <td data-label="Title">${esc(c.title)}</td>
    <td data-label="Station">${esc(c.policeStation)}</td>
    <td data-label="Status">${statusBadge(c.status)}</td>
    ${extraCell || ''}
  </tr>`;
}

function dashPolice() {
  const cases = state.cases;
  const pendingForensic = cases.filter(c => c.status === 'Forensic Pending').length;
  return `
  <div class="stat-grid">
    <div class="stat-card"><div class="s-label">Active Cases</div><div class="s-value">${cases.filter(c => c.status !== 'Closed').length}</div><div class="s-sub">Across ${new Set(cases.map(c => c.policeStation)).size} stations</div></div>
    <div class="stat-card c-warning"><div class="s-label">Pending Forensic</div><div class="s-value">${pendingForensic}</div><div class="s-sub">Awaiting examination</div></div>
    <div class="stat-card"><div class="s-label">Evidence Items</div><div class="s-value">${state.evidence.length}</div><div class="s-sub">Logged this year</div></div>
    <div class="stat-card c-success"><div class="s-label">Documents Added</div><div class="s-value">${state.documents.length}</div><div class="s-sub">Hash-verified on upload</div></div>
  </div>
  <div class="panel">
    <div class="panel-head"><h3>Cases</h3><span class="small faint">${cases.length} total</span></div>
    <div class="panel-body table-scroll">
      <table><thead><tr><th>Case ID</th><th>FIR</th><th>Title</th><th>Station</th><th>Status</th></tr></thead>
      <tbody>${cases.map(c => caseRow(c)).join('')}</tbody></table>
    </div>
  </div>`;
}

function dashJudge() {
  const myCases = state.cases.filter(c => c.assignedJudge === state.session.name);
  const myRequests = requestsForJudge(state.session.name);
  const pending = myRequests.filter(r => r.status === 'PENDING');
  return `
  <div class="stat-grid">
    <div class="stat-card c-warning"><div class="s-label">Pending Requests</div><div class="s-value">${pending.length}</div><div class="s-sub">Lawyer access awaiting review</div></div>
    <div class="stat-card"><div class="s-label">Assigned Cases</div><div class="s-value">${myCases.length}</div><div class="s-sub">On your docket</div></div>
    <div class="stat-card c-success"><div class="s-label">Forensic Reports</div><div class="s-value">${state.forensicExams.filter(x => myCases.some(c => c.caseId === x.caseId)).length}</div><div class="s-sub">Available for review</div></div>
  </div>
  ${pending.length > 0 ? `
  <div class="panel">
    <div class="panel-head"><h3>Pending Lawyer Access Requests</h3></div>
    <div class="panel-body table-scroll">
      <table><thead><tr><th>Request</th><th>Case</th><th>Lawyer</th><th>Requested</th><th></th></tr></thead>
      <tbody>${pending.map(r => `<tr>
        <td data-label="Request" class="mono">${r.requestId}</td>
        <td data-label="Case" class="mono">${r.caseId}</td>
        <td data-label="Lawyer">${esc(r.lawyerName)}</td>
        <td data-label="Requested">${fmtDate(r.requestedOn)}</td>
        <td data-label=""><button class="btn btn-primary btn-sm" data-action="open-review-request" data-req="${r.requestId}">Review</button></td>
      </tr>`).join('')}</tbody></table>
    </div>
  </div>` : `<div class="alert alert-info">${ic('shieldCheck')}<div>No pending lawyer access requests right now.</div></div>`}
  <div class="panel">
    <div class="panel-head"><h3>Assigned Cases</h3></div>
    <div class="panel-body table-scroll">
      <table><thead><tr><th>Case ID</th><th>FIR</th><th>Title</th><th>Station</th><th>Status</th></tr></thead>
      <tbody>${myCases.map(c => caseRow(c)).join('')}</tbody></table>
    </div>
  </div>`;
}

function dashLawyer() {
  const authorized = state.authorizations.filter(a => a.lawyerId === state.session.userId && a.status === 'ACTIVE');
  const pending = state.accessRequests.filter(r => r.lawyerId === state.session.userId && r.status === 'PENDING');
  const rejected = state.accessRequests.filter(r => r.lawyerId === state.session.userId && r.status === 'REJECTED');
  return `
  <div class="stat-grid">
    <div class="stat-card c-success"><div class="s-label">Authorized Cases</div><div class="s-value">${authorized.length}</div><div class="s-sub">Active case-specific access</div></div>
    <div class="stat-card c-warning"><div class="s-label">Pending Requests</div><div class="s-value">${pending.length}</div><div class="s-sub">Awaiting judge decision</div></div>
    <div class="stat-card"><div class="s-label">Access History</div><div class="s-value">${state.accessRequests.filter(r => r.lawyerId === state.session.userId).length}</div><div class="s-sub">Total requests raised</div></div>
  </div>
  <div class="alert alert-info">${ic('shieldCheck')}<div>Knowing a Case ID never grants access. You must request access; the assigned judge is identified automatically and reviews every request.</div></div>
  <div class="panel">
    <div class="panel-head"><h3>My Authorized Cases</h3><button class="btn btn-primary btn-sm" data-action="go-request-access">${ic('plus')} Request Case Access</button></div>
    <div class="panel-body ${authorized.length ? 'table-scroll' : 'pad'}">
      ${authorized.length === 0 ? emptyState('folder', 'No Authorized Cases', 'Cases approved for your account will appear here once a judge grants access.') :
        `<table><thead><tr><th>Case ID</th><th>Approved By</th><th>Access Level</th><th>Valid Until</th><th></th></tr></thead>
        <tbody>${authorized.map(a => `<tr class="clickable" data-action="open-case" data-case="${a.caseId}">
          <td data-label="Case ID" class="mono">${a.caseId}</td>
          <td data-label="Approved By">${esc(a.approvedByJudge)}</td>
          <td data-label="Access Level">Limited</td>
          <td data-label="Valid Until">${fmtDate(a.expiresAt)}</td>
          <td data-label="">${statusBadge('ACTIVE')}</td>
        </tr>`).join('')}</tbody></table>`}
    </div>
  </div>
  ${pending.length > 0 ? `
  <div class="panel">
    <div class="panel-head"><h3>Pending Requests</h3></div>
    <div class="panel-body table-scroll">
      <table><thead><tr><th>Case ID</th><th>Assigned Judge</th><th>Requested</th><th>Status</th></tr></thead>
      <tbody>${pending.map(r => `<tr><td data-label="Case ID" class="mono">${r.caseId}</td><td data-label="Judge">${esc(r.assignedJudge)}</td><td data-label="Requested">${fmtDate(r.requestedOn)}</td><td data-label="Status">${statusBadge('PENDING')}</td></tr>`).join('')}</tbody></table>
    </div>
  </div>` : ''}
  ${rejected.length > 0 ? `
  <div class="panel">
    <div class="panel-head"><h3>Rejected Requests</h3></div>
    <div class="panel-body table-scroll">
      <table><thead><tr><th>Case ID</th><th>Decided</th><th>Reason</th></tr></thead>
      <tbody>${rejected.map(r => `<tr><td data-label="Case ID" class="mono">${r.caseId}</td><td data-label="Decided">${fmtDate(r.decidedOn)}</td><td data-label="Reason">${esc(r.rejectReason || '—')}</td></tr>`).join('')}</tbody></table>
    </div>
  </div>` : ''}`;
}

function dashForensic() {
  const myExamsEvidenceIds = state.forensicExams.map(x => x.evidenceId);
  const assignedEvidence = state.evidence;
  const pendingEvidence = assignedEvidence.filter(e => !myExamsEvidenceIds.includes(e.evidenceId));
  return `
  <div class="stat-grid">
    <div class="stat-card"><div class="s-label">Assigned Evidence</div><div class="s-value">${assignedEvidence.length}</div><div class="s-sub">Across all assigned cases</div></div>
    <div class="stat-card c-warning"><div class="s-label">Pending Examination</div><div class="s-value">${pendingEvidence.length}</div><div class="s-sub">Not yet started</div></div>
    <div class="stat-card c-success"><div class="s-label">Completed Reports</div><div class="s-value">${state.forensicExams.filter(x => x.status === 'Completed').length}</div><div class="s-sub">Hash-verified &amp; stored</div></div>
  </div>
  <div class="panel">
    <div class="panel-head"><h3>Evidence Queue</h3></div>
    <div class="panel-body table-scroll">
      <table><thead><tr><th>Evidence ID</th><th>Case</th><th>Type</th><th>Received</th><th>Status</th><th></th></tr></thead>
      <tbody>${assignedEvidence.map(e => {
        const exam = examForEvidence(e.evidenceId);
        return `<tr>
          <td data-label="Evidence ID" class="mono">${e.evidenceId}</td>
          <td data-label="Case" class="mono">${e.caseId}</td>
          <td data-label="Type">${esc(e.type)}</td>
          <td data-label="Received">${fmtDate(e.collectedAt)}</td>
          <td data-label="Status">${exam ? statusBadge(exam.status) : statusBadge('PENDING')}</td>
          <td data-label="">${exam
            ? `<button class="btn btn-sm" data-action="open-exam" data-exam="${exam.examinationId}">View</button>`
            : `<button class="btn btn-primary btn-sm" data-action="start-exam" data-evidence="${e.evidenceId}" data-case="${e.caseId}">Start Examination</button>`}</td>
        </tr>`;
      }).join('')}</tbody></table>
    </div>
  </div>`;
}

function emptyState(icon, title, body) {
  return `<div class="center-state"><div class="ic-big">${bigIcon(icon)}</div><h3>${title}</h3><p>${body}</p></div>`;
}

/* ---------- Case detail ---------- */

function tabsForRole(role, isLawyerAuthorized, perms) {
  if (role !== 'lawyer') return [
    { t: 'overview', label: 'Overview' }, { t: 'fir', label: 'FIR' }, { t: 'documents', label: 'Documents' },
    { t: 'evidence', label: 'Evidence' }, { t: 'forensics', label: 'Forensics' }, { t: 'access', label: 'Access' }, { t: 'audit', label: 'Audit' },
  ];
  const tabs = [{ t: 'overview', label: 'Overview' }];
  if (perms && perms.viewFIR) tabs.push({ t: 'fir', label: 'FIR' });
  if (perms && perms.viewDocuments) tabs.push({ t: 'documents', label: 'Documents' });
  if (perms && perms.viewForensicReports) tabs.push({ t: 'forensics', label: 'Forensics' });
  return tabs;
}

function renderCaseDetail() {
  const c = getCase(state.ui.selectedCaseId);
  if (!c) return emptyState('folder', 'Case Not Found', 'This case does not exist or is not visible to your account.');
  if (state.ui.caseLoading) return `<div class="center-state">${ic('clock')}<h3 style="margin-top:10px;">Loading case details from the server…</h3></div>`;

  const role = state.session.role;
  let auth = null, perms = null;
  if (role === 'lawyer') {
    auth = authForLawyerCase(state.session.userId, c.caseId);
    if (!auth) {
      return `<div class="alert alert-danger">${ic('lock')}<div><strong>Access Restricted.</strong> You do not have an active authorization for this case. Request access from your dashboard.</div></div>`;
    }
    perms = auth.permissions;
  }
  const tabs = tabsForRole(role, !!auth, perms);
  if (!tabs.find(t => t.t === state.ui.activeTab)) state.ui.activeTab = 'overview';

  return `
  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:4px;">
    <div>
      <div style="display:flex;align-items:center;gap:10px;">
        <h2 class="mono" style="font-size:19px;">${c.caseId}</h2>${statusBadge(c.status)}
      </div>
      <div class="muted small" style="margin-top:3px;">${esc(c.title)} · ${esc(c.policeStation)} · FIR ${c.firNumber}</div>
    </div>
    ${role === 'lawyer' ? `<div class="badge badge-success">${ic('shieldCheck')} Authorized · Approved by ${esc(auth.approvedByJudge)}</div>` : ''}
  </div>
  <div class="tabs" style="margin-top:16px;">
    ${tabs.map(t => `<div class="tab ${state.ui.activeTab === t.t ? 'active' : ''}" data-action="set-tab" data-tab="${t.t}">${t.label}</div>`).join('')}
  </div>
  ${renderCaseTab(c, role, perms)}
  `;
}

function renderCaseTab(c, role, perms) {
  switch (state.ui.activeTab) {
    case 'overview': return tabOverview(c, role, perms);
    case 'fir': return tabFIR(c);
    case 'documents': return tabDocuments(c, role, perms);
    case 'evidence': return tabEvidence(c);
    case 'forensics': return tabForensics(c);
    case 'access': return tabAccess(c);
    case 'audit': return tabAudit(c);
    default: return '';
  }
}

function tabOverview(c, role, perms) {
  return `
  <div class="panel"><div class="panel-body pad">
    <div class="kv-grid">
      <div class="kv-item"><div class="k">Case ID</div><div class="v mono">${c.caseId}</div></div>
      <div class="kv-item"><div class="k">FIR Number</div><div class="v mono">${c.firNumber}</div></div>
      <div class="kv-item"><div class="k">Registration Date</div><div class="v">${fmtDate(c.registrationDate)}</div></div>
      <div class="kv-item"><div class="k">Police Station</div><div class="v">${esc(c.policeStation)}</div></div>
      <div class="kv-item"><div class="k">Area</div><div class="v">${esc(c.area)}, ${c.year}</div></div>
      <div class="kv-item"><div class="k">Investigating Officer</div><div class="v">${esc(c.investigatingOfficer)}</div></div>
      <div class="kv-item"><div class="k">Assigned Judge</div><div class="v">${esc(c.assignedJudge)}</div></div>
      <div class="kv-item"><div class="k">Case Status</div><div class="v">${statusBadge(c.status)}</div></div>
    </div>
    <div class="divider"></div>
    <div class="section-title">Case Status Flow</div>
    <div class="small muted">FIR Registered → Case Created → Investigation → Evidence Collected → Forensic Examination → Court Proceeding → Case Closed</div>
  </div></div>
  ${role === 'lawyer' ? `<div class="panel"><div class="panel-body pad">
    <div class="alert alert-warning" style="margin:0;">${ic('alert')}<div><strong>Demo:</strong> attempt an action outside your granted permissions.
      <div style="margin-top:8px;"><button class="btn btn-danger btn-sm" data-action="attempt-restricted" data-case="${c.caseId}">Attempt: Modify Police Evidence Record</button></div>
    </div></div>
  </div></div>` : ''}`;
}

function tabFIR(c) {
  const fir = state.documents.find(d => d.caseId === c.caseId && d.type === 'FIR');
  return `
  <div class="panel"><div class="panel-body pad">
    <div class="kv-grid">
      <div class="kv-item"><div class="k">FIR Number</div><div class="v mono">${c.firNumber}</div></div>
      <div class="kv-item"><div class="k">Incident Date</div><div class="v">${fmtDate(c.incidentDate)}</div></div>
      <div class="kv-item"><div class="k">Complainant</div><div class="v">${esc(c.complainant)}</div></div>
      <div class="kv-item"><div class="k">Accused</div><div class="v">${esc(c.accused)}</div></div>
      <div class="kv-item"><div class="k">Sections</div><div class="v">${esc(c.sections)}</div></div>
      <div class="kv-item"><div class="k">Incident Location</div><div class="v">${esc(c.incidentLocation)}</div></div>
    </div>
    ${fir ? docCard(fir, true) : '<div class="small faint" style="margin-top:12px;">FIR document not yet uploaded.</div>'}
  </div></div>`;
}

function docCard(doc, downloadAllowed) {
  const statusCls = doc.integrityStatus === 'VERIFIED' ? 'integrity-verified' : doc.integrityStatus === 'MISMATCH' ? 'integrity-mismatch' : 'muted';
  return `
  <div class="hash-box" style="margin-top:14px;">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
      <div><strong class="mono">${esc(doc.name)}</strong> <span class="small faint">v${doc.version} · ${esc(doc.type)}</span></div>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-sm" data-action="verify-integrity" data-doc="${doc.documentId}">${ic('shieldCheck')} Verify Integrity</button>
        ${downloadAllowed !== false ? `<button class="btn btn-sm btn-ghost">${ic('download')} Download</button>` : ''}
      </div>
    </div>
    <div class="hash-row"><span class="hk">Hash Algorithm</span><span class="hv mono">SHA-256</span></div>
    <div class="hash-row"><span class="hk">Trusted Hash</span><span class="hv mono">${shortHash(doc.trustedHash)}</span></div>
    <div class="hash-row"><span class="hk">Integrity Status</span><span class="hv ${statusCls}">${doc.integrityStatus}${doc.tampered ? ' (content edited since hash)' : ''}</span></div>
    <div class="hash-row"><span class="hk">Signature</span><span class="hv">${doc.signatureStatus} — ${esc(doc.uploadedBy)}, ${fmtDate(doc.uploadedAt)}</span></div>
    <div class="hash-row"><span class="hk">DigiLocker Reference</span><span class="hv mono">DL-MH-2026-${doc.documentId.replace('DOC-', '')}</span></div>
    ${!doc._live ? `<div style="margin-top:8px;display:flex;gap:8px;">
      ${!doc.tampered
        ? `<button class="btn btn-sm btn-ghost" data-action="simulate-edit" data-doc="${doc.documentId}">Simulate edit after hashing (demo)</button>`
        : `<button class="btn btn-sm btn-ghost" data-action="restore-item" data-doc="${doc.documentId}">Restore original (demo)</button>`}
    </div>` : ''}
  </div>`;
}

function tabDocuments(c, role, perms) {
  let docs = docsForCase(c.caseId);
  if (role === 'lawyer') {
    // lawyer sees only non-restricted categories they're permitted to view
    docs = docs.filter(d => d.type !== 'Forensic Report');
  }
  return `<div class="panel"><div class="panel-body pad">
    ${docs.length === 0 ? emptyState('file', 'No Documents', 'No documents are available for this case yet.') :
      docs.map(d => docCard(d, role !== 'lawyer' || (perms && perms.downloadDocuments))).join('')}
  </div></div>`;
}

function tabEvidence(c) {
  const items = evidenceForCase(c.caseId);
  return items.map(e => {
    const exam = examForEvidence(e.evidenceId);
    const statusCls = e.integrityStatus === 'VERIFIED' ? 'integrity-verified' : e.integrityStatus === 'MISMATCH' ? 'integrity-mismatch' : 'muted';
    const tl = state.chainOfCustody[e.evidenceId] || [];
    const open = state.ui.tlOpen === e.evidenceId;
    return `<div class="panel"><div class="panel-head">
      <h3 class="mono">${e.evidenceId} <span class="small muted" style="font-weight:400;">— ${esc(e.type)}</span></h3>
      ${exam ? statusBadge(exam.status) : statusBadge('PENDING')}
    </div>
    <div class="panel-body pad">
      <div class="kv-grid">
        <div class="kv-item"><div class="k">Description</div><div class="v">${esc(e.description)}</div></div>
        <div class="kv-item"><div class="k">Collected</div><div class="v">${fmtDate(e.collectedAt)} by ${esc(e.collectedBy)}</div></div>
        <div class="kv-item"><div class="k">Current Custodian</div><div class="v">${esc(e.currentCustodian)}</div></div>
      </div>
      <div class="hash-box">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong>Integrity</strong>
          <button class="btn btn-sm" data-action="verify-integrity" data-evidence="${e.evidenceId}">${ic('shieldCheck')} Verify Integrity</button>
        </div>
        <div class="hash-row"><span class="hk">SHA-256</span><span class="hv mono">${shortHash(e.trustedHash)}</span></div>
        <div class="hash-row"><span class="hk">Status</span><span class="hv ${statusCls}">${e.integrityStatus}${e.tampered ? ' (edited since hash)' : ''}</span></div>
        ${!e._live ? `<div style="margin-top:6px;">
          ${!e.tampered
            ? `<button class="btn btn-sm btn-ghost" data-action="simulate-edit" data-evidence="${e.evidenceId}">Simulate edit after hashing (demo)</button>`
            : `<button class="btn btn-sm btn-ghost" data-action="restore-item" data-evidence="${e.evidenceId}">Restore original (demo)</button>`}
        </div>` : ''}
      </div>
      <button class="btn btn-sm" style="margin-top:12px;" data-action="toggle-tl" data-evidence="${e.evidenceId}">${ic('clock')} ${open ? 'Hide' : 'Show'} Chain of Custody (${tl.length} events)</button>
      ${open ? `<div class="timeline" style="margin-top:16px;">${tl.map((step, i) => `
        <div class="tl-item done">
          <div class="tl-dot">${ic('check')}</div>
          <div class="tl-title">${esc(step.step)}</div>
          <div class="tl-meta">${fmtDateTime(step.timestamp)} · ${esc(step.user)} (${ROLE_LABEL[step.role] || step.role})</div>
          <div class="tl-meta">${esc(step.note)}</div>
        </div>`).join('')}</div>` : ''}
    </div></div>`;
  }).join('') || emptyState('box', 'No Evidence', 'No evidence has been logged for this case.');
}

function tabForensics(c) {
  const exams = examsForCase(c.caseId);
  if (exams.length === 0) return emptyState('flask', 'No Forensic Reports', 'No authorized forensic reports are currently available for this case.');
  return exams.map(x => `
  <div class="panel"><div class="panel-head"><h3 class="mono">${x.examinationId}</h3>${statusBadge(x.status)}</div>
  <div class="panel-body pad">
    <div class="section-title mt-0">Examination Details</div>
    <div class="kv-grid">
      <div class="kv-item"><div class="k">Evidence</div><div class="v mono">${x.evidenceId}</div></div>
      <div class="kv-item"><div class="k">Type</div><div class="v">${esc(x.examinationType)}</div></div>
      <div class="kv-item"><div class="k">Period</div><div class="v">${fmtDate(x.startDate)} – ${fmtDate(x.endDate)}</div></div>
      <div class="kv-item"><div class="k">Methods</div><div class="v">${esc(x.methods)}</div></div>
      <div class="kv-item"><div class="k">Equipment</div><div class="v">${esc(x.equipment)}</div></div>
      <div class="kv-item"><div class="k">Expert</div><div class="v">${esc(DEMO_USERS.forensic.name)}</div></div>
    </div>
    <div class="section-title">Findings</div>
    <div class="kv-grid">
      <div class="kv-item" style="grid-column:1/-1;"><div class="k">Findings</div><div class="v">${esc(x.findings)}</div></div>
      <div class="kv-item" style="grid-column:1/-1;"><div class="k">Observations</div><div class="v">${esc(x.observations)}</div></div>
      <div class="kv-item" style="grid-column:1/-1;"><div class="k">Results</div><div class="v">${esc(x.results)}</div></div>
      <div class="kv-item" style="grid-column:1/-1;"><div class="k">Conclusion</div><div class="v">${esc(x.conclusion)}</div></div>
    </div>
    ${(() => { const doc = state.documents.find(d => d.caseId === c.caseId && d.type === 'Forensic Report'); return doc ? docCard(doc, true) : ''; })()}
  </div></div>`).join('');
}

function tabAccess(c) {
  const reqs = state.accessRequests.filter(r => r.caseId === c.caseId);
  const auths = state.authorizations.filter(a => a.caseId === c.caseId);
  return `
  <div class="panel"><div class="panel-head"><h3>Active Authorizations</h3></div>
  <div class="panel-body ${auths.length ? 'table-scroll' : 'pad'}">
    ${auths.length === 0 ? emptyState('shield', 'No Active Authorizations', 'No lawyer currently has authorized access to this case.') :
      `<table><thead><tr><th>Auth ID</th><th>Lawyer</th><th>Approved By</th><th>Status</th><th>Expires</th></tr></thead>
      <tbody>${auths.map(a => `<tr><td data-label="Auth" class="mono">${a.authorizationId}</td><td data-label="Lawyer">${esc(a.lawyerName)}</td><td data-label="Approved By">${esc(a.approvedByJudge)}</td><td data-label="Status">${statusBadge(a.status)}</td><td data-label="Expires">${fmtDate(a.expiresAt)}</td></tr>`).join('')}</tbody></table>`}
  </div></div>
  <div class="panel"><div class="panel-head"><h3>Request History</h3></div>
  <div class="panel-body ${reqs.length ? 'table-scroll' : 'pad'}">
    ${reqs.length === 0 ? emptyState('list', 'No Requests', 'No lawyer has requested access to this case.') :
      `<table><thead><tr><th>Request</th><th>Lawyer</th><th>Status</th><th>Requested</th></tr></thead>
      <tbody>${reqs.map(r => `<tr><td data-label="Request" class="mono">${r.requestId}</td><td data-label="Lawyer">${esc(r.lawyerName)}</td><td data-label="Status">${statusBadge(r.status)}</td><td data-label="Requested">${fmtDate(r.requestedOn)}</td></tr>`).join('')}</tbody></table>`}
  </div></div>`;
}

function tabAudit(c) {
  const events = state.auditEvents.filter(e => e.resource === c.caseId || docsForCase(c.caseId).some(d => d.name === e.resource) || evidenceForCase(c.caseId).some(ev => ev.evidenceId === e.resource) || examsForCase(c.caseId).some(x => x.examinationId === e.resource));
  return auditTable(events, true);
}

/* ---------- Request Access (Lawyer) ---------- */

function renderRequestAccess() {
  return `
  <div class="panel" style="max-width:560px;"><div class="panel-head"><h3>Request Case Access</h3></div>
  <div class="panel-body pad">
    <div id="ra-error" class="alert alert-danger" style="display:none;"></div>
    <form data-form="request-access">
      <div class="field"><label>Case ID</label><input type="text" id="ra-caseid" class="mono" placeholder="PRISM-2026-001245" required /></div>
      <div class="field"><label>Reason for Access</label><textarea id="ra-reason" placeholder="Representation in ongoing court proceeding"></textarea></div>
      <div class="field">
        <label>Requested Access</label>
        <div class="checkbox-row" style="margin-bottom:8px;"><input type="checkbox" id="ra-docs" checked/> <label for="ra-docs" style="margin:0;font-weight:400;">Case Documents</label></div>
        <div class="checkbox-row"><input type="checkbox" id="ra-forensic" checked/> <label for="ra-forensic" style="margin:0;font-weight:400;">Forensic Reports</label></div>
      </div>
      <div class="alert alert-info">${ic('shieldCheck')}<div>You do not choose a judge. The system automatically identifies the judge assigned to this case and routes the request there.</div></div>
      <button class="btn btn-primary btn-block" type="submit">Submit Request</button>
    </form>
  </div></div>`;
}

/* ---------- Access Requests (Judge) ---------- */

function renderAccessRequestsScreen() {
  const reqs = requestsForJudge(state.session.name).slice().sort((a, b) => new Date(b.requestedOn) - new Date(a.requestedOn));
  return `
  <div class="panel"><div class="panel-head"><h3>Lawyer Access Requests</h3></div>
  <div class="panel-body ${reqs.length ? 'table-scroll' : 'pad'}">
    ${reqs.length === 0 ? emptyState('shield', 'No Requests', 'You currently have no lawyer access requests requiring action.') :
      `<table><thead><tr><th>Request</th><th>Case</th><th>Lawyer</th><th>Requested</th><th>Status</th><th></th></tr></thead>
      <tbody>${reqs.map(r => `<tr>
        <td data-label="Request" class="mono">${r.requestId}</td>
        <td data-label="Case" class="mono">${r.caseId}</td>
        <td data-label="Lawyer">${esc(r.lawyerName)}</td>
        <td data-label="Requested">${fmtDate(r.requestedOn)}</td>
        <td data-label="Status">${statusBadge(r.status)}</td>
        <td data-label="">${r.status === 'PENDING' ? `<button class="btn btn-primary btn-sm" data-action="open-review-request" data-req="${r.requestId}">Review</button>` : ''}</td>
      </tr>`).join('')}</tbody></table>`}
  </div></div>`;
}

/* ---------- Forensic Exam screen ---------- */

function renderForensicExamScreen() {
  if (state.ui.selectedExamId) {
    const x = state.forensicExams.find(e => e.examinationId === state.ui.selectedExamId);
    if (!x) return emptyState('flask', 'Examination Not Found', '');
    const c = getCase(x.caseId);
    return `<div class="small muted" style="margin-bottom:10px;"><a href="#" data-action="open-case" data-case="${x.caseId}">${x.caseId}</a> / ${x.examinationId}</div>` + tabForensics(c);
  }
  const evidenceId = state.ui.examEvidence;
  const caseId = state.ui.examCase;
  const ev = state.evidence.find(e => e.evidenceId === evidenceId);
  const c = getCase(caseId);
  if (!ev || !c) return emptyState('flask', 'Select Evidence', 'Choose an item from the Evidence Queue to start an examination.');
  const checks = state.ui.examChecks;

  return `
  <div class="panel"><div class="panel-head"><h3>New Forensic Examination</h3><span class="small faint mono">${evidenceId}</span></div>
  <div class="panel-body pad">
    <div class="section-title mt-0">Case Information</div>
    <div class="kv-grid">
      <div class="kv-item"><div class="k">Case ID</div><div class="v mono">${c.caseId}</div></div>
      <div class="kv-item"><div class="k">FIR Number</div><div class="v mono">${c.firNumber}</div></div>
      <div class="kv-item"><div class="k">Police Station</div><div class="v">${esc(c.policeStation)}</div></div>
      <div class="kv-item"><div class="k">Investigating Officer</div><div class="v">${esc(c.investigatingOfficer)}</div></div>
    </div>
    <div class="section-title">Evidence Information</div>
    <div class="kv-grid">
      <div class="kv-item"><div class="k">Evidence ID</div><div class="v mono">${ev.evidenceId}</div></div>
      <div class="kv-item"><div class="k">Type</div><div class="v">${esc(ev.type)}</div></div>
      <div class="kv-item" style="grid-column:1/-1;"><div class="k">Description</div><div class="v">${esc(ev.description)}</div></div>
    </div>
    <div class="section-title">Examination Details</div>
    <div class="two-col">
      <div class="field"><label>Examination Type</label><input type="text" id="ex-type" placeholder="Digital Forensic Imaging" /></div>
      <div class="field"><label>Start Date</label><input type="date" id="ex-start" value="${fmtISODate(new Date())}" /></div>
    </div>
    <div class="field"><label>Methods / Techniques Used</label><textarea id="ex-methods" placeholder="Write-blocked imaging, file carving..."></textarea></div>
    <div class="field"><label>Equipment / Tools Used</label><input type="text" id="ex-equipment" placeholder="FTK Imager, Autopsy..." /></div>
    <div class="section-title">Findings</div>
    <div class="field"><label>Findings</label><textarea id="ex-findings" placeholder="What was found"></textarea></div>
    <div class="field"><label>Observations</label><textarea id="ex-observations" placeholder="Notable observations"></textarea></div>
    <div class="field"><label>Results</label><textarea id="ex-results" placeholder="Result of the examination"></textarea></div>
    <div class="field"><label>Conclusion</label><textarea id="ex-conclusion" placeholder="Overall conclusion"></textarea></div>
    <div class="upload-drop">${ic('upload')} Supporting files &amp; final report (simulated — no file upload needed for this prototype)</div>

    ${checks ? `
    <div class="divider"></div>
    <div class="section-title mt-0">Verification &amp; Validation</div>
    <div class="hash-box">
      <div class="hash-row"><span class="hk">Required Fields Complete</span><span class="hv ${checks.fieldsComplete ? 'integrity-verified' : 'integrity-mismatch'}">${checks.fieldsComplete ? 'VERIFIED' : 'MISSING: ' + checks.missing.join(', ')}</span></div>
      <div class="hash-row"><span class="hk">File Format Valid</span><span class="hv integrity-verified">VERIFIED</span></div>
    </div>` : ''}

    <div style="display:flex;gap:10px;margin-top:16px;">
      <button class="btn" data-action="run-verification">${ic('shieldCheck')} Run Verification</button>
      <button class="btn btn-success" data-action="finalize-exam" ${checks && checks.fieldsComplete ? '' : 'disabled'}>${ic('hash')} Finalize &amp; Generate Hash</button>
    </div>
  </div></div>`;
}

/* ---------- Audit Log ---------- */

function renderAuditLogScreen() {
  return `<div id="audit-wrap">${renderAuditInner()}</div>`;
}

function renderAuditInner() {
  return `<div class="panel"><div class="panel-head"><h3>System Audit Trail</h3>
    <div style="display:flex;gap:8px;">
      <button class="btn btn-sm" onclick="doVerifyChainUI()">${ic('shieldCheck')} Verify Chain</button>
      <button class="btn btn-sm btn-ghost" onclick="doSimulateTamperUI()">Simulate Tamper Attempt</button>
    </div>
  </div>
  <div class="panel-body pad"><div id="chain-status" class="alert alert-info">${ic('link')}<div>Click "Verify Chain" to recompute every SHA-256 link from the first event.</div></div></div>
  ${auditTable(state.auditEvents.slice().reverse(), false)}
  </div>`;
}

function auditTable(events, compact) {
  if (events.length === 0) return `<div class="panel-body pad">${emptyState('list', 'No Audit Events', 'No recorded actions yet for this case.')}</div>`;
  return `<div class="table-scroll"><table><thead><tr><th>Timestamp</th><th>User</th><th>Role</th><th>Action</th><th>Resource</th><th>Result</th>${compact ? '' : '<th>Hash</th>'}</tr></thead>
  <tbody>${events.map(e => `<tr>
    <td data-label="Time">${fmtDateTime(e.timestamp)}</td>
    <td data-label="User">${esc(e.user)}</td>
    <td data-label="Role">${ROLE_LABEL[e.role] || e.role}</td>
    <td data-label="Action">${esc(e.action)}</td>
    <td data-label="Resource" class="mono">${esc(e.resource)}</td>
    <td data-label="Result">${statusBadge(e.result.includes('DENIED') || e.result.includes('MISMATCH') ? 'DENIED' : 'SUCCESS')} <span class="small faint">${e.result !== 'SUCCESS' ? esc(e.result) : ''}</span></td>
    ${compact ? '' : `<td data-label="Hash" class="mono small faint">${shortHash(e.eventHash)}</td>`}
  </tr>`).join('')}</tbody></table></div>`;
}

async function doVerifyChainUI() {
  const box = document.getElementById('chain-status');
  if (!box) return;
  box.className = 'alert alert-info'; box.innerHTML = `${ic('clock')}<div>Recomputing hash chain…</div>`;
  const result = await verifyAuditChain(state);
  if (result.valid) {
    box.className = 'alert alert-info';
    box.innerHTML = `${ic('shieldCheck')}<div><strong>Audit Chain Verified.</strong> All ${state.auditEvents.length} events form an unbroken SHA-256 hash chain — no retroactive edits detected.</div>`;
  } else {
    box.className = 'alert alert-danger';
    box.innerHTML = `${ic('alert')}<div><strong>Chain Broken at event #${result.brokenAt + 1}.</strong> This indicates a record was altered after being written.</div>`;
  }
}

function doSimulateTamperUI() {
  const box = document.getElementById('chain-status');
  if (!box) return;
  box.className = 'alert alert-danger';
  box.innerHTML = `${ic('alert')}<div><strong>Simulated tamper attempt:</strong> if event #3's "Action" field were edited directly in the database, its stored hash would no longer match its recomputed hash, and every subsequent event's <span class="mono">previousEventHash</span> link would break — instantly flagging the row and everything after it. (This is a demo message only; no data was changed. Click "Verify Chain" to confirm the real chain is intact.)</div>`;
}

/* ---------- Search ---------- */

function renderSearchScreen() {
  const results = state.ui.searchResults;
  const note = state.ui.searchNote;
  return `
  <div class="panel"><div class="panel-body pad">
    <div class="search-bar">
      <input type="text" id="search-q" placeholder="Search by Case ID, FIR number, title, station, area..." class="mono" />
      <select id="search-status"><option value="">All Statuses</option><option>Under Investigation</option><option>Forensic Pending</option><option>Court Proceeding</option><option>Closed</option></select>
      <button class="btn btn-primary" data-action="run-search">${ic('search')} Search</button>
    </div>
    ${state.session.role === 'lawyer' ? `<div class="alert alert-info" style="margin-bottom:0;">${ic('lock')}<div>Search only returns cases you are already authorized on. This never confirms or denies the existence of other cases.</div></div>` : ''}
  </div></div>
  ${results ? `<div class="panel"><div class="panel-head"><h3>Results</h3><span class="small faint">${results.length} found</span></div>
    <div class="panel-body ${results.length ? 'table-scroll' : 'pad'}">
      ${results.length === 0
        ? `<div class="center-state">${ic('lock')}<h3 style="margin-top:10px;">${note || 'No results found'}</h3></div>`
        : `<table><thead><tr><th>Case ID</th><th>FIR</th><th>Title</th><th>Station</th><th>Status</th></tr></thead><tbody>${results.map(c => caseRow(c)).join('')}</tbody></table>`}
    </div></div>` : ''}`;
}

/* ---------- Modals ---------- */

function renderModal() {
  const m = state.ui.modal;
  if (m.type === 'reviewRequest') return modalReviewRequest(m);
  if (m.type === 'rejectRequest') return modalReject(m);
  if (m.type === 'accessDenied') return modalAccessDenied(m);
  if (m.type === 'confirmReset') return modalConfirmReset();
  return '';
}

function modalReviewRequest(m) {
  const req = state.accessRequests.find(r => r.requestId === m.reqId);
  if (!req) return '';
  const perms = m.perms || defaultPerms();
  const rows = [
    ['viewCaseInfo', 'View Case Information', true],
    ['viewFIR', 'View FIR', false],
    ['viewDocuments', 'View Investigation Documents', false],
    ['viewForensicReports', 'View Forensic Reports', false],
    ['downloadDocuments', 'Download Documents', false],
    ['uploadLegalDocuments', 'Upload Legal Documents', false],
  ];
  const lockedDeny = ['Modify Police Documents', 'Modify Evidence', 'Delete Evidence'];
  return `<div class="modal-backdrop" data-action="close-modal">
    <div class="modal">
      <div class="modal-head"><h3>Lawyer Access Request</h3><button class="modal-close" data-action="close-modal">${ic('x')}</button></div>
      <div class="modal-body">
        <div class="kv-grid" style="margin-bottom:14px;">
          <div class="kv-item"><div class="k">Request ID</div><div class="v mono">${req.requestId}</div></div>
          <div class="kv-item"><div class="k">Case</div><div class="v mono">${req.caseId}</div></div>
          <div class="kv-item"><div class="k">Lawyer</div><div class="v">${esc(req.lawyerName)}</div></div>
          <div class="kv-item"><div class="k">Requested On</div><div class="v">${fmtDate(req.requestedOn)}</div></div>
          <div class="kv-item" style="grid-column:1/-1;"><div class="k">Reason</div><div class="v">${esc(req.reason)}</div></div>
        </div>
        <div class="section-title mt-0">Permission Matrix</div>
        ${rows.map(([key, label, locked]) => `
          <div class="perm-row"><span>${label}</span>
            <button class="toggle ${perms[key] ? 'on' : ''} ${locked ? 'locked' : ''}" ${locked ? '' : `data-action="toggle-perm" data-perm="${key}"`}></button>
          </div>`).join('')}
        ${lockedDeny.map(l => `<div class="perm-row"><span>${l}</span><span class="badge badge-danger">Deny</span></div>`).join('')}
      </div>
      <div class="modal-foot">
        <button class="btn btn-danger" data-action="open-reject" data-req="${req.requestId}">Reject</button>
        <button class="btn btn-success" data-action="approve-request" data-req="${req.requestId}">Approve Access</button>
      </div>
    </div>
  </div>`;
}

function modalReject(m) {
  const req = state.accessRequests.find(r => r.requestId === m.reqId);
  return `<div class="modal-backdrop" data-action="close-modal">
    <div class="modal" style="max-width:400px;">
      <div class="modal-head"><h3>Reject Access Request?</h3><button class="modal-close" data-action="close-modal">${ic('x')}</button></div>
      <div class="modal-body">
        <p class="small muted">Rejecting access for <strong>${esc(req.lawyerName)}</strong> to case <span class="mono">${req.caseId}</span>. No access will be granted.</p>
        <div class="field"><label>Reason</label><textarea id="reject-reason" placeholder="State a reason (optional)"></textarea></div>
      </div>
      <div class="modal-foot"><button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-danger" data-action="confirm-reject" data-req="${req.requestId}">Reject Request</button></div>
    </div>
  </div>`;
}

function modalAccessDenied(m) {
  return `<div class="modal-backdrop" data-action="close-modal">
    <div class="modal" style="max-width:400px;">
      <div class="modal-head"><h3>Access Restricted</h3><button class="modal-close" data-action="close-modal">${ic('x')}</button></div>
      <div class="modal-body center-state" style="padding:20px 10px;">
        <div class="ic-big" style="color:var(--danger);">${bigIcon('lock')}</div>
        <h3>You do not have permission to perform this action.</h3>
        <p>Your current authorization for this case does not include this action. This attempt has been recorded in the audit trail.</p>
        <p class="mono small faint" style="margin-top:10px;">Reference: SEC-2026-${Math.floor(10000 + Math.random() * 89999)}</p>
      </div>
      <div class="modal-foot"><button class="btn btn-primary" data-action="close-modal">Understood</button></div>
    </div>
  </div>`;
}

function modalConfirmReset() {
  return `<div class="modal-backdrop" data-action="close-modal">
    <div class="modal" style="max-width:380px;">
      <div class="modal-head"><h3>Reset Demo Data?</h3><button class="modal-close" data-action="close-modal">${ic('x')}</button></div>
      <div class="modal-body"><p class="small muted">This clears all local demo state (sessions, requests, approvals, audit log) and reloads with fresh seed data.</p></div>
      <div class="modal-foot"><button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-danger" data-action="confirm-reset-demo">Reset</button></div>
    </div>
  </div>`;
}
