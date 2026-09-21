/**
 * Computer networks in VR: results store.
 * Paste this into a Google Apps Script project attached to a Google Sheet,
 * set a TEACHER_KEY script property, then deploy as a web app (see README).
 *
 * Sheet "Progress": one row per student per experience.
 */
const SHEET = 'Progress';
const HEAD = ['key', 'name', 'class', 'experience', 'score', 'total', 'stations done', 'stations', 'updated', 'data'];

function doGet() {
  return out({ ok: true, service: 'networks-vr' });
}

function doPost(e) {
  let req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return out({ ok: false, error: 'bad request' }); }
  try {
    if (req.action === 'save') return out(save(req));
    if (req.action === 'load') return out(load(req));
    if (req.action === 'all') return out(all(req));
    return out({ ok: false, error: 'unknown action' });
  } catch (err) {
    return out({ ok: false, error: String(err.message || err) });
  }
}

function sheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) { sh = ss.insertSheet(SHEET); sh.appendRow(HEAD); sh.setFrozenRows(1); }
  return sh;
}

function clean(s, max) { return String(s || '').replace(/[\u0000-\u001f]/g, '').slice(0, max); }

function save(req) {
  const key = clean(req.key, 80), expId = clean(req.expId, 60);
  if (!/^[0-9a-fx]+$/.test(key) || !expId) throw new Error('bad key');
  const data = JSON.stringify(req.data || {});
  if (data.length > 45000) throw new Error('too large');
  const d = req.data || {}, s = d.summary || {};
  const row = [key, clean(req.name, 60), clean(req.cls, 20), expId, s.score || 0, s.total || 0, s.done || 0, s.count || 0, new Date(), data];
  // Stop spreadsheet formulas being injected through names
  if (/^[=+\-@]/.test(row[1])) row[1] = "'" + row[1];
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const sh = sheet(), last = sh.getLastRow();
    if (last > 1) {
      const vals = sh.getRange(2, 1, last - 1, 4).getValues();
      for (let i = 0; i < vals.length; i++) {
        if (vals[i][0] === key && vals[i][3] === expId) { sh.getRange(i + 2, 1, 1, row.length).setValues([row]); return { ok: true }; }
      }
    }
    sh.appendRow(row);
    return { ok: true };
  } finally { lock.releaseLock(); }
}

function load(req) {
  const key = clean(req.key, 80), sh = sheet(), last = sh.getLastRow(), progress = {};
  if (last > 1) {
    sh.getRange(2, 1, last - 1, HEAD.length).getValues().forEach(r => {
      if (r[0] === key) { try { progress[r[3]] = JSON.parse(r[9]); } catch (e) {} }
    });
  }
  return { ok: true, progress: progress };
}

function all(req) {
  const tk = PropertiesService.getScriptProperties().getProperty('TEACHER_KEY');
  if (!tk || req.teacherKey !== tk) throw new Error('bad key');
  const sh = sheet(), last = sh.getLastRow(), rows = [];
  if (last > 1) {
    sh.getRange(2, 1, last - 1, HEAD.length).getValues().forEach(r => {
      rows.push({ key: r[0], name: String(r[1]).replace(/^'/, ''), cls: r[2], expId: r[3], data: r[9] });
    });
  }
  return { ok: true, rows: rows };
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
