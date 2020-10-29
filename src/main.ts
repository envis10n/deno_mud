import { server } from "./net/mod.ts";

export default async function main() {
  server.listen().catch((e) => {
    console.error(e);
  }).finally(() => {
    //
  });
  console.log(`Server listening on ${server.host}:${server.port}...`);
}