# PRISM — Prototype (Netlify-ready)

A frontend-only, high-fidelity prototype of PRISM (Police Records & Investigation
Security Management), built for SIH 2026. Plain HTML/CSS/JS — **no build step,
no backend, no npm install required.**

Tech surface shown in this prototype maps to the team's confirmed stack
(React.js/Next.js/Tailwind in the real product; this prototype uses vanilla
HTML/CSS/JS purely so it can be dragged straight into Netlify with zero
tooling). Data lives in the browser's `localStorage` — there is no server;
everything is realistic mock data.

## Deploy to Netlify (2 minutes)

**Option A — Drag and drop (fastest)**
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag this whole folder (`prism-prototype/`) onto the page
3. Netlify gives you a live URL immediately — done

**Option B — Netlify CLI**
```bash
npm install -g netlify-cli
cd prism-prototype
netlify deploy --prod
```

**Option C — Git-based (for ongoing edits)**
1. Push this folder to a GitHub repo
2. In Netlify: **Add new site → Import an existing project**
3. Build command: *(leave blank)* · Publish directory: `.`
4. Deploy

No environment variables, no build command, no framework install needed —
`index.html` loads `styles.css`, `data.js` and `app.js` directly.

## Run locally before deploying

Hash verification uses the browser's real Web Crypto SHA-256, which requires
a secure context (HTTPS, or `localhost`). Opening `index.html` directly via
`file://` mostly works, but for full fidelity serve it locally:

```bash
cd prism-prototype
python3 -m http.server 8000
# open http://localhost:8000
```

## Demo accounts

No real authentication — pick a role on the login screen, MFA is pre-filled.

| Role | Name |
|---|---|
| Police | Inspector Arjun Patil |
| Judge | Hon. Justice A. Sharma |
| Lawyer | Adv. Rahul Mehta |
| Forensic Expert | Dr. Anjali Rao |

## Suggested demo script (matches the SIH walkthrough)

1. **Login as Police** → open case `PRISM-2026-001245` → **FIR** tab, **Evidence**
   tab (click *Verify Integrity*, expand *Chain of Custody*), **Forensics** tab
   (view the completed report + hash) → logout.
2. **Login as Lawyer** → *Request Case Access* → enter `PRISM-2026-001245` →
   submit → dashboard shows request **Pending** → logout.
3. **Login as Judge** → *Access Requests* → **Review** the pending request →
   toggle the permission matrix → **Approve Access** → logout.
4. **Login as Lawyer** → dashboard now shows the case under *My Authorized
   Cases* → open it → view permitted documents/forensic report → on the
   Overview tab, click **"Attempt: Modify Police Evidence Record"** →
   see the **Access Denied** modal → logout.
5. **Login as Judge or Police** → *Audit Logs* → **Verify Chain** → shows
   every action from steps 1–4, including the denied attempt, as an unbroken
   SHA-256 hash chain.

Other things worth clicking during a demo:
- **Forensic Expert** login → Dashboard → *Start Examination* on `Evidence-885`
  → fill the form → *Run Verification* → *Finalize & Generate Hash* (creates
  a real new hashed document you can see reflected on the case's Forensics tab).
- On any document/evidence hash panel: **"Simulate edit after hashing"** then
  **Verify Integrity** again → shows a genuine `MISMATCH`, then **Restore**.
- **Search** as a Lawyer for a case you are *not* authorized on — returns
  "No authorized record found" rather than confirming the case exists.
- Sidebar → **Reset Demo Data** — wipes local state and reseeds everything,
  useful between demo run-throughs.

## What's real vs. simulated

- **Real:** SHA-256 hashing (Web Crypto), hash-chained audit log (recomputed
  and verified live), RBAC/ABAC-style permission gating in the UI logic,
  full state machine for the lawyer/judge authorization workflow.
- **Simulated (labeled as such in the UI):** file upload (no actual file
  storage — hashes are computed from document metadata), DigiLocker /
  government interoperability (reference IDs shown, no live API call), OCR/AI
  metadata extraction (not implemented in this pass — flagged as a next step
  below).

## Known scope trims (flagged, not hidden)

This prototype prioritizes the judge-facing critical path (lawyer access
workflow, integrity/hash verification, audit trail, forensic examination)
over full coverage of every screen in the original 60-section spec. Not yet
built: AI/OCR upload simulation screen, document version-history UI,
settings page, full notification read-state persistence beyond session.
These are straightforward additions on top of the existing state model in
`data.js` if you want them for the final SIH build.

## File structure

```
prism-prototype/
├── index.html      — shell, loads fonts + the two scripts below
├── styles.css       — design system (navy/blue, IBM Plex Sans + Mono)
├── data.js           — mock data, state persistence, SHA-256 + audit-chain logic
├── app.js            — all screens, rendering, and event handling
└── netlify.toml     — zero-config static deploy + basic security headers
```
