export type ContrastLevel = "body" | "large" | "ui";

export interface ContrastPair {
  foreground: string;
  background: string;
  level: ContrastLevel;
}

export interface ContrastResult {
  presetName: string;
  pair: string;
  level: ContrastLevel;
  required: number;
  ratio: number;
  passed: boolean;
}

export declare const THRESHOLDS: Record<ContrastLevel, number>;
export declare const CONTRAST_PAIRS: ContrastPair[];

export declare function parseHsl(value: string): {
  hue: number;
  saturation: number;
  lightness: number;
};
export declare function hslToRgb(value: string): number[];
export declare function relativeLuminance(value: string): number;
export declare function contrastRatio(foreground: string, background: string): number;
export declare function roundRatio(ratio: number): number;
export declare function auditPreset(
  presetName: string,
  theme: Record<string, string>,
): ContrastResult[];
export declare function auditAllPresets(
  presets: Record<string, Record<string, string>>,
): ContrastResult[];
