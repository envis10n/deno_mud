import { env } from "./config.ts";
import { path, v4 } from "../deps.ts";
import { ensureDirSync, ensureFileSync } from "./util.ts";

let _dbpath: string = env["DB_PATH"] || "./db";

if (!path.isAbsolute(_dbpath)) _dbpath = path.resolve(Deno.cwd(), _dbpath);

export const dbPath = _dbpath;

export interface ICollection {
  checksum: string;
  contents: any[];
}

export interface IDocument {
  _key?: string;
}

export class Collection<T extends IDocument> {
  public checksum: string = "";
  public contents: T[] = [];
  public find = this.contents.find;
  private dbBase: string;
  public readonly name: string;
  constructor(name: string, basePath: string) {
    this.dbBase = basePath;
    this.name = name;
  }
  public path(): string {
    return path.resolve(this.dbBase, `${this.name}.json`);
  }
  private serialize() {
    const d = JSON.stringify(this, null, 2);
    ensureFileSync(this.path(), d);
  }
  public insert(...docs: T[]): number {
    let count = 0;
    for (const doc of docs) {
      if (doc._key == undefined) doc._key = v4.generate().split("-")[0];
      else if (this.contents.findIndex((d) => d._key == doc._key) != -1) {
        continue;
      }
      this.contents.push(doc);
      count++;
    }
    this.serialize();
    return count;
  }
}

export class Database {
  public readonly path: string;
  private _collections: Map<string, ICollection> = new Map();
  constructor(dbpath: string) {
    this.path = dbpath;
    if (!ensureDirSync(this.path)) throw new Error("Unable to create db directory.");
    for (const f of Deno.readDirSync(this.path)) {
      if (!f.isFile) continue;
      const fpath = path.resolve(this.path, f.name);
      try {
        const data = JSON.parse(new TextDecoder().decode(Deno.readFileSync(fpath))) as ICollection;
        const pdata = path.parse(fpath);
        this._collections.set(pdata.name, data);
      } catch (e) {
        console.error("Error loading collection:", fpath, e);
      }
    }
  }
  public collection<T>(name: string): Collection<T> {
    let icol = this._collections.get(name);
    if (icol == undefined) {
      icol = { checksum: "", contents: [] };
      ensureFileSync(path.resolve(this.path, `${name}.json`), JSON.stringify(icol, null, 2));
      this._collections.set(name, icol);
    }
    return this.collectionFrom(name, icol);
  }
  private collectionFrom<T extends IDocument>(name: string, json: ICollection): Collection<T> {
    const col = new Collection<T>(name, this.path);
    col.checksum = json.checksum;
    col.contents = json.contents as T[];
    return col;
  }
}

export const db = new Database(dbPath);