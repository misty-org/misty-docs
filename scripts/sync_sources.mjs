// Finds each source's directory (sources.json): a sibling checkout in development, a pinned clone in
// .sources/ otherwise. It also points node_modules/@misty/ui at the ui source, so the components, their
// styles and the docs built from them are always one checkout.
//
//   node scripts/sync_sources.mjs          (runs before `npm run dev` and `npm run build`)
//   DOCS_SOURCES=pinned node scripts/sync_sources.mjs   (ignore sibling checkouts)
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, lstatSync, unlinkSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed in ${cwd}`);
}

/** The directory of every source, by name. */
export function resolveSources() {
  const { sources } = JSON.parse(readFileSync(join(root, "sources.json"), "utf8"));
  const pinned = process.env.DOCS_SOURCES === "pinned";
  const dirs = {};
  for (const source of sources) {
    const sibling = resolve(root, source.path);
    if (!pinned && existsSync(sibling)) {
      dirs[source.name] = sibling;
      continue;
    }
    const clone = join(root, ".sources", source.name);
    if (!existsSync(clone)) {
      mkdirSync(join(root, ".sources"), { recursive: true });
      run("git", ["clone", "--depth", "1", "--branch", source.ref, source.repo, clone], root);
      if (source.install) run("npm", ["install", "--no-audit", "--no-fund", "--ignore-scripts"], clone);
    }
    dirs[source.name] = clone;
  }
  if (dirs.ui) linkUi(dirs.ui);
  return dirs;
}

function linkUi(ui) {
  const link = join(root, "node_modules", "@misty", "ui");
  mkdirSync(dirname(link), { recursive: true });
  try {
    if (lstatSync(link).isSymbolicLink() || existsSync(link)) {
      if (existsSync(link) && resolve(dirname(link), readSafe(link)) === ui) return;
      rmSync(link, { recursive: true, force: true });
    }
  } catch {
    /* nothing there yet */
  }
  symlinkSync(ui, link, "dir");
}

function readSafe(path) {
  try {
    return spawnSync("readlink", [path], { encoding: "utf8" }).stdout.trim() || path;
  } catch {
    return path;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(resolveSources());
}
