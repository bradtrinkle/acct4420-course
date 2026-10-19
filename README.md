# ACCT/MIS 4420/5420: Generative AI in Business Decision-Making

Student-facing course site (Iowa State cardinal and gold), hosted with GitHub Pages. **Everything in this repository is public.**

**Never commit here:** grader instructions, answer keys, student work, or grades. Those live in the private `acct4420-grading` repository.

## How the site works

- Plain HTML, CSS, and JavaScript. No build step; GitHub Pages serves it as is (`.nojekyll`).
- Each module is one page with a step-by-step walkthrough. Students answer questions to move forward, get instant feedback, and their progress and answers are saved in their own browser only.
- The page builds the Word submission automatically from what students typed (fixed sections A to G, so the grader always knows where to look).

## Layout

| Path | Contents |
| --- | --- |
| `index.html` | Home page and course journey |
| `module-1.html` | Module 1 walkthrough (Modules 2 to 10 will follow the same pattern) |
| `policy.html` | Velox Responsible AI Policy |
| `assets/style.css` | Iowa State colors and layout |
| `assets/config.js` | **Edit this:** video, quiz, and Canvas submission links per module |
| `assets/module1.js` | Module 1 logic (gating, feedback, submission builder) |
| `downloads/` | Files students upload to their Jordan coach (policy, rubric, coach instructions) |
| `data/module-N/` | Simulated datasets (all fictional) |

Note: the Jordan coach instructions are in `downloads/jordan-coach-instructions.txt` and are also embedded in `module-1.html` so students can copy them with one click. Keep the two in sync.
