import { TcpServer, ITelnetHandler, TcpClient } from "./tcp.ts";
import { buildGMCP, parseGMCPSupports, Option } from "./telnet.ts";
import { env } from "../config.ts";

function log(...args: any[]): void {
  console.log("[Net]", ...args);
}

export const server = new TcpServer({
  host: env["HOST"] || "127.0.0.1",
  port: isNaN(Number(env["PORT"])) ? 13390 : Number(env["PORT"]),
  handlers: {
    onData: async function (chunk: Uint8Array) {
      const data: string = new TextDecoder().decode(chunk);
      log(`<${this.guid}> DATA: ${data}`);
    },
    onGoAhead: async function () {
      log(`<${this.guid}> GOAHEAD`);
    },
    onNegotiation: async function (command: number, option: number) {
      log(`<${this.guid}> NEG: ${command} | ${option}`);
    },
    onSubnegotiation: async function (option: number, data: Uint8Array) {
      if (option == Option.GMCP) return;
      log(`<${this.guid}> SUBNEG: ${option} | ${new TextDecoder().decode(data)}`);
    },
    onSend: async function (data) {
      await this.send(data);
    },
    onGMCP: async function (namespace: string, data: string | string[] | { [key: string]: any }) {
      //
    }
  }
});