# ACCT/MIS 4420/5420: Artificial Intelligence in Business Decision-Making

Student-facing course site (Iowa State cardinal and gold), hosted with GitHub Pages. **Everything in this repository is public.**

**Never commit here:** grader instructions, answer keys, student work, or grades. Those live in the private `acct4420-grading` repository.

## How the site works

- Plain HTML, CSS, and JavaScript. No build step; GitHub Pages serves it as is (`.nojekyll`).
- Each module is one page with a step-by-step walkthrough. Students answer questions to move forward, get instant feedback, and their progress and answers are saved in their own browser only.
- The page builds the Word submission automatically from what students typed (fixed lettered sections that match the module's rubric, so the grader always knows where to look).

## Layout

| Path | Contents |
| --- | --- |
| `index.html` | Home page and course journey |
| `module-1.html` to `module-10.html` | The ten module walkthroughs |
| `policy.html` | Velox Responsible AI Policy |
| `technique-map.html` | Every prompt technique, its official name, and the module where it is taught |
| `assets/style.css` | Iowa State colors and layout |
| `assets/common.js` | Shared behavior: gating, auto-save, copy buttons, reviewer mode |
| `assets/config.js` | **Edit this:** video, quiz, and Canvas submission links per module |
| `assets/module1.js` to `module10.js` | Each module's logic (gating, feedback, submission builder) |
| `assets/videos/` | The Jordan video for each module |
| `downloads/` | Rubrics, video transcripts, slides, the Responsible AI Policy, and the coach instructions |
| `data/module-N/` | Simulated datasets (all fictional) |

Note: the Jordan coach instructions are in `downloads/jordan-coach-instructions.txt` and are also embedded in `module-1.html` so students can copy them with one click. Keep the two in sync.

## Terms and sections (one frozen copy per term)

The main site (the files at the top level) is the **working copy**. Each term or section gets its own frozen copy in `terms/<name>/` (for example `terms/spring2027/` and `terms/test/`), with its own Canvas course number in that copy's `assets/config.js` and a `term.json` note. Videos are shared: each copy points to `assets/videos/` in the main site. Each Canvas course links to its own term folder.

- **Freeze a term** (once the working copy is final): `python3 tools/release_term.py spring2027 --course-id 132435 --label "Spring 2027"`. It refuses to overwrite an existing term.
- **Fix a running term** (must-fix problems only): fix the working copy, then `python3 tools/patch_term.py spring2027 module-3.html assets/module3.js` (or `all`). It copies those files into the term folder, never touches that term's `config.js`, and refuses if a saved-answer name (a `data-save` name or a quick-check id) would disappear, because that would erase students' saved answers. Needs node and playwright.
- Progress is saved in the student's browser under the same names in every copy, so a fix never makes students redo work.
