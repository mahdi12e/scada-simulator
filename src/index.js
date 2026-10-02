const EQUIPMENT = [
  { id: "P-101", name: "Feed Pump A", type: "Pump", area: "Unit 1", baseTemp: 46, baseVibration: 2.1, baseLoad: 62 },
  { id: "P-102", name: "Feed Pump B", type: "Pump", area: "Unit 1", baseTemp: 43, baseVibration: 1.7, baseLoad: 58 },
  { id: "T-201", name: "Storage Tank", type: "Tank", area: "Unit 2", baseTemp: 29, baseVibration: 0, baseLoad: 71 },
  { id: "V-301", name: "Control Valve", type: "Valve", area: "Unit 2", baseTemp: 35, baseVibration: 0.4, baseLoad: 48 }
];

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

function telemetry() {
  const now = Date.now();
  return EQUIPMENT.map((item, i) => {
    const wave = Math.sin(now / 17000 + i * 1.3);
    const temperature = +(item.baseTemp + wave * 3.2 + Math.random() * 1.4).toFixed(1);
    const vibration = +(Math.max(0, item.baseVibration + wave * 0.35 + Math.random() * 0.15)).toFixed(2);
    const load = +Math.min(100, Math.max(0, item.baseLoad + wave * 5 + Math.random() * 2)).toFixed(1);
    return { ...item, temperature, vibration, load, status: temperature > 52 || vibration > 3.2 ? "WARNING" : "NORMAL", updatedAt: new Date().toISOString() };
  });
}

async function getEvents(env) {
  if (!env.DB) return [];
  const result = await env.DB.prepare("SELECT id, severity, equipment_id, message, created_at, acknowledged, acknowledged_at FROM events ORDER BY id DESC LIMIT 100").all();
  return result.results || [];
}
async function saveEvent(env, severity, equipmentId, message) {
  if (!env.DB) throw new Error("D1 database is not configured.");
  const result = await env.DB.prepare("INSERT INTO events (severity, equipment_id, message) VALUES (?, ?, ?)").bind(severity, equipmentId, message).run();
  return result.meta && result.meta.last_row_id;
}

const page = [
'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0b1220"><title>SCADA Simulator</title>',
'<style>',
':root{color-scheme:dark;--bg:#0b1220;--panel:#121d30;--line:#26364f;--muted:#91a3bd;--text:#edf4ff;--green:#39d98a;--amber:#ffca66;--red:#ff6b75;--blue:#7ab8ff}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.5 system-ui,sans-serif}header{padding:22px clamp(16px,4vw,44px);border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}.brand{display:flex;align-items:center;gap:12px}.logo{width:42px;height:42px;border-radius:12px;background:#183b35;color:var(--green);display:grid;place-items:center;font-weight:800;font-size:18px}h1{font-size:20px;margin:0}h2{font-size:16px;margin:0 0 14px}.sub,.muted{color:var(--muted)}.sub{font-size:12px}.pill{border:1px solid var(--line);border-radius:999px;padding:6px 10px;color:var(--muted);font-size:12px}main{max-width:1280px;margin:auto;padding:24px clamp(16px,4vw,44px) 50px}.notice{border:1px solid #6b5125;background:#2b2416;color:#ffe0a1;padding:12px 14px;border-radius:12px;margin-bottom:20px}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:22px}.metric,.panel,.equipment{background:var(--panel);border:1px solid var(--line);border-radius:14px}.metric{padding:16px}.metric .label{color:var(--muted);font-size:12px}.metric .value{font-size:27px;font-weight:750;margin-top:4px}.layout{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(300px,1fr);gap:18px}.panel{padding:18px;margin-bottom:18px}.equipment-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.equipment{padding:14px}.equip-head{display:flex;justify-content:space-between;gap:8px;align-items:start}.equip-id{font-size:12px;color:var(--blue);font-weight:700}.equip-name{font-weight:650;margin-top:3px}.status{font-size:11px;font-weight:700;border-radius:999px;padding:4px 8px;background:#153b2c;color:var(--green)}.status.warning{background:#493719;color:var(--amber)}.readings{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:17px}.reading{background:#0d1728;border-radius:9px;padding:9px}.reading span{display:block;color:var(--muted);font-size:11px}.reading strong{font-size:16px}.section-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}button{border:1px solid var(--line);border-radius:9px;background:#1a2b44;color:var(--text);padding:9px 12px;font:inherit;cursor:pointer}button:hover{border-color:var(--blue)}button.primary{background:#1e5c49;border-color:#26765d}button:disabled{opacity:.5;cursor:not-allowed}.event-list{display:grid;gap:9px}.event{border:1px solid var(--line);border-radius:10px;padding:11px 12px;display:flex;gap:10px;justify-content:space-between;align-items:center}.event-main{min-width:0}.event-title{font-weight:600}.event-meta{color:var(--muted);font-size:11px;margin-top:3px}.sev{font-size:10px;font-weight:800}.sev.CRITICAL{color:var(--red)}.sev.WARNING{color:var(--amber)}.sev.INFO{color:var(--blue)}.empty{color:var(--muted);padding:20px;text-align:center}.footer{text-align:center;color:var(--muted);font-size:12px;margin-top:18px}@media(max-width:850px){.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.layout{grid-template-columns:1fr}}@media(max-width:500px){.equipment-grid{grid-template-columns:1fr}.metric .value{font-size:23px}.panel{padding:13px}.readings{gap:5px}.reading{padding:7px}}',
'</style></head><body><header><div class="brand"><div class="logo">S</div><div><h1>SCADA Simulator</h1><div class="sub">Industrial telemetry · training environment</div></div></div><span class="pill">● SIMULATION MODE</span></header><main>',
'<div class="notice"><strong>Simulation only.</strong> All readings are generated sample data. This dashboard does not connect to or control real industrial equipment.</div>',
'<section class="metrics"><div class="metric"><div class="label">Equipment monitored</div><div class="value" id="m-equipment">4</div></div><div class="metric"><div class="label">Normal status</div><div class="value" id="m-normal">—</div></div><div class="metric"><div class="label">Active alarms</div><div class="value" id="m-alarms">—</div></div><div class="metric"><div class="label">Last refresh</div><div class="value" style="font-size:18px" id="m-refresh">—</div></div></section>',
'<div class="layout"><div><section class="panel"><div class="section-head"><h2>Equipment overview</h2><span class="muted" id="live-label">Refreshing…</span></div><div class="equipment-grid" id="equipment"></div></section><section class="panel"><div class="section-head"><h2>Process trend</h2><span class="muted">Temperature · °C</span></div><canvas id="trend" height="160" style="width:100%;height:160px"></canvas></section></div>',
'<div><section class="panel"><div class="section-head"><h2>Alarm log</h2><button id="refresh-btn">Refresh</button></div><div class="event-list" id="events"><div class="empty">Loading events…</div></div></section><section class="panel"><h2>Test controls</h2><p class="muted">Generate a sample alarm to test the event log. This does not affect equipment.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="primary" id="alarm-btn">Generate test alarm</button><button id="info-btn">Add info event</button></div><div class="sub" id="action-result" style="margin-top:10px" aria-live="polite"></div></section></div></div>',
'<div class="footer">SCADA Simulator · Demonstration data only · No real-world control functions</div></main><script>',
'const $=id=>document.getElementById(id);let history=[];let latest=[];function esc(s){return String(s).replace(/[&<>"\']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;", "\"":"&quot;","\'":"&#39;"}[c]));}',
'async function api(path,options={}){const r=await fetch(path,{...options,headers:{"content-type":"application/json",...(options.headers||{})}});const d=await r.json().catch(()=>({error:"Invalid response"}));if(!r.ok)throw Error(d.error||"Request failed");return d}',
`function render(items){latest=items;$("equipment").innerHTML=items.map(e=>'<article class="equipment"><div class="equip-head"><div><div class="equip-id">'+esc(e.id)+' · '+esc(e.type)+'</div><div class="equip-name">'+esc(e.name)+'</div><div class="sub">'+esc(e.area)+'</div></div><span class="status '+(e.status==="WARNING"?"warning":"")+'">'+esc(e.status)+'</span></div><div class="readings"><div class="reading"><span>Temperature</span><strong>'+e.temperature+'°</strong></div><div class="reading"><span>Vibration</span><strong>'+e.vibration+'</strong></div><div class="reading"><span>Load / level</span><strong>'+e.load+'%</strong></div></div></article>').join("")}`,
'function draw(){const c=$("trend"),r=c.getBoundingClientRect(),d=window.devicePixelRatio||1;c.width=Math.max(300,Math.floor(r.width*d));c.height=160*d;const x=c.getContext("2d");x.scale(d,d);const w=c.width/d,h=160,p=24;x.clearRect(0,0,w,h);x.strokeStyle="#26364f";for(let j=0;j<4;j++){const y=p+j*(h-2*p)/3;x.beginPath();x.moveTo(p,y);x.lineTo(w-p,y);x.stroke()}const colors=["#7ab8ff","#39d98a","#ffca66","#c39aff"];latest.forEach((e,k)=>{const a=history.map(v=>v[k]);if(a.length<2)return;x.strokeStyle=colors[k];x.lineWidth=2;x.beginPath();a.forEach((v,i)=>{const xx=p+i*(w-2*p)/Math.max(1,a.length-1),yy=h-p-(v-10)/60*(h-2*p);i?x.lineTo(xx,yy):x.moveTo(xx,yy)});x.stroke()})}',
`async function loadEvents(){try{const a=await api("/api/events");$("events").innerHTML=a.length?a.map(e=>'<div class="event"><div class="event-main"><div class="sev '+esc(e.severity)+'">'+esc(e.severity)+' · '+esc(e.equipment_id)+'</div><div class="event-title">'+esc(e.message)+'</div><div class="event-meta">'+esc(new Date(e.created_at).toLocaleString())+(e.acknowledged?" · Acknowledged":" · Unacknowledged")+'</div></div>'+(e.acknowledged?"":'<button data-ack="'+e.id+'">Ack</button>')+'</div>').join(""):'<div class="empty">No events yet. Generate a test event to begin.</div>'}catch(e){$("events").textContent="Could not load events: "+e.message}}`,
'async function refresh(){try{const d=await api("/api/overview");render(d.equipment);$("m-equipment").textContent=d.equipment.length;$("m-normal").textContent=d.equipment.filter(e=>e.status==="NORMAL").length;$("m-alarms").textContent=d.activeAlarms;$("m-refresh").textContent=new Date().toLocaleTimeString();$("live-label").textContent="Auto-refresh: 5 sec";history.push(d.equipment.map(e=>e.temperature));if(history.length>24)history.shift();draw()}catch(e){$("live-label").textContent="API unavailable"}await loadEvents()}',
'$("events").addEventListener("click",async e=>{const b=e.target.closest("[data-ack]");if(!b)return;b.disabled=true;try{await api("/api/events/"+b.dataset.ack+"/ack",{method:"POST"});await loadEvents()}catch(err){alert(err.message);b.disabled=false}});$("alarm-btn").addEventListener("click",async()=>{try{await api("/api/simulate/alarm",{method:"POST"});$("action-result").textContent="Test alarm added.";await refresh()}catch(e){$("action-result").textContent=e.message}});$("info-btn").addEventListener("click",async()=>{try{await api("/api/simulate/info",{method:"POST"});$("action-result").textContent="Info event added.";await loadEvents()}catch(e){$("action-result").textContent=e.message}});$("refresh-btn").addEventListener("click",refresh);window.addEventListener("resize",draw);refresh();setInterval(refresh,5000);',
'</script></body></html>'
].join("");

export default {
  async fetch(request, env) {
    const url = new URL(request.url), path = url.pathname, method = request.method.toUpperCase();
    if (path === "/" && method === "GET") return new Response(page, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    if (path === "/api/health" && method === "GET") return json({ ok: true, mode: "simulation-only", databaseConfigured: Boolean(env.DB), timestamp: new Date().toISOString() });
    if (path === "/api/overview" && method === "GET") {
      const equipment = telemetry(), events = await getEvents(env);
      return json({ mode: "simulation-only", equipment, activeAlarms: events.filter(e => !e.acknowledged && e.severity !== "INFO").length, timestamp: new Date().toISOString() });
    }
    if (path === "/api/events" && method === "GET") return json(await getEvents(env));
    if (path === "/api/simulate/alarm" && method === "POST") {
      try { const id = EQUIPMENT[Math.floor(Math.random() * EQUIPMENT.length)].id; const eventId = await saveEvent(env, "WARNING", id, "SIMULATED TEST ALARM — training workflow"); return json({ ok: true, id: eventId, mode: "simulation-only" }, 201); }
      catch (e) { return json({ error: e.message }, 503); }
    }
    if (path === "/api/simulate/info" && method === "POST") {
      try { const eventId = await saveEvent(env, "INFO", "SYSTEM", "Simulation status checked by operator"); return json({ ok: true, id: eventId }, 201); }
      catch (e) { return json({ error: e.message }, 503); }
    }
    const match = path.match(/^\/api\/events\/(\d+)\/ack$/);
    if (match && method === "POST") {
      if (!env.DB) return json({ error: "D1 database is not configured." }, 503);
      const result = await env.DB.prepare("UPDATE events SET acknowledged=1, acknowledged_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").bind(Number(match[1])).run();
      if (!result.meta || !result.meta.changes) return json({ error: "Event not found." }, 404);
      return json({ ok: true, id: Number(match[1]) });
    }
    return json({ error: "Not found" }, 404);
  }
};
