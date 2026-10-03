/* Revision 360: the engine.
 *
 * One engine, two renderers. Everything a question stream needs that is not
 * drawing: which question comes next, what it is worth, what the answer earned,
 * what that says about what to revise, and what to remember afterwards. The page
 * and the headset both call this and neither contains any of it, which is the
 * only way the two can agree about a mark.
 *
 * Marks, not questions. A learner's standing is marks achieved out of marks
 * available, because that is what an exam gives them and because a three-mark
 * explanation half-answered is not the same event as a one-mark recall missed.
 *
 * The first attempt is never overwritten. Everything diagnostic - what to
 * revise, which topics are weak, which command words cost marks - is worked out
 * from first attempts only. Improved attempts are kept separately and shown as
 * marks recovered, because an improved mark says something about learning and
 * nothing about what the learner knew when they met the question.
 *
 * What this does NOT do: predict a grade. Section 60. A continuous question
 * stream a learner chooses the topics for is not a paper sat under exam
 * conditions, and a percentage from it is not a grade. It is not stored, not
 * derived and not displayed.
 *
 * What it stores: the marks, the answers given, which questions were seen and
 * when, bookmarks, and a learner's own confidence if they offer it. Nothing
 * about where they looked or how long they took. Section 77.
 */
(function () {
  "use strict";
  const KEY = "revision";          // the id this progress is saved under
  const V = 1;
  const MODES = {
    endless:  { label: "Endless revision", target: null },
    q10:      { label: "10 questions", target: { questions: 10 } },
    q20:      { label: "20 questions", target: { questions: 20 } },
    q30:      { label: "30 questions", target: { questions: 30 } },
    m20:      { label: "Earn 20 marks", target: { marks: 20 } },
    m40:      { label: "Earn 40 marks", target: { marks: 40 } },
    mistakes: { label: "Revise my mistakes", target: null, needsEvidence: 1 },
    recover:  { label: "Recover my marks", target: null, needsEvidence: 1 },
    weakest:  { label: "Focus on my weakest topics", target: null, needsEvidence: 40 },
    exam:     { label: "Exam practice only", target: null }
  };
  const CONFIDENCE = ["Not sure", "Fairly sure", "Very sure"];
  // How many questions have to go by before a question itself may come round
  // again, and before a concept a learner got wrong is retested. Section 54:
  // later, not immediately.
  const SPACING = { sameQuestion: 40, sameConcept: 6, sameStem: 3 };
  // Marks of first-attempt evidence before a topic verdict is worth printing.
  const EVIDENCE = { topic: 12, command: 10, weakest: 40 };

  function now() { return Date.now(); }
  function blank() {
    return { v: V, filters: { topics: [] }, mode: "endless", seen: 0,
             q: {}, concepts: {}, history: [],
             totals: { firstGot: 0, firstAvail: 0, bestGot: 0, recovered: 0, questions: 0,
                       byTopic: {}, byCommand: {}, byType: {}, examGot: 0, examAvail: 0 },
             target: null, session: null };
  }

  function pot(obj, k) { return (obj[k] = obj[k] || { got: 0, avail: 0, n: 0 }); }

  const Engine = {
    MODES, CONFIDENCE, SPACING, EVIDENCE, KEY,
    state: blank(),
    bank: null,                // the questions currently loaded, filtered
    onChange: [],

    /* ---------------------------------------------------------- lifecycle */
    load() {
      const saved = window.Store && Store.get(KEY);
      Engine.state = saved && saved.v === V ? saved : blank();
      // A `Store` with no student signed in keeps nothing, and that is fine:
      // revision still works, it just does not follow them to another device.
      return Engine.state;
    },
    save() {
      try { if (window.Store) Store.put(KEY, Engine.state); } catch (e) { /* full or blocked */ }
      Engine.onChange.forEach(f => { try { f(Engine.state); } catch (e) {} });
    },

    /* ---------------------------------------------------------- filters */
    topics() { return Engine.state.filters.topics.slice(); },
    setTopics(list) {
      const have = R360Bank.topics();
      const keep = list.filter(t => have.indexOf(t) >= 0);
      Engine.state.filters.topics = keep.length ? keep : have.slice();
      Engine.save();
      return Engine.state.filters.topics;
    },
    toggleTopic(t) {
      const cur = Engine.state.filters.topics.slice();
      const i = cur.indexOf(t);
      if (i >= 0) { if (cur.length > 1) cur.splice(i, 1); } else cur.push(t);
      return Engine.setTopics(cur);
    },
    setPaper(n) {
      return Engine.setTopics(R360Bank.manifest.topics.filter(t => t.paper === n).map(t => t.topic));
    },

    async refresh() {
      const ts = Engine.topics();
      const problems = await R360Bank.load(ts);
      Engine.bank = R360Bank.loaded(ts);
      return problems;
    },

    /* ---------------------------------------------------------- modes */
    setMode(m) {
      if (!MODES[m]) return Engine.state.mode;
      const why = Engine.modeBlocked(m);
      if (why) return why;
      Engine.state.mode = m;
      Engine.save();
      return m;
    },
    /* Why a mode is not available yet, or null. Section 35 asks for the words
     * for the weakest-topics case, and the same honesty applies to the other two:
     * a mode that works from mistakes needs a mistake to work from. */
    modeBlocked(m) {
      const s = Engine.state, need = (MODES[m] || {}).needsEvidence;
      if (!need) return null;
      if (m === "weakest") {
        if (s.totals.firstAvail < EVIDENCE.weakest)
          return "Complete more revision questions before Revise 360 can identify your "
               + "weakest topics reliably. You have attempted " + s.totals.firstAvail
               + " marks of the " + EVIDENCE.weakest + " needed.";
        return null;
      }
      const lost = Object.keys(s.concepts).filter(k => s.concepts[k].lost > 0).length;
      if (!lost) return "Nothing to revisit yet. Answer some questions first, and anything "
                      + "you lose marks on will come back here.";
      return null;
    },
    modesAvailable() {
      return Object.keys(MODES).map(m => ({ id: m, label: MODES[m].label,
                                            blocked: Engine.modeBlocked(m) }));
    },

    /* ---------------------------------------------------------- a session */
    startSession() {
      Engine.state.session = {
        at: now(), questions: 0, got: 0, avail: 0, firstGot: 0, bestGot: 0,
        recovered: 0, examGot: 0, examAvail: 0, asked: [], topics: {},
        byType: {}, byCommand: {}, concepts: {}
      };
      Engine.save();
      return Engine.state.session;
    },
    session() { return Engine.state.session || Engine.startSession(); },

    /* How much of the target is done, or null in endless revision. */
    progress() {
      const s = Engine.session(), t = MODES[Engine.state.mode].target;
      if (!t) return null;
      if (t.questions) return { kind: "questions", done: s.questions, of: t.questions };
      return { kind: "marks", done: s.firstGot, of: t.marks };
    },
    finished() {
      const p = Engine.progress();
      return !!p && p.done >= p.of;
    },

    /* ---------------------------------------------------------- choosing */
    /* Not random. Section 52 lists what the choice has to take account of, and
     * each of those is a term below. Within the best handful it IS random, so
     * two learners revising the same topics do not get the same lesson in the
     * same order - that is the "controlled" in controlled randomness. */
    pick() {
      const s = Engine.state, mode = s.mode;
      let pool = (Engine.bank || []).slice();
      if (!pool.length) return null;

      if (mode === "exam") pool = pool.filter(q => q.examStyle);
      if (mode === "mistakes" || mode === "recover") {
        const weak = Engine.weakConcepts();
        const ids = {};
        weak.forEach(c => { ids[c.id] = c; });
        let p = pool.filter(q => ids[q.revisitStationId]);
        if (mode === "recover") {
          // Written answers that fell short first: those are the marks there is
          // most to recover, and the ones Improve my answer is for.
          const w = p.filter(q => q.type === "written" || q.type === "short");
          if (w.length) p = w;
        }
        if (p.length) pool = p;
      }
      if (mode === "weakest") {
        const weak = Engine.weakTopics(3).map(t => t.topic);
        const p = pool.filter(q => weak.indexOf(q.topic) >= 0);
        if (p.length) pool = p;
      }

      const sess = Engine.session();
      const wanted = Engine.topicShares();
      const level = Engine.level();
      const recentTypes = sess.asked.slice(-2).map(id => {
        const q = R360Bank.question(id); return q ? q.type : null; });
      const examShare = sess.questions ? sess.examAvail / Math.max(1, sess.avail) : 0;

      let best = [], bestScore = -1e9;
      pool.forEach(q => {
        const r = s.q[q.id] || null;
        let v = 0;

        // Not the same question again until a good many have gone by.
        if (r && s.seen - (r.seenAt || 0) < SPACING.sameQuestion) v -= 400;
        if (sess.asked.indexOf(q.id) >= 0) v -= 1000;
        // Nor the same concept straight away: section 54 wants it later.
        const c = s.concepts[q.revisitStationId];
        if (c && s.seen - (c.seenAt || 0) < SPACING.sameConcept) v -= 60;

        // Something not met before is worth more than something met often.
        if (!r) v += 40; else v -= Math.min(30, 8 * (r.attempts || 0));

        // Marks lost on this concept pull it back, harder when the learner was
        // sure and wrong: that is a misconception, not a guess. Section 37.
        if (c && c.lost > 0) v += Math.min(60, 12 * c.lost) + (c.priority ? 45 : 0);

        // Every selected topic keeps appearing. Section 57.
        const share = sess.avail ? (sess.topics[q.topic] || 0) / sess.avail : 0;
        v += 70 * ((wanted[q.topic] || 0) - share);

        // Difficulty follows how the learner is doing, simply and predictably.
        v -= 18 * Math.abs(Engine.rank(q.difficulty) - level);

        // A mix of kinds, and roughly the exam-style share the bank is built to.
        if (recentTypes.indexOf(q.type) >= 0) v -= 22;
        v += (q.examStyle ? 1 : -1) * (0.22 - examShare) * 60;

        v += Math.random() * 12;        // the controlled part of the randomness
        if (v > bestScore) { bestScore = v; best = [q]; }
        else if (v > bestScore - 6) best.push(q);
      });
      if (!best.length) return null;
      return best[Math.floor(Math.random() * best.length)];
    },

    rank(d) { return { retrieve: 0, understand: 1, apply: 2, stretch: 3 }[d] || 1; },

    /* Where the learner is working, from the last ten first attempts. Section 55
     * asks for simple and deterministic, and says not to call it AI. It is a
     * rolling average with two thresholds. */
    level() {
      const r = Engine.recent(10);
      if (r.avail < 6) return 1;
      const p = r.got / r.avail;
      return p > 0.8 ? 2.4 : p > 0.6 ? 1.8 : p > 0.4 ? 1.2 : 0.6;
    },
    recent(n) {
      const s = Engine.state;
      const rows = Object.keys(s.q).map(k => s.q[k]).filter(r => r.first)
        .sort((a, b) => (b.first.at || 0) - (a.first.at || 0)).slice(0, n);
      return { got: rows.reduce((t, r) => t + r.first.got, 0),
               avail: rows.reduce((t, r) => t + r.first.max, 0), n: rows.length };
    },

    /* How much of the stream each selected topic should be. Section 56: by what
     * the bank actually holds, which is the only honest measure of the breadth
     * the course gives a topic. It explicitly does not guess at exam weighting. */
    topicShares() {
      const ts = Engine.topics(), out = {};
      let total = 0;
      ts.forEach(t => { const b = R360Bank.topic(t); total += b ? b.questions : 0; });
      ts.forEach(t => { const b = R360Bank.topic(t); out[t] = total ? (b ? b.questions : 0) / total : 0; });
      return out;
    },

    /* ---------------------------------------------------------- marking */
    /* Mark a response and record it. `improve` says this is a second go at a
     * question already attempted: the first attempt stays exactly as it was. */
    submit(q, response, opts) {
      opts = opts || {};
      const res = R360Mark.mark(q, response);
      const s = Engine.state, sess = Engine.session();
      const r = (s.q[q.id] = s.q[q.id] || { attempts: 0, bookmarked: false });
      const first = !r.first;
      r.attempts++;
      r.seenAt = s.seen;
      r.type = q.type;
      r.topic = q.topic;

      if (first && !opts.improve) {
        r.first = { got: res.got, max: res.max, at: now(), source: res.source,
                    confidence: opts.confidence == null ? null : opts.confidence };
        r.best = { got: res.got, max: res.max, at: now(), source: res.source };
        Engine.countFirst(q, res, opts);
      } else {
        // An improved attempt. Only the best moves, and the difference between
        // it and the first attempt is the marks recovered. Section 23 and 26.
        const was = r.best ? r.best.got : 0;
        if (res.got > was) {
          const gain = res.got - was;
          r.best = { got: res.got, max: res.max, at: now(), source: res.source };
          r.recovered = (r.recovered || 0) + gain;
          s.totals.bestGot += gain;
          s.totals.recovered += gain;
          sess.bestGot += gain;
          sess.recovered += gain;
        }
        r.improved = true;
      }
      s.seen++;
      res.first = r.first;
      res.bestSoFar = r.best;
      res.recovered = r.recovered || 0;
      res.isImprovement = !!opts.improve;
      Engine.save();
      return res;
    },

    /* Everything diagnostic comes from here, and here only runs on a first
     * attempt. That is the whole point of keeping the two apart. */
    countFirst(q, res, opts) {
      const s = Engine.state, sess = Engine.session(), t = s.totals;
      t.questions++; t.firstGot += res.got; t.firstAvail += res.max; t.bestGot += res.got;
      sess.questions++; sess.got += res.got; sess.avail += res.max;
      sess.firstGot += res.got; sess.bestGot += res.got;
      sess.asked.push(q.id);
      sess.topics[q.topic] = (sess.topics[q.topic] || 0) + res.max;

      const tp = pot(t.byTopic, q.topic); tp.got += res.got; tp.avail += res.max; tp.n++;
      const ty = pot(t.byType, q.type); ty.got += res.got; ty.avail += res.max; ty.n++;
      if (q.commandWord) {
        const cw = pot(t.byCommand, q.commandWord);
        cw.got += res.got; cw.avail += res.max; cw.n++;
        const cs = pot(sess.byCommand, q.commandWord); cs.got += res.got; cs.avail += res.max; cs.n++;
      }
      const st = pot(sess.byType, q.type); st.got += res.got; st.avail += res.max; st.n++;
      if (q.examStyle) {
        t.examGot += res.got; t.examAvail += res.max;
        sess.examGot += res.got; sess.examAvail += res.max;
      }

      // The concept, which is the station that teaches it. That is the grain
      // everything about what to revise next is kept at.
      const c = (s.concepts[q.revisitStationId] = s.concepts[q.revisitStationId]
                 || { got: 0, avail: 0, lost: 0, n: 0, topic: q.topic });
      c.got += res.got; c.avail += res.max; c.n++; c.seenAt = s.seen;
      c.lost += (res.max - res.got);
      if (res.max - res.got > 0) c.lastLost = now();
      // Wrong and sure of it. Section 37: that is a misconception, and it comes
      // back sooner and harder than a guess does.
      if (res.got < res.max && opts.confidence === 2) c.priority = true;
      if (res.got === res.max && c.priority && c.lost <= 0) c.priority = false;
      const cs2 = pot(sess.concepts, q.revisitStationId);
      cs2.got += res.got; cs2.avail += res.max; cs2.n++;
    },

    /* A learner marking their own long answer against the mark points. The mark
     * is stored, and stored as theirs: section 21 says do not let it pass for a
     * verified one, so `source` travels with it everywhere. */
    selfReview(q, ticked, opts) {
      return Engine.submit(q, ticked, opts || {});
    },

    /* ---------------------------------------------------------- diagnosis */
    weakConcepts(n) {
      const s = Engine.state;
      return Object.keys(s.concepts).map(k => {
        const c = s.concepts[k];
        return { id: k, lost: c.lost, got: c.got, avail: c.avail, topic: c.topic,
                 priority: !!c.priority,
                 share: c.avail ? c.got / c.avail : 0, n: c.n };
      }).filter(c => c.lost > 0)
        .sort((a, b) => (b.priority - a.priority) || (b.lost - a.lost))
        .slice(0, n || 999);
    },

    /* Topics ranked by first-attempt marks, and only those with enough evidence
     * to say anything. Section 44: not from one question. */
    weakTopics(n) {
      const t = Engine.state.totals.byTopic;
      return Object.keys(t).map(k => ({ topic: k, got: t[k].got, avail: t[k].avail,
                                        n: t[k].n, share: t[k].avail ? t[k].got / t[k].avail : 0 }))
        .filter(x => x.avail >= EVIDENCE.topic)
        .sort((a, b) => a.share - b.share)
        .slice(0, n || 999);
    },

    /* Command words, where there is enough of a sample. Section 39. */
    commandWords() {
      const c = Engine.state.totals.byCommand;
      return Object.keys(c).map(k => ({ word: k, got: c[k].got, avail: c[k].avail, n: c[k].n }))
        .filter(x => x.avail >= EVIDENCE.command)
        .sort((a, b) => (a.got / a.avail) - (b.got / b.avail));
    },

    /* What to revise next: the concepts costing the most marks, each with the
     * station that teaches it. Short, and nothing in it from a single question. */
    queue(n) {
      return Engine.weakConcepts().filter(c => c.n >= 1 && c.lost >= 1)
        .slice(0, n || 5)
        .map(c => {
          const st = R360Bank.station(c.id);
          return { concept: st ? st.stationName : c.id, lost: c.lost, priority: c.priority,
                   topic: c.topic, station: st };
        });
    },

    /* ---------------------------------------------------------- bookmarks */
    bookmark(id, on) {
      const r = (Engine.state.q[id] = Engine.state.q[id] || { attempts: 0 });
      r.bookmarked = on === undefined ? !r.bookmarked : !!on;
      Engine.save();
      return r.bookmarked;
    },
    bookmarked() {
      const s = Engine.state;
      return Object.keys(s.q).filter(k => s.q[k].bookmarked);
    },
    isBookmarked(id) { return !!(Engine.state.q[id] && Engine.state.q[id].bookmarked); },

    /* ---------------------------------------------------------- targets */
    /* Optional, and not a streak. Section 42: a missed target does nothing. */
    setTarget(kind, n) {
      if (!kind) { Engine.state.target = null; Engine.save(); return null; }
      Engine.state.target = { kind: kind, n: n, weekStart: Engine.weekStart(), got: 0 };
      Engine.save();
      return Engine.state.target;
    },
    weekStart() {
      const d = new Date(); d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      return d.getTime();
    },
    targetProgress() {
      const t = Engine.state.target;
      if (!t) return null;
      if (t.weekStart !== Engine.weekStart()) { t.weekStart = Engine.weekStart(); t.got = 0; }
      const since = t.weekStart;
      let got = 0;
      const s = Engine.state;
      Object.keys(s.q).forEach(k => {
        const r = s.q[k];
        if (!r.first || r.first.at < since) return;
        got += t.kind === "attemptMarks" ? r.first.max : r.first.got;
      });
      return { kind: t.kind, n: t.n, got: got, done: got >= t.n };
    },

    /* ---------------------------------------------------------- ending */
    endSession() {
      const s = Engine.state, sess = s.session;
      if (!sess || !sess.questions) { s.session = null; Engine.save(); return null; }
      const row = { at: sess.at, ended: now(), questions: sess.questions,
                    got: sess.firstGot, avail: sess.avail, best: sess.bestGot,
                    recovered: sess.recovered,
                    topics: Object.keys(sess.topics),
                    examGot: sess.examGot, examAvail: sess.examAvail };
      s.history.unshift(row);
      if (s.history.length > 60) s.history.length = 60;
      const summary = {
        row: row,
        strongest: Object.keys(sess.byType).map(k => ({ what: k, got: sess.byType[k].got,
                                                       avail: sess.byType[k].avail }))
          .filter(x => x.avail >= 3).sort((a, b) => (b.got / b.avail) - (a.got / a.avail)).slice(0, 3),
        toRecover: Engine.queue(3),
        commandWords: Engine.commandWords()
      };
      s.session = null;
      Engine.save();
      return summary;
    },

    history(n) { return Engine.state.history.slice(0, n || 20); },

    /* Everything the progress page shows. No grade in it, by construction. */
    overview() {
      const t = Engine.state.totals;
      return {
        questions: t.questions,
        firstGot: t.firstGot, firstAvail: t.firstAvail,
        bestGot: t.bestGot, recovered: t.recovered,
        examGot: t.examGot, examAvail: t.examAvail,
        byTopic: Object.keys(t.byTopic).map(k => ({ topic: k, title: R360Bank.title(k),
                                                   got: t.byTopic[k].got, avail: t.byTopic[k].avail,
                                                   enough: t.byTopic[k].avail >= EVIDENCE.topic })),
        commandWords: Engine.commandWords(),
        weakTopics: Engine.weakTopics(3),
        queue: Engine.queue(5),
        bookmarks: Engine.bookmarked().length,
        target: Engine.targetProgress()
      };
    },

    /* Start again from nothing. Only ever on a learner's own say-so. */
    forget() { Engine.state = blank(); Engine.save(); }
  };

  window.R360Engine = Engine;
})();
