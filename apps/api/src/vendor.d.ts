declare module "swagger-ui-express" {
  import type { RequestHandler } from "express";
  const serve: RequestHandler[];
  export function setup(doc: unknown, opts?: unknown): RequestHandler;
  export default { serve, setup };
}
declare module "bcryptjs" {
  export function hash(data: string, saltOrRounds: string | number): Promise<string>;
  export function compare(data: string, encrypted: string): Promise<boolean>;
  const bcrypt: { hash: typeof hash; compare: typeof compare };
  export default bcrypt;
}
