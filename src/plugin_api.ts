export {TcpClient, TcpServer} from "./net/tcp.ts";
export { Database, Collection } from "./storage.ts";
import { ICollection as _ICollection, IDocument as _IDocument } from "./storage.ts";
import { IContext as _IContext, IPlugin as _IPlugin} from "./plugins.ts";

export type ICollection = _ICollection;
export type IContext = _IContext;
export type IPlugin = _IPlugin;
export type IDocument = _IDocument;