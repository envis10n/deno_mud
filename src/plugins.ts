import { denoMUDOptions } from "./config.ts";
import { path } from "../deps.ts";
import { Database } from "./storage.ts";
import { TcpServer, TcpClient } from "./net/tcp.ts";

export interface IContext {
  server: TcpServer,
  db: Database,
};

function log(...args: any[]): void {
  console.log("[Plugins]", ...args);
}

export const pluginDir = path.resolve(Deno.cwd(), "plugins");

export interface IPlugin {
  __id: string;
  __init(context: IContext): Promise<void>;
}

export const plugins: Map<string, IPlugin> = new Map();

export async function loadPlugin(path: string, context: IContext): Promise<void> {
  const plugin: IPlugin = await import(path);
  if (plugin.__id == undefined || typeof plugin.__id != "string") throw new Error("Plugin id is not a string.");
  if (plugin.__init == undefined || typeof plugin.__init != "function") throw new Error(`Plugin file ${plugin.__id} is missing __init`);
  if (plugins.has(plugin.__id)) throw new Error(`Duplicate plugin identifiers: ${plugin.__id}`);
  plugins.set(plugin.__id, plugin);
  await plugin.__init(context);
  log("Loaded plugin:", plugin.__id);
}

export async function loadPlugins(context: IContext): Promise<void> {
  // Load local plugins.
  for await (const ent of Deno.readDir(pluginDir)) {
    if (!ent.isFile) continue;
    const fpath = `file:///${path.resolve(pluginDir, ent.name)}`;
    await loadPlugin(fpath, context);
  }
  // Load remote plugins from plugins list file.
  for (const path of denoMUDOptions.plugins.filter((e) => e.enabled).map((e) => e.url)) {
    await loadPlugin(path, context);
  }
  log("Loaded", plugins.size, "plugin(s).");
}