# Restoration PM Academy

Restoration PM Academy is a practical learning platform for restoration and construction project managers.

The course follows a consistent learning loop:

**Learn → Practice → Explain → Apply → Review → Master**

## Interactive pilot

The current pilot includes:

- Three visual building-envelope modules
- Ten-question interactive assessments in every module
- Multiple-choice and open-response questions
- An 85% passing requirement for every required module
- Retakes with the highest score retained
- Browser-based progress storage
- A Certificate of Completion after every module is passed
- A printable certificate that can be saved as a PDF
- Original instructional illustrations for masonry, sealant, and moisture conditions
- A transparent rubric-grading fallback when a server-side AI endpoint is unavailable

## Project structure

```text
docs/                  Static academy application and GitHub Pages source
api/grade.js           Server-side OpenAI grading endpoint
scripts/                Local validation and preview utilities
vercel.json             Optional server-host deployment configuration
```

## Validate and preview locally

Node.js 20 or newer is recommended.

```bash
npm run check
npm start
```

Open `http://127.0.0.1:4173`.

## Publish with GitHub Pages

In the repository's **Settings → Pages** screen, select:

- Source: **Deploy from a branch**
- Branch: **main**
- Folder: **/docs**

The GitHub Pages version uses the client-side rubric fallback for open responses because it is a static deployment.

## Enable genuine AI grading

Import the repository into a server host such as Vercel, then add `OPENAI_API_KEY` as a protected environment variable. `OPENAI_MODEL` is optional. Never place an API key in browser code or commit it to the repository.

The current client calls `/api/grade` when that endpoint is available and otherwise keeps the learner's response and uses the transparent rubric fallback.

## Pilot limitations

Progress is currently stored in the learner's browser rather than a shared database. Certificates are not yet backed by a public verification registry. Authentication, database-backed progress, instructor administration, rate limiting, and the expanded curriculum remain future work.
