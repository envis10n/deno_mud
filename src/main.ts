import { server } from "./net/mod.ts";
import { env } from "./config.ts";
import { loadPlugins } from "./plugins.ts";

const pluginContext: { [key: string]: any; } = {
  server,
};

export default async function main() {
  await loadPlugins(pluginContext);
  server.listen().catch((e) => {
    console.error(e);
  }).finally(() => {
    //
  });
  console.log(`Server listening on ${server.host}:${server.port}...`);
}