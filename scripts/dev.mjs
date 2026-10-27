import { existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import demo from "./development-project.json" with { type: "json" };

process.chdir(fileURLToPath(new URL("../", import.meta.url)));
if (!existsSync("node_modules/next/dist/bin/next")) {
  console.log("Installing packages for the first run…");
  const result = spawnSync(process.execPath, [process.env.npm_execpath, "ci"], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const { default: { loadEnvConfig } } = await import("@next/env");
loadEnvConfig(process.cwd(), true);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url && !key) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = demo.url;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = demo.key;
  console.log("Connected to the Delivery Stories development project.");
} else if (!url || !key) {
  console.error("Your custom Supabase settings need both a URL and a publishable key.");
  process.exit(1);
}
process.env.NEXT_PUBLIC_SITE_URL ||= "http://localhost:3000";
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "0.0.0.0", ...process.argv.slice(2)], { stdio: "inherit", env: process.env });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", code => process.exit(code ?? 0));
