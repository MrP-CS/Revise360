/* Revision 360: the marker.
 *
 * One marker, used by the page and by the headset, because a question that is
 * worth two marks on a laptop has to be worth two marks in a headset and earn
 * them for the same reasons. Nothing in here draws anything.
 *
 * Written answers are marked by MEANING, not by matching words. That claim is
 * easy to make and easy to get wrong, so this is what it actually means here:
 *
 *   * Each mark point carries `accept`: a list of ways of saying it. One way is
 *     a list of groups, and every group in it has to appear for that way to
 *     count. A group is alternatives separated by `|`, written as fragments
 *     ("volatil" catches volatile and volatility) so an author does not have to
 *     list inflections.
 *
 *   * A match inside a negated clause does not count. "RAM is not volatile"
 *     contains the word and earns nothing, because the clause it sits in is
 *     negated. That is clause-by-clause, so "RAM is volatile, unlike a hard
 *     disk, which does not lose its contents" still earns it.
 *
 *   * A mark point may carry `reject`: wordings that mean the opposite. "RAM is
 *     volatile because it keeps its contents when the power is removed" has the
 *     right term and the wrong reason, and loses the point on the reject rather
 *     than on the term.
 *
 *   * A mark point marked `developed` needs the ideas joined - because, so,
 *     therefore, which means - and not merely both present. That is what makes
 *     a three-mark explanation different from three facts in a row.
 *
 *   * An answer with no sentence in it is a word list. A word list cannot earn
 *     more than one mark on a question worth more, whatever words are in it,
 *     and the learner is told why.
 *
 *   * Ordinary spelling does not cost marks. Each word of the answer is snapped
 *     to a term the question itself uses when it is one typo away from it - and
 *     deliberately NOT snapped when it is one typo from two different terms,
 *     because then nobody can tell which was meant.
 *
 * What this does not do: judge a six-mark discussion. Those are authored
 * `extended` and go to guided self review, which is honest about who did the
 * marking. See docs/REVISION-QUIZ-QA.md.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.R360Mark = api;
})(this, function () {
  "use strict";

  // ---------------------------------------------------------------- text
  const CONTRACTION = [
    [/\bdoesn'?t\b/g, "does not"], [/\bdon'?t\b/g, "do not"], [/\bdidn'?t\b/g, "did not"],
    [/\bcan+o+t\b/g, "can not"], [/\bisn'?t\b/g, "is not"], [/\baren'?t\b/g, "are not"], [/\bwasn'?t\b/g, "was not"],
    [/\bweren'?t\b/g, "were not"], [/\bcan'?t\b/g, "cannot"], [/\bcannot\b/g, "can not"],
    [/\bcouldn'?t\b/g, "could not"], [/\bwon'?t\b/g, "will not"], [/\bwouldn'?t\b/g, "would not"],
    [/\bhasn'?t\b/g, "has not"], [/\bhaven'?t\b/g, "have not"], [/\bhadn'?t\b/g, "had not"],
    [/\bshouldn'?t\b/g, "should not"], [/\bn'?t\b/g, " not"]
  ];

  /* British English is what the course is written in, and a learner who writes
   * the American spelling has not made a mistake worth a mark. Both forms are
   * folded onto one so an author only ever writes one of them. */
  const SPELLING = [
    [/\borgani[sz]/g, "organis"], [/\banal[yi][sz]/g, "analys"], [/\bminimi[sz]/g, "minimis"],
    [/\bmaximi[sz]/g, "maximis"], [/\bauthori[sz]/g, "authoris"], [/\butili[sz]/g, "utilis"],
    [/\bcustomi[sz]/g, "customis"], [/\bsynchroni[sz]/g, "synchronis"],
    [/\bprioriti[sz]/g, "prioritis"], [/\bdigiti[sz]/g, "digitis"],
    [/\bbehaviou?r/g, "behaviour"], [/\bcolou?r/g, "colour"], [/\blicen[sc]e/g, "licence"],
    [/\bdefen[sc]e/g, "defence"], [/\bprogramme?s?\b/g, "program"]
  ];

  // Separators that end a clause. Negation does not reach past one of these.
  const CLAUSE = /(?:[.;:!?]+|,| but | however | whereas | although | though | unlike | while | and | or | then | so that | which | that )/;
  /* "fails" is deliberately not here. "If one cable fails" is a condition, not a
   * denial, and treating it as one lost the mark on an answer about what happens
   * when a cable breaks. A learner who means a denial writes "fails to", and the
   * "to" is not what makes it negative - "not" is. */
  const NEGATOR = new Set(["not", "never", "no", "none", "without", "nor", "neither",
                           "cannot", "unable"]);
  const NEG_REACH = 4;          // how many words forward a negator denies

  /* Words that carry sentence structure. A written answer with almost none of
   * them is a list of terms, not an explanation. */
  const FUNCTION_WORDS = new Set((
    "a an the is are was were be been being am it its this that these those they them their " +
    "of in on to for from with by as at into over under between through during after before " +
    "and or but so because therefore thus hence since if when while whereas although though " +
    "which who whom whose what how why where there here more less than then also too very " +
    "can could will would shall should may might must do does did done has have had having " +
    "not no nor never only both each any all some many much other another such same " +
    "you your we our i my he she him her his").split(" "));

  const LINK = /(because|so that|so |therefore|thus|hence|as a result|this means|which |meaning|means that|due to|owing to|leads? to|causes?|causing|results? in|resulting in|in order to|consequently|then |allows? |allowing|makes? it|making it|that is why|why |when |if |unless |since |as a consequence|ends up|the reason|makes? the|makes? it|makes? them)/;

  function norm(s) {
    let t = " " + String(s == null ? "" : s).toLowerCase() + " ";
    CONTRACTION.forEach(([re, to]) => { t = t.replace(re, to); });
    SPELLING.forEach(([re, to]) => { t = t.replace(re, to); });
    t = t.replace(/[‘’“”]/g, "'")
         .replace(/[^a-z0-9.,;:!?%/\-+*'\s]/g, " ")
         /* A hyphen inside a word closes the word up rather than splitting it.
          * "non-volatile" was becoming the two words "non" and "volatile", so a
          * rejection written to catch "volatile" fired on an answer that said
          * non-volatile - and every mark point about ROM was being lost by a
          * learner who had got it right. */
         .replace(/([a-z])-([a-z])/g, "$1$2")
         .replace(/\s+/g, " ");
    return t;
  }

  function words(t) { return t.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean); }

  function dist1(a, b) {          // is the edit distance between a and b at most 1?
    if (a === b) return true;
    const la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return false;
    let i = 0, j = 0, slips = 0;
    while (i < la && j < lb) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++slips > 1) return false;
      if (la === lb) { i++; j++; } else if (la > lb) i++; else j++;
    }
    if (i < la || j < lb) slips++;
    return slips <= 1;
  }

  /* A light stemmer, so an author writes one form of a word and the learner may
   * write another. It is deliberately crude and deliberately the same on both
   * sides: "volatile", "volatility" and the pattern "volatil" all reduce to
   * volatil, and nothing here has to know what a word means. Where two forms do
   * not reduce together - run and running - the author lists both. */
  const SUFFIX = [["ication", "ic"], ["ational", "at"], ["ations", "at"], ["ation", "at"],
                  ["ities", "it"], ["ity", ""], ["iness", ""], ["ness", ""],
                  ["ingly", ""], ["ing", ""], ["ied", "y"], ["ies", "y"], ["edly", ""],
                  ["ed", ""], ["ly", ""], ["es", ""], ["s", ""], ["e", ""]];
  function stem(w) {
    if (w.length <= 4) return w;
    for (const [suf, rep] of SUFFIX)
      if (w.length - suf.length >= 4 && w.slice(-suf.length) === suf)
        return w.slice(0, w.length - suf.length) + rep;
    return w;
  }

  /* Does one word of an answer satisfy one token of a pattern?
   *
   * Prefix first, on the stem, which covers inflection. Then one edit on the
   * stem, which is the spelling tolerance section 19 asks for - but only on a
   * word long enough for a typo to be obvious, and only when the first letter
   * agrees, because serial and aerial are one edit apart and are not the same
   * answer. */
  function accepts(token, word) {
    if (word === token) return true;
    /* A short token is matched whole, not as a prefix. "acc" standing for the
     * accumulator must not be found inside "access", and "bit" must not be
     * found inside "bitmap" - while "ram" and "rams" are the same word. */
    if (token.length < 4) return word === token + "s" || word === token + "es";
    if (word.indexOf(token) === 0) return true;
    const ts = stem(token), ws = stem(word);
    if (ws.indexOf(ts) === 0) return true;
    /* Both stems long enough. One edit apart is a typo between two long words
     * and a different word between short ones: "sort" and "short" are one edit
     * apart, and an answer about sorting was earning a mark about hexadecimal
     * being shorter. */
    if (ts.length >= 5 && ws.length >= 5 && ts[0] === ws[0] && dist1(ts, ws)) return true;
    /* One typo in a long word, compared on the words themselves rather than on
     * their stems. "waiting" and "waiing" do not stem together, because the
     * stemmer will not take "ing" off something that short - and a learner who
     * dropped a letter out of the middle of a word has not got it wrong. Six
     * letters, and the same first letter: "code" and "core" are one edit apart
     * and are not the same answer, and neither are "serial" and "aerial". */
    return token.length >= 6 && word.length >= 5 && token[0] === word[0]
           && dist1(token, word);
  }

  /* Where does this phrase start in these words, or -1? Up to two words may sit
   * between the phrase's own words, so "loses its contents" matches a pattern
   * written "lose contents" without the author listing every filler. */
  function findPhrase(ws, tokens) {
    for (let i = 0; i + tokens.length - 1 < ws.length; i++) {
      if (!accepts(tokens[0], ws[i])) continue;
      let at = i, ok = true;
      for (let j = 1; j < tokens.length; j++) {
        let found = -1;
        for (let k = at + 1; k <= Math.min(at + 3, ws.length - 1); k++)
          if (accepts(tokens[j], ws[k])) { found = k; break; }
        if (found < 0) { ok = false; break; }
        at = found;
      }
      if (ok) return [i, at];
    }
    return null;
  }

  /* The answer as one list of words, with the clause each word belongs to.
   *
   * It used to be a list of clauses, and a pattern was looked for inside one of
   * them. That made a pattern containing "and" or "or" impossible to match -
   * "on and off" is a perfectly ordinary way to say what one bit holds, and no
   * clause ever contained it, so the mark point could not be earned at all.
   *
   * A phrase may now run across a clause boundary. A negation may not: it still
   * reaches forward a few words and stops dead at the end of its own clause,
   * which is the whole reason the boundaries are tracked rather than dropped. */
  function prepare(t) {
    const ws = [], clause = [];
    t.split(CLAUSE).forEach((part, ci) => words(part).forEach(w => {
      ws.push(w); clause.push(ci);
    }));
    return { ws: ws, clause: clause };
  }

  /* A pattern goes through exactly the same tidying as the answer. It has to:
   * `norm` writes "cannot" as "can not", so a pattern that said "cannot repair"
   * was looking for a word the answer could never contain, and every mark point
   * written that way silently matched nothing. */
  /* A pattern is tokenised exactly as the answer is, clause separators and all.
   * The answer's "and" is dropped when it is split into clauses, so a pattern
   * that kept its own "and" was looking for a word the answer no longer had:
   * "on and off" matched nothing at all. */
  function phrasesOf(group) {
    return String(group).split("|").map(p => prepare(norm(p)).ws).filter(a => a.length);
  }

  /* Is this group in the answer, meant rather than denied? Returns the clause it
   * was found in, or -1. */
  function findGroup(prep, group) {
    for (const tokens of phrasesOf(group)) {
      const own = tokens.some(t => NEGATOR.has(t));
      const span = findPhrase(prep.ws, tokens);
      if (!span) continue;
      if (!own && negatedAt(prep, span)) continue;
      return prep.clause[span[0]];
    }
    return -1;
  }

  /* A negator reaches forward over the next few words and no further, and does
   * not reach past the end of its own clause. "no moving parts" denies the
   * moving parts; "without a CPU the instructions would simply sit in RAM" does
   * not deny that they sit there, and "RAM is volatile, unlike a disk, which
   * does not lose its contents" does not deny the volatility.
   *
   * The span itself counts too, not only what comes before it: a phrase may
   * match with a word or two in between, and "respond in not real time" was
   * matching the pattern "respond in time" with the denial sitting in the gap. */
  function negatedAt(prep, span) {
    const here = prep.clause[span[0]];
    for (let i = span[0] - 1; i >= Math.max(0, span[0] - NEG_REACH); i--) {
      if (prep.clause[i] !== here) break;
      if (NEGATOR.has(prep.ws[i])) return true;
    }
    for (let i = span[0]; i <= span[1]; i++) if (NEGATOR.has(prep.ws[i])) return true;
    return false;
  }

  /* A way is satisfied when every one of its groups is in the answer, meant
   * rather than denied. Across clauses, because an explanation spreads over
   * sentences. */
  function wayMet(prep, groups) {
    return groups.every(g => findGroup(prep, g) >= 0);
  }

  /* A rejection is one specific wrong statement, so all of its groups have to
   * land in the SAME clause: "keeps its contents when the power is removed" is
   * wrong as a sentence, while "keeps" in one clause and "power" in another is
   * just two things a correct answer might also say. */
  function rejectMet(prep, ways) {
    return (Array.isArray(ways[0]) ? ways : [ways]).some(function (way) {
      const where = way.map(g => findGroup(prep, g));
      return where.every(c => c >= 0) && new Set(where).size === 1;
    });
  }

  /* Is this a list of key words rather than an answer?
   *
   * Two tests, because the first one on its own was not enough: "written cannot
   * be split idle" has just enough ordinary words in it to look like prose by
   * ratio, and it earned two marks on a three-mark explanation. The second test
   * asks a sharper question - is nearly every word in this answer a word the
   * mark scheme was looking for, with nothing joining them? That is what a
   * learner writing down remembered terms produces, and what a learner
   * explaining something does not.
   *
   * Neither test can touch a one-mark answer, because the cap only applies above
   * one mark: "Central processing unit" is every word the scheme wants and is
   * exactly the right answer. */
  function isDump(t, points) {
    const ws = words(t);
    if (ws.length < 3) return false;
    const fn = ws.filter(w => FUNCTION_WORDS.has(w)).length;
    if (fn / ws.length < 0.12) return true;
    if (LINK.test(t)) return false;
    const wanted = [];
    (points || []).forEach(p => (p.accept || []).forEach(way => way.forEach(g =>
      g.split("|").forEach(a => { const ts = words(a.toLowerCase()); if (ts.length) wanted.push(ts); }))));
    const scheme = ws.filter(w => wanted.some(ts => ts.some(t2 => accepts(t2, w)))).length;
    /* How much of this answer is the learner's own? Counting ordinary words
     * instead was no good, because a mark scheme's own phrases contain ordinary
     * words - "cannot be split" is four of them - so a list of remembered
     * phrases read as prose and earned two of three marks. What a word list has
     * almost none of is anything the scheme was NOT looking for. */
    return (ws.length - scheme) / ws.length < 0.2;
  }

  // ---------------------------------------------------------------- written
  /* Mark a written answer against its authored mark points.
   *
   * Returns { got, max, earned[], missed[], dump, blank, source:"AUTO-MARKED" }.
   * `earned` and `missed` are the concepts, in the question's own order, so the
   * feedback the learner sees is the mark scheme and not a guess at one. */
  function markWritten(q, answer) {
    const points = q.markPoints || [];
    const max = q.marks || points.length;
    const blank = !String(answer || "").trim();
    const out = { got: 0, max, earned: [], missed: [], dump: false, blank,
                  source: "AUTO-MARKED", detail: [] };
    if (blank) {
      out.missed = points.map(p => p.concept);
      return out;
    }
    const t = norm(answer);
    const prep = prepare(t);
    const linked = LINK.test(t);
    out.dump = isDump(t, points);

    points.forEach(p => {
      const ways = p.accept || [];
      let met = ways.some(way => wayMet(prep, way));
      let why = met ? "met" : "not stated";
      if (met && p.reject && rejectMet(prep, p.reject)) { met = false; why = "contradicted"; }
      if (met && p.developed && !linked) { met = false; why = "not developed"; }
      out.detail.push({ concept: p.concept, met, why, worth: p.worth || 1 });
      if (met) { out.earned.push(p.concept); out.got += p.worth || 1; }
      else out.missed.push(p.concept);
    });

    /* A list of key words is not an explanation, however many of the right
     * words are in it. It can still show one thing was recalled, so it keeps
     * one mark on a question worth more than one. */
    if (out.dump && max > 1 && out.got > 1) {
      out.got = 1;
      out.capped = "A list of key words can earn one mark for recall. Write it in "
                 + "sentences to show how the ideas connect.";
    }
    if (out.got > max) out.got = max;
    return out;
  }

  // ---------------------------------------------------------------- numbers
  function numbersIn(s) {
    return String(s == null ? "" : s).replace(/,(?=\d{3}\b)/g, "")
      .match(/-?\d+(?:\.\d+)?/g) || [];
  }

  /* A numeric answer: the value has to be right, the units are read if the
   * question asked for them, and the working earns its own mark where the
   * question offers one. */
  function markNumeric(q, answer) {
    const want = q.answer, max = q.marks || 1;
    const out = { got: 0, max, earned: [], missed: [], source: "AUTO-MARKED",
                  blank: !String(answer || "").trim() };
    const got = numbersIn(answer);
    const right = got.some(n => close(parseFloat(n), want, q.tolerance));
    if (right) { out.got += q.methodMark && max > 1 ? max : 1; out.earned.push(q.answerLabel || "the correct value"); }
    else out.missed.push(q.answerLabel || ("the correct value (" + want + (q.unit ? " " + q.unit : "") + ")"));
    /* Method marks: the question names the intermediate values a learner has to
     * reach. Showing one earns its mark even when the final answer is wrong,
     * which is how a calculation is marked on paper. */
    if (!right && q.methodMark) {
      const steps = Array.isArray(q.methodMark) ? q.methodMark : [q.methodMark];
      steps.forEach(st => {
        if (got.some(n => close(parseFloat(n), st.value, st.tolerance))) {
          out.got += st.worth || 1; out.earned.push(st.label);
        } else out.missed.push(st.label);
      });
    }
    if (out.got > max) out.got = max;
    return out;
  }

  function close(a, b, tol) {
    if (!isFinite(a) || !isFinite(b)) return false;
    const t = tol == null ? 0 : tol;
    return Math.abs(a - b) <= t + 1e-9;
  }

  /* An exact answer that is a string rather than a number: a binary pattern, a
   * hex value, a line of output. Whitespace and case do not matter; a 0x or 0b
   * prefix and the "two's complement" style spacing in 1010 0110 do not either. */
  function tidyExact(s, kind) {
    let t = String(s == null ? "" : s).trim().toLowerCase();
    if (kind === "binary" || kind === "hex") t = t.replace(/^0[bx]/, "").replace(/\s+/g, "");
    else t = t.replace(/\s+/g, " ");
    return t;
  }

  function markExact(q, answer) {
    const max = q.marks || 1;
    const accepted = [q.answer].concat(q.alsoAccept || []);
    const mine = tidyExact(answer, q.exact);
    const ok = accepted.some(a => tidyExact(a, q.exact) === mine) && mine !== "";
    return { got: ok ? max : 0, max, earned: ok ? [q.answerLabel || "correct"] : [],
             missed: ok ? [] : [(q.answerLabel || "the correct answer") + " (" + q.answer + ")"],
             source: "AUTO-MARKED", blank: mine === "" };
  }

  // ---------------------------------------------------------------- selected
  function markChoice(q, chosen) {
    const max = q.marks || 1;
    const ok = chosen === (q.options || [])[q.correct];
    return { got: ok ? max : 0, max, earned: ok ? ["the correct option"] : [],
             missed: ok ? [] : ["the correct option is: " + (q.options || [])[q.correct]],
             source: "AUTO-MARKED", blank: chosen == null };
  }

  /* Multi-select. One mark a correct selection, one lost for each wrong one,
   * never below zero - which is the convention that stops "tick everything"
   * scoring full marks. */
  function markMulti(q, chosen) {
    const right = q.correct || [], picks = chosen || [];
    const max = q.marks || right.length;
    const hit = picks.filter(p => right.indexOf(p) >= 0);
    const wrong = picks.filter(p => right.indexOf(p) < 0);
    const got = Math.max(0, Math.min(max, hit.length - wrong.length));
    return { got, max, earned: hit, missed: right.filter(r => picks.indexOf(r) < 0),
             over: wrong, source: "AUTO-MARKED", blank: !picks.length };
  }

  function markPairs(q, got) {           // matching: one mark a correct pair
    const pairs = q.pairs || [], mine = got || {};
    const max = q.marks || pairs.length;
    const earned = [], missed = [];
    pairs.forEach((p, i) => (mine[i] === p[1] ? earned : missed).push(p[0] + " → " + p[1]));
    return { got: Math.min(max, earned.length), max, earned, missed,
             source: "AUTO-MARKED", blank: !Object.keys(mine).length };
  }

  function markOrder(q, seq) {           // one mark a step in the right place
    const steps = q.steps || [], mine = seq || [];
    const max = q.marks || steps.length;
    const earned = [], missed = [];
    steps.forEach((s, i) => (mine[i] === s ? earned : missed).push((i + 1) + ". " + s));
    return { got: Math.min(max, earned.length), max, earned, missed,
             source: "AUTO-MARKED", blank: !mine.length };
  }

  function markSort(q, pick) {           // classification: one mark an item
    const items = q.items || [], mine = pick || {};
    const max = q.marks || items.length;
    const earned = [], missed = [];
    items.forEach((it, i) => (mine[i] === it[1] ? earned : missed).push(it[0] + " → " + it[1]));
    return { got: Math.min(max, earned.length), max, earned, missed,
             source: "AUTO-MARKED", blank: !Object.keys(mine).length };
  }

  /* A grid: a truth table or a trace table. One mark a cell the question left
   * blank, which is the rule js/store.js already uses for the course's own
   * trace tables, so the two cannot disagree about what a grid is worth. */
  function markGrid(q, cells) {
    const want = q.answer || [], given = cells || {};
    const blanks = [];
    want.forEach((row, r) => row.forEach((v, c) => {
      if (!q.rows || q.rows[r][c] === "") blanks.push([r, c, v]);
    }));
    const max = q.marks || blanks.length;
    const earned = [], missed = [];
    blanks.forEach(([r, c, v]) => {
      const mine = tidyExact(given[r + "," + c], "cell");
      (mine === tidyExact(v, "cell") ? earned : missed)
        .push("row " + (r + 1) + (q.cols ? ", " + q.cols[c] : "") + ": " + v);
    });
    return { got: Math.min(max, earned.length), max, earned, missed,
             source: "AUTO-MARKED", blank: !Object.keys(given).length };
  }

  /* A six-mark discussion, or anything else nobody should pretend to mark
   * automatically. The learner is shown the mark points and marks it against
   * them, and the mark says who gave it. */
  function markSelfReview(q, claimed) {
    const max = q.marks || 6;
    const ticked = claimed || [];
    const points = (q.markPoints || []).map(p => p.concept);
    return { got: Math.max(0, Math.min(max, ticked.length)), max,
             earned: ticked, missed: points.filter(p => ticked.indexOf(p) < 0),
             source: "SELF-REVIEWED", selfReview: true, blank: !ticked.length };
  }

  const WRITTEN = ["short", "written"];
  const BY_TYPE = {
    mcq: markChoice, tf: markChoice, multi: markMulti, match: markPairs,
    order: markOrder, sort: markSort, truth: markGrid, trace: markGrid,
    num: markNumeric, convert: markExact, binadd: markExact, binshift: markExact,
    codeout: markExact, short: markWritten, written: markWritten,
    extended: markSelfReview
  };

  function mark(q, response) {
    const f = BY_TYPE[q.type];
    if (!f) throw new Error("no marker for question type " + q.type);
    const res = f(q, response);
    res.type = q.type;
    res.full = res.got >= res.max;
    res.partial = res.got > 0 && res.got < res.max;
    /* Improve my answer is offered where a second go can earn something: a
     * written answer that fell short. Not on a question whose answer was shown
     * the moment it was marked - there is nothing left to work out. */
    res.canImprove = WRITTEN.indexOf(q.type) >= 0 && res.got < res.max && !res.blank;
    return res;
  }

  return { mark, markWritten, markNumeric, markExact, markChoice, markMulti,
           markPairs, markOrder, markSort, markGrid, markSelfReview,
           norm, stem, accepts, prepare, findGroup, isDump, numbersIn, dist1,
           WRITTEN, TYPES: Object.keys(BY_TYPE) };
});
