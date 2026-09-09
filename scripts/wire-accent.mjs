// Barra superior con el color de la carrera (logo, enlace activo) + tema global.
// - MarketplaceStitch usa el tema global en vez de estado local.
// - Bazar/Monetiza/Legal tiñen logo y enlace activo con el acento global.
// - StitchAuth se tiñe en su propio archivo (editar manual ya aplicado).
// Idempotente (marca LIVE-ACCENT).
// Uso: node scripts/wire-accent.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, "..", "apps", "web", "src", "stitch");
const MARK = "/* LIVE-ACCENT v1 */";

function must(cond, msg) {
  if (!cond) throw new Error("wire-accent: " + msg);
}
const load = (f) => fs.readFileSync(path.join(dir, f), "utf8");
const save = (f, s) => fs.writeFileSync(path.join(dir, f), s);

const LOGO_ANCHOR = '<span className="font-headline-sm text-headline-sm text-primary tracking-tight">';
const ACTIVE_ANCHOR =
  'aria-current="page" className="px-space-md py-space-sm transition-all bg-surface-container-high text-primary font-semibold rounded-lg"';

function tintHeader(s, f) {
  must(s.includes(LOGO_ANCHOR), `${f} logo`);
  s = s.replace(
    LOGO_ANCHOR,
    '<span style={accent ? { color: accent.color } : undefined} className="font-headline-sm text-headline-sm text-primary tracking-tight">'
  );
  if (s.includes(ACTIVE_ANCHOR)) {
    s = s.replace(
      ACTIVE_ANCHOR,
      'style={accent ? { backgroundColor: accent.soft, color: accent.color } : undefined} ' + ACTIVE_ANCHOR
    );
  } else {
    // LegalStitch: su enlace activo no trae resaltado de origen; se le da el del acento.
    const legalAnchor =
      'data-path="marco-legal-y-etica-academica" href="#">';
    must(s.includes(legalAnchor), `${f} active`);
    s = s.replace(
      legalAnchor,
      'style={accent ? { backgroundColor: accent.soft, color: accent.color } : undefined} ' + legalAnchor
    );
  }
  return s;
}

// ---------- Marketplace: tema global ----------
{
  const f = "MarketplaceStitch.tsx";
  let s = load(f);
  if (!s.includes(MARK)) {
    must(s.includes('import { UNSA_CAREERS, careerOf } from "../data/unsa";'), "market unsa import");
    s = s.replace(
      'import { UNSA_CAREERS, careerOf } from "../data/unsa";',
      'import { UNSA_CAREERS } from "../data/unsa";\nimport { useCareerTheme } from "../live/careerTheme";'
    );
    const initBlock = `  const [liveCareer, setLiveCareer] = useState(() => {
    const c = new URLSearchParams(window.location.search).get("career") ?? "all";
    return c === "all" || CAREER_KEYS.includes(c) ? c : "all";
  });`;
    must(s.includes(initBlock), "market init");
    s = s.replace(initBlock, "  const { career: liveCareer, setCareer: setLiveCareer, accent } = useCareerTheme();");
    const effectBlock = `  const { user } = useAuth();
  const appliedProfile = useRef(false);
  useEffect(() => {
    const hasParam = new URLSearchParams(window.location.search).has("career");
    const pc = user?.profile?.career;
    if (!hasParam && !appliedProfile.current && pc && CAREER_KEYS.includes(pc)) {
      appliedProfile.current = true;
      setLiveCareer(pc);
    }
  }, [user]);`;
    must(s.includes(effectBlock), "market profile effect");
    s = s.replace(effectBlock, "");
    must(s.includes('const accent = liveCareer === "all" ? null : careerOf(liveCareer);'), "market accent line");
    s = s.replace('const accent = liveCareer === "all" ? null : careerOf(liveCareer);', "");
    s = tintHeader(s, f);
    s += `\n${MARK}\n`;
    save(f, s);
    console.log(`${f}: tema global + header con acento`);
  } else console.log(`${f}: ya con acento, se omite`);
}

// ---------- Bazar / Monetiza / Legal: tiñen su header ----------
for (const [f, fn] of [
  ["BazarStitch.tsx", "BazarStitch"],
  ["MonetizaStitch.tsx", "MonetizaStitch"],
  ["LegalStitch.tsx", "LegalStitch"],
]) {
  let s = load(f);
  if (s.includes(MARK)) {
    console.log(`${f}: ya con acento, se omite`);
    continue;
  }
  const imp = 'import { StitchAuth } from "../live/StitchAuth";';
  must(s.includes(imp), `${f} import auth`);
  s = s.replace(imp, `${imp}\nimport { useCareerTheme } from "../live/careerTheme";`);
  const open = `export function ${fn}() {`;
  must(s.includes(open), `${f} open`);
  s = s.replace(open, `${open}\n  const { accent } = useCareerTheme();`);
  s = tintHeader(s, f);
  s += `\n${MARK}\n`;
  save(f, s);
  console.log(`${f}: header con acento`);
}

console.log("wire-accent OK");
