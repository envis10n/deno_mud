import { config } from "../deps.ts";
import { readJSONAs, existsSync, ensureFileSync } from "./util.ts"
import { path } from "../deps.ts";

const envPath = path.resolve(Deno.cwd(), ".env");
const envDefaults = `${envPath}.defaults`;
const configPath = path.resolve(Deno.cwd(), "deno_mud.json");

interface IDenoMUDPluginDef {
  enabled: boolean;
  url: string;
}

interface IDenoMUDOptions {
  plugins: IDenoMUDPluginDef[],
}

ensureFileSync(configPath, JSON.stringify({
  plugins: [],
}, null, 2));

export const denoMUDOptions: IDenoMUDOptions = await readJSONAs(configPath);

let _env: { [key: string]: string } = {}

if (existsSync(envPath)) {
  _env = config({ path: envPath, defaults: envDefaults });
}

export const env = _env;