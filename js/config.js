// ============================================================
//  SITE SETTINGS - the only file most teachers need to edit
// ============================================================
window.APP_CONFIG = {
  // The site name shown to students is set in experiences/topics.json
  siteTitle: "Revise 360",

  // Paste the web app URL from your Google Apps Script deployment here
  // (see README.md, step 2). Leave it empty to run in "this device only"
  // mode: progress is saved in the browser, but teachers can't see it.
  backendUrl: "",

  // Classes shown in the sign-in list. Edit to match your groups.
  classes: ["10A", "10B", "10C", "10D"],

  // Score bands used everywhere (fraction of marks).
  secure: 1.0,   // full marks = Secure
  revise: 0.6    // at least 60% = Revise, below = Focus here
};
