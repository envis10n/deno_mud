import { config } from "../deps.ts";

export const env = config({path: `${Deno.cwd()}/.env`});