import React from "react";
import { DocsTitle, InlineLink, Surface, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text, CodeBlock } from "@misty/ui";

import { loadGuidance, type Example, type PropDoc } from "./sources";

const repository = "https://github.com/misty-org/misty-ui";

function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, index) =>
        part.startsWith("`") ? (
          <code key={index} className="rounded-sm bg-control-hover px-1 font-mono text-[0.9em] text-tone-teal">
            {part.slice(1, -1)}
          </code>
        ) : part.startsWith("**") ? (
          <strong key={index} className="font-semibold text-cream-bright">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3">
      <Text as="h2" size="title" weight="semibold" tone="bright">
        {title}
      </Text>
      {children}
    </section>
  );
}

class Boundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <Text size="meta" tone="danger" wrap>
          Couldn't render: {this.state.error.message}
        </Text>
      );
    }
    return this.props.children;
  }
}

function PropsTable({ name, rows }: { name: string; rows: PropDoc[] | undefined }) {
  if (!rows?.length) return null;
  return (
    <div className="grid gap-2">
      <Text size="control" weight="semibold" tone="bright">
        {name}
      </Text>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Prop</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>What it does</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.name}>
              <TableCell className="align-top">
                <code className="font-mono text-meta text-tone-teal">
                  {row.name}
                  {row.optional ? "?" : ""}
                </code>
              </TableCell>
              <TableCell className="align-top">
                <code className="font-mono text-meta text-tone-violet">{row.type}</code>
              </TableCell>
              <TableCell className="align-top">
                <Text size="meta" tone="muted" wrap>
                  {row.doc}
                </Text>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ComponentPage({ example }: { example: Example }) {
  const details = example.load();
  const guidanceModule = loadGuidance();
  const { Component: Preview, code, props } = React.use(details);
  const guidance = React.use(guidanceModule).guidanceFor(example.components);
  const withProps = example.components.filter((name) => (props[name]?.length ?? 0) > 0);
  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <DocsTitle
          eyebrow="Components"
          title={example.title}
          lead={[example.components.length > 1 ? `With ${example.components.slice(1).join(", ")}.` : "", example.about].filter(Boolean).join(" ")}
        />
        <Text size="meta" tone="muted">
          <InlineLink asChild>
            <a href={`${repository}/blob/main/src/${example.file.split(" · ")[0]}`}>src/{example.file}</a>
          </InlineLink>
        </Text>
      </div>
      <Surface tone="page" edge="hairline" radius="xl" className="relative min-w-0 p-6">
        <Boundary key={example.id}>
          <Preview />
        </Boundary>
      </Surface>
      {guidance.length ? (
        <Section title="When to use it">
          <div className="grid gap-3">
            {guidance.map((row) => (
              <div key={row.job} className="grid gap-1">
                <Text size="body" weight="medium" wrap>
                  {row.job}
                </Text>
                <Text size="meta" tone="muted" wrap>
                  Use <Inline text={row.use} />
                </Text>
                <Text size="meta" tone="muted" wrap>
                  Not <Inline text={row.not} />
                </Text>
              </div>
            ))}
          </div>
        </Section>
      ) : null}
      <Section title="Code">
        <CodeBlock language="tsx" code={code} />
      </Section>
      {withProps.length ? (
        <Section title="Props">
          <div className="grid gap-6">
            {withProps.map((name) => (
              <PropsTable key={name} name={name} rows={props[name]} />
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}
