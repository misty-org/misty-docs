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
  ErrorState,
  IconButton,
  Mark,
  NavList,
  NavRow,
  NavRowLabel,
  PaneLoading,
  Pressable,
  Text,
} from "@misty/ui";

import { loadOnce } from "./load_once";
import { Markdown } from "./Markdown";
import { allDocs, allExamples, componentGroups, sectionLines, sections, type Doc, type DocPage, type Example } from "./sources";

const repository = "https://github.com/misty-org";

const GoContext = React.createContext<(route: string) => void>(() => {});
const useGo = () => React.useContext(GoContext);

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

function useActiveHeading(page: DocPage | undefined) {
  const [active, setActive] = React.useState<string | undefined>();
  React.useEffect(() => {
    setActive(page?.headings[0]?.id);
    const targets = (page?.headings ?? []).map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => !!el);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-72px 0px -70% 0px" },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [page]);
  return active;
}

function useDocPage(doc: Doc | undefined) {
  const [, setLoaded] = React.useState(0);
  const [failed, setFailed] = React.useState<string>();
  const read = doc && failed !== doc.id ? doc.page() : undefined;
  React.useEffect(() => {
    if (!(read instanceof Promise) || !doc) return;
    let live = true;
    read.then(
      () => live && setLoaded((count) => count + 1),
      () => live && setFailed(doc.id),
    );
    return () => {
      live = false;
    };
  }, [read, doc]);
  return {
    page: read instanceof Promise ? undefined : read,
    failed: !!doc && failed === doc.id,
    retry: () => setFailed(undefined),
  };
}

function DocArticle({ doc, page, group }: { doc: Doc; page: DocPage; group: string | undefined }) {
  return (
    <article className="min-w-0 max-w-3xl">
      <DocsTitle eyebrow={group} title={doc.title} lead={page.description} />
      <div className="mt-10">
        <Markdown source={page.body} />
      </div>
    </article>
  );
}

const loadComponents = loadOnce(() => import("./Components"));

const styleLoads = new WeakMap<() => Promise<unknown>, () => Promise<unknown>>();

function loadStyles(load: () => Promise<unknown>) {
  let once = styleLoads.get(load);
  if (!once) {
    once = loadOnce(load);
    styleLoads.set(load, once);
  }
  return once();
}

function ComponentRoute({ example, styles }: { example: Example; styles?: () => Promise<unknown> }) {
  const page = loadComponents();
  const stylesheet = styles ? loadStyles(styles) : undefined;
  const { ComponentPage } = React.use(page);
  if (stylesheet) React.use(stylesheet);
  return <ComponentPage example={example} />;
}

class LoadBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <ErrorState
          inline
          title="Couldn't load this page"
          action={{ label: "Try again", onClick: () => this.setState({ failed: false }) }}
        />
      );
    }
    return this.props.children;
  }
}

const exampleForRoute = (route: string): Example | undefined =>
  allExamples.find((example) => `components/${example.id}` === route);

export function DocsSite({
  route: requested,
  onNavigate,
  top = "0px",
  bar = true,
  gutter,
  maxWidth,
  themeToggle = false,
  componentStyles,
}: {
  route: string;
  onNavigate: (route: string) => void;
  top?: string;
  bar?: boolean;
  gutter?: string;
  maxWidth?: string;
  themeToggle?: boolean;
  componentStyles?: () => Promise<unknown>;
}) {
  const go = onNavigate;
  const [light, setLight] = React.useState(false);
  React.useEffect(() => {
    if (!themeToggle) return;
    document.documentElement.dataset.theme = light ? "light" : "dark";
  }, [light, themeToggle]);

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
  const { page, failed, retry } = useDocPage(doc);
  const active = useActiveHeading(page);

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
        page && page.headings.length > 1 ? (
          <DocsToc
            items={page.headings}
            active={active}
            onSelect={(id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
          />
        ) : undefined
      }
    >
      {doc ? (
        page ? (
          <DocArticle doc={doc} page={page} group={groupOfPage} />
        ) : failed ? (
          <ErrorState inline title="Couldn't load this page" action={{ label: "Try again", onClick: retry }} />
        ) : (
          <PaneLoading inline label={`Loading ${doc.title}`} />
        )
      ) : example ? (
        <LoadBoundary key={route}>
          <React.Suspense fallback={<PaneLoading inline label={`Loading ${example.title}`} />}>
            <ComponentRoute example={example} styles={componentStyles} />
          </React.Suspense>
        </LoadBoundary>
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

export function DocsNavControls({ route, onNavigate }: { route: string; onNavigate: (route: string) => void }) {
  const current = productOf(route)?.id ?? products[0]?.id;
  return (
    <DocsSwitcher
      sections={products.map((item) => ({ id: item.id, label: item.label }))}
      current={current}
      onSelect={(id) => onNavigate(firstPage(products.find((item) => item.id === id)!))}
    />
  );
}
