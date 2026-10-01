# Pyodide, vendored

CPython compiled to WebAssembly. This is what runs a pupil's Python when they
answer a code question, and it is served from this site rather than a CDN so
the platform works on a school network that blocks one, and so a version change
is a commit rather than something that happens to us overnight.

- Version: **314.0.7**, taken from the npm package `pyodide`.
- Licence: **MPL-2.0** (Mozilla Public License 2.0). Upstream:
  https://github.com/pyodide/pyodide

Only the files needed to start Python are here:

| file | what it is |
|---|---|
| `pyodide.mjs` | the loader, imported by `js/pyworker.js` |
| `pyodide.asm.mjs` / `pyodide.asm.wasm` | the interpreter itself |
| `python_stdlib.zip` | the standard library |
| `pyodide-lock.json` | the package index it expects to find |

About 12MB in total, which the server compresses to roughly a third of that. It
is fetched the first time a pupil opens a code question, not on every page, and
then cached.

To update: `npm install pyodide@<version>`, copy those files across, run
`node tools/tests/smokecode.js`, and note the new version here.
