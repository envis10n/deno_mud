import { Option } from "https://deno.land/x/deno_telnet@0.1.5/mod.ts";
import { TcpServer, ITelnetHandler, TcpClient } from "./tcp.ts";
import { buildGMCP, parseGMCPSupports } from "./telnet.ts";
import { env } from "../config.ts";

export const server = new TcpServer({
  host: "0.0.0.0",
  port: 13390,
  handlers: {
    onData: async function (chunk: Uint8Array) {
      const data: string = new TextDecoder().decode(chunk);
      console.log(`<${this.guid}> DATA: ${data}`);
      await this.send("(DEMO)> ");
    },
    onGoAhead: async function () {
      console.log(`<${this.guid}> GOAHEAD`);
    },
    onNegotiation: async function (command: number, option: number) {
      console.log(`<${this.guid}> NEG: ${command} | ${option}`);
    },
    onSubnegotiation: async function (option: number, data: Uint8Array) {
      if (option == Option.GMCP) return;
      console.log(`<${this.guid}> SUBNEG: ${option} | ${new TextDecoder().decode(data)}`);
    },
    onGMCP: async function (namespace: string, data: string | string[] | { [key: string]: any }) {
      switch (namespace) {
        case "Core.Hello":
          data = <{ [key: string]: any }>(data);
          const client: string = data.client || data.Client || "[NO CLIENT]";
          const version: string = data.version || data.Version || "[NO VERSION]";
          console.log(`<${this.guid}> GMCP enabled. Hello from ${client} ${version}`);
          break;
        case "Core.Supports.Set":
          console.log(parseGMCPSupports(data as string[]));
          break;
        case "External.Discord.Hello":
          this.send(buildGMCP("External.Discord.Info", { applicationid: env["DISCORD_APPID"] }));
          break;
        default:
          console.log(`<${this.guid}> GMCP Event ${namespace}`, data);
          break;
      }
    }
  }
});