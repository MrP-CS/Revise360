// Revise 360 — Copyright (c) 2026 Revise 360 Ltd. All rights reserved. See LICENCE.txt.
// ============================================================
//  SITE SETTINGS - the only file most teachers need to edit
// ============================================================
window.APP_CONFIG = {
  // The site name shown to students is set in experiences/topics.json
  siteTitle: "Revise 360",

  // Hosted Revise 360 Cloudflare Worker API. Leave this empty to run in demo mode:
  // sign-ins, class logins, login cards, progress and the dashboard are saved on this
  // device only. For hosted or self-hosted syncing, point this at the compatible Worker
  // described in backend/README.md (for example "https://api.revise360.co.uk").
  backendUrl: "",

  // Classes shown in the sign-in list. Edit to match your groups.
  classes: ["MCS 11A", "MCS 10C", "BDB 11B", "BDB 10B"],

  // Score bands used everywhere (fraction of marks).
  secure: 1.0,   // full marks = Secure
  revise: 0.6    // at least 60% = Revise, below = Focus here
};
