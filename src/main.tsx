// The standalone docs site (`npm run dev`). misty-website mounts DocsSite itself, under its own navbar.
import React from "react";
import { createRoot } from "react-dom/client";

import "./docs.css";

import { NoticeViewport, TooltipProvider } from "@misty/ui";

import { DocsSite } from "./DocsSite";

// The page lives in the hash (#/sdk/react), so the site is plain files that any static host serves.
const go = (route: string) => {
  window.location.hash = `/${route}`;
};

function useRoute(): string {
  const read = () => window.location.hash.replace(/^#\/?/, "");
  const [route, setRoute] = React.useState(read);
  React.useEffect(() => {
    const onHash = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return route;
}

function Standalone() {
  return <DocsSite route={useRoute()} onNavigate={go} themeToggle />;
}

createRoot(document.getElementById("root")!).render(
  <TooltipProvider>
    <Standalone />
    <NoticeViewport />
  </TooltipProvider>,
);
