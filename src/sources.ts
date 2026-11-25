import { marked } from "marked";

import { loadOnce } from "./load_once";

export interface DocPage {
  body: string;
  description: string;
  headings: Array<{ id: string; text: string }>;
}

export interface Doc {
  id: string;
  title: string;
  order: number;
  page: () => DocPage | Promise<DocPage>;
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

const content = import.meta.glob("../content/*/*.md", { query: "?raw", import: "default", eager: true }) as Raw;
const sdk = import.meta.glob("@docs-sdk/*.md", { query: "?raw", import: "default", eager: true }) as Raw;
const ui = import.meta.glob<string>("@docs-ui/DESIGN.md", { query: "?raw", import: "default" });

const frontMatter = /^---\n([\s\S]*?)\n---\n?/;

function metaOf(source: string): Record<string, string> {
  const meta: Record<string, string> = {};
  for (const line of (frontMatter.exec(source)?.[1] ?? "").split("\n")) {
    const at = line.indexOf(":");
    if (at > 0) meta[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  return meta;
}

function withoutFrontMatter(source: string): string {
  const match = frontMatter.exec(source);
  return match ? source.slice(match[0].length) : source;
}

function firstHeading(source: string): string | undefined {
  const rest = withoutFrontMatter(source).replace(/^(?:\s+|<!--[\s\S]*?-->)*/, "");
  return /^# +(.+?) *#* *(?:\n|$)/.exec(rest)?.[1];
}

function parsePage(source: string): DocPage {
  const tokens = marked.lexer(withoutFrontMatter(source));
  while (tokens[0] && (tokens[0].type === "space" || tokens[0].type === "html")) tokens.shift();
  if (tokens[0]?.type === "heading" && tokens[0].depth === 1) tokens.shift();
  while (tokens[0]?.type === "space") tokens.shift();
  const lead = tokens[0]?.type === "paragraph" ? tokens.shift() : undefined;
  return {
    body: tokens.map((token) => token.raw).join(""),
    description: lead ? plain(lead.raw.trim()) : "",
    headings: tokens
      .filter((token) => token.type === "heading" && token.depth === 2)
      .map((token) => ({ id: slugify(plain((token as { text: string }).text)), text: plain((token as { text: string }).text) })),
  };
}

const slugOf = (path: string) => path.split("/").pop()!.replace(/\.md$/, "").toLowerCase();

const byOrder = (a: Doc, b: Doc) => a.order - b.order || a.title.localeCompare(b.title);

function docsOf(raw: Raw, section: string): Doc[] {
  return Object.entries(raw)
    .map(([path, source]): Doc => {
      const slug = slugOf(path);
      const meta = metaOf(source);
      let page: DocPage | undefined;
      return {
        id: `${section}/${slug}`,
        title: meta.title ?? firstHeading(source) ?? slug,
        order: Number(meta.order ?? 100),
        page: () => (page ??= parsePage(source)),
      };
    })
    .sort(byOrder);
}

function lazyDocsOf(loaders: Record<string, () => Promise<string>>, section: string, title: string): Doc[] {
  return Object.entries(loaders).map(([path, loadSource]): Doc => {
    let page: DocPage | undefined;
    const load = loadOnce(() => loadSource().then((source) => (page = parsePage(source))));
    return { id: `${section}/${slugOf(path)}`, title, order: 100, page: () => page ?? load() };
  });
}

const contentSections: Array<[folder: string, title: string]> = [
  ["introduction", "Introduction"],
  ["getting-started", "Getting started"],
  ["features", "Features"],
  ["account", "Account"],
  ["self-hosting", "Self-hosting"],
  ["env-files", "Server env files"],
  ["reference", "Reference"],
];

export const sectionLines: Record<string, string> = {
  introduction: "What Misty is and how it fits together.",
  "getting-started": "Install, sign in and run your first agent.",
  features: "Chats, Spaces, the Agents page and the Studio.",
  account: "Plans and what Misty keeps about you.",
  "self-hosting": "Run your own server, keep it updated and backed up.",
  "env-files": "Every setting the server reads, file by file.",
  reference: "Where things run, and fixes.",
  guides: "Use Misty, run a server and fix problems.",
  sdk: "Build apps that run inside a Space.",
  design: "Tokens, rules and every component, live.",
};

const inFolder = (folder: string): Raw =>
  Object.fromEntries(Object.entries(content).filter(([path]) => path.includes(`/content/${folder}/`)));

export const sections: Section[] = [
  ...contentSections.map(([folder, title]) => ({ id: folder, title, docs: docsOf(inFolder(folder), folder) })),
  { id: "sdk", title: "SDK", docs: docsOf(sdk, "sdk") },
  { id: "design", title: "Design system", docs: lazyDocsOf(ui, "design", "Design system") },
].filter((section) => section.docs.length > 0);

export const allDocs: Doc[] = sections.flatMap((section) => section.docs);

export { allExamples, groups as componentGroups } from "@docs-ui/site/content";
export type { Example, PropDoc } from "@docs-ui/site/content";

export const loadGuidance = loadOnce(() => import("@docs-ui/site/guidance"));
