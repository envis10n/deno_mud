import { TcpClient, TcpServer } from "../src/net/tcp.ts";
import { buildGMCP, parseGMCPSupports, Option } from "../src/net/telnet.ts";
import { env } from "../src/config.ts";

function log(...args: any[]): void {
  console.log("[GMCP]", ...args);
}

export const __id = "gmcp";
export async function __init(context: { [key: string]: any; }) {
  context.server.addListener("connect", async function (this: TcpServer, client: TcpClient) {
    client.parser.options.support(Option.GMCP);
    client.parser.WILL(Option.GMCP);
  });
  context.server.addListener("gmcp", async function (this: TcpClient, namespace: string, data: string | string[] | { [key: string]: any }) {
    switch (namespace) {
      case "Core.Hello":
        data = <{ [key: string]: any }>(data);
        const client: string = data.client || data.Client || "[NO CLIENT]";
        const version: string = data.version || data.Version || "[NO VERSION]";
        log(`<${this.guid}> GMCP enabled. Hello from ${client} ${version}`);
        break;
      case "Core.Supports.Set":
        log(parseGMCPSupports(data as string[]));
        break;
      case "External.Discord.Hello":
        this.send(buildGMCP("External.Discord.Info", { applicationid: env["DISCORD_APPID"] }));
        break;
      default:
        log(`<${this.guid}> GMCP Event ${namespace}`, data);
        break;
    }
  });
}