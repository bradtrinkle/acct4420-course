#!/usr/bin/env python3
"""Apply a must-fix change to a running term (or all terms) without breaking saved answers.

Usage: python3 tools/patch_term.py <term|all> <file> [<file> ...] [--allow-id-change]
Files are paths relative to the site root, for example module-3.html or assets/module3.js.
Copies each file from the working site into terms/<term>/.

Saved answers are stored under names built from each box's data-save name and each quick check's id.
For every .html file, the script loads the term's current page and the patched page in a headless
browser and refuses to patch if a saved-answer name would disappear (a renamed box would lose a
student's saved answer). Needs node and playwright. assets/config.js is never copied,
because it holds each term's own Canvas course number.
"""
import json, re, shutil, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
def saved_keys(site, pages):
    r = subprocess.run(["node", str(ROOT / "tools" / "saved_keys.js"), str(site), *pages], capture_output=True, text=True, cwd=ROOT)
    if r.returncode: sys.exit("Could not check saved-answer names: " + r.stderr[-400:])
    return {k: set(v) for k, v in json.loads(r.stdout.strip().splitlines()[-1]).items()}

def main():
    args = [x for x in sys.argv[1:] if not x.startswith("--")]
    allow = "--allow-id-change" in sys.argv
    if len(args) < 2: sys.exit(__doc__)
    term, files = args[0], args[1:]
    terms = [p for p in (ROOT / "terms").iterdir() if (p / "term.json").exists()] if term == "all" else [ROOT / "terms" / term]
    for t in terms:
        if not t.is_dir(): sys.exit(f"No such term folder: {t}")
    bad = False
    files = [f for f in files if f != "assets/config.js"]
    pages = [f for f in files if f.endswith(".html")]
    for f in files:
        if not (ROOT / f).is_file(): sys.exit(f"Missing in working site: {f}")
    if pages and not allow:
        for t in terms:
            with tempfile.TemporaryDirectory() as tmp:
                new = Path(tmp) / "new"; shutil.copytree(t, new)
                for f in files:
                    (new / f).parent.mkdir(parents=True, exist_ok=True); shutil.copy2(ROOT / f, new / f)
                old_k, new_k = saved_keys(t, pages), saved_keys(new, pages)
            for pgname in pages:
                lost = old_k[pgname] - new_k[pgname]
                if lost: bad = True; print(f"REFUSED {t.name}/{pgname}: saved-answer names that would disappear: {sorted(lost)[:10]}")
    if bad: sys.exit("Nothing copied. Keep those names, or rerun with --allow-id-change if you accept that students lose answers in those boxes.")
    for t in terms:
        for f in files:
            (t / f).parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT / f, t / f); print(f"patched {t.name}/{f}")

main()
