// Frontend generation skill.
// Injected into the system prompt so the model follows consistent, high-quality
// rules when generating landing pages / sites with `staticSiteGenerator`.
// Static only: HTML + CSS + JS. No backend, no serverless functions, no databases.

export const FRONTEND_SKILL = `
<frontend_skill>
You generate STATIC websites only — a single landing page made of HTML, CSS, and JS.
There is NO backend, NO server-side code, NO serverless functions, NO database.
Anything that needs a server (auth, form storage, payments) must be faked client-side
or wired to a third-party link/embed (e.g. a "tel:" link, mailto:, or an external form URL).

STRUCTURE
- Output one complete, valid HTML document (with <!DOCTYPE html>, <head>, <body>).
- Put styles in the css field and behavior in the js field — do not inline large blocks.
- Reference them as <link rel="stylesheet" href="/style.css"> and <script src="/script.js"></script>
  (the generator wires these automatically if you omit the tags).
- Always include <meta name="viewport" content="width=device-width, initial-scale=1.0">.

DESIGN QUALITY (avoid generic "AI slop")
- Pick a cohesive palette (2-3 colors + neutrals) and ONE accent. Use CSS custom properties (:root { --accent: ... }).
- Avoid overused defaults: no Inter/Roboto/Arial-only stacks, no purple-gradient-on-white cliché.
  Prefer characterful pairings (e.g. a serif display + clean sans body) via Google Fonts <link>.
- Establish a type scale and consistent spacing scale. Generous whitespace. Strong visual hierarchy.
- Add tasteful micro-interactions: hover states, smooth transitions, subtle scroll reveals.
- Make it fully responsive (mobile-first; test the layout at 375px and 1280px mentally).

CONTENT
- Real, specific copy — never "Lorem ipsum". Write headlines and body that fit the brief.
- Use placeholder images from Unsplash/Pexels (https://images.unsplash.com/...) relevant to the topic.
- Include semantic sections appropriate to the brief (hero, features, gallery, CTA, footer).
- Primary CTA must do something: scroll to a section, open a tel:/mailto: link, or link out.

ACCESSIBILITY & POLISH
- Semantic HTML (header/nav/main/section/footer), alt text on images, labels on inputs.
- Sufficient color contrast. Visible focus states. No layout shift.
- Keep JS lightweight and dependency-free unless a CDN library is clearly warranted.
</frontend_skill>
`.trim();
