export interface ComponentCatalogEntry {
  fallbackSlots: string[];
  id: string;
  needsForm: boolean;
  props: Record<string, unknown>;
  slots: string[];
  usage: number;
  warnings: string[];
}

export declare const componentCatalog: ComponentCatalogEntry[];
