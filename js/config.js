// Revise 360 — Copyright (c) 2026 Revise 360 Ltd. All rights reserved. See LICENCE.txt.
// ============================================================
//  SITE SETTINGS - the only file most teachers need to edit
// ============================================================
window.APP_CONFIG = {
  // The site name shown to students is set in experiences/topics.json
  siteTitle: "Revise 360",

  // Paste the web app URL from your Google Apps Script deployment here
  // (see README.md, step 2). Leave it empty to run in "this device only"
  // mode: progress is saved in the browser, but teachers can't see it.
  // The hosted Revise 360 backend. Teachers don't need to change anything here:
  // students sign in and their progress syncs automatically. Schools who prefer
  // to hold the data themselves can point this at their own Worker instead
  // (see backend/README.md).
  // Leave this empty to run in demo mode: sign-ins, class logins, login cards, progress
  // and the dashboard all work in the browser, saved on that device only. When your
  // Cloudflare Worker is deployed, put its URL here and everything switches to it with
  // no other change: "https://api.revise360.co.uk".
  backendUrl: "",

  // Classes shown in the sign-in list. Edit to match your groups.
  classes: ["MCS 11A", "MCS 10C", "BDB 11B", "BDB 10B"],

  // Score bands used everywhere (fraction of marks).
  secure: 1.0,   // full marks = Secure
  revise: 0.6    // at least 60% = Revise, below = Focus here
};
