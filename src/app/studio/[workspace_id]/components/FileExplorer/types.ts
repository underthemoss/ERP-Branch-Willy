export interface FileNode {
  id: string;
  name: string;
  type: "root" | "folder" | "entity";
  entityType?: "pricebook" | "project" | "contact" | "price";
  entityId?: string;
  children?: FileNode[];
  isLazyLoaded?: boolean;
  hasUnloadedChildren?: boolean;
}

export type EntityType = "pricebook" | "project" | "contact" | "price";
