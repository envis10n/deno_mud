import { config } from "https://deno.land/x/dotenv@v0.5.0/mod.ts";

export const env = config({path: `${Deno.cwd()}/.env`});