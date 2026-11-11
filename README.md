# ACCT/MIS 4420/5420: Generative AI in Business Decision-Making

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
