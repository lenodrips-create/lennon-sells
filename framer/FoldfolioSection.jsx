// FoldfolioSection: a Framer code component (plain JavaScript version).
// A closed foldable phone that unfolds into Lennon Helman's portfolio as the visitor scrolls.
// Paste into Framer: Assets → Code → "+" → New Code File → name it FoldfolioSection → replace everything with this file.
// Then drag "FoldfolioSection" from Assets onto the page, set Width to Fill and Height to Fit (auto).
import { useEffect, useRef, useState } from "react";
import { addPropertyControls, ControlType } from "framer";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform, } from "framer-motion";
const FINISHES = {
    graphite: ["#4a4a4f", "#1b1b1e", "#2c2c30"],
    silver: ["#e4e5e9", "#9fa1a8", "#c4c6cc"],
    ember: ["#ff7a4d", "#9a2400", "#d84a17"],
};
const ease = [0.2, 0.8, 0.2, 1];
/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 */
export default function FoldfolioSection(props) {
    const { name, role, location, accent, background, headingFont, scrollLength, showFinishPicker, style, } = props;
    const reduce = useReducedMotion();
    const track = useRef(null);
    const stage = useRef(null);
    // ---------- size the device to the visible area ----------
    const [box, setBox] = useState({ w: 1200, h: 800 });
    useEffect(() => {
        const el = stage.current;
        if (!el)
            return;
        const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    const portrait = box.w < 700 || box.h > box.w * 1.25;
    const dw = portrait ? Math.min(box.w * 0.9, 460) : Math.min(1180, box.w * 0.9, box.h * 0.8 * 1.62);
    const dh = portrait ? Math.min(box.h * 0.8, dw * 2.05) : dw / 1.62;
    const bz = Math.round(Math.max(7, Math.min(12, dw * 0.011)));
    const r = Math.round(Math.max(26, Math.min(40, dw * 0.034)));
    const ri = r - bz;
    // ---------- scroll drives the fold ----------
    const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
    const raw = useTransform(scrollYProgress, [0.15, 0.8], [0, 1], { clamp: true });
    const open = useSpring(raw, { stiffness: 90, damping: 22, mass: 0.9 });
    const smooth = (v) => (reduce ? (v > 0.5 ? 1 : 0) : v * v * (3 - 2 * v));
    const angle = useTransform(open, (v) => 180 * (1 - smooth(v)));
    const lift = useTransform(open, (v) => 1 - smooth(v));
    const hingeTransform = useTransform(angle, (a) => (portrait ? `rotateX(${a}deg)` : `rotateY(${-a}deg)`));
    const deviceTransform = useTransform(lift, (l) => portrait
        ? `translate3d(0, ${(dh / 4) * l}px, 0) rotateX(${14 * l}deg) rotateZ(${-2 * l}deg) scale(${1 - 0.08 * l})`
        : `translate3d(${(dw / 4) * l}px, 0, 0) rotateY(${-16 * l}deg) rotateX(${8 * l}deg)`);
    const crease = useTransform(angle, (a) => Math.sin((Math.PI * a) / 180) * 0.9);
    const [isOpen, setIsOpen] = useState(false);
    const [shut, setShut] = useState(true);
    useMotionValueEvent(open, "change", (v) => {
        setIsOpen(smooth(v) >= 0.995);
        setShut(smooth(v) < 0.02);
    });
    // ---------- finish, clock, project sheet ----------
    const [finish, setFinish] = useState(props.finish);
    useEffect(() => setFinish(props.finish), [props.finish]);
    const [f1, f2, f3] = FINISHES[finish];
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 15000);
        return () => clearInterval(t);
    }, []);
    const [active, setActive] = useState(null);
    useEffect(() => {
        if (!isOpen)
            setActive(null);
    }, [isOpen]);
    useEffect(() => {
        const k = (e) => e.key === "Escape" && setActive(null);
        window.addEventListener("keydown", k);
        return () => window.removeEventListener("keydown", k);
    }, []);
    const frame = `linear-gradient(135deg, ${f1}, ${f2} 55%, ${f3})`;
    const faceBase = {
        position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
        background: frame, backgroundSize: `${dw}px ${dh}px`,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.14), inset 0 0 0 2px rgba(0,0,0,.35)",
    };
    const halfA = portrait
        ? { position: "absolute", left: 0, right: 0, top: 0, height: "50%", transformStyle: "preserve-3d" }
        : { position: "absolute", top: 0, bottom: 0, left: 0, width: "50%", transformStyle: "preserve-3d" };
    const halfB = portrait
        ? { position: "absolute", left: 0, right: 0, top: "50%", height: "50%", transformStyle: "preserve-3d", transformOrigin: "50% 0" }
        : { position: "absolute", top: 0, bottom: 0, left: "50%", width: "50%", transformStyle: "preserve-3d", transformOrigin: "0 50%" };
    const radA = portrait ? `${r}px ${r}px 0 0` : `${r}px 0 0 ${r}px`;
    const radB = portrait ? `0 0 ${r}px ${r}px` : `0 ${r}px ${r}px 0`;
    const paneA = portrait
        ? { inset: `${bz}px ${bz}px 0 ${bz}px`, borderRadius: `${ri}px ${ri}px 0 0` }
        : { inset: `${bz}px 0 ${bz}px ${bz}px`, borderRadius: `${ri}px 0 0 ${ri}px` };
    const paneB = portrait
        ? { inset: `0 ${bz}px ${bz}px ${bz}px`, borderRadius: `0 0 ${ri}px ${ri}px` }
        : { inset: `${bz}px ${bz}px ${bz}px 0`, borderRadius: `0 ${ri}px ${ri}px 0` };
    const screenW = dw - 2 * bz, screenH = dh - 2 * bz;
    const creaseA = portrait ? "linear-gradient(0deg,rgba(0,0,0,.75),rgba(0,0,0,0) 45%)" : "linear-gradient(270deg,rgba(0,0,0,.75),rgba(0,0,0,0) 45%)";
    const creaseB = portrait ? "linear-gradient(180deg,rgba(0,0,0,.75),rgba(0,0,0,0) 45%)" : "linear-gradient(90deg,rgba(0,0,0,.75),rgba(0,0,0,0) 45%)";
    // a static copy of the display for each folding half; the interactive one takes over when fully open
    const copy = (offset) => (<div aria-hidden style={{ position: "absolute", width: screenW, height: screenH, overflow: "hidden", pointerEvents: "none", ...offset }}>
            <Display {...props} compact={screenW < 620} interactive={false} onOpen={() => { }}/>
        </div>);
    return (<div ref={track} style={{ ...style, position: "relative", width: "100%", height: `${scrollLength * 100}vh` }}>
            <div ref={stage} style={{
            position: "sticky", top: 0, height: "100vh", overflow: "hidden",
            background: `radial-gradient(120% 80% at 50% 115%, ${accent}29, transparent 60%), ${background}`,
            perspective: 2400, perspectiveOrigin: "50% 40%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "Inter, system-ui, sans-serif", color: "#f2f1ee",
        }}>
                <motion.div style={{ position: "relative", width: dw, height: dh, transformStyle: "preserve-3d", transform: deviceTransform }}>
                    <div style={{ position: "absolute", left: "8%", right: "8%", bottom: "-7%", height: "12%", borderRadius: "50%", background: "rgba(0,0,0,.6)", filter: "blur(28px)" }}/>

                    {/* fixed half */}
                    <div style={halfA}>
                        <div style={{ ...faceBase, borderRadius: radA }}>
                            <div style={{ position: "absolute", overflow: "hidden", background, visibility: shut ? "hidden" : "visible", ...paneA }}>
                                {copy({ left: 0, top: 0 })}
                                <motion.div style={{ position: "absolute", inset: 0, background: creaseA, opacity: crease }}/>
                            </div>
                        </div>
                    </div>

                    {/* folding half: inner screen on the front, cover screen on the back */}
                    <motion.div style={{ ...halfB, transform: hingeTransform }}>
                        <div style={{ ...faceBase, borderRadius: radB, backgroundPosition: portrait ? `0 ${-dh / 2}px` : `${-dw / 2}px 0` }}>
                            <div style={{ position: "absolute", overflow: "hidden", background, ...paneB }}>
                                {copy(portrait ? { left: 0, top: bz - dh / 2 } : { left: bz - dw / 2, top: 0 })}
                                <motion.div style={{ position: "absolute", inset: 0, background: creaseB, opacity: crease }}/>
                            </div>
                        </div>
                        <div style={{ ...faceBase, borderRadius: radA, transform: `${portrait ? "rotateX" : "rotateY"}(180deg) translateZ(1px)` }}>
                            <Cover inset={bz} radius={ri} now={now} name={name} role={role} accent={accent} headingFont={headingFont}/>
                        </div>
                    </motion.div>

                    {/* the live, interactive display */}
                    <div 
    // inert is a valid DOM attribute
    inert={isOpen ? undefined : ""} style={{ position: "absolute", inset: bz, borderRadius: ri, overflow: "hidden", background, opacity: isOpen ? 1 : 0, visibility: isOpen ? "visible" : "hidden" }}>
                        <div style={{ position: "absolute", inset: 0, overflowY: "auto", overflowX: "hidden" }}>
                            <Display {...props} compact={screenW < 620} interactive onOpen={setActive}/>
                        </div>
                        <ProjectSheet {...props} index={active} onClose={() => setActive(null)}/>
                    </div>
                </motion.div>

                <div style={{ position: "absolute", left: 0, right: 0, bottom: "clamp(14px,3.5vh,34px)", display: "flex", alignItems: "center", justifyContent: "center", gap: 16, fontSize: 12, letterSpacing: ".08em", color: "rgba(255,255,255,.6)" }}>
                    {showFinishPicker && (<div role="group" aria-label="Frame finish" style={{ display: "flex", gap: 8, padding: 6, borderRadius: 999, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)" }}>
                            {Object.keys(FINISHES).map((k) => (<button key={k} aria-label={k} aria-pressed={finish === k} onClick={() => setFinish(k)} style={{ width: 22, height: 22, borderRadius: "50%", padding: 0, cursor: "pointer", border: `2px solid ${finish === k ? "#fff" : "transparent"}`, background: `linear-gradient(135deg, ${FINISHES[k][0]}, ${FINISHES[k][1]})` }}/>))}
                        </div>)}
                    <span>{isOpen ? "Scroll up to fold" : "Scroll to unfold"}</span>
                </div>
            </div>
        </div>);
}
function Cover({ inset, radius, now, name, role, accent, headingFont }) {
    const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).replace(/\s?[AP]M$/i, "");
    const day = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
    const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    return (<div style={{ position: "absolute", inset, borderRadius: radius, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "clamp(14px,6%,28px)", background: `radial-gradient(90% 60% at 30% 0%, ${accent}59, transparent 60%), radial-gradient(80% 60% at 100% 100%, rgba(36,64,255,.28), transparent 60%), #0d0d0f` }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, letterSpacing: ".08em", color: "rgba(255,255,255,.7)" }}>
                <span>{initials}</span>
                <span>Portfolio</span>
            </div>
            <div>
                <div style={{ fontFamily: headingFont, fontWeight: 900, fontSize: "clamp(44px,9vmin,96px)", lineHeight: 0.9, letterSpacing: "-.02em" }}>{time}</div>
                <div style={{ marginTop: 8, fontSize: 14, color: "rgba(255,255,255,.7)" }}>{day}</div>
            </div>
            <div>
                <div style={{ fontFamily: headingFont, fontWeight: 700, fontSize: "clamp(18px,2.6vmin,26px)", lineHeight: 1.05 }}>{name}</div>
                <div style={{ marginTop: 4, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: accent }}>{role}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 12, color: "rgba(255,255,255,.65)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent }}/>
                    Scroll to unfold
                </div>
            </div>
        </div>);
}
function Reveal({ children, delay = 0, live }) {
    if (!live)
        return <div>{children}</div>;
    return (<motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.7, ease, delay }}>
            {children}
        </motion.div>);
}
function Display(p) {
    const { compact, interactive, accent, headingFont } = p;
    const pad = compact ? 20 : 48;
    const muted = "#8e8d93", line = "rgba(255,255,255,.09)", surface = "#151517";
    const H = (s = {}) => ({ fontFamily: headingFont, margin: 0, ...s });
    const tabIndex = interactive ? 0 : -1;
    const head = (title, aside) => (<div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${line}` }}>
            <h3 style={H({ fontWeight: 700, fontSize: compact ? 22 : 30 })}>{title}</h3>
            <span style={{ color: muted, fontSize: 13 }}>{aside}</span>
        </div>);
    return (<div style={{ fontSize: compact ? 14 : 15, lineHeight: 1.55 }}>
            <header style={{ position: "sticky", top: 0, zIndex: 3, display: "flex", alignItems: "center", gap: 20, padding: `16px ${pad}px`, background: `linear-gradient(${p.background} 60%, transparent)` }}>
                <span style={H({ fontWeight: 700, fontSize: 17 })}>{p.name}</span>
                {!compact && (<nav style={{ display: "flex", gap: 18, marginLeft: "auto", color: muted }}>
                        <span>Work</span><span>About</span><span>Contact</span>
                    </nav>)}
                <a tabIndex={tabIndex} href={`mailto:${p.email}`} style={{ marginLeft: compact ? "auto" : 0, padding: "8px 14px", borderRadius: 999, background: "#f2f1ee", color: "#0b0b0c", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>Email ↗</a>
            </header>

            <section style={{ padding: `${compact ? 28 : 72}px ${pad}px ${compact ? 28 : 56}px` }}>
                <p style={{ display: "inline-flex", alignItems: "center", gap: 8, margin: "0 0 18px", padding: "6px 12px", border: `1px solid ${line}`, borderRadius: 999, color: muted, fontSize: 13 }}>
                    <b style={{ width: 7, height: 7, borderRadius: "50%", background: "#2bd46b" }}/>
                    {p.role} · {p.location}
                </p>
                <h2 style={H({ fontWeight: 900, fontSize: compact ? 44 : "clamp(48px, 8vw, 120px)", lineHeight: 0.88, letterSpacing: "-.035em" })}>
                    {p.headline} <span style={{ color: accent }}>{p.headlineAccent}</span>
                </h2>
                <p style={{ maxWidth: "34em", margin: "22px 0 0", color: muted, fontSize: compact ? 15 : 17 }}>{p.lede}</p>
            </section>

            <section style={{ padding: `24px ${pad}px` }}>
                <Reveal live={interactive}>{head("Selected work", `${String(p.projects.length).padStart(2, "0")} projects`)}</Reveal>
                <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "repeat(2, minmax(0,1fr))", gap: 16 }}>
                    {p.projects.map((pr, i) => (<Reveal key={i} live={interactive} delay={(i % 2) * 0.07}>
                            <motion.button tabIndex={tabIndex} onClick={() => interactive && p.onOpen(i)} whileHover={interactive ? { y: -4 } : undefined} transition={{ duration: 0.45, ease }} style={{ gridColumn: !compact && i === 0 ? "1 / -1" : undefined, display: "flex", flexDirection: "column", width: "100%", padding: 0, border: `1px solid ${line}`, borderRadius: 20, background: surface, color: "inherit", font: "inherit", textAlign: "left", cursor: "pointer", overflow: "hidden" }}>
                                <span style={{ position: "relative", display: "block", aspectRatio: !compact && i === 0 ? "21/9" : "16/9", overflow: "hidden", borderRadius: 14, margin: "8px 8px 0", background: "#000" }}>
                                    {pr.image?.src && <motion.img src={pr.image.src} srcSet={pr.image.srcSet} alt={pr.image.alt || ""} whileHover={interactive ? { scale: 1.05 } : undefined} transition={{ duration: 0.8, ease }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}/>}
                                </span>
                                <span style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "4px 14px", padding: "14px 16px 16px" }}>
                                    <span style={{ color: muted, fontSize: 13 }}>{String(i + 1).padStart(2, "0")}</span>
                                    <span style={H({ fontWeight: 700, fontSize: 19, lineHeight: 1.1 })}>{pr.title}</span>
                                    <span style={{ gridRow: "1 / span 2", gridColumn: 3, display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: "50%", border: `1px solid ${line}` }}>↗</span>
                                    <span style={{ gridColumn: 2, color: muted, fontSize: 13 }}>{pr.kind}</span>
                                    <span style={{ gridColumn: "2 / -1", display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                                        {pr.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (<span key={t} style={{ padding: "3px 9px", borderRadius: 999, background: "rgba(255,255,255,.06)", color: muted, fontSize: 12 }}>{t}</span>))}
                                    </span>
                                </span>
                            </motion.button>
                        </Reveal>))}
                </div>
            </section>

            <section style={{ padding: `24px ${pad}px` }}>
                <Reveal live={interactive}>{head("About", p.links[0]?.label || "")}</Reveal>
                <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "1.3fr 1fr", gap: 32 }}>
                    <Reveal live={interactive}>
                        <p style={{ margin: "0 0 12px", fontSize: compact ? 17 : 19, lineHeight: 1.35 }}>{p.aboutLead}</p>
                        {p.about.split(/\n+/).map((para, i) => <p key={i} style={{ margin: "0 0 12px", color: "#c9c8cd" }}>{para}</p>)}
                    </Reveal>
                    <Reveal live={interactive} delay={0.07}>
                        <ul style={{ margin: 0, padding: 0, listStyle: "none", borderTop: `1px solid ${line}` }}>
                            {p.facts.map((f) => (<li key={f.label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: `1px solid ${line}` }}>
                                    <span style={{ color: muted }}>{f.label}</span>{f.value}
                                </li>))}
                        </ul>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 16 }}>
                            {p.stack.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (<span key={t} style={{ padding: "5px 11px", border: `1px solid ${line}`, borderRadius: 999, fontSize: 12, color: "#c9c8cd" }}>{t}</span>))}
                        </div>
                    </Reveal>
                </div>
            </section>

            <section style={{ padding: `24px ${pad}px` }}>
                <Reveal live={interactive}>{head("Contact", "Open to work")}</Reveal>
                <Reveal live={interactive}>
                    <a tabIndex={tabIndex} href={`mailto:${p.email}`} style={H({ display: "inline-block", fontWeight: 900, fontSize: compact ? 30 : "clamp(36px, 6vw, 92px)", lineHeight: 0.95, letterSpacing: "-.03em", color: "inherit", textDecoration: "none" })}>{p.email}</a>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
                        {p.links.map((l) => (<a key={l.url} tabIndex={tabIndex} href={l.url} target="_blank" rel="noopener" style={{ padding: "9px 15px", border: `1px solid ${line}`, borderRadius: 999, color: "inherit", textDecoration: "none" }}>{l.label} ↗</a>))}
                    </div>
                </Reveal>
            </section>

            <footer style={{ display: "flex", justifyContent: "space-between", padding: `22px ${pad}px 28px`, marginTop: 32, borderTop: `1px solid ${line}`, color: muted, fontSize: 13 }}>
                <span>© {new Date().getFullYear()} {p.name}</span><span>{p.location}</span>
            </footer>
        </div>);
}
function ProjectSheet(p) {
    const pr = p.index === null ? null : p.projects[p.index];
    const line = "rgba(255,255,255,.09)";
    return (<motion.div role="dialog" aria-modal="true" aria-label={pr?.title || "Project"} onClick={(e) => e.target === e.currentTarget && p.onClose()} initial={false} animate={{ opacity: pr ? 1 : 0 }} transition={{ duration: 0.35 }} style={{ position: "absolute", inset: 0, zIndex: 5, background: "rgba(5,5,6,.55)", backdropFilter: "blur(6px)", pointerEvents: pr ? "auto" : "none" }}>
            <motion.div initial={false} animate={{ y: pr ? "0%" : "102%" }} transition={{ duration: 0.6, ease: [0.2, 0.9, 0.2, 1] }} style={{ position: "absolute", left: 16, right: 16, top: 16, bottom: 0, overflowY: "auto", borderRadius: "22px 22px 0 0", background: "#151517", border: `1px solid ${line}`, borderBottom: 0, padding: "clamp(18px, 3vw, 40px)" }}>
                {pr && (<>
                        <button onClick={p.onClose} aria-label="Close project" style={{ position: "sticky", top: 0, float: "right", width: 38, height: 38, borderRadius: "50%", border: `1px solid ${line}`, background: "#1d1d20", color: "#f2f1ee", cursor: "pointer", fontSize: 18 }}>✕</button>
                        <p style={{ margin: "0 0 8px", color: p.accent, fontSize: 13, letterSpacing: ".12em", textTransform: "uppercase" }}>{String((p.index ?? 0) + 1).padStart(2, "0")} — {pr.kind}</p>
                        <h3 style={{ margin: 0, fontFamily: p.headingFont, fontWeight: 900, fontSize: "clamp(32px, 5vw, 80px)", lineHeight: 0.9, letterSpacing: "-.03em" }}>{pr.title}</h3>
                        <p style={{ maxWidth: "42em", margin: "16px 0 0", color: "#c9c8cd", fontSize: 16 }}>{pr.description}</p>
                        <a href={pr.link} target="_blank" rel="noopener" style={{ display: "inline-flex", marginTop: 20, padding: "8px 14px", borderRadius: 999, background: "#f2f1ee", color: "#0b0b0c", fontWeight: 600, textDecoration: "none" }}>{pr.linkLabel} ↗</a>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 22 }}>
                            {[pr.image, ...(pr.gallery || [])].filter((im) => !!im?.src).map((im, i) => (<img key={i} src={im.src} srcSet={im.srcSet} alt={im.alt || `${pr.title} screenshot`} style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", borderRadius: 14, background: "#000" }}/>))}
                        </div>
                    </>)}
            </motion.div>
        </motion.div>);
}
const SITE = "https://lennonh.com/img/work/";
const img = (n, alt) => ({ src: `${SITE}${n}.jpg`, alt });
FoldfolioSection.defaultProps = {
    name: "Lennon Helman",
    role: "Software developer",
    location: "Greencastle, PA",
    email: "lenodrips@gmail.com",
    links: [
        { label: "GitHub", url: "https://github.com/lenodrips-create" },
        { label: "keplerbrowser.org", url: "https://keplerbrowser.org" },
    ],
    headline: "I build what",
    headlineAccent: "I imagine.",
    lede: "Browsers, dev tools and the web: the engine, the interface and the page that tells people about it.",
    aboutLead: "I'm Lennon. I build what I imagine.",
    about: "I'm a developer who likes building the whole thing: the engine, the interface and the page that tells people about it.\nMost of my work starts as a question. Could I make my own web browser? That became Kepler, written in C++ on Qt and Chromium. Could a full code studio run inside a browser tab? That became CTerm Studio, with a C core compiled to WebAssembly.\nI care about how software feels as much as what it does: fast, private, and a little bit cinematic.",
    facts: [
        { label: "Handle", value: "@lenodrips" },
        { label: "Focus", value: "Browsers, dev tools, the web" },
        { label: "Based in", value: "Greencastle, PA" },
        { label: "Public projects", value: "5" },
    ],
    stack: "C++, Qt 6, Rust, C, WebAssembly, JavaScript, React, Vite, CMake, HyperFrames",
    projects: [
        { title: "Kepler", kind: "Desktop browser", description: "A web browser from another orbit, written in C++ on Qt 6 and Chromium: a built-in tracker blocker, private Orbit windows, session restore and an animated new-tab page.", tags: "C++17, Qt 6, Qt WebEngine, CMake", link: "https://github.com/lenodrips-create/kepler", linkLabel: "View on GitHub", image: img("01", "Kepler browser"), gallery: [img("02", "Kepler start page"), img("03", "Kepler browsing")] },
        { title: "keplerbrowser.org", kind: "Website + Rust server", description: "The download and docs site for Kepler, served by a zero-dependency Rust release server with a JSON releases API.", tags: "Rust, HTML, CSS, JavaScript", link: "https://keplerbrowser.org", linkLabel: "Visit keplerbrowser.org", image: img("04", "keplerbrowser.org home"), gallery: [img("05", "Features page"), img("06", "Security page")] },
        { title: "CTerm Studio", kind: "Browser code studio", description: "An editor, live preview, file explorer and two shells in one page, all running on a C core compiled to WebAssembly.", tags: "C, WebAssembly, React 19, Vite", link: "https://github.com/lenodrips-create/cterm-studio", linkLabel: "View on GitHub", image: img("11", "CTerm Studio editor"), gallery: [img("12", "Windows layer"), img("13", "Landing page")] },
        { title: "FORGIVN", kind: "Storefront", description: "A clothing storefront in one dependency-free file: dove intro, filterable products, a saved cart, a contact form and scroll animations.", tags: "HTML, CSS, JavaScript", link: "https://github.com/lenodrips-create/zay-website", linkLabel: "View on GitHub", image: img("14", "FORGIVN home"), gallery: [img("16", "Cross collection"), img("20", "Mobile")] },
        { title: "This portfolio", kind: "Interactive site", description: "A HyperFrames showreel, a laptop with a living picture strip and this foldable phone.", tags: "HyperFrames, GSAP, CSS 3D, JavaScript", link: "https://github.com/lenodrips-create/lennon-sells", linkLabel: "View on GitHub", image: img("21", "Portfolio intro") },
    ],
    accent: "#ff3d00",
    background: "#0b0b0c",
    finish: "graphite",
    showFinishPicker: true,
    headingFont: '"League Spartan", "Inter", sans-serif',
    scrollLength: 3,
};
const imageControl = { type: ControlType.ResponsiveImage, title: "Image" };
addPropertyControls(FoldfolioSection, {
    name: { type: ControlType.String, title: "Name" },
    role: { type: ControlType.String, title: "Role" },
    location: { type: ControlType.String, title: "Location" },
    email: { type: ControlType.String, title: "Email" },
    headline: { type: ControlType.String, title: "Headline" },
    headlineAccent: { type: ControlType.String, title: "Accent words" },
    lede: { type: ControlType.String, title: "Intro", displayTextArea: true },
    projects: {
        type: ControlType.Array,
        title: "Projects",
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title" },
                kind: { type: ControlType.String, title: "Kind" },
                description: { type: ControlType.String, title: "Text", displayTextArea: true },
                tags: { type: ControlType.String, title: "Tags", placeholder: "Comma, separated" },
                link: { type: ControlType.Link, title: "Link" },
                linkLabel: { type: ControlType.String, title: "Link label" },
                image: imageControl,
                gallery: { type: ControlType.Array, title: "Gallery", control: imageControl },
            },
        },
    },
    aboutLead: { type: ControlType.String, title: "About lead" },
    about: { type: ControlType.String, title: "About", displayTextArea: true },
    facts: {
        type: ControlType.Array,
        title: "Facts",
        control: { type: ControlType.Object, controls: { label: { type: ControlType.String }, value: { type: ControlType.String } } },
    },
    stack: { type: ControlType.String, title: "Stack", placeholder: "Comma, separated" },
    links: {
        type: ControlType.Array,
        title: "Links",
        control: { type: ControlType.Object, controls: { label: { type: ControlType.String }, url: { type: ControlType.Link } } },
    },
    accent: { type: ControlType.Color, title: "Accent" },
    background: { type: ControlType.Color, title: "Background" },
    finish: { type: ControlType.Enum, title: "Frame", options: ["graphite", "silver", "ember"], optionTitles: ["Graphite", "Silver", "Ember"] },
    showFinishPicker: { type: ControlType.Boolean, title: "Finish picker" },
    headingFont: { type: ControlType.String, title: "Heading font" },
    scrollLength: { type: ControlType.Number, title: "Scroll length", min: 2, max: 6, step: 0.5, unit: "× screen" },
});
