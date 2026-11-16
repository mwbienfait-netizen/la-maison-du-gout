const TEL = "+250791848862";
const WA = "https://wa.me/250791848862";
const MAP = "https://www.google.com/maps?q=KG+19+Ave,+Kibagabaga,+Kigali&output=embed";
const DIRECTIONS = "https://www.google.com/maps/search/?api=1&query=KG+19+Ave+Kibagabaga+Kigali";

const SERVICES = [
  { title: "Restaurant", text: "Grilled plates, fresh salads and generous dishes, served without hurry.", cta: "See the menu", to: "menu" },
  { title: "Bar", text: "Cocktails prepared at the counter and wine by the glass, late into the evening.", cta: "Reserve a table", to: "reserve" },
  { title: "Événements", text: "Birthdays, weddings and private dinners, shaped around your occasion.", cta: "Plan your event", to: "events" },
  { title: "Service traiteur", text: "Our kitchen at your venue, with the same care at your table.", cta: "Ask about catering", to: "events" },
];

// The calm bar that sits at the bottom of the hero slides.
export function HomeBar({ go }) {
  return (
    <div className="hm-bar">
      <div className="hm-facts">
        <div><b>Open 8am to 1am</b><span>Coffee, lunch, dinner and drinks</span></div>
        <div><b>KG 19 Ave, Kibagabaga</b><span>Kigali, Rwanda</span></div>
      </div>
      <div className="hm-cta">
        <button className="btn" onClick={() => go("menu")}>Order food</button>
        <button className="hm-ghost" onClick={() => go("reserve")}>Reserve a table</button>
        <button className="link" onClick={() => go("events")}>Events and catering</button>
      </div>
    </div>
  );
}

// Home: the hero (with the bar inside it) and a short introduction.
export function Home({ go, hero }) {
  return (
    <>
      <style>{css}</style>
      {hero}
      <section className="hm-sec">
        <div className="hm-in hm-abt">
          <h2>About us</h2>
          <div>
            <p>Maison du Goût opens early and closes late, because good moments do not keep office hours. We cook with care and welcome with warmth, for a quiet coffee, a family lunch or a night out.</p>
            <p className="hm-quote">Bon café, bon moment. Bonne cuisine, belle âme.</p>
            <button className="hm-ghost" onClick={() => go("about")}>Our story</button>
          </div>
        </div>
      </section>
      <section className="hm-sec hm-offer">
        <div className="hm-in">
          <h2 className="hm-title">What we offer</h2>
          <div className="hm-cards">
            {SERVICES.map((s) => (
              <div className="hm-card" key={s.title}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <button className="link" onClick={() => go(s.to)}>{s.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="hm-sec hm-find">
        <div className="hm-in hm-visit">
          <div>
            <h2>Contact us</h2>
            <dl>
              <dt>Address</dt><dd>KG 19 Ave, Kibagabaga, Kigali</dd>
              <dt>Hours</dt><dd>8am to 1am</dd>
              <dt>Phone</dt><dd><a href={`tel:${TEL}`}>0791 848 862</a></dd>
              <dt>WhatsApp</dt><dd><a href={WA} target="_blank" rel="noreferrer">Chat on WhatsApp</a></dd>
            </dl>
            <div className="hm-cta">
              <button className="btn" onClick={() => go("message")}>Send a message</button>
              <a className="hm-ghost" href={DIRECTIONS} target="_blank" rel="noreferrer">Get directions</a>
            </div>
          </div>
          <iframe className="hm-map" title="Map to Maison du Goût" src={MAP} loading="lazy" />
        </div>
      </section>
    </>
  );
}

export function Footer({ go }) {
  const links = [["home", "Home"], ["about", "About"], ["contact", "Contact"], ["menu", "Menu"], ["reserve", "Reserve"], ["events", "Events"]];
  return (
    <footer className="hm-foot">
      <style>{css}</style>
      <div className="hm-in hm-foot-in">
        <div>
          <img className="hm-flogo" src="/images/logo-gold.png" alt="La Maison du Goût" />
        </div>
        <div className="hm-flinks">
          {links.map(([v, l]) => <button key={v} onClick={() => go(v)}>{l}</button>)}
        </div>
        <div>
          <p>KG 19 Ave, Kibagabaga, Kigali</p>
          <p>Open 8am to 1am</p>
          <p><a href={`tel:${TEL}`}>0791 848 862</a></p>
        </div>
      </div>
      <p className="hm-copy">© {new Date().getFullYear()} Maison du Goût <button className="hm-staff" onClick={() => go("staff")}>Staff login</button></p>
    </footer>
  );
}

export function About({ go }) {
  return (
    <>
      <style>{css}</style>
      <section className="hm-sec">
        <div className="hm-in hm-split">
          <div>
            <h1>About us</h1>
            <p>Maison du Goût opens early and closes late, because good moments do not keep office hours. The day begins with a proper coffee at eight, moves through long lunches and unhurried afternoons, and carries on into the night with grilled plates and a well-made drink.</p>
            <p>We cook with care and welcome with warmth. A quiet table for two, a family gathering, a birthday or a wedding reception: whatever the occasion, we hold ourselves to the promise on our sign, bon goût, bonne ambiance.</p>
            <p className="hm-quote">Bon café, bon moment. Bonne cuisine, belle âme.</p>
          </div>
          <div className="hm-photo">
            <img className="hm-img" src="/images/table.png" alt="Grilled chicken and salad with a glass of white wine" />
          </div>
        </div>
      </section>
      <section className="hm-sec hm-dark">
        <div className="hm-in">
          <h2>What we do</h2>
          <div className="hm-services">
            {SERVICES.map((s) => (
              <div key={s.title}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <button className="hm-lnk" onClick={() => go(s.to)}>{s.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export function Contact({ go }) {
  return (
    <>
      <style>{css}</style>
      <section className="hm-sec">
        <div className="hm-in hm-split">
          <div>
            <h1>Contact us</h1>
            <dl>
              <dt>Address</dt><dd>KG 19 Ave, Kibagabaga, Kigali</dd>
              <dt>Hours</dt><dd>8am to 1am</dd>
              <dt>Phone</dt><dd><a href={`tel:${TEL}`}>0791 848 862</a></dd>
            </dl>
            <div className="hm-cta">
              <a className="btn" href={`tel:${TEL}`}>Call us</a>
              <a className="hm-ghost" href={WA} target="_blank" rel="noreferrer">WhatsApp</a>
              <a className="hm-ghost" href={DIRECTIONS} target="_blank" rel="noreferrer">Directions</a>
              <button className="hm-ghost" onClick={() => go("message")}>Send a message</button>
            </div>
          </div>
          <iframe className="hm-map" title="Map to Maison du Goût" src={MAP} loading="lazy" />
        </div>
      </section>
    </>
  );
}

// Three colours only: cream, black and gold (from your sign).
const css = `
.hm-sec{padding:clamp(56px,9vw,112px) 24px}
.hm-in{max-width:1080px;margin:0 auto}
.hm-dark{background:var(--bordeaux);color:var(--ivory)}
.hm-strip{display:flex;flex-wrap:wrap;gap:20px 56px;justify-content:space-between;align-items:center;padding:28px clamp(20px,5vw,56px);border-bottom:1px solid var(--line)}
.hm-facts{display:flex;flex-wrap:wrap;gap:12px 48px}
.hm-facts b{display:block;font-weight:500}
.hm-facts span{color:var(--muted);font-size:.95rem}
.hm-cta{display:flex;flex-wrap:wrap;gap:12px 20px;align-items:center}
.hm-ghost{display:inline-block;border:1px solid var(--red);padding:13px 26px;border-radius:6px;color:var(--red);text-decoration:none;transition:background .2s,color .2s}
.hm-ghost:hover{background:var(--red);color:var(--ivory)}
a.btn{display:inline-block;text-decoration:none}
.hm-bar{position:relative;z-index:1;display:flex;flex-wrap:wrap;gap:16px 48px;justify-content:space-between;align-items:center;padding:20px clamp(24px,6vw,72px);border-top:1px solid var(--line);color:var(--ink)}
.hm-bar .link{color:var(--red)}
.hero:not(.plain) .hm-bar{background:rgba(58,11,20,.6);backdrop-filter:blur(10px);border-top-color:rgba(250,246,238,.2);color:var(--ivory)}
.hero:not(.plain) .hm-bar .hm-facts span{color:var(--ivory);opacity:.75}
.hero:not(.plain) .hm-bar .hm-ghost{border-color:var(--ivory);color:var(--ivory)}
.hero:not(.plain) .hm-bar .link{color:var(--ivory)}
.hm-split{display:grid;grid-template-columns:1.1fr .9fr;gap:clamp(32px,6vw,88px);align-items:center}
.hm-split h1,.hm-split h2{font-size:clamp(2.2rem,5vw,3.6rem);margin-bottom:24px}
.hm-split p{color:var(--muted);max-width:52ch;margin-bottom:18px}
.hm-split .hm-ghost{margin-top:10px}
.hm-quote{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1.6rem;line-height:1.3;max-width:28ch}
.hm-split p.hm-quote{color:var(--ink);margin-top:28px}
.hm-photo{overflow:hidden;aspect-ratio:4/5}
.hm-img{width:100%;height:100%;object-fit:cover;display:block}
.hm-dark h2{font-size:clamp(2rem,4.5vw,3rem)}
.hm-services{display:grid;grid-template-columns:repeat(4,1fr);gap:40px;margin-top:40px}
.hm-services div{border-top:1px solid var(--gold);padding-top:20px}
.hm-services p{opacity:.75;margin:8px 0 14px}
.hm-lnk{color:var(--gold);text-decoration:underline}
dl{display:grid;grid-template-columns:auto 1fr;gap:14px 28px;margin:0 0 32px}
dt{color:var(--muted)}
dd a{color:var(--red);text-decoration:underline}
.hm-map{width:100%;min-height:380px;height:100%;border:0;filter:grayscale(.5)}
@media(max-width:900px){.hm-services{grid-template-columns:repeat(2,1fr)}}
@media(max-width:760px){.hm-split{grid-template-columns:1fr}.hm-services{grid-template-columns:1fr}}
.hm-title{font-size:clamp(2rem,4.5vw,3rem);margin-bottom:36px}
.hm-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
.hm-card{background:#fff;border:1px solid var(--line);border-radius:10px;padding:28px 24px;display:flex;flex-direction:column;gap:10px;align-items:flex-start}
.hm-card::before{content:"";width:36px;height:2px;background:var(--gold);margin-bottom:6px}
.hm-card .link{color:var(--red)}
.hm-card p{color:var(--muted);flex:1}
.hm-duo{display:grid;grid-template-columns:1fr 1fr}
.hm-duo>div{padding:clamp(40px,7vw,96px) clamp(24px,6vw,80px);display:flex;flex-direction:column;align-items:flex-start;gap:18px}
.hm-duo p{color:var(--muted);max-width:46ch}
.hm-contact{background:var(--ink);color:var(--cream)}
.hm-contact dl{margin:0 0 8px}
.hm-contact dt{color:rgba(246,241,231,.65)}
.hm-contact dd a{color:var(--gold)}
.hm-contact .hm-ghost{border-color:var(--cream);color:var(--cream)}
.hm-contact .hm-ghost:hover{background:var(--cream);color:var(--ink)}
.hm-foot{background:var(--bordeaux);color:var(--cream);padding:48px 24px 28px;text-align:left;font-size:.95rem}
.hm-foot-in{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:32px}
.hm-flogo{height:120px;width:auto;display:block}
.hm-fbrand{font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:600}
.hm-fbrand i{color:var(--gold)}
.hm-foot p{margin:0 0 6px;opacity:.8}
.hm-foot a{color:var(--gold);text-decoration:underline}
.hm-flinks{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;align-content:start}
.hm-flinks button{text-align:left;color:var(--cream);opacity:.85}
.hm-flinks button:hover{opacity:1;text-decoration:underline}
.hm-foot .hm-copy{max-width:1080px;margin:32px auto 0;opacity:.55;font-size:.85rem}
.hm-staff{margin-left:18px;color:var(--cream);text-decoration:underline}
@media(max-width:900px){.hm-cards{grid-template-columns:repeat(2,1fr)}}
@media(max-width:760px){.hm-cards,.hm-duo,.hm-foot-in{grid-template-columns:1fr}}
.hm-offer{border-top:1px solid var(--line)}
.hm-abt{display:grid;grid-template-columns:1fr 1.3fr;gap:clamp(32px,6vw,88px);align-items:start}
.hm-abt h2{font-size:clamp(2.2rem,5vw,3.6rem)}
.hm-abt p{color:var(--muted);max-width:52ch;margin-bottom:18px}
.hm-abt p.hm-quote{color:var(--ink);margin:24px 0 28px}
.hm-visit{display:grid;grid-template-columns:1fr 1.2fr;gap:clamp(32px,6vw,80px);align-items:center}
.hm-contact h2{font-size:clamp(2rem,4.5vw,3rem);margin-bottom:24px}
.hm-visit dl{margin:0 0 32px}
.hm-contact .hm-map{height:100%;min-height:380px;margin:0}
@media(max-width:760px){.hm-abt,.hm-visit{grid-template-columns:1fr}}
.hm-find{border-top:1px solid var(--line)}
.hm-find h2{font-size:clamp(2rem,4.5vw,3rem);margin-bottom:24px}
.hm-find .hm-map{height:100%;min-height:380px;border:1px solid var(--line);filter:grayscale(.35)}
`;
