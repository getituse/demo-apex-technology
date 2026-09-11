export const MIRROR_REGISTRY: string;
export const FETCH_TIMEOUT_MS: number;
export const PROBE_PACKAGES: readonly string[];
export function npmInstallArgs(npmBin: string, cache?: string): string[];
export function verificationProject(lock: unknown): {
  manifest: {
    name: string;
    version: string;
    private: boolean;
    dependencies: Record<string, string>;
  };
  lock: {
    name: string;
    version: string;
    lockfileVersion: number;
    requires: boolean;
    packages: Record<string, unknown>;
  };
};
export function verifyLockedArchive(archive: Buffer, expected: string): boolean;
