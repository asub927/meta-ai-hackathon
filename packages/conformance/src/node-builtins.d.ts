/** Minimal declarations for the node: builtins used by the vector scripts.
 *  (The workspace has no @types/node; these cover exactly what we import.) */
declare module "node:fs" {
  export function mkdirSync(path: string, options?: { recursive?: boolean }): string | undefined;
  export function writeFileSync(path: string, data: string): void;
  export function readFileSync(path: string, encoding: "utf8"): string;
}
declare module "node:path" {
  export function dirname(p: string): string;
  export function join(...paths: string[]): string;
}
declare module "node:url" {
  export function fileURLToPath(url: string | URL): string;
}
