declare module "jsvectormap" {
  export default class jsVectorMap {
    constructor(options: Record<string, unknown>);
    destroy(): void;
    updateSize(): void;
    setFocus(config: Record<string, unknown>): void;
    setSelectedMarkers(indexes: number[]): void;
    clearSelectedMarkers(): void;
    setSelectedRegions(regions: string | string[]): void;
    clearSelectedRegions(): void;
    addMarkers(config: unknown): void;
    removeMarkers(markers?: unknown): void;
  }
}

declare module "jsvectormap/dist/maps/world.js";
declare module "jsvectormap/dist/jsvectormap.min.css";
