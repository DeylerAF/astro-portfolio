# deyleraf.dev

Personal site and portfolio. Astro 5, Tailwind CSS 4, deployed to Cloudflare
Pages.

## Editing the content

There is no copy inside the components — everything the site says lives in
YAML under `src/content/`, validated by the Zod schemas in
`src/content.config.ts`. A bad edit fails the build rather than reaching
production, and any of these files can be edited from GitHub's web editor
without touching code.

| File | What it holds |
| --- | --- |
| `src/content/profile/profile.yaml` | Name, headline, tagline, about, services, links |
| `src/content/engagements/*.yaml` | One file per client engagement |
| `src/content/projects/*.yaml` | One file per project; `draft: true` hides it |

Dates are stored as `YYYY-MM` and rendered as years only — the months are kept
because LinkedIn and CVs ask for them.

Components read through `src/lib/content.ts` and never call `astro:content`
directly, so moving the content to a database or an API later means rewriting
that one module.

## Commands

| Command | Does |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server on `localhost:4321` |
| `npm run build` | Typecheck (`astro check`) and build |
| `npm run preview` | Serve the build locally |

## Contact form

`/api/contact` is the only route rendered on demand; everything else is
prerendered. It verifies a Cloudflare Turnstile token server-side, then sends
the message through Resend. Without `PUBLIC_TURNSTILE_SITE_KEY` at build time
the form is replaced by a link to LinkedIn, so the site is safe to deploy
before any of this is configured.

Set these on the Cloudflare Pages project (and in a local `.dev.vars` for
development):

| Variable | Notes |
| --- | --- |
| `RESEND_API_KEY` | Secret. Sending access is enough |
| `TURNSTILE_SECRET_KEY` | Secret |
| `CONTACT_TO_EMAIL` | Where enquiries are delivered |
| `CONTACT_FROM_EMAIL` | Must be on a domain verified with Resend |
| `PUBLIC_TURNSTILE_SITE_KEY` | Public; read at build time, so changing it needs a redeploy |
