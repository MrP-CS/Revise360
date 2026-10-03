/* Revision 360: getting the questions.
 *
 * The manifest first, which is small and says what exists and how much of it.
 * Then one file a lesson, fetched only for the topics a learner has actually
 * chosen, and kept once fetched. Nothing loads the whole bank: section 75.
 *
 * It also holds the station index, so a question that says `revisit:
 * "ms-l02-s2"` can be turned into "1.2 Lesson 2 - Swap space, station 2" and
 * into a link that opens that very station. That mapping was worked out at build
 * time by tools/revindex.py, from the course's own records; nothing here guesses
 * it from the words in a question.
 */
(function () {
  "use strict";
  const ROOT = "revision/";
  let manifest = null, stations = null;
  const files = {};          // path -> questions
  const byId = {};

  async function json(path) {
    const r = await fetch(ROOT + path, { cache: "no-cache" });
    if (!r.ok) throw new Error("could not load " + path + " (" + r.status + ")");
    return r.json();
  }

  /* Where to send a learner so the lesson opens looking at that station. The
   * experience player already understands `go=<scene id>:<station index>` - it
   * is what its own progress panel uses - so this is not a new way into the
   * course, it is the one that is already there.
   *
   * `back` says where to come back to, so Revisit experience is a round trip
   * rather than a way out of a revision session. */
  /* The same wording tools/revschema.py builds into every question, for the
   * cases that do not come from one - the revision queue names a station, not a
   * question. A final challenge is called that; it is not station "final". */
  function label(L, st) {
    return L.unit + " Lesson " + L.lesson + " \u2014 " + L.title + ", "
         + (st.n === "final" ? st.name : "station " + st.n + ": " + st.name);
  }

  function href(lessonId, st) {
    let u = "experience.html?id=" + encodeURIComponent(lessonId);
    if (st.scene && st.k !== null && st.k !== undefined)
      u += "&go=" + encodeURIComponent(st.scene + ":" + st.k);
    return u + "&back=revise.html";
  }

  const Bank = {
    get manifest() { return manifest; },
    get stations() { return stations; },

    async start() {
      if (manifest) return manifest;
      [manifest, stations] = await Promise.all([json("manifest.json"), json("stations.json")]);
      return manifest;
    },

    topics() { return (manifest ? manifest.topics : []).map(t => t.topic); },
    topic(id) { return (manifest ? manifest.topics : []).find(t => t.topic === id) || null; },
    papers() {
      const out = { 1: [], 2: [] };
      (manifest ? manifest.topics : []).forEach(t => out[t.paper].push(t.topic));
      return out;
    },

    /* Load the questions for these topics. Already-loaded files are not fetched
     * again, and a file that will not load does not stop the others: a learner
     * with three topics chosen and one file missing revises the other two, which
     * is section 76's point about a connection that comes and goes. */
    async load(topicIds) {
      const want = [];
      topicIds.forEach(id => {
        const t = Bank.topic(id);
        if (t) t.files.forEach(f => { if (!(f in files)) want.push(f); });
      });
      const problems = [];
      await Promise.all(want.map(async f => {
        try {
          const doc = await json(f);
          files[f] = doc.questions;
          doc.questions.forEach(q => { byId[q.id] = q; });
        } catch (e) { files[f] = []; problems.push(f); }
      }));
      return problems;
    },

    loaded(topicIds) {
      const out = [];
      topicIds.forEach(id => {
        const t = Bank.topic(id);
        if (t) t.files.forEach(f => { if (files[f]) out.push.apply(out, files[f]); });
      });
      return out;
    },

    question(id) { return byId[id] || null; },

    /* Where a question sends a learner, in words and as somewhere to go. */
    revisit(q) {
      if (!q || !q.revisitStationId || !stations) return null;
      const L = stations.lessons[q.revisitLessonId];
      if (!L) return null;
      const st = L.stations.filter(s => s.id === q.revisitStationId)[0];
      if (!st) return null;
      return {
        lessonId: L.id, unit: L.unit, lessonTitle: L.title, lessonNumber: L.lesson,
        stationId: st.id, stationName: st.name, n: st.n,
        scene: st.scene, k: st.k,
        label: q.revisitLabel || label(L, st),
        reason: q.revisitReason || "",
        href: href(L.id, st)
      };
    },

    /* The same, for a station id on its own: what the revision queue shows. */
    station(sid) {
      if (!stations) return null;
      for (const lid in stations.lessons) {
        const L = stations.lessons[lid];
        for (const st of L.stations)
          if (st.id === sid)
            return { lessonId: lid, unit: L.unit, lessonTitle: L.title,
                     stationName: st.name, n: st.n,
                     label: label(L, st),
                     href: href(lid, st) };
      }
      return null;
    },

    title(topicId) { const t = Bank.topic(topicId); return t ? t.title : topicId; }
  };

  window.R360Bank = Bank;
})();
