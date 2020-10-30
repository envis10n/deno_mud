import { Parser, Option, Command, buildGMCP, buildTelnetCommand, CompatibilityTable } from "./telnet.ts";
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
      onSend: handlers.onSend.bind(this),
    }

    // Bind parser events to internal handler methods
    this.parser.on("data", this.handlers.onData);
    this.parser.on("goahead", this.handlers.onGoAhead);
    this.parser.on("negotiation", this.handlers.onNegotiation);
    this.parser.on("subnegotiation", this.handlers.onSubnegotiation);
    this.parser.on("gmcp", this.handlers.onGMCP);
    this.parser.on("send", this.handlers.onSend);
  }
  public async loop(): Promise<void> {
    for await (const b of Deno.iter(this.conn)) {
      this.parser.accumulate(b);
    }
  }
  public async send(data: string | Uint8Array, goAhead: boolean = false): Promise<number> {
    let buffer: Uint8Array;
    if (typeof data == "string") buffer = new TextEncoder().encode(data);
    else buffer = data;
    const sent = await this.conn.write(buffer);
    if (goAhead) {
      await this.conn.write(buildTelnetCommand(Command.GA));
    }
    return sent;
  }
}

// "data" | "goahead" | "negotiation" | "subnegotiation" | "gmcp"

export interface ITelnetHandler {
  onData: (this: TcpClient, chunk: Uint8Array) => Promise<void>;
  onGoAhead: (this: TcpClient, ) => Promise<void>;
  onNegotiation: (this: TcpClient, command: number, option: number) => Promise<void>;
  onSubnegotiation: (this: TcpClient, option: number, data: Uint8Array) => Promise<void>;
  onGMCP: (this: TcpClient, namespace: string, data: string | string[] | { [key: string]: any }) => Promise<void>;
  onSend: (this: TcpClient, data: Uint8Array) => Promise<void>;
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
  private eventListeners: Map<string, Array<(...args: any[]) => Promise<void>>> = new Map();
  constructor(config: ITcpServerConfig) {
    this.host = config.host || "localhost";
    this.port = config.port;
    const self = this;
    this.handlers = {
      async onData(chunk) {
        await self.emitEvent(this, "data", chunk);
        await config.handlers.onData.call(this, chunk);
      },
      async onGoAhead() {
        await self.emitEvent(this, "goahead");
        await config.handlers.onGoAhead.call(this);
      },
      async onGMCP(namespace, data) {
        await self.emitEvent(this, "gmcp", namespace, data);
        await config.handlers.onGMCP.call(this, namespace, data);
      },
      async onNegotiation(command, option) {
        await self.emitEvent(this, "negotiation", command, option);
        await config.handlers.onNegotiation.call(this, command, option);
      },
      async onSubnegotiation(option, data) {
        await self.emitEvent(this, "subnegotiation", option, data);
        await config.handlers.onSubnegotiation.call(this, option, data);
      },
      async onSend(data) {
        await self.emitEvent(this, "send", data);
        await config.handlers.onSend.call(this, data);
      }
    };
    this.listener = Deno.listen({ hostname: this.host, port: this.port, transport: "tcp" });
  }
  public addListener(event: string, listener: (...args: any[]) => Promise<void>): void {
    if (!this.eventListeners.has(event)) this.eventListeners.set(event, []);
    const listeners = this.eventListeners.get(event);
    if (listeners == undefined) return;
    listeners.push(listener);
  }
  public async emitEvent(self: any, event: string, ...args: any[]): Promise<void> {
    const listeners = this.eventListeners.get(event);
    if (listeners == undefined) return;
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      await listener.call(self, ...args);
    }
  }
  public removeListener(event: string, listener: (...args: any[]) => Promise<void>): boolean {
    const listeners = this.eventListeners.get(event);
    if (listeners == undefined) return false;
    const i = listeners.findIndex((l) => l.toString() == listener.toString());
    if (i == -1) return false;
    listeners.splice(i, 1);
    return true;
  }
  public async listen(): Promise<void> {
    for await (const conn of this.listener) {
      let client: TcpClient | null = new TcpClient(conn, this.handlers);
      const guid: string = client.guid;
      this.clientList.set(client.guid, client);
      console.log(`Client ${guid} connected.`);
      client.loop().catch((e) => {
        // Error here?
        console.log(`Client ${guid} error: ${e}`);
      }).finally(() => {
        this.emitEvent(this, "disconnect", client).finally(() => {
          this.clientList.delete(guid);
          client = null;
          console.log(`Client ${guid} disconnected.`);
        });
      });
      await this.emitEvent(this, "connect", client);
    }
  }
}