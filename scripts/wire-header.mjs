// Header Stitch: quita la cuenta falsa ("Lic. Sofía V."), pone sesión real (login/registro),
// ensancha el header (1200 -> 1440px) y conecta el selector de universidad a /?uni=.
// Idempotente (marca LIVE-HEADER).
// Uso: node scripts/wire-header.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, "..", "apps", "web", "src", "stitch");
const MARK = "/* LIVE-HEADER v1 */";
const FILES = ["MarketplaceStitch.tsx", "BazarStitch.tsx", "MonetizaStitch.tsx", "LegalStitch.tsx"];

function must(cond, msg) {
  if (!cond) throw new Error("wire-header: " + msg);
}

let changed = 0;
for (const f of FILES) {
  const p = path.join(dir, f);
  let s = fs.readFileSync(p, "utf8");
  if (s.includes(MARK)) {
    console.log(`${f}: ya parchado, se omite`);
    continue;
  }
  // 1. import StitchAuth
  const importAnchor = 'import { LiveBazarItems } from "../live/live";';
  const importMarket = 'import { LiveDocuments } from "../live/live";';
  if (s.includes(importAnchor)) {
    s = s.replace(importAnchor, `${importAnchor}\nimport { StitchAuth } from "../live/StitchAuth";\n${MARK}`);
  } else if (s.includes(importMarket)) {
    s = s.replace(importMarket, `${importMarket}\nimport { StitchAuth } from "../live/StitchAuth";\n${MARK}`);
  } else if (s.includes('import { useEffect, useState } from "react";')) {
    must(true, "unreachable");
    s = s.replace(
      'import { useEffect, useState } from "react";',
      `import { useEffect, useState } from "react";\nimport { StitchAuth } from "../live/StitchAuth";\n${MARK}`
    );
  } else {
    must(s.includes('import { useState } from "react";'), `${f} import base`);
    s = s.replace(
      'import { useState } from "react";',
      `import { useState } from "react";\nimport { StitchAuth } from "../live/StitchAuth";\n${MARK}`
    );
  }
  // 2. ensanchar header: 75rem (1200px) -> 90rem (1440px)
  must(s.includes("h-20 max-w-container-max mx-auto"), `${f} header ancho`);
  s = s.replace("h-20 max-w-container-max mx-auto", "h-20 max-w-[90rem] mx-auto");
  // 3. selector universidad del header -> filtra el marketplace real (/?uni=)
  must(/<option value="unsa">UNSA Biom/.test(s), `${f} uni`);
  s = s.replace(
    /(<select)([^>]*?>)(\s*<option value="unsa">UNSA Biom)/,
    `$1 onChange={(e) => { window.location.href = "/?uni=" + e.target.value; }}$2$3`
  );
  // 4. campana + cuenta falsa -> sesión real
  const bell = '<button aria-label="Notificaciones"';
  const bi = s.indexOf(bell);
  must(bi >= 0, `${f} campana`);
  const sof = s.indexOf("8vo ciclo</span>", bi);
  must(sof >= 0, `${f} cuenta falsa`);
  let ei = sof;
  for (let k = 0; k < 2; k++) {
    ei = s.indexOf("</div>", ei);
    must(ei >= 0, `${f} cierre ${k}`);
    ei += 6;
  }
  s = s.slice(0, bi) + `<StitchAuth />` + s.slice(ei);
  fs.writeFileSync(p, s);
  changed++;
  console.log(`${f}: cuenta falsa -> StitchAuth + header ancho + uni funcional`);
}
console.log(changed === 0 ? "wire-header: todo ya parchado" : `wire-header: ${changed} archivo(s) parchados`);
