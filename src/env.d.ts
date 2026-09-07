/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

/** Bindings and secrets configured on the Cloudflare Pages project. */
interface Env {
    /** Resend API key. Server-side only — never expose it to the client. */
    RESEND_API_KEY: string;
    /** Where contact submissions are delivered. */
    CONTACT_TO_EMAIL: string;
    /** Sender address on a domain verified with Resend, e.g. site@deyleraf.dev */
    CONTACT_FROM_EMAIL: string;
    /** Turnstile secret, paired with PUBLIC_TURNSTILE_SITE_KEY. */
    TURNSTILE_SECRET_KEY: string;
}

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
    interface Locals extends Runtime {}
}

interface ImportMetaEnv {
    /** Turnstile site key. Public by design — it ships in the markup. */
    readonly PUBLIC_TURNSTILE_SITE_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

interface Window {
    /** Injected by the Turnstile script tag. */
    turnstile?: { reset: (widget?: string) => void };
}
