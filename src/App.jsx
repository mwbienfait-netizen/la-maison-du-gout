import { useEffect, useState } from "react";
import { Home, About, Contact, HomeBar, Footer } from "./Home.jsx";
import Staff from "./Staff.jsx";

// Address of the Node server. For now it runs on your computer.
const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

const SAMPLE = [
  { id: 1, category: "Entrées", name: "Salade de chèvre chaud", description: "Toast de chèvre, miel, noix, jeunes pousses", price: 7000 },
  { id: 2, category: "Entrées", name: "Velouté de saison", description: "Crème légère, huile d'herbes, pain grillé", price: 6000 },
  { id: 3, category: "Grillades", name: "Entrecôte grillée", description: "Sauce chimichurri, frites maison", price: 18000 },
  { id: 4, category: "Grillades", name: "Poulet mariné au feu de bois", description: "Salade croquante, pain du jour", price: 12000 },
  { id: 5, category: "Grillades", name: "Brochettes de bœuf", description: "Légumes grillés, sauce poivre", price: 11000 },
  { id: 6, category: "Plats", name: "Tilapia entier", description: "Citron, herbes fraîches, riz parfumé", price: 13000 },
  { id: 7, category: "Plats", name: "Pâtes à la crème de champignons", description: "Parmesan, persil", price: 9500 },
  { id: 8, category: "Bar", name: "Cocktail du jour", description: "Demandez à notre barman", price: 7000 },
  { id: 9, category: "Bar", name: "Verre de vin rouge", description: "Sélection de la maison", price: 6500 },
  { id: 10, category: "Desserts", name: "Fondant au chocolat", description: "Glace vanille", price: 5500 },
];
const EVENTS = ["Anniversaire", "Mariage", "Réunion d'entreprise", "Cocktail privé", "Autre"];

// Set to true to show the photo slideshow behind the hero text. For now the hero is text only.
const USE_PHOTOS = false;

// Hero slides. The vertical video only plays on phones / tall screens.
// "contain" shows a small photo at its natural size on the right instead of stretching it.
const SLIDES = [
  { type: "video", src: "/videos/hero.mp4", poster: "/images/hero.png", portraitOnly: true },
  { type: "image", src: "/images/hero.png" },
  { type: "image", src: "/images/table.png" },
  { type: "image", src: "/images/dessert.png", contain: true },
  { type: "image", src: "/images/bar.png" },
];

// Hero phrases, played one after the other. Each has two lines and a subtitle.
const PHRASES = [
  { lines: ["Bon goût,", "bonne ambiance."], sub: "Restaurant, bar, événements et service traiteur." },
  { lines: ["Bon café, bon moment,", "Bonne cuisine, belle âme."], sub: "Restaurant, bar, événements et service traiteur." },
];
const STEP = 0.07; // seconds between letters (keep equal to .07s in the .ch CSS rule)
const HOLD = 2.6; // seconds the finished phrase stays on screen

const fmt = (n) => Number(n).toLocaleString("en-US") + " RWF";
const letters = (t) => [...t].filter((c) => c !== " ").length;

// Sends a form to the Node server. Returns true when it was saved.
const save = async (table, row) => {
  const path = { orders: "orders", reservations: "reservations", event_enquiries: "events", messages: "messages" }[table];
  try {
    const r = await fetch(`${API}/api/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });
    return r.ok;
  } catch {
    return false;
  }
};

function Letters({ text, base, off }) {
  let i = 0;
  return text.split(" ").map((w, wi) => (
    <span className="word" key={wi}>
      {[...w].map((c, ci) => {
        const idx = i++;
        return (
          <span key={ci} className="ch" style={{ "--i": idx, "--g": off + idx, "--b": base + "s" }}>{c}</span>
        );
      })}
    </span>
  ));
}

// Writes a phrase in, holds it, erases it from the end, then moves on to the next one.
function HeroText({ still }) {
  const [p, setP] = useState(0);
  const [out, setOut] = useState(false);
  const ph = PHRASES[p];
  const n1 = letters(ph.lines[0]);
  const n2 = letters(ph.lines[1]);
  const b1 = 0.3;
  const b2 = b1 + n1 * STEP + 0.5;
  const endIn = b2 + n2 * STEP + 0.8;
  useEffect(() => {
    if (still) return;
    const outDur = (n1 + n2) * 0.03 + 0.8;
    const startOut = endIn + 0.5 + HOLD;
    const t1 = setTimeout(() => setOut(true), startOut * 1000);
    const t2 = setTimeout(() => {
      setOut(false);
      setP((p + 1) % PHRASES.length);
    }, (startOut + outDur + 0.3) * 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [p, still]);
  return (
    <div className={"heroText" + (out ? " out" : "")} key={p} style={{ "--n": n1 + n2 }}>
      <p className="eyebrow">Café · Grill · Take away</p>
      <h1 aria-label={ph.lines.join(" ")}>
        <span className="hl" aria-hidden="true"><Letters text={ph.lines[0]} base={b1} off={0} /></span>
        <span className="hl" aria-hidden="true"><Letters text={ph.lines[1]} base={b2} off={n1} /></span>
      </h1>
      <span className="rule" style={{ "--rd": endIn - 0.9 + "s" }} />
      <p className="sub" style={{ "--sd": endIn - 0.4 + "s" }}>{ph.sub}</p>
    </div>
  );
}

// "children" is the bar that sits at the bottom of the hero.
function Hero({ children }) {
  const portrait = window.matchMedia("(max-aspect-ratio: 1/1)").matches;
  const slides = USE_PHOTOS ? SLIDES.filter((s) => !s.portraitOnly || portrait) : [];
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    if (paused || still || slides.length < 2) return;
    const t = setTimeout(() => setI((i + 1) % slides.length), slides[i].type === "video" ? 8000 : 5000);
    return () => clearTimeout(t);
  }, [i, paused, still]);
  return (
    <section className={"hero" + (slides.length ? "" : " plain")}>
      {slides.map((s, n) =>
        s.type === "video" ? (
          <video
            key={n}
            className={"slide" + (n === i ? " on" : "")}
            src={s.src}
            poster={s.poster}
            loop
            muted
            playsInline
            preload="auto"
            ref={(el) => {
              if (el) {
                el.muted = true;
                if (n === i) el.play().catch(() => {});
                else el.pause();
              }
            }}
          />
        ) : (
          <img key={n} className={"slide" + (n === i ? " on" : "") + (s.contain ? " contain" : "")} src={s.src} alt="" />
        )
      )}
      <HeroText still={still} />
      {children}
      {!still && slides.length > 1 && <button className="pause" onClick={() => setPaused(!paused)}>{paused ? "Play" : "Pause"}</button>}
    </section>
  );
}

function Form({ title, intro, fields, table, extra, cta, done, onDone }) {
  const [v, setV] = useState({});
  const [st, setSt] = useState("idle");
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setSt("busy");
    setSt((await save(table, { ...v, ...extra })) ? "ok" : "err");
  };
  if (st === "ok")
    return (
      <div className="panel">
        <h2>Merci, c'est reçu</h2>
        <p className="muted">{done}</p>
        <button className="btn" onClick={onDone}>Back to home</button>
      </div>
    );
  return (
    <form className="panel" onSubmit={submit}>
      <h2>{title}</h2>
      <p className="muted">{intro}</p>
      {fields.map((f) => (
        <label key={f.k}>
          {f.l}
          {f.opts ? (
            <select required value={v[f.k] || ""} onChange={set(f.k)}>
              <option value="">Select</option>
              {f.opts.map((o) => <option key={o}>{o}</option>)}
            </select>
          ) : f.area ? (
            <textarea rows="4" required={!f.opt} value={v[f.k] || ""} onChange={set(f.k)} />
          ) : (
            <input type={f.t || "text"} required={!f.opt} value={v[f.k] || ""} onChange={set(f.k)} />
          )}
        </label>
      ))}
      {st === "err" && <p className="err">We could not send this. Check your connection and try again, or call us.</p>}
      <button className="btn" disabled={st === "busy"}>{st === "busy" ? "Sending…" : cta}</button>
    </form>
  );
}

function Menu({ menu, cart, add }) {
  const cats = [...new Set(menu.map((m) => m.category))];
  const [cat, setCat] = useState(cats[0]);
  return (
    <section className="wrap">
      <h1>La carte</h1>
      <div className="tabs">
        {cats.map((c) => (
          <button key={c} className={c === cat ? "on" : ""} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      {menu.filter((m) => m.category === cat).map((m) => (
        <div className="dish" key={m.id}>
          <div>
            <h3>{m.name}</h3>
            <p className="muted">{m.description}</p>
            <span className="price">{fmt(m.price)}</span>
          </div>
          <button className="add" aria-label={`Add ${m.name}`} onClick={() => add(m.id, 1)}>
            {cart[m.id] ? cart[m.id] : "+"}
          </button>
        </div>
      ))}
    </section>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  const [menu, setMenu] = useState(SAMPLE);
  const [cart, setCart] = useState({});
  useEffect(() => {
    fetch(`${API}/api/menu`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && d.length && setMenu(d))
      .catch(() => {});
  }, []);
  const go = (v) => { setView(v); window.scrollTo(0, 0); };
  const add = (id, d) => setCart((c) => {
    const q = (c[id] || 0) + d, n = { ...c };
    q > 0 ? (n[id] = q) : delete n[id];
    return n;
  });
  const lines = menu.filter((m) => cart[m.id]).map((m) => ({ ...m, qty: cart[m.id] }));
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const total = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const home = () => { setCart({}); go("home"); };
  const nav = (v, label) => <button className={view === v ? "on" : ""} onClick={() => go(v)}>{label}</button>;

  return (
    <div className="app">
      <style>{css}</style>
      <header>
        <button className="brand" onClick={() => go("home")}>
          <img src="/images/logo-gold.png" alt="Maison du Goût" />
        </button>
        <nav className="nav-mid">{nav("home", "Home")}{nav("about", "About")}{nav("contact", "Contact")}</nav>
        <nav className="nav-end">{nav("menu", "Menu")}{nav("reserve", "Reserve")}{nav("events", "Events")}<button className="btn" onClick={() => go("menu")}>Order now</button></nav>
      </header>

      {view === "home" && <Home go={go} hero={<Hero><HomeBar go={go} /></Hero>} />}
      {view === "about" && <About go={go} />}
      {view === "contact" && <Contact go={go} />}
      {view === "menu" && <Menu menu={menu} cart={cart} add={add} />}

      {view === "checkout" && (
        <section className="wrap narrow">
          <h1>Your order</h1>
          {lines.map((l) => (
            <div className="line" key={l.id}>
              <span>{l.name}</span>
              <span className="qty">
                <button onClick={() => add(l.id, -1)} aria-label="Remove one">−</button>
                {l.qty}
                <button onClick={() => add(l.id, 1)} aria-label="Add one">+</button>
              </span>
              <span>{fmt(l.qty * l.price)}</span>
            </div>
          ))}
          <div className="line total"><span>Total</span><span /><span>{fmt(total)}</span></div>
          {count === 0 ? (
            <p className="muted">Your order is empty. <button className="link" onClick={() => go("menu")}>Browse the menu</button></p>
          ) : (
            <Form
              title="Where should we send it?" intro="Pay when you collect or when it arrives."
              table="orders" cta="Place order" onDone={home}
              done="We are preparing your order and will call you to confirm."
              extra={{ items: lines.map(({ id, qty }) => ({ id, qty })) }}
              fields={[
                { k: "name", l: "Name" }, { k: "phone", l: "Phone", t: "tel" },
                { k: "mode", l: "Take away or delivery", opts: ["Take away", "Delivery"] },
                { k: "address", l: "Delivery address", opt: true }, { k: "notes", l: "Notes", area: true, opt: true },
              ]}
            />
          )}
        </section>
      )}

      {view === "reserve" && (
        <section className="wrap narrow">
          <Form
            title="Reserve a table" intro="We will confirm by phone within the hour."
            table="reservations" cta="Request a table" onDone={() => go("home")}
            done="We have your request and will call you to confirm."
            fields={[
              { k: "date", l: "Date", t: "date" },
              { k: "time", l: "Time", opts: ["12:00", "13:00", "14:00", "18:00", "19:00", "20:00", "21:00"] },
              { k: "guests", l: "Guests", opts: ["1", "2", "3", "4", "5", "6", "7", "8+"] },
              { k: "name", l: "Name" }, { k: "phone", l: "Phone", t: "tel" },
              { k: "notes", l: "Anything we should know?", area: true, opt: true },
            ]}
          />
        </section>
      )}

      {view === "events" && (
        <section className="wrap narrow">
          <Form
            title="Plan an event" intro="Tell us what you have in mind. We reply within one day."
            table="event_enquiries" cta="Send enquiry" onDone={() => go("home")}
            done="Thank you. Our team will contact you to talk through the details."
            fields={[
              { k: "kind", l: "Type of event", opts: EVENTS },
              { k: "date", l: "Date", t: "date" }, { k: "guests", l: "Number of guests", t: "number" },
              { k: "name", l: "Name" }, { k: "phone", l: "Phone", t: "tel" },
              { k: "notes", l: "Details", area: true, opt: true },
            ]}
          />
        </section>
      )}

      {view === "message" && (
        <section className="wrap narrow">
          <Form
            title="Send us a message" intro="We read every message and reply by phone or WhatsApp."
            table="messages" cta="Send message" onDone={() => go("home")}
            done="Thank you. We will get back to you soon."
            fields={[
              { k: "name", l: "Name" }, { k: "phone", l: "Phone", t: "tel" },
              { k: "message", l: "Your message", area: true },
            ]}
          />
        </section>
      )}

      {view === "staff" && <Staff api={API} />}

      {view === "menu" && count > 0 && (
        <button className="bar" onClick={() => go("checkout")}>
          <span>{count} {count > 1 ? "items" : "item"}</span><span>View order, {fmt(total)}</span>
        </button>
      )}
      <Footer go={go} />
    </div>
  );
}

// Three colours only: cream, black and gold (from the sign).
const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Jost:wght@400;500&display=swap');
:root{--ivory:#FAF6EE;--cream:#FAF6EE;--stone:#E9E1D3;--ink:#26201D;--red:#A41E34;--bordeaux:#3A0B14;--gold:#C9A24E;--muted:#6B645B;--line:#E9E1D3}
*{box-sizing:border-box;margin:0}
body{margin:0;display:block;background:var(--cream)}
#root{display:block;width:100%;max-width:none;margin:0;border:0;text-align:left}
.app{font-family:Jost,system-ui,sans-serif;color:var(--ink);font-size:17px;line-height:1.6;min-height:100vh;padding-bottom:0}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
h1,h2,h3,.brand{font-family:'Cormorant Garamond',serif;font-weight:600;line-height:1.1}
h1{font-size:clamp(2.4rem,6vw,4.2rem)} h2{font-size:clamp(1.8rem,4vw,2.6rem)} h3{font-size:1.45rem}
.muted{color:var(--muted)}
header{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px 24px;padding:18px clamp(20px,5vw,56px);position:sticky;top:0;background:var(--bordeaux);color:var(--ivory);z-index:5}
.brand{font-size:1.7rem;display:flex;align-items:center;gap:12px;justify-self:start} .brand i{color:var(--gold)}
.brand img{height:56px;width:auto;display:block}
nav{display:flex;align-items:center;gap:clamp(12px,3vw,32px)}
nav button{padding:6px 0;border-bottom:1px solid transparent}
nav button:hover,nav button.on{border-color:var(--gold)}
.nav-mid{justify-self:center} .nav-end{justify-self:end}
.hero{position:relative;overflow:hidden;min-height:88vh;display:flex;flex-direction:column;justify-content:flex-end;align-items:stretch;padding:clamp(24px,6vw,72px) 0 0;color:var(--cream);background:var(--bordeaux)}
.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(58,11,20,.85),rgba(58,11,20,.15) 60%)}
.slide{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 1.2s ease}
.slide.on{opacity:1}
.slide.contain{object-fit:contain;object-position:right center;background:#000}
.heroText{position:relative;z-index:1;max-width:760px;min-height:12rem;margin:0 clamp(24px,6vw,72px) clamp(24px,4vw,48px)}
.hero h1{color:var(--cream)}
.hl{display:block}
.hl:nth-child(2){font-style:italic;color:var(--gold);font-weight:500}
.word{display:inline-block;margin-right:.28em;white-space:nowrap}
.ch{display:inline-block;opacity:0;transform:translateY(.4em);filter:blur(6px);animation:in .8s ease forwards;animation-delay:calc(var(--b) + var(--i) * .07s)}
@keyframes in{to{opacity:1;transform:none;filter:none}}
.out .ch{animation:away .8s ease forwards;animation-delay:calc((var(--n) - var(--g)) * .03s)}
@keyframes away{from{opacity:1;transform:none;filter:none}to{opacity:0;transform:translateY(-.3em);filter:blur(8px)}}
.rule{display:block;height:1px;width:110px;margin-top:20px;background:var(--gold);transform:scaleX(0);transform-origin:left;animation:draw .9s ease forwards;animation-delay:var(--rd)}
@keyframes draw{to{transform:scaleX(1)}}
.out .rule{animation:undraw .6s ease forwards;animation-delay:0s}
@keyframes undraw{from{transform:scaleX(1)}to{transform:scaleX(0)}}
.sub{margin-top:16px;font-size:1.15rem;opacity:0;animation:fade .9s ease forwards;animation-delay:var(--sd)}
@keyframes fade{to{opacity:.9}}
.out .sub{animation:fadeout .5s ease forwards;animation-delay:0s}
@keyframes fadeout{from{opacity:.9}to{opacity:0}}
.pause{position:absolute;top:20px;right:24px;z-index:2;color:var(--cream);text-decoration:underline;opacity:.8}
@media (prefers-reduced-motion:reduce){.ch{animation:none;opacity:1;transform:none;filter:none}.rule{animation:none;transform:none}.sub{animation:none;opacity:.9}.slide{transition:none}}
.wrap{max-width:1040px;margin:0 auto;padding:56px 24px} .narrow{max-width:620px}
.btn{background:var(--red);color:var(--ivory);padding:14px 28px;border-radius:6px;font-weight:500;transition:opacity .2s}
.btn:hover{opacity:.88} .btn:disabled{opacity:.6}
.tabs{display:flex;gap:8px;overflow-x:auto;margin:24px 0 8px;position:sticky;top:81px;background:var(--cream);padding:10px 0;z-index:4}
.tabs button{padding:8px 18px;border:1px solid var(--line);border-radius:999px;white-space:nowrap}
.tabs .on{background:var(--red);color:var(--ivory);border-color:var(--red)}
.dish{display:flex;justify-content:space-between;gap:20px;align-items:center;padding:22px 0;border-bottom:1px solid var(--line)}
.price{font-weight:500;color:var(--red)}
.add{width:46px;height:46px;border:1px solid var(--red);color:var(--red);border-radius:50%;font-size:1.3rem;flex:none;transition:background .2s}
.add:hover{background:var(--red);color:var(--ivory)}
.bar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);width:min(92vw,520px);display:flex;justify-content:space-between;background:var(--bordeaux);color:var(--ivory);padding:16px 22px;border-radius:6px;z-index:6}
.panel{display:flex;flex-direction:column;gap:16px;margin-top:20px}
label{display:flex;flex-direction:column;gap:6px;font-size:.95rem;color:var(--muted)}
input,select,textarea{font:inherit;color:var(--ink);padding:12px 14px;border:1px solid var(--line);background:#fff;border-radius:6px}
.line{display:grid;grid-template-columns:1fr auto 110px;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid var(--line)}
.line span:last-child{text-align:right} .total{font-weight:500}
.qty{display:flex;gap:12px;align-items:center} .qty button{width:30px;height:30px;border:1px solid var(--line);border-radius:50%}
.link{text-decoration:underline} .err{color:var(--red)}
footer{text-align:center;color:var(--muted);padding:40px 20px;font-size:.9rem}
.hero.plain{min-height:76vh;background:var(--ivory);color:var(--ink)}
.hero.plain h1{color:var(--ink)}
.hero.plain .hl:nth-child(2){color:var(--red)}
.hero.plain .sub{color:var(--muted)}
.hero.plain .eyebrow{color:var(--red)}
.eyebrow{font-weight:500;letter-spacing:.16em;text-transform:uppercase;font-size:.85rem;color:var(--gold);margin-bottom:14px;opacity:0;animation:fade .8s ease .1s forwards}
.hero.plain::after{display:none}
.hero.plain .heroText{max-width:none;text-align:center;margin-top:auto;margin-bottom:auto}
.hero.plain .rule{margin-left:auto;margin-right:auto;transform-origin:center}
@media(max-width:900px){header{grid-template-columns:1fr;justify-items:center;position:static}.brand,.nav-mid,.nav-end{justify-self:center}nav{gap:18px;font-size:.95rem}.tabs{top:0}}
@media(max-width:760px){.line{grid-template-columns:1fr auto}.line span:last-child{grid-column:2}}
`;
