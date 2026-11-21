import { Info } from "lucide-react";
import { marked, type Token } from "marked";
import { CodeBlock, Prose, ProseCallout, Text } from "@misty/ui";
import type { CodeLanguage } from "@misty/ui";

import { slugify } from "./sources";

const languages: Record<string, CodeLanguage> = {
  tsx: "tsx",
  jsx: "tsx",
  ts: "ts",
  typescript: "ts",
  js: "ts",
  javascript: "ts",
  css: "css",
  bash: "bash",
  sh: "bash",
  shell: "bash",
  json: "json",
};

const plain = (text: string) => text.replace(/\*\*|`|\[([^\]]+)\]\([^)]*\)/g, "$1");

type Group =
  | { kind: "code"; code: string; language?: CodeLanguage }
  | { kind: "heading"; depth: number; text: string }
  | { kind: "note"; tokens: Token[] }
  | { kind: "prose"; tokens: Token[] };

const asTokens = (tokens: Token[]) => Object.assign(tokens, { links: {} });

/**
 * A page's Markdown, drawn with the system's own pieces: code fences are a CodeBlock (colored by
 * language), a quote is a callout, headings are anchored Text, and the rest is Prose.
 */
export function Markdown({ source }: { source: string }) {
  const groups: Group[] = [];
  for (const token of marked.lexer(source)) {
    if (token.type === "space") continue;
    if (token.type === "code") {
      groups.push({ kind: "code", code: token.text, language: languages[(token.lang ?? "").toLowerCase()] });
    } else if (token.type === "heading") {
      groups.push({ kind: "heading", depth: token.depth, text: plain(token.text) });
    } else if (token.type === "blockquote") {
      groups.push({ kind: "note", tokens: token.tokens });
    } else {
      const last = groups[groups.length - 1];
      if (last?.kind === "prose") last.tokens.push(token);
      else groups.push({ kind: "prose", tokens: [token] });
    }
  }
  return (
    <div className="grid gap-5">
      {groups.map((group, index) => {
        if (group.kind === "code") return <CodeBlock key={index} code={group.code} language={group.language} header={group.language === "bash" ? "terminal" : group.language} />;
        if (group.kind === "heading") {
          const id = slugify(group.text);
          return group.depth <= 2 ? (
            <Text key={index} as="h2" id={id} size="title" weight="semibold" tone="bright" wrap className="mt-6 scroll-mt-20">
              {group.text}
            </Text>
          ) : (
            <Text key={index} as="h3" id={id} size="page" weight="semibold" tone="bright" wrap className="mt-2 scroll-mt-20">
              {group.text}
            </Text>
          );
        }
        // The Markdown is the repositories' own, built into the site; it is not user input.
        const html = marked.parser(asTokens(group.tokens));
        return group.kind === "note" ? (
          <ProseCallout key={index} kind="note" label="Note" icon={Info}>
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </ProseCallout>
        ) : (
          <Prose key={index} size="page">
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </Prose>
        );
      })}
    </div>
  );
}
