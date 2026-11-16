import { useEffect, useState } from "react";

const ROLES = ["admin", "manager", "staff", "cuisine"];
// Which pages each role sees.
const TABS = {
  admin: ["Overview", "Orders", "Reservations", "Enquiries", "Messages", "Accounts"],
  manager: ["Overview", "Orders", "Reservations", "Enquiries", "Messages"],
  staff: ["Reservations", "Enquiries", "Messages"],
  cuisine: ["Orders"],
};
const KEY = "mdg_token";

async function call(api, token, path, method = "GET", body) {
  const r = await fetch(`${api}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Something went wrong");
  return d;
}

function Accounts({ api, token, me }) {
  const blank = { name: "", username: "", role: "staff", password: "" };
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState("");
  const [f, setF] = useState(blank);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const load = () => call(api, token, "/admin/users").then(setUsers).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);
  const act = async (id, method, body) => {
    setErr("");
    try {
      await call(api, token, `/admin/users/${id}`, method, body);
      load();
    } catch (e) {
      setErr(e.message);
    }
  };
  const create = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await call(api, token, "/admin/users", "POST", f);
      setF(blank);
      load();
    } catch (x) {
      setErr(x.message);
    }
  };
  return (
    <>
      <h2>Accounts</h2>
      <p className="muted">admin: everything and accounts. manager: orders, bookings, enquiries and messages. staff: front desk bookings, enquiries and messages. cuisine: kitchen orders.</p>
      {err && <p className="err">{err}</p>}
      <form className="st-new" onSubmit={create}>
        <label>Name<input required value={f.name} onChange={set("name")} /></label>
        <label>Username<input required value={f.username} onChange={set("username")} /></label>
        <label>Role
          <select value={f.role} onChange={set("role")}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
        </label>
        <label>Password (8+ characters)<input required type="password" minLength="8" value={f.password} onChange={set("password")} /></label>
        <button className="btn">Create account</button>
      </form>
      {users.map((u) => {
        const self = u.id === me.id;
        return (
          <div className="st-row" key={u.id}>
            <div className="st-who">
              <b>{u.name}</b>
              <span className="muted">{u.username}{!u.active ? " (disabled)" : ""}{self ? " (you)" : ""}</span>
            </div>
            <select value={u.role} disabled={self} onChange={(e) => act(u.id, "PATCH", { role: e.target.value })}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
            <button className="link" disabled={self} onClick={() => act(u.id, "PATCH", { active: !u.active })}>{u.active ? "Disable" : "Enable"}</button>
            <button className="link" onClick={() => { const p = prompt("New password (8 or more characters)"); if (p) act(u.id, "PATCH", { password: p }); }}>Reset password</button>
            <button className="link" disabled={self} onClick={() => confirm(`Delete ${u.name}?`) && act(u.id, "DELETE")}>Delete</button>
          </div>
        );
      })}
    </>
  );
}

const LABEL = { orders: "Orders", reservations: "Reservations", enquiries: "Enquiries", messages: "Messages" };
const KIND = Object.fromEntries(Object.entries(LABEL).map(([k, v]) => [v, k]));
const FINAL = { orders: "done", reservations: "cancelled", enquiries: "done", messages: "done" };
const STATUS = {
  orders: ["new", "preparing", "ready", "done"],
  reservations: ["new", "confirmed", "cancelled"],
  enquiries: ["new", "contacted", "done"],
  messages: ["new", "done"],
};
const money = (n) => Number(n).toLocaleString("en-US") + " RWF";
const when = (t) => new Date(t).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const title = (kind, r) =>
  kind === "orders" ? `Order #${r.id}`
  : kind === "reservations" ? `${r.date} at ${r.time}, ${r.guests} guests`
  : kind === "enquiries" ? `${r.kind}, ${r.date}`
  : "Message";

const detail = (kind, r) => (
  <>
    {kind === "orders" && (
      <>
        <ul>{(r.items || []).map((i, n) => <li key={n}>{i.qty} × {i.name}</li>)}</ul>
        <p>{r.mode}{r.address ? `: ${r.address}` : ""}</p>
        <p><b>{money(r.total)}</b></p>
      </>
    )}
    {kind === "enquiries" && r.guests ? <p>Guests: {r.guests}</p> : null}
    {kind === "messages" ? <p>{r.message}</p> : null}
    {r.notes ? <p className="muted">Notes: {r.notes}</p> : null}
  </>
);

// One list (orders, reservations, enquiries or messages) with status buttons. Refreshes by itself.
function Inbox({ api, token, kind }) {
  const [rows, setRows] = useState([]);
  const [all, setAll] = useState(false);
  const [err, setErr] = useState("");
  const load = () => call(api, token, `/staff/${kind}`).then((d) => { setRows(d); setErr(""); }).catch((e) => setErr(e.message));
  useEffect(() => {
    load();
    const t = setInterval(load, kind === "orders" ? 10000 : 30000);
    return () => clearInterval(t);
  }, [kind]);
  const setStatus = async (id, status) => {
    try {
      await call(api, token, `/staff/${kind}/${id}`, "PATCH", { status });
      load();
    } catch (e) {
      setErr(e.message);
    }
  };
  const shown = rows.filter((r) => all || r.status !== FINAL[kind]);
  return (
    <>
      <div className="st-bar">
        <h2>{LABEL[kind]}</h2>
        <button className="link" onClick={() => setAll(!all)}>{all ? "Hide finished" : "Show finished"}</button>
      </div>
      {err && <p className="err">{err}</p>}
      {!shown.length && <p className="muted">Nothing here right now.</p>}
      {shown.map((r) => (
        <div className={"st-card s-" + r.status} key={r.id}>
          <div className="st-head"><b>{title(kind, r)}</b><span className="st-pill">{r.status}</span></div>
          <p className="muted">{when(r.created_at)}</p>
          <p><b>{r.name}</b> <a href={`tel:${r.phone}`}>{r.phone}</a></p>
          {detail(kind, r)}
          <div className="st-acts">
            {STATUS[kind].filter((s) => s !== r.status).map((s) => (
              <button key={s} className="hm-ghost" onClick={() => setStatus(r.id, s)}>{s}</button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

// Manager and admin: how many new items are waiting in each list.
function Overview({ api, token, setTab }) {
  const [n, setN] = useState(null);
  useEffect(() => {
    const l = () => call(api, token, "/staff/summary").then(setN).catch(() => {});
    l();
    const t = setInterval(l, 15000);
    return () => clearInterval(t);
  }, []);
  return (
    <>
      <h2>Overview</h2>
      <p className="muted">New items waiting for attention. Tap one to open it.</p>
      <div className="st-stats">
        {Object.keys(LABEL).map((k) => (
          <button key={k} className="st-stat" onClick={() => setTab(LABEL[k])}>
            <b>{n ? n[k] : "–"}</b><span>{LABEL[k]}</span>
          </button>
        ))}
      </div>
    </>
  );
}

export default function Staff({ api }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(KEY) || "");
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const out = () => { sessionStorage.removeItem(KEY); setToken(""); setMe(null); };
  useEffect(() => {
    if (token) call(api, token, "/auth/me").then(setMe).catch(out);
  }, [token]);
  const login = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const d = new FormData(e.target);
    try {
      const r = await call(api, "", "/auth/login", "POST", { username: d.get("username"), password: d.get("password") });
      sessionStorage.setItem(KEY, r.token);
      setToken(r.token);
      setMe(r.user);
    } catch (x) {
      setErr(x.message);
    }
    setBusy(false);
  };
  const tabs = me ? TABS[me.role] || [] : [];
  const cur = tab || tabs[0];
  return (
    <section className="wrap narrow st">
      <style>{css}</style>
      {!token ? (
        <form className="panel" onSubmit={login}>
          <h1>Staff login</h1>
          <p className="muted">For the Maison du Goût team. Ask the admin for an account.</p>
          <label>Username<input name="username" required autoComplete="username" /></label>
          <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
          {err && <p className="err">{err}</p>}
          <button className="btn" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
      ) : !me ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
          <div className="st-top">
            <div>
              <h1>Staff area</h1>
              <p className="muted">Signed in as {me.name} ({me.role})</p>
            </div>
            <button className="hm-ghost" onClick={out}>Sign out</button>
          </div>
          <div className="st-tabs">
            {tabs.map((t) => <button key={t} className={t === cur ? "on" : ""} onClick={() => setTab(t)}>{t}</button>)}
          </div>
          {cur === "Accounts" ? <Accounts api={api} token={token} me={me} />
            : cur === "Overview" ? <Overview api={api} token={token} setTab={setTab} />
            : <Inbox key={cur} api={api} token={token} kind={KIND[cur]} />}
        </>
      )}
    </section>
  );
}

const css = `
.st.narrow{max-width:980px}
.st-top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:20px}
.st-tabs{display:flex;gap:8px;margin-bottom:28px}
.st-tabs button{padding:8px 18px;border:1px solid var(--line);border-radius:999px}
.st-tabs .on{background:var(--red);color:var(--ivory);border-color:var(--red)}
.st h2{margin-bottom:8px}
.st-new{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;align-items:end;margin:24px 0 32px}
.st-row{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;padding:14px 0;border-bottom:1px solid var(--line)}
.st-who{flex:1 1 180px;display:flex;flex-direction:column}
.st-row select{padding:8px 10px}
.st .link:disabled{opacity:.35;cursor:not-allowed}
.st-tabs{flex-wrap:wrap}
.st-bar{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.st-card{background:#fff;border:1px solid var(--line);border-radius:10px;padding:18px 20px;margin-top:14px}
.st-card p{margin:4px 0}
.st-card ul{margin:6px 0 6px 18px}
.st-head{display:flex;justify-content:space-between;gap:12px}
.st-pill{font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;color:var(--red)}
.st-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.st-acts .hm-ghost{padding:8px 16px;text-transform:capitalize}
.st-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-top:20px}
.st-stat{background:#fff;border:1px solid var(--line);border-radius:10px;padding:20px;text-align:left}
.st-stat b{display:block;font-family:'Cormorant Garamond',serif;font-size:2.4rem;color:var(--red)}
.s-done,.s-cancelled{opacity:.6}
`;
