# The Record — Constantine Petros

Four-page static editorial archive; no build step or framework. All substantive copy, navigation, citations and headings are rendered in HTML. JavaScript is a progressive enhancement for the homepage archive, timeline, and opt-in 3D vehicle viewer.

## Pages

- `index.html` — Immersive archive homepage: public profile, business, and public-record pathways.
- `about/index.html` — Source-limited public profile. No speculative biography.
- `business/index.html` — California filing summary for Sonoma Shed, LLC and official registry link.
- `public-record/index.html` — Overview of the 2016 Porsche case, pretrial dismissal statement, original reporting, and official court-record request instructions.

Shared visual system: `styles.css`.
- `archive-scene.js` — Three.js progressive-enhancement scene, pinned to Three.js 0.180.0 via CDN importmap on home only. The CSS archive remains interactive if WebGL is unavailable. Single click/tap selects; double click/tap opens; scroll, swipe and keyboard arrows change selection.
- `site-effects.js` — Timeline emphasis and a Sketchfab iframe loaded only on explicit visitor activation.
- `favicon.svg` — Site icon.
- `robots.txt` / `sitemap.xml` — Crawl configuration and discovery.

## Search / AI search

Every page uses a unique title, description, canonical URL, accessible HTML headings, a static source-linked body, internal links, BreadcrumbList JSON-LD, and a WebPage or Article/ProfilePage JSON-LD node. A common WebSite and Person entity use stable @id values. The case article includes dated source references, a concise summary, primary-record instructions, and short visible Q&A.

Google's AI Overview / AI Mode guidance says conventional SEO and helpful, unique, reliably sourced, indexed HTML are the prerequisites; **there is no guaranteed placement**, no special AI schema required, and no reason to create an llms.txt solely for Google. See: https://developers.google.com/search/docs/appearance/ai-features

After publishing:
1. Confirm the site is serving the updated HTML and assets over the final canonical URLs, including the /public-record/ page.
2. Verify domain ownership in Google Search Console.
3. Submit https://constantinepetros.com/sitemap.xml and inspect each canonical URL with URL Inspection; request indexing if needed.
4. Check Google indexing, performance, structured data, mobile accessibility, and Core Web Vitals. Monitor AI-related search visibility through available Search Console reports.
5. Publish original, reviewable supporting primary documents **when legitimately available and authorized**, not invented source material.

### Accuracy and attribution

The November 2016 Insurance Journal article documents the initial charges. The statement that felony charges were dropped before trial following the introduction of new evidence was supplied by the site owner; the editing process has not independently reviewed an official order or docket confirming the stated disposition. Public court links lead to record-request instructions, including form CR-01, **not** the actual case filings. Do not describe these links as proof of a dismissal.

The Porsche 356 Speedster Sketchfab model is an illustrative third-party 3D asset hosted by Sketchfab and credited in the page, not the particular disputed vehicle.

The Sonoma Shed, LLC facts are sourced to a third-party filing summary whose record date is March 25, 2026. The page links to the California Secretary of State for current status.

## Deployment

The repository contains static files and does not contain a configured Cloudflare Worker. GitHub commits alone do **not** guarantee a public deployment.

For Cloudflare Pages, connect the `main` branch and publish the repository root with no build command where the hosting configuration supports it. For a Cloudflare Worker with Static Assets, publish the entire site tree so that nested `/about/`, `/business/`, and `/public-record/` paths resolve to their index files. Confirm `styles.css`, `archive-scene.js`, and `site-effects.js` are served in production.

Do not suppress snippets, disallow Googlebot, or introduce an indiscriminate Cloudflare challenge for search engine crawlers if search visibility is the goal.
