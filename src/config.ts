import { config } from "../deps.ts";
import { readJSONAs } from "./util.ts"
import { path } from "../deps.ts";

interface IDenoMUDPluginDef {
  enabled: boolean;
  url: string;
}

interface IDenoMUDOptions {
  plugins: IDenoMUDPluginDef[],
}

export const denoMUDOptions: IDenoMUDOptions = await readJSONAs(path.resolve(Deno.cwd(), "deno_mud.json"));

export const env = config({path: `${Deno.cwd()}/.env`});