import { env } from "./config.ts";
import { path } from "../deps.ts";
import { ensureDirSync } from "./util.ts";

let _dbpath: string = env["DB_PATH"] || "./db";

if (!path.isAbsolute(_dbpath)) _dbpath = path.resolve(Deno.cwd(), _dbpath);

export const dbPath = _dbpath;

export interface ICollection {
  checksum: string;
  contents: any[];
}

export class Collection<T> {
  public checksum: string = "";
  public contents: T[] = [];
  public find = this.contents.find;
  public static from<T>(json: ICollection): Collection<T> {
    const col = new Collection<T>();
    col.checksum = json.checksum;
    col.contents = json.contents as T[];
    return col;
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
      this._collections.set(name, icol);
    }
    return Collection.from(icol);
  }
}

export const db = new Database(dbPath);