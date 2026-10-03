/* One Python lexer, for everything that shows Python to a pupil.
 *
 * There used to be two: one that produced HTML for the editor's highlighter and
 * one that produced data for the headset's canvas. They were written from the
 * same idea at different times and had already begun to disagree - the data one
 * had quietly lost triple-quoted strings. Two lexers also meant two colour
 * tables, and the whole purpose of the colouring is that a pupil recognises the
 * amber 25 in the instruction as the same thing as the amber 25 in their
 * program. So: one lexer here, one colour table in css/pytok.css, and both are
 * read by the editor, the worked examples, the inline code in a task, the
 * headset and the print builds.
 *
 *   R360Tok.lex(src)      -> [{ t, k }]   k is one of k b s n c o t
 *   R360Tok.html(src)     -> HTML with <span class="k|b|s|n|c|o|t">
 *   R360Tok.inline(src)   -> <code class="pytok"> ... </code>
 *   R360Tok.rich(text)    -> a sentence with `backticks` turned into inline code
 *   R360Tok.plain(text)   -> the same sentence with the backticks simply removed
 *   R360Tok.colours       -> { k: "#...", ... }, read from the stylesheet
 *
 * The kinds are deliberately few. A beginner does not need Python's full
 * grammar coloured; they need to see at a glance that a thing is a piece of
 * text, a number, a name, or a word Python already knows.
 */
(function () {
  "use strict";

  const KEY = ("False None True and as assert async await break class continue def del elif else " +
    "except finally for from global if import in is lambda nonlocal not or pass raise return try " +
    "while with yield").split(" ");
  const BUILT = ("abs all any bool chr dict enumerate float input int len list max min open ord " +
    "print range reversed round set sorted str sum tuple type zip append").split(" ");

  /* Order matters: a # inside a string is not a comment, so strings are tried
   * before comments cannot be - which is why the comment arm only fires on a #
   * the string arm has not already eaten. Triple quotes come before single ones
   * so """a""" is one token rather than an empty string followed by a name. */
  const RE = /(#[^\n]*)|('''[\s\S]*?'''|"""[\s\S]*?"""|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")|(\b\d+\.?\d*\b)|([A-Za-z_]\w*)|(\s+)|([\s\S])/g;

  function lex(src) {
    const out = [];
    const re = new RegExp(RE.source, "g");
    let m;
    while ((m = re.exec(String(src)))) {
      if (m[1]) out.push({ t: m[1], k: "c" });
      else if (m[2]) out.push({ t: m[2], k: "s" });
      else if (m[3]) out.push({ t: m[3], k: "n" });
      else if (m[4]) out.push({ t: m[4], k: KEY.indexOf(m[4]) >= 0 ? "k" : BUILT.indexOf(m[4]) >= 0 ? "b" : "t" });
      else if (m[5]) out.push({ t: m[5], k: "t" });
      else out.push({ t: m[6], k: "o" });
      if (re.lastIndex === m.index) re.lastIndex++;   // never spin on an empty match
    }
    return out;
  }

  const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

  /* Plain text is left unwrapped: a span round every space and every ordinary
   * name trebles the size of a painted program for nothing. */
  function html(src, tag) {
    const t = tag || "span";
    return lex(src).map(x => x.k === "t" && !/\S/.test(x.t)
      ? esc(x.t)
      : `<${t} class="${x.k}">${esc(x.t)}</${t}>`).join("");
  }

  function inline(src) {
    return '<code class="pytok">' + html(src) + "</code>";
  }

  /* A sentence with pieces of Python in it, marked by the author with
   * backticks. Everything outside the backticks is escaped and left as prose;
   * everything inside is lexed and boxed. A lone backtick is just a backtick.
   *
   * Nothing here looks at the prose to decide what is data: the author said so.
   * Guessing it from the sentence - every capitalised word, every number - gets
   * "Then display Age" wrong in both directions, and a pupil who cannot trust
   * the boxes stops reading them. */
  function rich(text) {
    const s = String(text == null ? "" : text);
    let out = "", i = 0;
    for (;;) {
      const a = s.indexOf("`", i);
      if (a < 0) { out += esc(s.slice(i)); break; }
      const b = s.indexOf("`", a + 1);
      if (b < 0) { out += esc(s.slice(i)); break; }
      out += esc(s.slice(i, a)) + inline(s.slice(a + 1, b));
      i = b + 1;
    }
    return out;
  }

  /* The same sentence with no markup at all: for a title attribute, a
   * read-aloud voice, a plain-text export, a test that compares wording. */
  function plain(text) {
    return String(text == null ? "" : text).replace(/`([^`]*)`/g, "$1");
  }

  const has = text => /`[^`]+`/.test(String(text == null ? "" : text));

  /* The colours come from css/pytok.css, so the stylesheet is the only place
   * they are written down. The headset paints Python onto a canvas and needs
   * them as values rather than classes; this is how it gets them without a
   * second copy. The fallbacks are only for a context with no stylesheet at
   * all - a unit test in node, say - and tools/tests/smoketok.py checks that
   * they still agree with the file. */
  const KINDS = ["k", "b", "s", "n", "c", "o", "t"];
  const FALLBACK = { k: "#c792ea", b: "#7fb2ff", s: "#9fe6a0", n: "#ffcb6b", c: "#5d7290", o: "#b4c4dc", t: "#f0f4fa" };
  let cache = null;
  function colours() {
    if (cache) return cache;
    const out = {};
    let cs = null;
    try {
      cs = typeof getComputedStyle === "function" && typeof document !== "undefined"
        && document.documentElement ? getComputedStyle(document.documentElement) : null;
    } catch (e) { cs = null; }
    for (const k of KINDS) {
      const v = cs ? String(cs.getPropertyValue("--tok-" + k) || "").trim() : "";
      out[k] = v || FALLBACK[k];
    }
    /* Only cached once the stylesheet has actually answered, so a call made
     * before the CSS has loaded does not freeze the fallbacks in place. */
    if (cs && String(cs.getPropertyValue("--tok-k") || "").trim()) cache = out;
    return out;
  }

  const API = {
    lex, html, inline, rich, plain, has,
    get colours() { return colours(); },
    kinds: KINDS.slice(),
    keywords: KEY.slice(), builtins: BUILT.slice()
  };

  if (typeof window !== "undefined") window.R360Tok = API;

  /* The print builders run in node, where there is no stylesheet to ask, so they
   * read the same file the browser reads. Two palettes live in it - the screen
   * one on :root and the paper one inside @media print - and a worksheet asks
   * for "print". Nothing here hard-codes a colour: if css/pytok.css cannot be
   * read, the builder is told rather than quietly printing the wrong ink. */
  if (typeof module !== "undefined" && module.exports) {
    const fs = require("fs"), path = require("path");
    API.palette = function (mode) {
      const file = path.join(__dirname, "..", "css", "pytok.css");
      const css = fs.readFileSync(file, "utf8");
      const block = mode === "print"
        ? (css.split("@media print")[1] || "")
        : css.split("@media print")[0];
      const out = {};
      for (const k of KINDS) {
        const m = block.match(new RegExp("--tok-" + k + "\\s*:\\s*([^;]+);"));
        if (!m) throw new Error("css/pytok.css has no --tok-" + k + " for " + mode);
        out[k] = m[1].trim();
      }
      return out;
    };
    /* docx and pptxgenjs both want a colour with no leading hash. */
    API.flat = mode => {
      const p = API.palette(mode), out = {};
      for (const k of Object.keys(p)) out[k] = p[k].replace(/^#/, "").toUpperCase();
      return out;
    };
    module.exports = API;
    if (require.main === module) {
      /* node js/pytok.js --palette print  - so a python tool can ask too. */
      const want = process.argv.includes("--print") || process.argv[3] === "print" ? "print" : "screen";
      if (process.argv.includes("--palette")) {
        process.stdout.write(JSON.stringify(API.palette(want)) + "\n");
      } else if (process.argv.includes("--lex")) {
        let src = "";
        process.stdin.on("data", d => { src += d; });
        process.stdin.on("end", () => process.stdout.write(JSON.stringify(lex(src)) + "\n"));
      }
    }
  }
})();
