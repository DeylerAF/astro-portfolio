import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/** Year-month, e.g. "2025-05". Months are stored but only years are rendered:
 *  the site reads better with years, and LinkedIn asks for the month. */
const yearMonth = z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Expected a "YYYY-MM" date, e.g. "2025-05"');

const profile = defineCollection({
    loader: glob({ base: "src/content/profile", pattern: "**/*.yaml" }),
    schema: z.object({
        name: z.string(),
        headline: z.string(),
        /** Short positioning line for the hero. */
        tagline: z.string(),
        location: z.string(),
        /** Rendered as "5+ years" and friends — kept as a label rather than
         *  computed, so the number stays a deliberate choice. */
        yearsLabel: z.string(),
        availability: z.string().optional(),
        email: z.string().email().optional(),
        links: z.object({
            github: z.string().url(),
            linkedin: z.string().url(),
            website: z.string().url().optional(),
        }),
        about: z.array(z.string()).min(1),
        focus: z.array(z.string()).default([]),
    }),
});

const engagements = defineCollection({
    loader: glob({ base: "src/content/engagements", pattern: "**/*.yaml" }),
    schema: z.object({
        client: z.string(),
        role: z.string(),
        start: yearMonth,
        /** Omit while the engagement is ongoing. */
        end: yearMonth.optional(),
        location: z.string().optional(),
        arrangement: z.string().optional(),
        summary: z.string(),
        highlights: z.array(z.string()).default([]),
        stack: z.array(z.string()).default([]),
        url: z.string().url().optional(),
    }),
});

const projects = defineCollection({
    loader: glob({ base: "src/content/projects", pattern: "**/*.yaml" }),
    schema: z.object({
        title: z.string(),
        summary: z.string(),
        description: z.array(z.string()).default([]),
        stack: z.array(z.string()).default([]),
        image: z.string().optional(),
        url: z.string().url().optional(),
        repo: z.string().url().optional(),
        /** Drafts stay out of the published list. */
        draft: z.boolean().default(false),
        order: z.number().default(0),
    }),
});

export const collections = { profile, engagements, projects };
