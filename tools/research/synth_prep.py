#!/usr/bin/env python3
"""Synthesis prep for vibe-fence: extract per-stream, per-contributor structure
from every contributor file so the synthesis step compares like with like.

Usage: python3 synth_prep.py [stream_filter]
"""
import os, re, json, sys, glob

ROOT = "/Users/poferraz/Documents/Development/active/vibe-fence"
CONTRIB = os.path.join(ROOT, "docs/research/contributors")
STREAMS = {
    "01": "harnesses", "02": "harness-influence", "03": "elicitation",
    "04": "guardrails", "05": "companion-ux", "06": "meta-models",
}

def clean(t):
    return t.replace("**", "").replace("`", "").strip()

def extract(path):
    body = open(path, encoding="utf-8").read()
    d = {"file": path, "bytes": len(body), "lines": body.count("\n") + 1}

    # header fields
    for key in ("Model", "Provider", "Date", "Stream"):
        m = re.search(rf"\*\*.{{0,3}}{key}:{{0,3}}\*\*\s*(.+)", body)
        if not m:
            m = re.search(rf"^-\s*\*{key}\*\*\s*[:\-]?\s*(.+)$", body, re.M)
        d[key.lower()] = clean(m.group(1)) if m else "?"

    # sources table — row ids vary by contributor: 1, S-01, S01, etc.
    m = re.search(r"^#+.*\bSources\b", body, re.M | re.I)
    if m:
        tail = body[m.end():]
        nxt = re.search(r"^##\s", tail, re.M)
        sec = tail[:nxt.start()] if nxt else tail
        # a data row starts with | then an id token (digits, S-01, S01, #1 ...)
        rows = re.findall(r"^\|\s*([A-Za-z#]?[A-Za-z0-9_.#-]*)\s*\|(.*)$", sec, re.M)
        rows = [(i, r) for i, r in rows if i and not re.fullmatch(r"[-: ]*", i)
                and not i.lower() in ("source", "source url", "#", "id", "no", "n")]
        d["sources"] = len(rows)
        urls = set()
        for _, rest in rows:
            for u in re.findall(r"https?://[^\s,;)\]]+", rest):
                urls.add(u.rstrip("/").rstrip("."))
        d["unique_source_urls"] = len(urls)
        d["source_ids"] = [i for i, _ in rows][:60]
    else:
        d["sources"] = 0
        d["unique_source_urls"] = 0
        d["source_ids"] = []

    # all urls anywhere in file
    d["all_unique_urls"] = len(set(re.findall(r"https?://[^\s,;)\]]+", body)))

    # headings (findings)
    d["headings"] = [clean(h) for h in re.findall(r"^#{2,4}\s+(.+)$", body, re.M)]

    # strength tags
    d["proven"] = len(re.findall(r"\bproven\b", body))
    d["practiced"] = len(re.findall(r"\bpracticed\b", body))
    d["contested"] = len(re.findall(r"\bcontested\b", body))
    d["block"] = len(re.findall(r"\bblock\b", body, re.I))
    d["warn"] = len(re.findall(r"\bwarn\b", body, re.I))
    d["nudge"] = len(re.findall(r"\bnudge\b", body, re.I))

    # implications — numbered list items
    imp = re.findall(r"^\s*(\d+)\.\s+(.{0,150})", body, re.M)
    d["implication_count"] = len(imp)
    d["implications"] = [clean(x[1])[:140] for x in imp]

    # verbs in implications
    verbs = re.findall(r"^\s*\d+\.\s+\*\*([A-Z]+)", body, re.M)
    d["implication_verbs"] = {v: verbs.count(v) for v in set(verbs)}

    d["has_gaps"] = bool(re.search(r"^#+.*\bGaps\b", body, re.M | re.I))
    d["has_implications"] = bool(re.search(r"^#+.*\bImplications\b", body, re.M | re.I))
    d["has_sources"] = d["sources"] > 0
    return d

def main():
    filt = sys.argv[1] if len(sys.argv) > 1 else None
    out = {}
    for cont in sorted(os.listdir(CONTRIB)):
        if cont.startswith("_"): continue
        cdir = os.path.join(CONTRIB, cont)
        if not os.path.isdir(cdir): continue
        for st, slug in STREAMS.items():
            if filt and st != filt: continue
            f = os.path.join(cdir, f"{st}-{slug}.md")
            if os.path.exists(f):
                out.setdefault(st, {})[cont] = extract(f)

    for st in sorted(out):
        print("=" * 100)
        print(f"STREAM {st} — {STREAMS[st]}   ({len(out[st])} contributors)")
        print("=" * 100)
        for cont, d in sorted(out[st].items()):
            flags = []
            if not d["has_gaps"]: flags.append("NO-GAPS")
            if not d["has_implications"]: flags.append("NO-IMPL")
            if not d["has_sources"]: flags.append("NO-SOURCES")
            if d["sources"] < 20: flags.append(f"THIN-SOURCES({d['sources']})")
            if d["implication_count"] < 8: flags.append(f"FEW-IMPL({d['implication_count']})")
            print(f"  {cont}")
            print(f"     {d['bytes']:>6}b  {d['lines']:>4}ln  sources={d['sources']:<3} "
                  f"urls={d['unique_source_urls']:<3} impl={d['implication_count']:<3} "
                  f"tags[p/p/c]={d['proven']}/{d['practiced']}/{d['contested']}  "
                  f"{' '.join(flags) if flags else 'OK'}")
        print()

    # cross-contributor overlap per stream
    if filt:
        print("=" * 100)
        print(f"SOURCE OVERLAP for stream {filt}")
        print("=" * 100)
        items = out[filt]
        sets = {}
        for cont, d in items.items():
            body = open(d["file"], encoding="utf-8").read()
            sets[cont] = {u.rstrip("/").rstrip(".").lower()
                          for u in re.findall(r"https?://[^\s,;)\]]+", body)}
        names = sorted(sets)
        print("\nUnique to ONE contributor (the differentiating evidence):")
        for c in names:
            others = set().union(*[sets[o] for o in names if o != c]) if len(names) > 1 else set()
            only = sets[c] - others
            print(f"\n  {c}  ({len(only)} unique):")
            for u in sorted(only)[:20]:
                print(f"      {u}")

    json.dump(out, open("/Users/poferraz/.hermes/cache/scratch/synth_prep.json", "w"), indent=1)

if __name__ == "__main__":
    main()
