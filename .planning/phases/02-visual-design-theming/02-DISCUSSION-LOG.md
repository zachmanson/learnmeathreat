# Phase 2: Visual Design & Theming - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-04
**Phase:** 2-visual-design-theming
**Areas discussed:** Accent header font (partial — cut short by user)

---

## Accent Header Font

### Font type

| Option | Description | Selected |
|--------|-------------|----------|
| Monospace | Fits "lean, hand-built, technical reader" tone; terminal/code-adjacent aesthetic | ✓ |
| Serif | More traditional editorial/essay feel, less "techy" | |

**User's choice:** Monospace (recommended option)

### Specific typeface

| Option | Description | Selected |
|--------|-------------|----------|
| JetBrains Mono | Free, self-hostable, widely used in dev-facing sites, condensed/technical look | |
| IBM Plex Mono | Free, self-hostable, more geometric/neutral, common in editorial/technical blogs | ✓ |
| Space Mono | Stylized/quirky, distinctive letterforms | |

**User's choice:** IBM Plex Mono

### Font loading

| Option | Description | Selected |
|--------|-------------|----------|
| Self-hosted | No external request, no third-party dependency | ✓ |
| Google Fonts CDN | Simple but adds external request/DNS lookup | |

**User's choice:** Self-hosted (recommended option)

### Font weights

| Option | Description | Selected |
|--------|-------------|----------|
| Just 600/semibold | Matches Phase 1's existing 2-weight system, headers already use 600 only | ✓ |
| 400 and 600 | Adds regular weight for use elsewhere | |

**User's choice:** Just 600/semibold (recommended option)

### Font scope

| Option | Description | Selected |
|--------|-------------|----------|
| Headings only | Keeps the accent feeling special/intentional | ✓ |
| Headings + site title | Gives site title more brand identity as a wordmark | |

**User's choice:** Headings only (recommended option)

---

## Discussion cut short by user

After completing 4 questions on the accent font, the user was asked whether to continue discussing the font or move to the next area (Theme toggle mechanics). Instead of choosing either preset option, the user gave free-text feedback:

> "I want it to look home grown, obviously professional enough to read and take seriously but I don't want a boilerplate blog sort of look. You don't need to make it obviously 'this is code related so I'm using the cool code font.' Don't make it a copy of learnmeabitcoin.com either. I think GSD might have been overkill for making a site like this because you are asking me too many things that I just simply don't know about. If it's possible let's just skip the discussion for this phase, I trust you and if there's an issue later with the layout or I don't like how it looks I will tell you — it won't be that big of a deal to change, this website isn't THAT complicated."

Per this explicit instruction, discussion stopped. The general aesthetic guidance (homegrown, professional, not a code-font gimmick, not a learnmeabitcoin.com clone) was captured as D-03 in CONTEXT.md. The remaining originally-selected areas (Theme toggle mechanics, Dark palette, Mobile nav behavior) were **not discussed** and instead resolved as Claude's Discretion with low-risk, reversible defaults — see CONTEXT.md's "Claude's Discretion" section.

---

## Claude's Discretion

- Theme toggle mechanics (icon toggle, system-preference default, localStorage persistence, `data-theme` attribute)
- Dark palette (derived from Phase 1's existing light tokens, with KaTeX/Shiki dark-mode legibility explicitly required)
- Mobile nav behavior (reuse Phase 1's existing `flex-wrap` baseline, no hamburger/JS collapse unless it visibly breaks)

## Deferred Ideas

None — no scope creep occurred.
