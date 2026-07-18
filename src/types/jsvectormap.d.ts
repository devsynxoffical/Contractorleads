declare module "jsvectormap" {
  export default class jsVectorMap {
    constructor(options: Record<string, unknown>);
    destroy(): void;
    updateSize(): void;
    setSelectedMarkers(indexes: number[]): void;
  }
}

declare module "jsvectormap/dist/maps/world.js";
declare module "jsvectormap/dist/jsvectormap.min.css";
