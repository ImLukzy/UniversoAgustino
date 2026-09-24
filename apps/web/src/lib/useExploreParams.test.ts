import { beforeEach, describe, expect, it, vi } from "vitest";

// Sin jsdom: un mini render de hooks (useState/useRef/useEffect) basta para
// probar la sincronización URL ↔ tema de carrera de /explorar (spec 14, T8).
const h = vi.hoisted(() => {
  type Effect = { fn: () => void; deps: unknown[] };
  const s = {
    slots: [] as unknown[],
    deps: [] as unknown[][],
    queue: [] as Effect[],
    i: 0,
    e: 0,
    dirty: false,
    url: new URLSearchParams(),
    replaced: 0,
    career: "all",
    setCareer: (c: string) => {
      s.career = c;
      s.dirty = true;
    },
    setParams: (next: URLSearchParams, opts?: { replace?: boolean }) => {
      s.url = new URLSearchParams(next);
      if (opts?.replace) s.replaced++;
      s.dirty = true;
    },
  };
  return s;
});

vi.mock("react", () => ({
  useState: <T,>(init: T | (() => T)) => {
    const i = h.i++;
    if (!(i in h.slots)) h.slots[i] = typeof init === "function" ? (init as () => T)() : init;
    const set = (v: T | ((p: T) => T)) => {
      h.slots[i] = typeof v === "function" ? (v as (p: T) => T)(h.slots[i] as T) : v;
      h.dirty = true;
    };
    return [h.slots[i], set];
  },
  useRef: <T,>(init: T) => {
    const i = h.i++;
    if (!(i in h.slots)) h.slots[i] = { current: init };
    return h.slots[i];
  },
  useEffect: (fn: () => void, deps: unknown[]) => {
    const e = h.e++;
    const prev = h.deps[e];
    if (!prev || deps.some((d, k) => !Object.is(d, prev[k]))) h.queue.push({ fn, deps });
    h.deps[e] = deps;
  },
}));

vi.mock("react-router-dom", () => ({ useSearchParams: () => [h.url, h.setParams] }));
vi.mock("../live/careerTheme", () => ({ useCareerTheme: () => ({ career: h.career, setCareer: h.setCareer }) }));

const { useExploreParams } = await import("./useExploreParams");
type Out = ReturnType<typeof useExploreParams>;
// Alias sin prefijo "use": el mini render llama al hook fuera de un componente a propósito.
const runHook = useExploreParams;

function render(): Out {
  let out!: Out;
  for (let n = 0; n < 20; n++) {
    h.i = h.e = 0;
    h.dirty = false;
    out = runHook();
    for (const q of h.queue.splice(0)) q.fn();
    if (!h.dirty) return out;
  }
  throw new Error("render sin estabilizar");
}

function mount(query: string, career = "all") {
  Object.assign(h, { slots: [], deps: [], queue: [], url: new URLSearchParams(query), replaced: 0, career });
  return render();
}

describe("useExploreParams", () => {
  beforeEach(() => mount(""));

  it("lee ?q y ?f de la URL; un filtro desconocido vale 'all'", () => {
    const a = mount("q=pae&f=free");
    expect([a.q, a.filter]).toEqual(["pae", "free"]);
    expect(mount("f=nope").filter).toBe("all");
  });

  it("?career= aplica la carrera al tema y la URL la conserva", () => {
    const out = mount("career=MEDICINA");
    expect(h.career).toBe("MEDICINA");
    expect(out.career).toBe("MEDICINA");
    expect(h.url.get("career")).toBe("MEDICINA");
  });

  it("una carrera inválida en la URL se ignora y se limpia", () => {
    mount("career=HACKER", "all");
    expect(h.career).toBe("all");
    expect(h.url.has("career")).toBe(false);
  });

  it("cambiar la carrera desde otro control actualiza la URL con replace", () => {
    mount("q=pae");
    h.setCareer("DERECHO");
    render();
    expect(h.url.get("career")).toBe("DERECHO");
    expect(h.url.get("q")).toBe("pae");
    expect(h.replaced).toBeGreaterThan(0);
  });

  it("q se guarda recortado y los valores por defecto no ensucian la URL", () => {
    const a = mount("f=docs");
    a.setQ("  anatomía ");
    a.setFilter("all");
    render();
    expect(h.url.get("q")).toBe("anatomía");
    expect(h.url.has("f")).toBe(false);
    expect(h.url.has("career")).toBe(false);
  });
});
