import { useEffect, useState } from "react";

const KEY = "mdg_token";
const ROLES = ["admin", "manager", "staff", "cuisine"];
// Tabs: a bottom bar on phones (under 800px), along the top on computers.
const TABS = {
  admin: ["Home", "Orders", "Inbox", "More"],
  manager: ["Home", "Orders", "Inbox", "More"],
  staff: ["Home", "Orders", "Inbox", "More"],
  cuisine: ["Home", "Kitchen", "More"],
};
const STATE = { new: "New", confirmed: "Confirmed", preparing: "Preparing", ready: "Ready", out: "Out for delivery", done: "Done", cancelled: "Cancelled" };
const DID = { confirm: "confirmed", prepare: "started preparing", ready: "marked ready", send: "sent out", deliver: "marked delivered", collect: "marked collected", cancel: "cancelled", pay: "marked paid" };
const ROLE_NAME = { admin: "Owner", manager: "Manager", staff: "Staff", cuisine: "Kitchen" };
const money = (n) => Number(n || 0).toLocaleString("en-US") + " RWF";
const clock = (t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const ago = (t) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(t)) / 60000));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
};

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

// Runs "load" now and then again every "ms" milliseconds while the page is open.
function useLive(load, ms) {
  useEffect(() => {
    load();
    const t = setInterval(load, ms);
    return () => clearInterval(t);
  }, []);
}

const Stat = ({ label, value, onClick }) => (
  <button className="pt-stat" onClick={onClick} disabled={!onClick}><b>{value}</b><span>{label}</span></button>
);

function Home({ api, token, open }) {
  const [d, setD] = useState(null);
  useLive(() => call(api, token, "/staff/home").then(setD).catch(() => {}), 20000);
  if (!d) return <p className="muted">Loading…</p>;
  const kitchen = d.role === "cuisine";
  const toOrders = () => open(kitchen ? "Kitchen" : "Orders");
  const toInbox = () => open("Inbox");
  const lanes = kitchen
    ? [["confirmed", "To start"], ["preparing", "Cooking"]]
    : [["new", "New"], ["confirmed", "Confirmed"], ["preparing", "Preparing"], ["ready", "Ready"], ["out", "Out for delivery"]];
  return (
    <>
      <h2>{kitchen ? "Kitchen" : "Today"}</h2>
      <h3>Order queue</h3>
      <div className="pt-stats">
        {lanes.map(([k, l]) => <Stat key={k} label={l} value={d.queue[k] || 0} onClick={toOrders} />)}
      </div>
      {d.today && (
        <>
          <h3>Sales today</h3>
          <div className="pt-stats">
            <Stat label="Orders" value={d.today.orders} />
            <Stat label="Sales" value={money(d.today.sales)} />
            <Stat label="Paid today" value={money(d.today.paid)} />
            <Stat label="Not yet paid" value={money(d.today.unpaid)} />
          </div>
        </>
      )}
      {d.inbox && (
        <>
          <h3>Waiting in the inbox</h3>
          <div className="pt-stats">
            <Stat label="New bookings" value={d.inbox.reservations} onClick={toInbox} />
            <Stat label="Event enquiries" value={d.inbox.enquiries} onClick={toInbox} />
            <Stat label="Messages" value={d.inbox.messages} onClick={toInbox} />
          </div>
        </>
      )}
      <h3>Your day</h3>
      <div className="pt-stats">
        {kitchen ? (
          <>
            <Stat label="Started cooking" value={d.mine.started} />
            <Stat label="Marked ready" value={d.mine.ready} />
          </>
        ) : (
          <>
            <Stat label="Order updates" value={d.mine.actions} />
            <Stat label="Cash collected" value={money(d.mine.cash)} />
          </>
        )}
      </div>
      {d.best && d.best.length > 0 && (
        <>
          <h3>Best sellers, last 7 days</h3>
          <div className="pt-list">{d.best.map((b) => <p key={b.name}><span>{b.name}</span><b>{b.qty}</b></p>)}</div>
        </>
      )}
      {d.team && d.team.length > 0 && (
        <>
          <h3>Team today</h3>
          <div className="pt-list">{d.team.map((t) => <p key={t.name}><span>{t.name}</span><b>{t.n} updates</b></p>)}</div>
        </>
      )}
    </>
  );
}

// The next stage button for an order. The kitchen only gets "start" and "ready".
const steps = (o, kitchen) => {
  if (o.status === "confirmed") return [["prepare", "Start preparing"]];
  if (o.status === "preparing") return [["ready", "Mark ready"]];
  if (kitchen) return [];
  if (o.status === "new") return [["confirm", "Confirm order"]];
  if (o.status === "ready") return [o.mode === "Delivery" ? ["send", "Send out"] : ["collect", "Mark collected"]];
  if (o.status === "out") return [["deliver", "Mark delivered"]];
  return [];
};
const finished = (o) => o.status === "done" || o.status === "cancelled";

function Orders({ api, token, me }) {
  const kitchen = me.role === "cuisine";
  const boss = me.role === "admin" || me.role === "manager";
  const [rows, setRows] = useState([]);
  const [all, setAll] = useState(false);
  const [msg, setMsg] = useState("");
  const [hist, setHist] = useState({});
  const [busy, setBusy] = useState(0);
  const load = () => call(api, token, "/staff/orders").then(setRows).catch((e) => setMsg(e.message));
  useLive(load, 20000);
  const act = async (id, action) => {
    setBusy(id);
    setMsg("");
    try {
      await call(api, token, `/staff/orders/${id}/${action}`, "POST");
    } catch (e) {
      setMsg(e.message);
    }
    await load();
    setBusy(0);
  };
  const history = async (id) => {
    if (hist[id]) return setHist({ ...hist, [id]: null });
    try {
      setHist({ ...hist, [id]: await call(api, token, `/staff/orders/${id}/history`) });
    } catch (e) {
      setMsg(e.message);
    }
  };
  const open = rows.filter((r) => !finished(r)).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const shown = all ? [...open, ...rows.filter(finished)] : open;
  return (
    <>
      <div className="st-bar">
        <h2>{kitchen ? "Kitchen" : "Orders"}</h2>
        {!kitchen && <button className="link" onClick={() => setAll(!all)}>{all ? "Hide finished" : "Show finished"}</button>}
      </div>
      <p className="muted">{kitchen ? "New dishes appear here by themselves." : "Refreshes by itself every 20 seconds."}</p>
      {msg && <p className="err">{msg}</p>}
      {!shown.length && <p className="muted">{kitchen ? "No dishes waiting right now." : "No open orders right now."}</p>}
      {shown.map((r) => (
        <div className="st-card" key={r.id}>
          <div className="st-head">
            <b>Order #{r.id}</b>
            <span className={"st-pill " + r.status}>{STATE[r.status]}</span>
          </div>
          <p className="muted">{clock(r.created_at)}{finished(r) ? "" : `, waiting ${ago(r.created_at)}`}</p>
          {!kitchen && (
            <p>
              <b>{r.name}</b> <a href={`tel:${r.phone}`}>{r.phone}</a>
              <br />{r.mode}{r.address ? `: ${r.address}` : ""}
            </p>
          )}
          <ul className="pt-items">{(r.items || []).map((i, n) => <li key={n}>{i.qty} × {i.name}</li>)}</ul>
          {r.notes ? <p className="pt-note">Note: {r.notes}</p> : null}
          {!kitchen && (
            <p><b>{money(r.total)}</b> {r.paid ? <span className="pt-paid">Paid</span> : <span className="muted">Not paid</span>}</p>
          )}
          <div className="pt-acts">
            {steps(r, kitchen).map(([a, l]) => (
              <button key={a} className="btn" disabled={busy === r.id} onClick={() => act(r.id, a)}>{l}</button>
            ))}
            {!kitchen && !r.paid && r.status !== "cancelled" && (
              <button className="pt-ghost" disabled={busy === r.id} onClick={() => act(r.id, "pay")}>Mark paid</button>
            )}
            {!kitchen && ["new", "confirmed", "preparing"].includes(r.status) && (
              <button className="link" onClick={() => confirm(`Cancel order #${r.id}?`) && act(r.id, "cancel")}>Cancel</button>
            )}
            {boss && <button className="link" onClick={() => history(r.id)}>History</button>}
          </div>
          {hist[r.id] && (
            <ul className="pt-hist">
              {hist[r.id].length ? hist[r.id].map((h, n) => <li key={n}>{clock(h.created_at)} {h.user_name} {DID[h.action] || h.action}</li>) : <li>Nothing recorded yet.</li>}
            </ul>
          )}
        </div>
      ))}
    </>
  );
}

const BOX = { reservations: ["new", "confirmed", "cancelled"], enquiries: ["new", "contacted", "done"], messages: ["new", "done"] };
const BOXEND = { reservations: "cancelled", enquiries: "done", messages: "done" };
const CHIPS = { Bookings: "reservations", Events: "enquiries", Messages: "messages" };

function List({ api, token, kind }) {
  const [rows, setRows] = useState([]);
  const [all, setAll] = useState(false);
  const [err, setErr] = useState("");
  const load = () => call(api, token, `/staff/${kind}`).then((d) => { setRows(d); setErr(""); }).catch((e) => setErr(e.message));
  useLive(load, 30000);
  const setStatus = async (id, status) => {
    try {
      await call(api, token, `/staff/${kind}/${id}`, "PATCH", { status });
      load();
    } catch (e) {
      setErr(e.message);
    }
  };
  const head = (r) => kind === "reservations" ? `${r.date} at ${r.time}, ${r.guests} guests` : kind === "enquiries" ? `${r.kind}, ${r.date}` : "Message";
  const shown = rows.filter((r) => all || r.status !== BOXEND[kind]);
  return (
    <>
      <div className="st-bar">
        <span className="muted">{shown.length} to look at</span>
        <button className="link" onClick={() => setAll(!all)}>{all ? "Hide finished" : "Show finished"}</button>
      </div>
      {err && <p className="err">{err}</p>}
      {!shown.length && <p className="muted">Nothing here right now.</p>}
      {shown.map((r) => (
        <div className="st-card" key={r.id}>
          <div className="st-head"><b>{head(r)}</b><span className={"st-pill " + r.status}>{r.status}</span></div>
          <p className="muted">{new Date(r.created_at).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
          <p><b>{r.name}</b> <a href={`tel:${r.phone}`}>{r.phone}</a></p>
          {kind === "enquiries" && r.guests ? <p>Guests: {r.guests}</p> : null}
          {kind === "messages" ? <p>{r.message}</p> : null}
          {r.notes ? <p className="muted">Notes: {r.notes}</p> : null}
          <div className="pt-acts">
            {BOX[kind].filter((s) => s !== r.status).map((s) => (
              <button key={s} className="pt-ghost" onClick={() => setStatus(r.id, s)}>{s}</button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function Inbox({ api, token }) {
  const [k, setK] = useState("Bookings");
  return (
    <>
      <h2>Inbox</h2>
      <div className="pt-chips">
        {Object.keys(CHIPS).map((c) => <button key={c} className={c === k ? "on" : ""} onClick={() => setK(c)}>{c}</button>)}
      </div>
      <List key={k} api={api} token={token} kind={CHIPS[k]} />
    </>
  );
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
      <h2>Staff accounts</h2>
      <p className="muted">Owner: everything, including sales figures, accounts and (soon) the menu and settings. Manager: runs the shift with orders, bookings, messages, team activity and order history, but no sales figures or accounts. Staff: orders, bookings, enquiries and messages. Kitchen: dishes only.</p>
      {err && <p className="err">{err}</p>}
      <form className="st-new" onSubmit={create}>
        <label>Name<input required value={f.name} onChange={set("name")} /></label>
        <label>Username<input required value={f.username} onChange={set("username")} /></label>
        <label>Role
          <select value={f.role} onChange={set("role")}>{ROLES.map((r) => <option key={r} value={r}>{ROLE_NAME[r]}</option>)}</select>
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
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_NAME[r]}</option>)}
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

function Password({ api, token }) {
  const blank = { current: "", next: "", again: "" };
  const [f, setF] = useState(blank);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setOk(false);
    if (f.next !== f.again) return setMsg("The two new passwords are not the same.");
    try {
      await call(api, token, "/auth/password", "POST", { current: f.current, next: f.next });
      setOk(true);
      setF(blank);
    } catch (x) {
      setMsg(x.message);
    }
  };
  return (
    <form className="panel" onSubmit={submit}>
      <h2>Change password</h2>
      <label>Current password<input type="password" required autoComplete="current-password" value={f.current} onChange={set("current")} /></label>
      <label>New password (8+ characters)<input type="password" required minLength="8" autoComplete="new-password" value={f.next} onChange={set("next")} /></label>
      <label>New password again<input type="password" required minLength="8" autoComplete="new-password" value={f.again} onChange={set("again")} /></label>
      {msg && <p className="err">{msg}</p>}
      {ok && <p>Password changed.</p>}
      <button className="btn">Save new password</button>
    </form>
  );
}

export default function Staff({ api, go }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(KEY) || "");
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState("Home");
  const [sub, setSub] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const out = () => { sessionStorage.removeItem(KEY); setToken(""); setMe(null); setTab("Home"); setSub(""); };
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
  const tabs = me ? TABS[me.role] || ["Home", "More"] : [];
  const cur = tabs.includes(tab) ? tab : "Home";
  const open = (t) => { setTab(t); setSub(""); window.scrollTo(0, 0); };
  const props = { api, token, me };
  return (
    <div className="pt">
      <style>{css}</style>
      <div className="pt-head">
        <img src="/images/logo-gold.png" alt="Maison du Goût" />
        {me && <span>{me.name} ({ROLE_NAME[me.role]})</span>}
      </div>
      {!token ? (
        <main className="pt-main">
          <form className="panel pt-login" onSubmit={login}>
            <h1>Staff login</h1>
            <p className="muted">For the Maison du Goût team. Ask the admin for an account.</p>
            <label>Username<input name="username" required autoComplete="username" /></label>
            <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
            {err && <p className="err">{err}</p>}
            <button className="btn" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
            <button type="button" className="link" onClick={() => go("home")}>‹ Back to the website</button>
          </form>
        </main>
      ) : !me ? (
        <main className="pt-main"><p className="muted">Loading…</p></main>
      ) : (
        <>
          <nav className="pt-bar">
            {tabs.map((t) => <button key={t} className={t === cur ? "on" : ""} onClick={() => open(t)}>{t}</button>)}
          </nav>
          <main className="pt-main">
            {cur === "More" && sub && <button className="link pt-back" onClick={() => setSub("")}>‹ More</button>}
            {cur === "Home" && <Home api={api} token={token} open={open} />}
            {(cur === "Orders" || cur === "Kitchen") && <Orders {...props} />}
            {cur === "Inbox" && <Inbox api={api} token={token} />}
            {cur === "More" && !sub && (
              <>
                <h2>More</h2>
                <div className="pt-menu">
                  {me.role === "admin" && <button onClick={() => setSub("accounts")}>Staff accounts<span>Add people, disable them, reset passwords</span></button>}
                  <button onClick={() => setSub("password")}>Change password<span>Your own password</span></button>
                  <a href="/" target="_blank" rel="noreferrer">View website<span>Opens in a new tab</span></a>
                  <button onClick={out}>Sign out</button>
                </div>
              </>
            )}
            {cur === "More" && sub === "accounts" && <Accounts {...props} />}
            {cur === "More" && sub === "password" && <Password api={api} token={token} />}
          </main>
        </>
      )}
    </div>
  );
}

const css = `
.pt{min-height:100vh;background:var(--ivory)}
.pt-head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px clamp(16px,4vw,40px);background:var(--bordeaux);color:var(--ivory)}
.pt-head img{height:48px;width:auto;display:block}
.pt-head span{font-size:.9rem;opacity:.85}
.pt-main{max-width:960px;margin:0 auto;padding:20px clamp(16px,4vw,40px) 100px}
.pt-login{max-width:420px;margin:24px auto}
.pt-bar{position:fixed;left:0;right:0;bottom:0;z-index:20;display:flex;background:#fff;border-top:1px solid var(--line);padding-bottom:env(safe-area-inset-bottom)}
.pt-bar button{flex:1;min-height:60px;font-size:.88rem;color:var(--muted);border-top:3px solid transparent}
.pt-bar button.on{color:var(--red);border-top-color:var(--red);font-weight:500}
@media(min-width:800px){
  .pt-bar{position:static;justify-content:flex-start;padding:0 clamp(16px,4vw,40px);background:var(--ivory)}
  .pt-bar button{flex:0 0 auto;min-height:48px;padding:0 22px;font-size:1rem;border-top:0;border-bottom:3px solid transparent}
  .pt-bar button.on{border-bottom-color:var(--red)}
  .pt-main{padding-bottom:48px}
}
.pt h2{margin-bottom:6px}
.pt h3{font-family:'Jost',sans-serif;font-size:1rem;font-weight:500;margin:26px 0 10px;color:var(--muted)}
.pt-back{display:block;margin-bottom:12px}
.pt-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px}
.pt-stat{background:#fff;border:1px solid var(--line);border-radius:10px;padding:16px;text-align:left;min-height:84px}
.pt-stat:disabled{cursor:default}
.pt-stat b{display:block;font-family:'Cormorant Garamond',serif;font-size:1.8rem;color:var(--red);line-height:1.1}
.pt-stat span{font-size:.88rem;color:var(--muted)}
.pt-list{background:#fff;border:1px solid var(--line);border-radius:10px;padding:6px 16px}
.pt-list p{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--line)}
.pt-list p:last-child{border-bottom:0}
.st-bar{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.st-card{background:#fff;border:1px solid var(--line);border-radius:10px;padding:18px 20px;margin-top:14px}
.st-card p{margin:4px 0}
.st-head{display:flex;justify-content:space-between;gap:12px}
.st-pill{font-size:.78rem;text-transform:uppercase;letter-spacing:.08em;color:var(--red)}
.st-pill.new{background:var(--red);color:#fff;padding:2px 10px;border-radius:999px}
.st-pill.done,.st-pill.cancelled{color:var(--muted)}
.pt-items{margin:8px 0 8px 18px;font-size:1.1rem}
.pt-note{background:var(--stone);padding:8px 12px;border-radius:6px}
.pt-paid{color:#2d6a4f;font-weight:500}
.pt-acts{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;margin-top:14px}
.pt-acts .btn{padding:14px 22px;min-height:48px}
.pt-ghost{display:inline-block;border:1px solid var(--red);color:var(--red);padding:12px 18px;min-height:48px;border-radius:6px;text-transform:capitalize}
.pt-ghost:hover{background:var(--red);color:var(--ivory)}
.pt-hist{margin:10px 0 0 18px;font-size:.92rem;color:var(--muted)}
.pt-chips{display:flex;gap:8px;margin:12px 0}
.pt-chips button{padding:10px 18px;border:1px solid var(--line);border-radius:999px;background:#fff}
.pt-chips .on{background:var(--red);color:var(--ivory);border-color:var(--red)}
.pt-menu{display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:10px;margin-top:12px}
.pt-menu>*{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:16px 18px;min-height:60px;text-align:left;border-bottom:1px solid var(--line);font-size:1.05rem}
.pt-menu>*:last-child{border-bottom:0}
.pt-menu span{font-size:.88rem;color:var(--muted)}
.st-new{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;align-items:end;margin:24px 0 32px}
.st-row{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;padding:14px 0;border-bottom:1px solid var(--line)}
.st-who{flex:1 1 180px;display:flex;flex-direction:column}
.st-row select{padding:8px 10px}
.pt .link:disabled{opacity:.35;cursor:not-allowed}
`;
