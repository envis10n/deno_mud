import { server } from "./net/mod.ts";
import { IContext } from "./plugin_api.ts";
import { loadPlugins } from "./plugins.ts";
import { db } from "./storage.ts";

const pluginContext: IContext = {
  server,
  db,
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