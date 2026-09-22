import { describe, expect, it } from "vitest";
import { resolveStorageConfig } from "./storage.js";

describe("resolveStorageConfig", () => {
  it("local por defecto sin tocar disco ni red", () => {
    const c = resolveStorageConfig({ ...process.env, STORAGE_DRIVER: undefined, S3_BUCKET: undefined });
    expect(c.backend).toBe("local");
    expect(c.localDir.endsWith("uploads")).toBe(true);
  });

  it("s3 exige las 4 credenciales (fail-fast)", () => {
    expect(() => resolveStorageConfig({ STORAGE_DRIVER: "s3" } as NodeJS.ProcessEnv)).toThrow(/S3_ENDPOINT, S3_BUCKET/);
  });

  it("s3 resuelve endpoint/bucket/prefix", () => {
    const c = resolveStorageConfig({
      STORAGE_DRIVER: "s3",
      S3_ENDPOINT: "https://xxx.r2.cloudflarestorage.com",
      S3_BUCKET: "ua-uploads",
      S3_ACCESS_KEY_ID: "id",
      S3_SECRET_ACCESS_KEY: "secret",
      S3_KEY_PREFIX: "/prod/",
    } as NodeJS.ProcessEnv);
    expect(c.backend).toBe("s3");
    expect(c.region).toBe("auto");
    expect(c.prefix).toBe("prod");
  });
});
