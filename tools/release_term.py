#!/usr/bin/env python3
"""Freeze a copy of the working site as terms/<name>/ for one term or section.

Usage: python3 tools/release_term.py <name> --course-id <Canvas course number> --label "<text>"
Example: python3 tools/release_term.py spring2027 --course-id 132435 --label "Spring 2027"
         python3 tools/release_term.py test --course-id 132495 --label "Tester course"

What it does:
- copies the working site (pages, assets, data, downloads) into terms/<name>/
- leaves out assets/videos and points the copy at the shared videos in the main site
- writes the Canvas course number into the copy's assets/config.js
- writes terms/<name>/term.json (label, course number, release date)
Refuses to overwrite an existing term folder.
"""
import argparse, datetime, json, re, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP = {"terms", "tools", ".git", ".gitignore", "README.md", "videos"}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("name"); ap.add_argument("--course-id", required=True); ap.add_argument("--label", required=True)
    a = ap.parse_args()
    if not re.fullmatch(r"[a-z0-9-]+", a.name) or not a.course_id.isdigit():
        sys.exit("name must be lowercase letters, digits, hyphens; course id must be digits")
    dest = ROOT / "terms" / a.name
    if dest.exists(): sys.exit(f"{dest} already exists. Use tools/patch_term.py to change a running term.")
    dest.mkdir(parents=True)
    for p in ROOT.iterdir():
        if p.name in SKIP: continue
        (shutil.copytree(p, dest / p.name, ignore=shutil.ignore_patterns("videos")) if p.is_dir() else shutil.copy2(p, dest / p.name))
    (dest / ".nojekyll").touch()
    cfg = dest / "assets" / "config.js"
    s = cfg.read_text()
    s = re.sub(r"courses/\d+/", f"courses/{a.course_id}/", s)
    s = s.replace('"assets/videos/', '"../../assets/videos/')
    cfg.write_text(s)
    (dest / "term.json").write_text(json.dumps({"label": a.label, "canvasCourseId": a.course_id, "released": datetime.date.today().isoformat(), "videosFrom": "../../assets/videos"}, indent=2) + "\n")
    print(f"Created {dest.relative_to(ROOT)}  (Canvas course {a.course_id}). Link: terms/{a.name}/index.html")

main()
