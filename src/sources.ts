// Where the docs come from. Each repository keeps the docs for its own code; this is the one place
// that says where to read them, so moving a source to its npm package is a change to one line here.
import { marked } from "marked";

export interface Doc {
  /** The address after `#/`, such as `sdk/live-rooms`. */
  id: string;
  title: string;
  order: number;
  /** Markdown without its front matter or its first heading, which is the title. */
  body: string;
  /** The first paragraph, as plain text: the lead under the title. */
  description: string;
  /** The page's own sections, for "On this page". */
  headings: Array<{ id: string; text: string }>;
}

export const slugify = (text: string) =>
  text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");

const plain = (text: string) => text.replace(/\*\*|`|\[([^\]]+)\]\([^)]*\)/g, "$1");

export interface Section {
  id: string;
  title: string;
  docs: Doc[];
}

type Raw = Record<string, string>;

// This repository's own guides: content/<section>/<page>.md.
const content = import.meta.glob("../content/*/*.md", { query: "?raw", import: "default", eager: true }) as Raw;
const sdk = import.meta.glob("@docs-sdk/*.md", { query: "?raw", import: "default", eager: true }) as Raw;
const ui = import.meta.glob("@docs-ui/DESIGN.md", { query: "?raw", import: "default", eager: true }) as Raw;

/** Splits `---` front matter (`title`, `order`) from the Markdown after it. */
function parse(path: string, source: string, section: string): Doc {
  const slug = path.split("/").pop()!.replace(/\.md$/, "").toLowerCase();
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(source);
  const meta: Record<string, string> = {};
  for (const line of (match?.[1] ?? "").split("\n")) {
    const at = line.indexOf(":");
    if (at > 0) meta[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  const tokens = marked.lexer(match ? source.slice(match[0].length) : source);
  // Blank lines and comments before the title are dropped; the rest keeps its own spacing.
  while (tokens[0] && (tokens[0].type === "space" || tokens[0].type === "html")) tokens.shift();
  const first = tokens[0]?.type === "heading" && tokens[0].depth === 1 ? tokens.shift() : undefined;
  while (tokens[0]?.type === "space") tokens.shift();
  const lead = tokens[0]?.type === "paragraph" ? tokens.shift() : undefined;
  const body = tokens.map((token) => token.raw).join("");
  return {
    id: `${section}/${slug}`,
    title: meta.title ?? (first && "text" in first ? first.text : slug),
    order: Number(meta.order ?? 100),
    body,
    description: lead ? plain(lead.raw.trim()) : "",
    headings: tokens
      .filter((token) => token.type === "heading" && token.depth === 2)
      .map((token) => ({ id: slugify(plain((token as { text: string }).text)), text: plain((token as { text: string }).text) })),
  };
}

const docsOf = (raw: Raw, section: string): Doc[] =>
  Object.entries(raw)
    .map(([path, source]) => parse(path, source, section))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

/** The sections of `content/`, in reading order: for using Misty first, then running a server. */
const contentSections: Array<[folder: string, title: string]> = [
  ["introduction", "Introduction"],
  ["getting-started", "Getting started"],
  ["features", "Features"],
  ["account", "Account"],
  ["self-hosting", "Self-hosting"],
  ["env-files", "Server env files"],
  ["reference", "Reference"],
];

/** One line per section for the home page's cards. */
export const sectionLines: Record<string, string> = {
  introduction: "What Misty is and how it fits together.",
  "getting-started": "Install, sign in and run your first agent.",
  features: "Chats, Spaces, the Agents page and the Studio.",
  account: "Plans, Boosts and what Misty keeps about you.",
  "self-hosting": "Run your own server, keep it updated and backed up.",
  "env-files": "Every setting the server reads, file by file.",
  reference: "Space levels, where things run, and fixes.",
  guides: "Use Misty, run a server and fix problems.",
  sdk: "Build apps that run inside a Space.",
  design: "Tokens, rules and every component, live.",
};

const inFolder = (folder: string): Raw =>
  Object.fromEntries(Object.entries(content).filter(([path]) => path.includes(`/content/${folder}/`)));

export const sections: Section[] = [
  ...contentSections.map(([folder, title]) => ({ id: folder, title, docs: docsOf(inFolder(folder), folder) })),
  { id: "sdk", title: "SDK", docs: docsOf(sdk, "sdk") },
  { id: "design", title: "Design system", docs: docsOf(ui, "design").map((doc) => ({ ...doc, title: "Design system" })) },
].filter((section) => section.docs.length > 0);

export const allDocs: Doc[] = sections.flatMap((section) => section.docs);

// The design system's component pages: misty-ui builds them (its examples, props and guidance), and
// this site only draws them. Like the guides above, this is the one place that names the source.
export { allExamples, groups as componentGroups, guidanceFor, props } from "@docs-ui/site/content";
export type { Example } from "@docs-ui/site/content";
