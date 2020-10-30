import { TcpClient, TcpServer } from "../src/net/tcp.ts";
export const __id = "echo";
export async function __init(context: { [key: string]: any; }) {
  context.server.addListener("connect", async function (this: TcpServer, client: TcpClient) {
    client.send("(DEMO)> ", true);
  });
  context.server.addListener("data", async function (this: TcpClient, chunk: Uint8Array) {
    this.send(chunk);
    this.send("(DEMO)> ", true);
  });
}