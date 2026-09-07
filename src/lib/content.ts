/**
 * The single place the site reads its content from.
 *
 * Components import from here and never touch `astro:content` directly, so
 * swapping the backing store later — a Notion database, D1, an API — means
 * rewriting this file alone. The shapes below are the contract; everything
 * downstream depends on them and not on where the data came from.
 */
import { getCollection, type CollectionEntry } from "astro:content";
import { byMostRecent } from "./dates";

export type Profile = CollectionEntry<"profile">["data"];
export type Engagement = CollectionEntry<"engagements">["data"];
export type Project = CollectionEntry<"projects">["data"];

export async function getProfile(): Promise<Profile> {
    const [entry] = await getCollection("profile");

    if (!entry) {
        throw new Error(
            "No profile found. Expected exactly one YAML file in src/content/profile/.",
        );
    }

    return entry.data;
}

/** Ongoing engagements first, then the rest newest to oldest. */
export async function getEngagements(): Promise<Engagement[]> {
    const entries = await getCollection("engagements");
    return entries.map((entry) => entry.data).sort(byMostRecent);
}

/** Published projects only, in the order set by each entry. */
export async function getProjects(): Promise<Project[]> {
    const entries = await getCollection("projects");
    return entries
        .map((entry) => entry.data)
        .filter((project) => !project.draft)
        .sort((a, b) => a.order - b.order);
}
