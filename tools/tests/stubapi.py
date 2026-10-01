# A local stand-in for the Cloudflare Worker, implementing the same actions with SQLite,
# so the browser side can be tested end to end before deploying.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S, OUT_S
import json, sqlite3, http.server, threading, functools, time, os, hashlib, random
DB = "/tmp/r360.db"
if os.path.exists(DB): os.remove(DB)
con = sqlite3.connect(DB, check_same_thread=False)
con.executescript(open(SITE_S + "backend/schema.sql").read())
LOCK = threading.Lock()
KEY = "test-teacher-key"
class H(http.server.BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def _send(self, obj, code=200):
        b=json.dumps(obj).encode(); self.send_response(code)
        self.send_header("content-type","application/json"); self.send_header("access-control-allow-origin","*")
        self.send_header("content-length",str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_OPTIONS(self):
        self.send_response(204); self.send_header("access-control-allow-origin","*"); self.send_header("access-control-allow-headers","content-type"); self.end_headers()
    def do_GET(self):
        with LOCK:
            s=con.execute("SELECT COUNT(*) FROM students").fetchone()[0]; r=con.execute("SELECT COUNT(*) FROM progress").fetchone()[0]
        self._send({"ok":True,"students":s,"rows":r})
    def do_POST(self):
        body=json.loads(self.rfile.read(int(self.headers["content-length"])))
        a=body.get("action"); now=int(time.time()*1000)
        with LOCK:
            if a=="save":
                con.execute("INSERT INTO students (key,name,cls,school_code,first_seen,last_seen) VALUES (?,?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET name=excluded.name, cls=excluded.cls, school_code=COALESCE(NULLIF(excluded.school_code,''), students.school_code), last_seen=excluded.last_seen",
                            (body["key"], body.get("name",""), body.get("cls",""), (body.get("school") or "").upper(), now, now))
                con.execute("INSERT INTO progress (key,exp_id,data,updated) VALUES (?,?,?,?) ON CONFLICT(key,exp_id) DO UPDATE SET data=excluded.data, updated=excluded.updated WHERE excluded.updated >= progress.updated",
                            (body["key"], body["expId"], json.dumps(body.get("data",{})), int((body.get("data") or {}).get("updated") or now)))
                con.commit(); return self._send({"ok":True})
            if a=="login":
                nm=(body.get("name") or "").strip().lower(); pin=(body.get("pin") or "").strip()
                if not nm or not pin.isdigit(): return self._send({"ok":False,"error":"bad login"})
                since=now-15*60*1000
                tries=con.execute("SELECT COUNT(*) FROM attempts WHERE name=? AND at>?",(nm,since)).fetchone()[0]
                if tries>=10: return self._send({"ok":False,"error":"locked"})
                school=(body.get("school") or "").upper()
                if school:
                    rows=con.execute("SELECT key,name,cls,school_code FROM students WHERE name=? AND pin=? AND school_code=? LIMIT 5",(nm,pin,school)).fetchall()
                else:
                    rows=con.execute("SELECT key,name,cls,school_code FROM students WHERE name=? AND pin=? LIMIT 5",(nm,pin)).fetchall()
                if not rows:
                    con.execute("INSERT INTO attempts (name,at) VALUES (?,?)",(nm,now)); con.commit()
                    return self._send({"ok":False,"error":"no match"})
                if len(rows)>1: return self._send({"ok":False,"error":"needs school"})
                con.execute("DELETE FROM attempts WHERE name=?",(nm,)); con.execute("UPDATE students SET last_seen=? WHERE key=?",(now,rows[0][0])); con.commit()
                r=rows[0]
                return self._send({"ok":True,"student":{"key":r[0],"name":r[1],"cls":r[2] or "","school":r[3] or ""}})
            if a=="check":
                k=body.get("key"); school=(body.get("school") or "").upper()
                r=con.execute("SELECT roster FROM students WHERE key=?",(k,)).fetchone()
                if r: return self._send({"ok":True,"known":True})
                if not school: return self._send({"ok":True,"known":False})
                t=con.execute("SELECT enforce_roster FROM teachers WHERE school_code=? AND active=1",(school,)).fetchone()
                if t and t[0]: return self._send({"ok":False,"error":"not on roster"})
                taken=con.execute("SELECT 1 FROM students WHERE name=? AND school_code=?", ((body.get("name") or "").lower(), school)).fetchone()
                if taken: return self._send({"ok":False,"error":"wrong pin"})
                return self._send({"ok":True,"known":False})
            if a=="load":
                rows=con.execute("SELECT exp_id,data FROM progress WHERE key=?", (body["key"],)).fetchall()
                return self._send({"ok":True,"progress":{k:json.loads(v) for k,v in rows}})
            who = {"all":True,"school":None} if body.get("teacherKey")==KEY else None
            if who is None and body.get("teacherKey"):
                _r=con.execute("SELECT school_code FROM teachers WHERE token=? AND active=1",(body.get("teacherKey"),)).fetchone()
                who = {"all":False,"school":_r[0]} if _r else None
            if a=="signup":
                con.execute("INSERT INTO requests (email,school,name,role,note,created,status) VALUES (?,?,?,?,?,?,'new')",
                            (body.get("email",""), body.get("school",""), body.get("name",""), body.get("role",""), body.get("note",""), now)); con.commit()
                return self._send({"ok":True})
            if a=="issue" and body.get("teacherKey")==KEY:
                import uuid
                tok=uuid.uuid4().hex; code=(body.get("schoolCode") or "K7M3QP").upper()
                con.execute("INSERT INTO teachers (id,email,token,school,school_code,seats,licence,active,created) VALUES (?,?,?,?,?,?,?,1,?)",
                            (uuid.uuid4().hex, body.get("email",""), tok, body.get("school",""), code, int(body.get("seats") or 0), body.get("licence") or "trial", now))
                if body.get("requestId"): con.execute("UPDATE requests SET status='issued' WHERE id=?", (body["requestId"],))
                con.commit()
                return self._send({"ok":True,"teacherKey":tok,"schoolCode":code})
            if a in ("all","csv","forget","requests","teachers","revoke","roster_add","roster_list","roster_reset","roster_remove","roster_enforce","team_list","team_set","invite_create","invite_cancel") and who is None: return self._send({"ok":False,"error":"bad key"},403)
            def skey(cls,name,pin): return hashlib.sha256((cls+"|"+name.lower()+"|"+pin).encode()).hexdigest()
            def mkpin(nm=None):
                bad={"000000","111111","123456","654321","121212","112233"}
                for _ in range(25):
                    p="%06d"%random.randint(0,999999)
                    if p in bad: continue
                    if nm and con.execute("SELECT 1 FROM students WHERE name=? AND pin=?",(nm,p)).fetchone(): continue
                    return p
                return "%06d"%random.randint(0,999999)
            import uuid as _u
            def isadmin(w):
                if not w or w["all"]: return False
                r=con.execute("SELECT role FROM teachers WHERE school_code=? AND token=?",(w["school"],body.get("teacherKey"))).fetchone()
                return (r[0] if r and r[0] else "admin")=="admin"
            def myid():
                r=con.execute("SELECT id FROM teachers WHERE token=?",(body.get("teacherKey"),)).fetchone(); return r[0] if r else None
            if a=="invite_create" and who and not who["all"]:
                if not isadmin(who): return self._send({"ok":False,"error":"only the school's lead teacher can invite colleagues"},403)
                code=_u.uuid4().hex[:12].upper()
                con.execute("INSERT INTO invites (code,school_code,created_by,email,created,expires) VALUES (?,?,?,?,?,?)",
                            (code, who["school"], myid(), body.get("email",""), now, now+30*24*3600*1000)); con.commit()
                return self._send({"ok":True,"code":code,"school":who["school"]})
            if a=="invite_info":
                r=con.execute("SELECT i.code,i.expires,i.used,t.school FROM invites i LEFT JOIN teachers t ON t.id=i.created_by WHERE i.code=?",(body.get("code"),)).fetchone()
                if not r: return self._send({"ok":False,"error":"unknown invite"})
                if r[2]: return self._send({"ok":False,"error":"invite already used"})
                if r[1] and r[1]<now: return self._send({"ok":False,"error":"invite expired"})
                return self._send({"ok":True,"school":r[3]})
            if a=="invite_accept":
                r=con.execute("SELECT school_code,created_by,used,expires FROM invites WHERE code=?",(body.get("code"),)).fetchone()
                if not r: return self._send({"ok":False,"error":"unknown invite"},400)
                if r[2]: return self._send({"ok":False,"error":"invite already used"},400)
                sch=con.execute("SELECT school,licence,seats FROM teachers WHERE id=?",(r[1],)).fetchone()
                tok=_u.uuid4().hex; tid=_u.uuid4().hex
                con.execute("INSERT INTO teachers (id,email,token,school,school_code,seats,licence,active,created,role,invited_by,person) VALUES (?,?,?,?,?,?,?,1,?,'member',?,?)",
                            (tid, body.get("email",""), tok, sch[0] if sch else "", r[0], sch[2] if sch else 0, sch[1] if sch else "trial", now, r[1], body.get("name","")))
                con.execute("UPDATE invites SET used=?, used_by=? WHERE code=?", (now, tid, body.get("code"))); con.commit()
                return self._send({"ok":True,"teacherKey":tok,"school":sch[0] if sch else "","schoolCode":r[0]})
            if a=="team_list" and who and not who["all"]:
                rows=con.execute("SELECT id,person,email,role,active,created FROM teachers WHERE school_code=? ORDER BY created",(who["school"],)).fetchall()
                inv=con.execute("SELECT code,email,created,expires FROM invites WHERE school_code=? AND used IS NULL",(who["school"],)).fetchall()
                return self._send({"ok":True,"you":myid(),"admin":isadmin(who),"school":who["school"],"schoolCode":who["school"],
                                   "team":[dict(zip(["id","person","email","role","active","created"],r)) for r in rows],
                                   "invites":[dict(zip(["code","email","created","expires"],i)) for i in inv]})
            if a=="team_set" and who and not who["all"]:
                if not isadmin(who): return self._send({"ok":False,"error":"only the school's lead teacher can change access"},403)
                if body.get("id")==myid(): return self._send({"ok":False,"error":"you can't remove your own access"},400)
                con.execute("UPDATE teachers SET active=? WHERE id=? AND school_code=?", (1 if body.get("active") else 0, body.get("id"), who["school"])); con.commit()
                return self._send({"ok":True})
            if a=="invite_cancel" and who and not who["all"]:
                con.execute("DELETE FROM invites WHERE code=? AND school_code=?", (body.get("code"), who["school"])); con.commit()
                return self._send({"ok":True})
            if a=="roster_add" and who and not who["all"]:
                cls=body.get("cls",""); made=[]
                for nm in body.get("names",[]):
                    nm=nm.strip().lower()
                    if not nm: continue
                    r=con.execute("SELECT pin FROM students WHERE name=? AND cls=? AND school_code=?",(nm,cls,who["school"])).fetchone()
                    pin=r[0] if r and r[0] else mkpin(nm); k=skey(cls,nm,pin)
                    con.execute("INSERT INTO students (key,name,cls,school_code,pin,roster,first_seen,last_seen) VALUES (?,?,?,?,?,1,?,?) ON CONFLICT(key) DO UPDATE SET roster=1, pin=excluded.pin, school_code=excluded.school_code",
                                (k,nm,cls,who["school"],pin,now,now))
                    made.append({"key":k,"name":nm,"cls":cls,"pin":pin})
                con.commit(); return self._send({"ok":True,"students":made,"schoolCode":who["school"]})
            if a=="roster_list" and who and not who["all"]:
                rows=con.execute("SELECT key,name,cls,pin,roster,last_seen,(SELECT COUNT(*) FROM progress p WHERE p.key=students.key) FROM students WHERE school_code=? ORDER BY cls,name",(who["school"],)).fetchall()
                t=con.execute("SELECT enforce_roster FROM teachers WHERE school_code=? LIMIT 1",(who["school"],)).fetchone()
                return self._send({"ok":True,"schoolCode":who["school"],"enforce":bool(t and t[0]),
                                   "students":[dict(zip(["key","name","cls","pin","roster","last_seen","started"],r)) for r in rows]})
            if a=="roster_reset" and who and not who["all"]:
                r=con.execute("SELECT key,name,cls FROM students WHERE key=? AND school_code=?",(body.get("key"),who["school"])).fetchone()
                if not r: return self._send({"ok":False,"error":"not found"},404)
                pin=mkpin(r[1]); k=skey(r[2],r[1],pin)
                con.execute("UPDATE students SET key=?,pin=? WHERE key=?",(k,pin,r[0])); con.execute("UPDATE progress SET key=? WHERE key=?",(k,r[0])); con.commit()
                return self._send({"ok":True,"key":k,"pin":pin,"name":r[1],"cls":r[2]})
            if a=="roster_remove" and who and not who["all"]:
                con.execute("DELETE FROM progress WHERE key=?",(body.get("key"),)); con.execute("DELETE FROM students WHERE key=?",(body.get("key"),)); con.commit()
                return self._send({"ok":True})
            if a=="roster_enforce" and who and not who["all"]:
                con.execute("UPDATE teachers SET enforce_roster=? WHERE school_code=?",(1 if body.get("on") else 0, who["school"])); con.commit()
                return self._send({"ok":True,"enforce":bool(body.get("on"))})
            if a=="teachers":
                rows=con.execute("SELECT id,email,school,school_code,licence,seats,active,created FROM teachers ORDER BY created DESC").fetchall()
                out=[]
                for r in rows:
                    d=dict(zip(["id","email","school","school_code","licence","seats","active","created"],r))
                    d["students"]=con.execute("SELECT COUNT(*) FROM students WHERE school_code=?",(d["school_code"],)).fetchone()[0]
                    out.append(d)
                return self._send({"ok":True,"teachers":out})
            if a=="revoke":
                con.execute("UPDATE teachers SET active=? WHERE id=?", (1 if body.get("active") else 0, body.get("id"))); con.commit()
                return self._send({"ok":True})
            if a in ("requests",):
                rows=con.execute("SELECT id,email,school,name,role,note,created,status FROM requests ORDER BY created DESC").fetchall()
                return self._send({"ok":True,"requests":[dict(zip(["id","email","school","name","role","note","created","status"],r)) for r in rows]})
            if a=="all":
                if who["all"]:
                    rows=con.execute("SELECT p.key,s.name,s.cls,s.school_code,p.exp_id,p.data FROM progress p JOIN students s ON s.key=p.key ORDER BY s.cls,s.name").fetchall()
                else:
                    rows=con.execute("SELECT p.key,s.name,s.cls,s.school_code,p.exp_id,p.data FROM progress p JOIN students s ON s.key=p.key WHERE s.school_code=? ORDER BY s.cls,s.name",(who["school"],)).fetchall()
                return self._send({"ok":True,"rows":[{"key":k,"name":n,"cls":c,"school":sc,"expId":e,"data":d} for k,n,c,sc,e,d in rows]})
            if a=="csv":
                rows=con.execute("SELECT s.cls,s.name,p.exp_id,p.updated FROM progress p JOIN students s ON s.key=p.key").fetchall()
                return self._send({"ok":True,"csv":"\n".join(["Class,Username,Experience,Updated"]+[",".join(map(str,r)) for r in rows])})
            if a=="forget":
                con.execute("DELETE FROM progress WHERE key=?", (body["key"],)); con.execute("DELETE FROM students WHERE key=?", (body["key"],)); con.commit()
                return self._send({"ok":True})
        self._send({"ok":False,"error":"unknown action"},400)
def serve(port=8899):
    srv=http.server.ThreadingHTTPServer(("127.0.0.1",port),H); threading.Thread(target=srv.serve_forever,daemon=True).start(); return srv
