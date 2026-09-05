# Pitfalls Research

**Domain:** Markdown+LaTeX static blog, deployed to Cloudflare Pages with custom domain, minimal hand-built design
**Researched:** 2026-09-03
**Confidence:** MEDIUM-HIGH (KaTeX/markdown issues and Cloudflare DNS issues are well-documented across multiple independent sources; design pitfalls are more subjective/lower confidence)

## Critical Pitfalls

### Pitfall 1: Underscore subscripts get eaten by Markdown's italic parser

**What goes wrong:**
LaTeX uses `_` for subscripts (`$a_i$`, `$x_{i,j}$`). Markdown uses `_` to toggle italics. When a math expression has two or more underscores in a paragraph, standard Markdown parsers (remark, markdown-it, etc.) can interpret the text between the first and second underscore as an italic span *before* the math plugin ever sees it — silently mangling the LaTeX source (deleting the underscores, wrapping text in `<em>`) so KaTeX either throws a parse error or renders garbage. This is one of the most commonly reported issues across GitHub Markdown, Jupyter, and generic remark/markdown-it pipelines.

**Why it happens:**
Markdown tokenizes `_..._` as emphasis at the text-parsing stage, which usually runs *before* (or independently of) the math-delimiter extraction stage, unless the markdown parser's math plugin explicitly claims `$...$` spans as opaque/raw text first.

**How to avoid:**
- Use `remark-math` + `rehype-katex` (for a JS-based SSG like Astro/Eleventy/Next) — `remark-math` runs as a remark (Markdown-AST) plugin that claims `$...$`/`$$...$$` spans as math nodes *before* emphasis parsing touches them, so underscores inside are protected. This is the standard, well-tested combo — don't hand-roll a regex-based math extractor.
- If using a generator whose default Markdown engine mangles math (some Hugo Goldmark configs, some Jekyll+kramdown configs are reported to have this problem), verify with a real test post containing `$a_{i,j} + b_{k}$` and `$$\sum_{i=1}^{n} x_i$$` before writing real content on top of it.
- Avoid delimiter schemes that require manually escaping every underscore (`\_`) — it's what breaks first when the user or Claude pastes LaTeX from other sources.

**Warning signs:**
- A post renders fine until it has 2+ subscripted variables in the same sentence.
- Random words go italic near math expressions.
- KaTeX throws `ParseError: Expected 'EOF', got '_'` in the browser console or during build.

**Phase to address:**
Tech-stack / SSG selection phase, verified with a dedicated "math torture test" post during initial site scaffolding — before any real content is written.

---

### Pitfall 2: Choosing client-side KaTeX rendering without realizing the cost, or build-time rendering without realizing the setup cost

**What goes wrong:**
Two rendering strategies exist and people default to the wrong one for their use case:
- **Client-side** (load katex.js + auto-render in the browser): simplest to wire up, but means shipping the ~250KB KaTeX JS bundle to every reader, a visible re-layout/flash as JS finds and re-renders `$...$` spans after the page paints, and math being invisible to anyone with JS disabled or to search engine crawlers that don't execute JS.
- **Build-time / server-side** (KaTeX renders to static HTML+MathML at build time, e.g., via `rehype-katex`): zero client JS needed for math, no flash, math is real HTML in the page source (better for SEO/accessibility) — but requires the SSG's build pipeline to actually run Node-side KaTeX rendering, which is a build-time dependency that can slow builds or fail silently if misconfigured.

For a math-heavy blog like this one, client-side rendering is the wrong default — it directly contradicts the "text is the star, minimal, fast" design goal, since every single page pays a JS + layout-shift tax for math that could just be static HTML.

**Why it happens:**
Many "add math to my Markdown blog" tutorials default to the client-side `auto-render` extension because it requires no build-tool integration — it "just works" by dropping a script tag. It's the path of least resistance, not the best choice for a static-generated site.

**How to avoid:**
Use build-time rendering (`remark-math` + `rehype-katex`, or the SSG's native math plugin if it wraps the same libraries) so KaTeX output is baked into the static HTML at build time. Ship the KaTeX **CSS** (for fonts/spacing) but not the KaTeX **JS** to the browser. Confirm this by viewing page source on a deployed math post — the rendered `<span class="katex">...</span>` markup should already be there with JS disabled.

**Warning signs:**
- Math flashes/pops in after page load (visible layout shift).
- Viewing page source shows raw `$...$` text instead of rendered spans.
- Lighthouse/PageSpeed flags a large JS bundle or layout shift (CLS) on post pages.

**Phase to address:**
SSG/tooling selection phase — this is a foundational architecture decision, expensive to change after dozens of posts exist.

---

### Pitfall 3: KaTeX fonts not self-hosted / not preloaded, causing FOUT or invisible math on first paint

**What goes wrong:**
KaTeX requires its own web fonts (KaTeX_Main, KaTeX_Math, etc.) to render correctly — without them, math falls back to system fonts and looks visibly broken (wrong glyph shapes, misaligned symbols, wrong spacing). If the KaTeX CSS/fonts aren't bundled and served from the same origin, they either 404 (if the CDN path assumed by a copy-pasted `<link>` tag doesn't match the actual install), or load late and cause a flash of incorrectly-styled math before swapping to correct glyphs.

**Why it happens:**
Copy-pasted "add KaTeX to your site" snippets often reference `cdn.jsdelivr.net` KaTeX CSS/font URLs rather than the fonts that ship with the locally-installed `katex` npm package used for build-time rendering — version mismatches or CDN downtime then break math styling in a way that's easy to miss because the HTML still "renders," just ugly.

**How to avoid:**
- Install `katex` as an npm dependency (matching the version used by the rendering plugin) and copy/serve its `dist/katex.min.css` and `dist/fonts/` directory from the site's own static assets — don't rely on a CDN `<link>` tag with a hardcoded version.
- Preload the KaTeX CSS in `<head>` on pages that contain math (KaTeX ships `font-display: block` by default specifically to avoid FOUT — verify this default isn't being overridden).

**Warning signs:**
- Math symbols look like default browser serif/sans-serif text instead of proper math typesetting (wrong spacing around fractions, integrals, etc.).
- Browser devtools Network tab shows 404s for `.woff2` font files on a post page.
- Visual diff between local dev (fonts cached) and fresh deploy (fonts missing).

**Phase to address:**
Initial site scaffolding / theme setup phase, verified visually against the KaTeX project's own reference rendering.

---

### Pitfall 4: Adding DNS records before linking the custom domain in Cloudflare Pages (or vice versa, wrong order)

**What goes wrong:**
The most commonly reported Cloudflare Pages custom-domain failure: someone manually creates a CNAME (or A record) pointing at the `*.pages.dev` deployment without first adding the domain as a **Custom Domain** inside the Pages project settings. Result: Cloudflare has no route mapping the incoming hostname to the Pages project, and visitors get a 522 error (or a Cloudflare "not found" page) even though DNS resolves correctly.

**Why it happens:**
It feels intuitive to "just add a CNAME like any other host" because that's how DNS setup works for most other providers. Cloudflare Pages requires an explicit association step in the Pages dashboard *in addition to* DNS, and the natural order (DNS first, dashboard second) is backwards.

**How to avoid:**
1. In the Cloudflare Pages project → Custom Domains, add `learnmeathreat.com` (and separately `www.learnmeathreat.com` if both should work) *first*.
2. If the domain's DNS is already managed by Cloudflare (i.e., registered elsewhere but nameservers pointed at Cloudflare), Pages will auto-create the correct DNS record when you add the custom domain — don't hand-create a competing CNAME/A record.
3. Only fall back to manually creating a CNAME if the zone is NOT on Cloudflare DNS (rare for this setup, since Cloudflare Pages custom domains require the zone to be on Cloudflare).

**Warning signs:**
- 522 "Connection timed out" or "Error 1000: DNS points to prohibited IP" after adding a CNAME.
- Root domain (`learnmeathreat.com`) works but `www` doesn't, or vice versa — sign that only one of the two hostnames was added as a Custom Domain.

**Phase to address:**
Deployment/custom-domain phase, explicitly sequenced: (1) get the site building and deployed to the `*.pages.dev` URL first and confirm it works, (2) only then move to custom domain — don't combine these into one step.

---

### Pitfall 5: Registrar/nameserver mismatch — domain purchased elsewhere never gets pointed at Cloudflare

**What goes wrong:**
Since the domain isn't registered yet (per PROJECT.md), the most likely failure mode when it is purchased later is: buying the domain from a registrar (Namecheap, Google Domains successor, Porkbun, etc.) and stopping there, expecting Cloudflare Pages custom domains to "just work." Cloudflare Pages custom domains require the domain's **DNS zone** to be active on Cloudflare (nameservers changed at the registrar to Cloudflare's assigned nameservers) — registration and DNS hosting are separate concerns, and skipping the nameserver change is the single most common blocker for first-time Cloudflare Pages custom domain setups.

**Why it happens:**
Registrars sell "here's your domain" without making clear that using it with a third-party host (Cloudflare) requires an extra step at the registrar (changing nameservers) that takes effect outside the registrar's own dashboard.

**How to avoid:**
When the domain is registered: (1) add the domain as a zone in Cloudflare (free plan), (2) Cloudflare will give two nameservers, (3) go into the registrar's dashboard and replace the default nameservers with Cloudflare's, (4) wait for propagation (can take a few minutes to ~24-48 hours, rarely longer), (5) only then add the Custom Domain in Pages. Document this as an explicit checklist step since it's a manual, easy-to-forget action outside any code Claude can run.

**Warning signs:**
- Cloudflare zone dashboard shows "Pending Nameserver Update" indefinitely.
- `dig NS learnmeathreat.com` (or an online DNS checker) shows the registrar's default nameservers instead of Cloudflare's.

**Phase to address:**
Deployment/custom-domain phase — should be written as an explicit manual checklist item in that phase's plan, not assumed to "just happen" alongside domain purchase.

---

### Pitfall 6: SSL/TLS certificate provisioning lag mistaken for a broken deploy

**What goes wrong:**
After correctly linking a custom domain, Cloudflare needs to provision a Universal SSL certificate for it. This is usually fast (minutes) but can occasionally take up to 24 hours, especially right after a nameserver change. During this window `https://learnmeathreat.com` may show a certificate error or fail to load, which can look like the deployment itself is broken and trigger unnecessary debugging.

**Why it happens:**
Certificate issuance is decoupled from DNS propagation and from the Pages deployment itself — three independent async processes (DNS, Pages custom domain routing, SSL cert issuance) that all need to complete, and it's not obvious from the UI which one is still pending.

**How to avoid:**
After adding the custom domain, check the Custom Domains page in the Pages dashboard for a "Active"/"Pending" status indicator rather than immediately testing in a browser. If it's still pending after a few hours, that's the signal to investigate (usually a nameserver issue), not before.

**Warning signs:**
- Browser shows `NET::ERR_CERT_AUTHORITY_INVALID` or similar right after setup.
- Cloudflare dashboard still shows the custom domain as "Pending" rather than "Active."

**Phase to address:**
Deployment/custom-domain phase — document expected wait time so it isn't mistaken for a bug.

---

### Pitfall 7: "Minimal" design defaults to looking like an unstyled template because there's no deliberate typographic system

**What goes wrong:**
"Minimal, text-first, hand-built" is frequently what results by *default* when someone skips design entirely — plain black-on-white system-font text with no considered type scale, no deliberate measure (line length), no vertical rhythm, and default browser spacing on headings/lists/code blocks. The result reads as "unstyled" or "default Jekyll/GitHub README" rather than "intentionally minimal," which is the opposite of the stated goal (avoid looking like a stock template while also not looking unfinished).

**Why it happens:**
Minimal design is deceptively hard — it has fewer elements to hide behind mistakes, so every remaining decision (type scale, line-length/measure, spacing rhythm, one deliberate accent like a monospace/serif header font per PROJECT.md) has to be intentional. Skipping CSS "because it's a minimal site" is not the same as designing a minimal site.

**How to avoid:**
- Set an explicit type scale (e.g., a modular scale) rather than relying on browser defaults for h1-h6/p.
- Constrain line length (measure) to ~60-75 characters for body text (`max-width` on the article container) — the single highest-leverage change for "hand-crafted" feel on a text-heavy site.
- Pick one deliberate typographic accent (per PROJECT.md: monospace or serif for headers) and apply it consistently, rather than using the browser's default sans-serif everywhere.
- Deliberately design the states that generic themes get wrong: code blocks, blockquotes, KaTeX spacing/margins, link hover/visited states, and the light/dark toggle transition — these are exactly the spots where "installed a theme and didn't touch it" shows.
- Avoid multi-column marketing-site patterns (hero sections, card grids, feature icons) — those are the "stock template" tells this project explicitly wants to avoid; a single-column, content-first layout is both simpler to build and harder to mistake for a template.

**Warning signs:**
- The site "looks fine" in a quick glance but nothing about it is memorable or distinguishes it from a bare markdown-to-HTML dump.
- No custom CSS beyond what the chosen SSG/theme starter ships with by default.
- Body text runs edge-to-edge on wide viewports (no measure constraint).

**Phase to address:**
Visual design/theming phase — should be its own explicit phase with a "does this look hand-built" review checkpoint, not bundled into initial scaffolding as an afterthought.

---

### Pitfall 8: Dark mode implemented as a naive CSS toggle, breaking KaTeX or code block contrast

**What goes wrong:**
KaTeX-rendered math and syntax-highlighted code blocks are usually painted with either inline styles or their own color variables (not inheriting the page's `color`/`background` automatically). A theme toggle built only around body text colors can leave math formulas or code blocks with poor contrast (e.g., dark text on a now-dark background) in one of the two themes, because those subsystems weren't included in the color-variable system.

**Why it happens:**
Math and code rendering libraries are treated as "black box" third-party output, so their styling gets forgotten when building the site's own light/dark CSS variables.

**How to avoid:**
Define a single set of CSS custom properties (e.g., `--bg`, `--fg`, `--code-bg`) at the `:root`/`[data-theme]` level, and make sure the KaTeX CSS override (KaTeX text color) and the syntax-highlighter's theme (e.g., swap Shiki/Prism themes, or use a highlighter with CSS-variable-based themes) both reference those same variables — test toggling dark mode specifically on a post that has both math and a code block.

**Warning signs:**
- Toggling dark mode makes math or code blocks unreadable while body text looks fine.
- Flash of wrong theme on page load (FOUC on theme, separate from font FOUT) if the toggle is applied via JS after paint instead of via a blocking inline script reading a stored preference.

**Phase to address:**
Visual design/theming phase, verified on a test post containing both math and code.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|------------------|
| Client-side `auto-render` KaTeX instead of build-time rendering | Faster to wire up, no build pipeline changes | Layout shift, larger JS payload, math invisible without JS/to crawlers | Never for this project — contradicts "minimal/fast, text is the star" goal |
| Linking KaTeX CSS/fonts from a CDN instead of self-hosting | One `<link>` tag, no asset pipeline work | Version drift, CDN outage breaks styling, extra DNS lookup on every page | Prototyping only; must be fixed before real content ships |
| Skipping a `max-width`/measure constraint on body text ("it's just markdown, browser defaults are fine") | Zero CSS to write | Reads as unstyled/template-default, hurts readability on wide screens | Never — this is a 3-line CSS fix with outsized visual impact |
| Manually creating DNS CNAME records instead of letting Pages manage them via Custom Domains | Feels more "in control" | Creates conflicting/stale records, causes 522 errors | Never when the zone is on Cloudflare — let Pages manage it |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| Cloudflare Pages custom domain | DNS record added before domain linked in Pages dashboard | Add Custom Domain in Pages first; let it manage DNS automatically |
| External registrar → Cloudflare | Domain purchased but nameservers never changed at registrar | Explicit checklist step: change nameservers at registrar to Cloudflare's assigned pair |
| KaTeX + Markdown parser | Using a math extension that runs after/independent of emphasis parsing | Use `remark-math`/`rehype-katex` (or SSG-native equivalent) that claims math spans at the AST level before emphasis parsing |
| KaTeX fonts | Referencing CDN katex.css with a version that doesn't match the installed npm `katex` package | Self-host fonts/CSS from the same `katex` package version used for rendering |
| Cloudflare Web Analytics | Assuming it's automatically enabled | Must be explicitly enabled per-zone/per-Pages-project in the Cloudflare dashboard (Analytics tab) — it's opt-in, not default |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Client-side KaTeX rendering | Visible math "pop-in" on every post load, CLS penalty | Build-time rendering (rehype-katex) | Immediately visible even at 1 visitor; gets worse as post count/math density grows |
| Un-tree-shaken/whole KaTeX JS bundle shipped even with build-time rendering | Larger-than-needed JS payload despite math being static HTML | Only ship `katex.min.css`, not `katex.min.js`, when using build-time rendering | Noticeable on Lighthouse/PageSpeed from day one |
| Cloudflare Pages free tier build limits (500 builds/month, single concurrent build, 20-min build timeout) | Builds queue or fail during heavy editing sessions | Batch content edits into fewer commits/deploys; not a concern at this project's scale (personal blog, infrequent posts) | Unlikely to be hit for a personal blog; would need frequent CI/rapid iteration to approach limits |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Leaving Cloudflare's proxy (orange cloud) off for the custom domain | Loses Cloudflare's SSL/CDN/DDoS protection, exposes origin more directly | Ensure DNS records for the custom domain are proxied (orange cloud) — this is default behavior when Pages manages the Custom Domain, but verify if any record was hand-created |
| No 2FA on the registrar or Cloudflare account | Domain hijack risk (higher-value target once the site is live and has traffic) | Enable 2FA on both the registrar and Cloudflare accounts; this is a one-time low-cost step |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Math flashing/reflowing after page load | Reader loses their place mid-sentence while scrolling; feels janky on a "rigorous, careful" content site | Build-time KaTeX rendering (no reflow) |
| Dark mode toggle with no persisted preference | Reader has to re-toggle on every page/visit | Persist choice in `localStorage`, apply via blocking inline script before first paint to avoid theme-flash |
| No visible "last updated" or post date on rigorous technical content | Reader can't judge whether the math/security claims are current | Include a publish (and optionally updated) date in frontmatter, rendered on the post |

## "Looks Done But Isn't" Checklist

- [ ] **Math rendering:** Test with a paragraph containing 2+ subscripted variables (`$a_{i,j}$`, `$x_1, x_2$`) and nested braces, not just a single simple formula — the simple case often works while the real case (multiple underscores/braces) breaks.
- [ ] **Custom domain:** Verify both `learnmeathreat.com` and `www.learnmeathreat.com` resolve and serve the site (not just one).
- [ ] **Dark mode:** Verify a post with both math and a code block in both themes, not just body text.
- [ ] **Cookieless analytics:** Verify Cloudflare Web Analytics beacon actually appears in Network tab (it's opt-in per zone, easy to think it's on when it isn't).
- [ ] **Custom 404 page:** Verify a broken/renamed post URL doesn't fall through to Cloudflare's generic error page — a hand-built site with a default 404 undercuts the "hand-built" impression.
- [ ] **SEO/social preview basics:** Verify post pages have a title tag, meta description, and OG tags pulled from frontmatter — easy to forget on a no-CMS static setup and invisible until someone shares a link.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|----------------|-----------------|
| Client-side KaTeX chosen initially, needs to move to build-time | LOW-MEDIUM | Swap in `remark-math`+`rehype-katex` (or SSG equivalent) in the build pipeline, remove client JS/CSS CDN tags, re-deploy; no content changes needed since Markdown math syntax is unchanged |
| Underscore-mangled math discovered after several posts written | LOW | Fix the markdown pipeline (correct math plugin/ordering), then re-render — source Markdown files are usually still intact since the mangling happens at render time, not in the source files, unless someone manually "fixed" it by escaping underscores in the source |
| DNS/custom domain misconfigured | LOW | Cloudflare Pages custom domain and DNS are fully reversible — remove and re-add the Custom Domain, delete stray manual DNS records; no data loss risk |
| Design reads as too generic after initial build | MEDIUM | CSS-only fix (type scale, measure, one distinct accent font) — doesn't require restructuring content or the SSG choice |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| Underscore/subscript mangling | SSG & tooling selection | Render a "math torture test" post with multi-underscore/nested-brace formulas before writing real content |
| Client-side vs build-time KaTeX | SSG & tooling selection | View page source on a deployed math post with JS disabled — rendered KaTeX HTML must already be present |
| KaTeX font/FOUT issues | Initial scaffolding / theming | Compare rendered math visually against katex.org reference; check Network tab for font 404s |
| DNS/Custom Domain ordering | Deployment / custom domain | Deploy to `*.pages.dev` and confirm working before starting custom domain steps |
| Registrar nameserver mismatch | Deployment / custom domain | `dig NS learnmeathreat.com` shows Cloudflare nameservers after registrar update |
| SSL provisioning lag mistaken for bug | Deployment / custom domain | Check Pages dashboard "Active" status before troubleshooting browser cert errors |
| Generic/template-looking design | Visual design / theming | Explicit "does this look hand-built" review against a type-scale/measure/accent-font checklist |
| Dark mode breaking math/code contrast | Visual design / theming | Toggle theme on a post containing both math and a code block |

## Sources

- [remark-math (GitHub)](https://github.com/remarkjs/remark-math) — MEDIUM-HIGH confidence, official plugin repo
- [MDX Math guide](https://mdxjs.com/guides/math/) — MEDIUM-HIGH confidence, official docs
- [react-markdown + remark-math + rehype-katex parsing issue #875](https://github.com/remarkjs/react-markdown/issues/875) — MEDIUM confidence, community-reported issue
- [GitHub Community: LaTeX multiple subscript bug](https://github.com/orgs/community/discussions/17384) — MEDIUM confidence, cross-platform confirmation of underscore/subscript conflict
- [markdown-it: option to disable underscore as italic marker #404](https://github.com/markdown-it/markdown-it/issues/404) — MEDIUM confidence
- [KaTeX Browser docs](https://katex.org/docs/browser) — HIGH confidence, official docs (font-display defaults)
- [KaTeX #2242: font-display: swap](https://github.com/KaTeX/KaTeX/issues/2242) — MEDIUM confidence
- [HN discussion: server-side rendering aspect of KaTeX](https://news.ycombinator.com/item?id=27657305) — MEDIUM confidence, practitioner commentary
- [Server-side KaTeX with Hugo](https://graemephi.github.io/posts/static-katex-with-hugo/) — MEDIUM confidence, practitioner writeup
- [Efficient LaTeX rendering with precompiled KaTeX](https://hernandis.me/2023/02/07/efficient-latex-rendering-with-precompiled-katex.html) — MEDIUM confidence
- [Cloudflare Pages Custom Domains (official docs)](https://developers.cloudflare.com/pages/configuration/custom-domains/) — HIGH confidence, official docs
- [Cloudflare Community: Pages with custom registrar domain](https://community.cloudflare.com/t/cloudflare-pages-with-custom-cloudflare-registrar-domain/518154) — MEDIUM confidence, community-reported
- [Silvermine: Cloudflare Pages custom domain troubleshooting](https://www.silvermine.ai/newsletter/2026-03-13-cloudflare-pages-custom-domain-troubleshooting) — MEDIUM confidence
- [Silvermine: what usually breaks when adding a custom domain](https://www.silvermine.ai/newsletter/2026-03-13-cloudflare-domain-setup-what-breaks-custom-domains) — MEDIUM confidence
- [Cloudflare Community: SSL certificate provisioning delays](https://community.cloudflare.com/t/ssl-certificate-provisioning-delays/556305) — MEDIUM confidence, official-channel community reports
- [Cloudflare Pages free tier limits summary](https://rubabsdigital.com/blog/cloudflare-pages-free-tier-limits) — LOW-MEDIUM confidence, third-party aggregation, cross-check against official Cloudflare docs before relying on exact numbers
- Design pitfalls (generic template look, type scale/measure) — synthesized from general typographic/web-design best practices, not domain-specific sourcing; LOW-MEDIUM confidence, treat as design-review heuristics rather than verified facts

---
*Pitfalls research for: Markdown+LaTeX static blog on Cloudflare Pages*
*Researched: 2026-09-03*
