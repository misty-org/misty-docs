import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const manifest = (dir) => JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));

export function sharedDependencies(ui, root) {
  const direct = Object.keys(manifest(ui).dependencies ?? {});
  const names = new Set(["react", "react-dom", "lucide-react", ...direct]);
  for (const name of direct) {
    const dir = join(ui, "node_modules", name);
    if (!existsSync(join(dir, "package.json"))) continue;
    for (const dependency of Object.keys(manifest(dir).dependencies ?? {})) names.add(dependency);
  }
  return [...names].filter((name) => existsSync(join(root, "node_modules", name, "package.json")));
}
