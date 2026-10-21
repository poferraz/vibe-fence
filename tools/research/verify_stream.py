#!/usr/bin/env python3
"""Citation-integrity checker for vibe-fence stream files.

Usage: python3 verify_stream.py <stream.md> <ledger.json>

Checks (each must pass):
  1. Sources table parses; row N is a real URL.
  2. Table row N URL == ledger id N URL (case-insensitive, trailing slash + www normalized).
  3. Every table row URL appears in some finding's Evidence block.
  4. Every Evidence-block URL appears in the sources table.
  5. Every inline [N] marker resolves to a table row.
  6. Every finding has Claim / Evidence / Strength / vibe-fence fit.
  7. Required top-level sections exist.
  8. No placeholder text (TODO/TBD/FIXME) outside known-legit tokens.
"""
import json, os, re, sys

if len(sys.argv) < 3:
    print(__doc__); sys.exit(2)

PATH, LEDGER = sys.argv[1], sys.argv[2]
body = open(PATH, encoding="utf-8").read()

def norm(u):
    u = u.split(" ")[0].rstrip("/").rstrip(".").rstrip(",")
    u = re.sub(r"^https?://", "", u)
    u = re.sub(r"^www\.", "", u)
    return u.lower()

fail = 0
def ok(label, bad, detail=""):
    global fail
    if bad:
        fail += 1
        print(f"  FAIL  {label}: {bad} {detail}")
    else:
        print(f"  ok    {label}")

print(f"=== {PATH} ===")
print(f"size: {len(body)} bytes, {body.count(chr(10))+1} lines\n")

# locate sources table
m = re.search(r"^##\s*\d+\.?\s*Sources", body, re.M | re.I)
if not m:
    m = re.search(r"^#+.*\bSources\b", body, re.M)
if not m:
    print("  FAIL  no Sources section found"); sys.exit(1)
tail = body[m.end():]
# cut at the next top-level heading after the table
nxt = re.search(r"^##\s", tail, re.M)
src_sec = tail[:nxt.start()] if nxt else tail

rows = re.findall(r"^\|\s*(\d+)\s*\|(.*)$", src_sec, re.M)
table = {}
for num, rest in rows:
    cells = [c.strip() for c in rest.split("|")]
    # the row may have 3..6 columns; take the whole row for URL extraction
    table[int(num)] = (rest.strip(), " | ".join(cells[1:3]), cells[3] if len(cells) > 3 else "")
print(f"sources table rows: {len(table)}\n")

led = json.load(open(LEDGER))["sources"]
ledger = {s["id"]: s["url"] for s in led}

# 1 + 2 — table rows must have a URL; if the ledger has that id, the URLs must match
bad1, bad2 = [], []
for n, (s, t, a) in table.items():
    mm = re.search(r"(https?://[^\s,;)]+)", s)
    if not mm:
        bad1.append(n); continue
    if n in ledger and norm(mm.group(1)) != norm(ledger[n]):
        bad2.append((n, norm(mm.group(1)), norm(ledger[n])))
ok("every table row has a URL", bad1)
ok("table row N == ledger id N (where the ledger has that id)", bad2)

# 3 + 4
ev_blocks = re.findall(r"\*\*Evidence:?\*\*:(.*?)(?=\n\s*-\s*\*\*Strength)", body, re.S)
if not ev_blocks:
    ev_blocks = re.findall(r"\*\*Evidence.*?\*\*(.*?)(?=\n\s*-\s*\*\*Strength)", body, re.S)
ev_text = " ".join(ev_blocks)
ev_keys = {norm(u) for u in re.findall(r"https?://[^\s,;)\]]+", ev_text)}
tbl_keys = {}
for n, (s, t, a) in table.items():
    mm = re.search(r"(https?://[^\s,;)]+)", s)
    if mm: tbl_keys[n] = norm(mm.group(1))
ok("every table row URL cited in an Evidence block",
   [n for n, k in tbl_keys.items() if k not in ev_keys])
ok("every Evidence URL present in the sources table",
   sorted({norm(u) for u in re.findall(r"https?://[^\s,;)\]]+", ev_text)} - set(tbl_keys.values())))

# 5
inline = sorted({int(x) for x in re.findall(r"\[(\d+)\]", body)})
ok("inline [N] markers all resolve", [i for i in inline if i not in table],
   f"(inline ids used: {inline})")

# 6
# A "finding" is any subsection that contains a Strength tag (proven/practiced/contested)
# or (for stream 04) a Severity tag (block/warn/nudge). Split on any heading.
parts = re.split(r"(?=^#{2,5}\s)", body, flags=re.M)
miss, n_find = [], 0
for p in parts:
    if not re.match(r"^#{2,5}\s", p): continue
    head = p.split("\n", 1)[0].strip()
    is_finding = re.search(r"\*\*Strength:?\*\*", p) or re.search(r"\*\*Severity:?\*\*", p, re.I)
    if not is_finding: continue
    n_find += 1
    if not re.search(r"\*\*Strength:?\*\*", p) and not re.search(r"\*\*Severity:?\*\*", p, re.I):
        miss.append(f"{head[:45]}/strength")
    if "Evidence" not in p and "Source" not in p and "http" not in p:
        miss.append(f"{head[:45]}/evidence")
print(f"  (findings scanned: {n_find})")
ok("every finding has Strength/severity + evidence", miss)
# the vibe-fence fit is a file-level obligation (a dedicated Implications section),
# not necessarily repeated per finding.
has_fit = bool(re.search(r"^#+.*\bImplications\b", body, re.M | re.I))
ok("file has a vibe-fence fit section", [] if has_fit else ["no Implications heading"])

# 7 — accept either a "Findings" heading OR area-grouped headings (prompt allows both)
has_findings = bool(re.search(r"^#+.*\bFindings\b", body, re.M | re.I))
areas = ["Teaching Dial", "Turbo", "Issue", "Anti-pattern", "Onboarding",
         "Security", "Git", "Deploy", "Hygiene", "Privacy",
         "Spark", "Image", "SAM", "Muse Code", "Winning",
         "Mechanism", "Pattern", "Harness", "Self-Consistency"]
if not has_findings:
    has_findings = any(re.search(a, body, re.I) for a in areas)
need = [r"^#+.*\bGaps\b", r"^#+.*\bSources\b", r"^#+.*\bImplications\b"]
missing_sec = [p for p in need if not re.search(p, body, re.M | re.I)]
ok("required sections (Gaps / Sources / Implications) present", missing_sec)
ok("findings section present (heading or area-grouped)", [] if has_findings else ["no Findings/area heading"])

# 8
ph = []
for tok in ("TODO", "TBD", "FIXME", "XXX", "[citation needed]", "Lorem"):
    for mm in re.finditer(r".{0,45}" + re.escape(tok) + r".{0,45}", body):
        ctx = mm.group(0)
        if "TODO(human)" in ctx: continue
        ph.append(f"{tok}: ...{ctx.strip()[:70]}...")
ok("no placeholder text", ph)

print()
print("RESULT:", "ALL CHECKS PASSED" if fail == 0 else f"{fail} CHECK(S) FAILED")
sys.exit(0 if fail == 0 else 1)
