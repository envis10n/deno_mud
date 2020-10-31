import * as tcp from "./net/tcp.ts";
import * as storage from "./storage.ts";

export interface IContext {
  server: tcp.TcpServer,
  db: storage.Database,
};

export type TcpServer = tcp.TcpServer;
export type TcpClient = tcp.TcpClient;
export type Database = storage.Database;
export type Collection<T> = storage.Collection<T>;