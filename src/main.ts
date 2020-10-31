import { server } from "./net/mod.ts";
import * as api from "./plugin_api.ts";
import { loadPlugins } from "./plugins.ts";
import { db } from "./storage.ts";

export interface IContext {
  server: api.TcpServer,
  db: api.Database,
};

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