// Where everything lives, for the Node generators. Mirrors paths.py.
//   R360_SITE  the site being built into  (default: the repo root above tools/)
//   R360_OUT   where finished files land  (default: <repo>/build)
const path = require("path");
const fs = require("fs");
const TOOLS = __dirname;
const REPO = path.dirname(TOOLS);
const SITE = process.env.R360_SITE || REPO;
const OUT = process.env.R360_OUT || path.join(REPO, "build");
fs.mkdirSync(OUT, { recursive: true });
module.exports = {
  TOOLS, REPO, SITE, OUT,
  worksheets: path.join(SITE, "worksheets"),
  answers: path.join(SITE, "answers"),
  presentations: path.join(SITE, "presentations"),
};
