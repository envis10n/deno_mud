export async function readFile(path: string): Promise<string> {
  return new TextDecoder().decode(await Deno.readFile(path));
}

export async function readJSONAs<T>(path: string): Promise<T> {
  return <T>(JSON.parse(await readFile(path)));
}

export function ensureDirSync(path: string): boolean {
  try {
    const finfo = Deno.statSync(path);
    return finfo.isDirectory;
  } catch (e) {
    Deno.mkdirSync(path, { recursive: true });
    return false;
  }
}

export function ensureFileSync(path: string, data: string = ""): boolean {
  try {
    const finfo = Deno.statSync(path);
    return finfo.isFile;
  } catch (e) {
    Deno.writeFileSync(path, new TextEncoder().encode(data));
    return false;
  }
}

export function existsSync(path: string): boolean {
  try {
    const finfo = Deno.statSync(path);
    return true;
  } catch (e) {
    return false;
  }
}