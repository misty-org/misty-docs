// The Misty docs, as a component: each repository's own docs, drawn with @misty/ui. The standalone
// site (main.tsx) and misty-website (which mounts it under its own navbar and footer) both render it.
import React from "react";
import { BookOpen, Blocks, Moon, Palette, Sun } from "lucide-react";

import {
  Button,
  CodeBlock,
  Disclosure,
  DocsCard,
  DocsHeader,
  DocsHero,
  DocsLayout,
  DocsPager,
  DocsSearch,
  DocsSwitcher,
  DocsTitle,
  DocsToc,
  EmptyState,
  IconButton,
  Mark,
  NavList,
  NavRow,
  NavRowLabel,
  Pressable,
  Text,
} from "@misty/ui";

import { ComponentPage, exampleForRoute } from "./Components";
import { Markdown } from "./Markdown";
import { allDocs, componentGroups, sectionLines, sections, type Doc } from "./sources";

const repository = "https://github.com/misty-org";

const GoContext = React.createContext<(route: string) => void>(() => {});
const useGo = () => React.useContext(GoContext);

// ---------------------------------------------------------------------------------------------
// The docs are split into products, each with its own sidebar: the guides for using Misty, the
// SDK, and the design system (its rules and every component).

interface Item {
  id: string;
  title: string;
}
interface Group {
  id: string;
  title: string;
  items: Item[];
}
interface Product {
  id: string;
  label: string;
  groups: Group[];
}

const guideIds = ["introduction", "getting-started", "features", "account", "self-hosting", "env-files", "reference"];
const toGroup = (section: (typeof sections)[number]): Group => ({
  id: section.id,
  title: section.title,
  items: section.docs.map((doc) => ({ id: doc.id, title: doc.title })),
});

const products: Product[] = [
  { id: "guides", label: "App", groups: sections.filter((s) => guideIds.includes(s.id)).map(toGroup) },
  { id: "sdk", label: "SDK", groups: sections.filter((s) => s.id === "sdk").map(toGroup) },
  {
    id: "design",
    label: "Design",
    groups: [
      ...sections.filter((s) => s.id === "design").map(toGroup),
      ...componentGroups.map((group) => ({
        id: group.id,
        title: group.title,
        items: group.examples.map((example) => ({ id: `components/${example.id}`, title: example.title })),
      })),
    ],
  },
].filter((product) => product.groups.some((group) => group.items.length > 0));

const productOf = (route: string): Product | undefined =>
  products.find((product) => product.groups.some((group) => group.items.some((item) => item.id === route)));

const firstPage = (product: Product) => product.groups.find((group) => group.items.length)!.items[0].id;

function Sidebar({ product, route }: { product: Product; route: string }) {
  const go = useGo();
  return (
    <>
      <DocsSearch
        items={products.flatMap((item) =>
          item.groups.flatMap((group) => group.items.map((page) => ({ id: page.id, label: page.title, group: group.title, detail: item.label }))),
        )}
        onSelect={go}
      />
      <NavList>
        <NavRow current={route === ""} onClick={() => go("")}>
          <NavRowLabel bright={route === ""}>Overview</NavRowLabel>
        </NavRow>
      </NavList>
      <div className="grid gap-2">
        {product.groups.map((group) => (
          <Disclosure
            key={`${product.id}/${group.id}`}
            kind="row"
            title={group.title}
            defaultOpen={group.items.some((item) => item.id === route) || group === product.groups[0]}
          >
            {/* Room between the group's heading and its pages, so their washes never touch. */}
            <div className="pt-1.5 pb-1">
              <NavList>
                {group.items.map((item) => (
                  <NavRow key={item.id} current={route === item.id} onClick={() => go(item.id)}>
                    <NavRowLabel bright={route === item.id}>{item.title}</NavRowLabel>
                  </NavRow>
                ))}
              </NavList>
            </div>
          </Disclosure>
        ))}
      </div>
    </>
  );
}

const productIcons = { guides: BookOpen, sdk: Blocks, design: Palette };

function Home() {
  const go = useGo();
  const guides = products.find((product) => product.id === "guides");
  const sdk = products.find((product) => product.id === "sdk");
  return (
    <div className="pb-24">
      <DocsHero
        title="Build with Misty"
        lead="Use Misty with your team, build apps that run inside a Space, and make anything that looks like Misty."
        actions={
          <>
            {guides ? (
              <Button variant="primary" size="lg" onClick={() => go("getting-started/quickstart")}>
                Get started
              </Button>
            ) : null}
            {sdk ? (
              <Button size="lg" onClick={() => go(firstPage(sdk))}>
                Build an app
              </Button>
            ) : null}
          </>
        }
        aside={<CodeBlock header="terminal" language="bash" code={"npm install @misty/sdk\nnpm install @misty/ui lucide-react"} />}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {products.map((product) => (
          <DocsCard
            key={product.id}
            icon={productIcons[product.id as keyof typeof productIcons]}
            title={product.label}
            onSelect={() => go(firstPage(product))}
          >
            {sectionLines[product.id]}
          </DocsCard>
        ))}
      </div>
    </div>
  );
}

/** The heading of the article that is on screen, for the contents column to light. */
function useActiveHeading(doc: Doc | undefined) {
  const [active, setActive] = React.useState<string | undefined>();
  React.useEffect(() => {
    setActive(doc?.headings[0]?.id);
    const targets = (doc?.headings ?? []).map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => !!el);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-72px 0px -70% 0px" },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [doc]);
  return active;
}

function DocArticle({ doc, group }: { doc: Doc; group: string | undefined }) {
  return (
    <article className="min-w-0 max-w-3xl">
      <DocsTitle eyebrow={group} title={doc.title} lead={doc.description} />
      <div className="mt-10">
        <Markdown source={doc.body} />
      </div>
    </article>
  );
}

/**
 * The docs. `route` is the page's address without its leading slash (`sdk/react`, empty for the front
 * page) and `onNavigate` goes to another. `top` is the height of any bar above the docs (the website's
 * navbar), which what stays in view sits below; `gutter` and `maxWidth` are the site's own page padding
 * and width. `themeToggle` adds a light/dark button, for a site that
 * has no theme of its own.
 */
export function DocsSite({
  route: requested,
  onNavigate,
  top = "0px",
  bar = true,
  gutter,
  maxWidth,
  themeToggle = false,
}: {
  route: string;
  onNavigate: (route: string) => void;
  top?: string;
  /** Draws the docs' own top bar. Off where the site's navbar carries its controls (`DocsNavControls`). */
  bar?: boolean;
  /** The page's width and its side padding, to match the site around it. */
  gutter?: string;
  maxWidth?: string;
  themeToggle?: boolean;
}) {
  const go = onNavigate;
  const [light, setLight] = React.useState(false);
  React.useEffect(() => {
    if (!themeToggle) return;
    document.documentElement.dataset.theme = light ? "light" : "dark";
  }, [light, themeToggle]);

  // A section's own address (`self-hosting`, `sdk`) opens its first page.
  const route = React.useMemo(() => {
    const target =
      sections.find((section) => section.id === requested)?.docs[0]?.id ??
      products.find((item) => item.id === requested)?.groups.find((group) => group.items.length)?.items[0]?.id;
    return target ?? requested;
  }, [requested]);
  React.useEffect(() => {
    if (route !== requested) go(route);
  }, [route, requested, go]);

  const product = productOf(route);
  const doc = allDocs.find((item) => item.id === route);
  const example = exampleForRoute(route);
  const active = useActiveHeading(doc);

  // The pages of this product in reading order, for the pager.
  const pages = product?.groups.flatMap((group) => group.items.map((item) => ({ ...item, group: group.title }))) ?? [];
  const index = pages.findIndex((page) => page.id === route);
  const link = (page: (typeof pages)[number] | undefined, from: string | undefined) =>
    page ? { label: page.title, group: page.group === from ? undefined : page.group, onSelect: () => go(page.id) } : undefined;
  const groupOfPage = pages[index]?.group;

  return (
    <GoContext.Provider value={go}>
    <div
      style={
        {
          "--docs-top": top,
          ...(bar ? {} : { "--docs-bar": "0px" }),
          ...(gutter ? { "--docs-gutter": gutter } : {}),
          ...(maxWidth ? { "--docs-max": maxWidth } : {}),
        } as React.CSSProperties
      }
    >
    <DocsLayout
      header={
        !bar ? undefined : <DocsHeader
          brand={
            <Pressable wash="text" onClick={() => go("")}>
              <Text size="control" weight="semibold" tone="bright">
                Docs
              </Text>
            </Pressable>
          }
          sections={products.map((item) => ({ id: item.id, label: item.label }))}
          current={product?.id ?? products[0]?.id}
          onSelect={(id) => go(firstPage(products.find((item) => item.id === id)!))}
        >
          {themeToggle ? (
            <IconButton label={light ? "Dark theme" : "Light theme"} onClick={() => setLight(!light)}>
              {light ? <Moon /> : <Sun />}
            </IconButton>
          ) : null}
          <IconButton label="Source on GitHub" asChild>
            <a href={repository}>
              <Mark of="github" label="GitHub" />
            </a>
          </IconButton>
        </DocsHeader>
      }
      nav={product || route === "" ? <Sidebar product={product ?? products[0]} route={route} /> : undefined}
      toc={
        doc && doc.headings.length > 1 ? (
          <DocsToc
            items={doc.headings}
            active={active}
            onSelect={(id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
          />
        ) : undefined
      }
    >
      {doc ? (
        <DocArticle doc={doc} group={groupOfPage} />
      ) : example ? (
        <ComponentPage example={example} />
      ) : route === "" ? (
        <Home />
      ) : (
        <EmptyState title="Page not found" />
      )}
      <div className="flex-1" />
      <DocsPager previous={link(pages[index - 1], groupOfPage)} next={link(pages[index + 1], groupOfPage)} />
    </DocsLayout>
    </div>
    </GoContext.Provider>
  );
}

/**
 * The docs' controls for a site's own navbar: a slash and the switcher between App, SDK and Design,
 * for the navbar to draw beside its logo when it hides the docs' own bar (`bar={false}`).
 */
export function DocsNavControls({ route, onNavigate }: { route: string; onNavigate: (route: string) => void }) {
  // The front page is the App docs' too, so a name is always showing.
  const current = productOf(route)?.id ?? products[0]?.id;
  return (
    <DocsSwitcher
      sections={products.map((item) => ({ id: item.id, label: item.label }))}
      current={current}
      onSelect={(id) => onNavigate(firstPage(products.find((item) => item.id === id)!))}
    />
  );
}
