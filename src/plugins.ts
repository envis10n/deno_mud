import * as path from "https://deno.land/std@0.75.0/path/mod.ts";

function log(...args: any[]): void {
  console.log("[Plugins]", ...args);
}

export const pluginDir = path.resolve(Deno.cwd(), "plugins");

export interface IPlugin {
  __id: string;
  __init(context: { [key: string]: any; }): Promise<void>;
}

export const plugins: Map<string, IPlugin> = new Map();

export async function loadPlugins(context: { [key: string]: any; }): Promise<void> {
  for await (const ent of Deno.readDir(pluginDir)) {
    if (!ent.isFile) continue;
    const fpath = path.resolve(pluginDir, ent.name);
    const plugin: IPlugin = await import(`file:///${fpath}`);
    if (plugin.__id == undefined || typeof plugin.__id != "string") throw new Error("Plugin id is not a string.");
    if (plugin.__init == undefined || typeof plugin.__init != "function") throw new Error(`Plugin file ${plugin.__id} is missing __init`);
    if (plugins.has(plugin.__id)) throw new Error(`Duplicate plugin identifiers: ${plugin.__id}`);
    plugins.set(plugin.__id, plugin);
    await plugin.__init(context);
    log("Loaded plugin:", plugin.__id);
  }
  log("Loaded", plugins.size, "plugin(s).");
}