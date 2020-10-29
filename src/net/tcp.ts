import { Parser, Option, Command, buildGMCP, buildTelnetCommand } from "https://deno.land/x/deno_telnet@0.1.5/mod.ts";
import { v4 } from "https://deno.land/std@0.75.0/uuid/mod.ts";

export class TcpClient {
  public parser = new Parser();
  public guid = v4.generate();
  public handlers: ITelnetHandler;
  public conn: Deno.Conn;
  constructor(connection: Deno.Conn, handlers: ITelnetHandler) {
    this.conn = connection;

    // Bind handler methods to "this"
    this.handlers = {
      onData: handlers.onData.bind(this),
      onGoAhead: handlers.onGoAhead.bind(this),
      onNegotiation: handlers.onNegotiation.bind(this),
      onSubnegotiation: handlers.onSubnegotiation.bind(this),
      onGMCP: handlers.onGMCP.bind(this),
    }

    // Bind parser events to internal handler methods
    this.parser.on("data", this.handlers.onData);
    this.parser.on("goahead", this.handlers.onGoAhead);
    this.parser.on("negotiation", this.handlers.onNegotiation);
    this.parser.on("subnegotiation", this.handlers.onSubnegotiation);
    this.parser.on("gmcp", this.handlers.onGMCP);
  }
  public async loop(): Promise<void> {
    for await (const b of Deno.iter(this.conn)) {
      this.parser.accumulate(b);
    }
  }
  public async send(data: string | Uint8Array): Promise<number> {
    let buffer: Uint8Array;
    if (typeof data == "string") buffer = new TextEncoder().encode(data);
    else buffer = data;
    return await this.conn.write(buffer);
  }
}

// "data" | "goahead" | "negotiation" | "subnegotiation" | "gmcp"

export interface ITelnetHandler {
  onData: (this: TcpClient, chunk: Uint8Array) => Promise<void>;
  onGoAhead: (this: TcpClient, ) => Promise<void>;
  onNegotiation: (this: TcpClient, command: number, option: number) => Promise<void>;
  onSubnegotiation: (this: TcpClient, option: number, data: Uint8Array) => Promise<void>;
  onGMCP: (this: TcpClient, namespace: string, data: string | { [key: string]: any }) => Promise<void>;
}

export interface ITcpServerConfig {
  host?: string;
  port: number;
  handlers: ITelnetHandler;
}

export class TcpServer {
  public handlers: ITelnetHandler;
  public clientList: Map<string, TcpClient> = new Map();
  public host: string;
  public port: number;
  public listener: Deno.Listener;
  constructor(config: ITcpServerConfig) {
    this.host = config.host || "localhost";
    this.port = config.port;
    this.handlers = config.handlers;
    this.listener = Deno.listen({ hostname: this.host, port: this.port, transport: "tcp" });
  }
  public async listen(): Promise<void> {
    for await (const conn of this.listener) {
      let client: TcpClient | null = new TcpClient(conn, this.handlers);
      const guid: string = client.guid;
      console.log(`Client ${guid} connected.`);
      this.clientList.set(client.guid, client);
      client.loop().catch((e) => {
        // Error here?
        console.log(`Client ${guid} error: ${e}`);
      }).finally(() => {
        this.clientList.delete(guid);
        client = null;
        console.log(`Client ${guid} disconnected.`);
      });
      client.send(buildTelnetCommand(Command.WILL, Option.GMCP));
    }
  }
}