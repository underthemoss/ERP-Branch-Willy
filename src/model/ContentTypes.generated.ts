
import { SystemIconTypes } from "@/ui/Icons";

/**
 * Keys of all content types
 */
export type ContentTypeKeys = "item" | "collection" | "collection_asset" | "workspace" | "folder" | "project" | "order" | "asset";

export const ContentTypeViewModelKeyed = {
  item: {
    type: "item",
    label: "Item",
    parent: null,
    allowed_children: [] as ContentTypeKeys[],
    abstract: true,
    color: "red",
    icon: "AccountTree" as SystemIconTypes,
    depth: 0,
    lineage: [] as ContentTypeKeys[],
    descendents: ["item","collection","collection_asset","workspace","folder","project","order","asset"] as ContentTypeKeys[],
    fields: [{"name":"created_by","label":"Created by","type":"text","required":true,"source":"item"}]
  },
  collection: {
    type: "collection",
    label: "Collection",
    parent: "item" as ContentTypeKeys,
    allowed_children: [] as ContentTypeKeys[],
    abstract: true,
    color: "gray",
    icon: "ViewList" as SystemIconTypes,
    depth: 1,
    lineage: ["item"] as ContentTypeKeys[],
    descendents: ["collection","collection_asset"] as ContentTypeKeys[],
    fields: [{"name":"created_by","label":"Created by","type":"text","required":true,"source":"item"},{"name":"name","label":"Name","type":"text","required":true,"source":"collection"}]
  },
  collection_asset: {
    type: "collection_asset",
    label: "Assets",
    parent: "collection" as ContentTypeKeys,
    allowed_children: ["asset"] as ContentTypeKeys[],
    abstract: false,
    color: "green",
    icon: "ViewList" as SystemIconTypes,
    depth: 2,
    lineage: ["item","collection"] as ContentTypeKeys[],
    descendents: ["collection_asset"] as ContentTypeKeys[],
    fields: [{"name":"created_by","label":"Created by","type":"text","required":true,"source":"item"},{"name":"name","label":"Name","type":"text","required":true,"source":"collection"}]
  },
  workspace: {
    type: "workspace",
    label: "Workspace",
    parent: "item" as ContentTypeKeys,
    allowed_children: ["project"] as ContentTypeKeys[],
    abstract: false,
    color: "green",
    icon: "Article" as SystemIconTypes,
    depth: 1,
    lineage: ["item"] as ContentTypeKeys[],
    descendents: ["workspace"] as ContentTypeKeys[],
    fields: [{"name":"created_by","label":"Created by","type":"text","required":true,"source":"item"},{"name":"name","label":"Name","type":"text","required":true,"source":"workspace"}]
  },
  folder: {
    type: "folder",
    label: "Folder",
    parent: "item" as ContentTypeKeys,
    allowed_children: [] as ContentTypeKeys[],
    abstract: true,
    color: "orange",
    icon: "FolderOpen" as SystemIconTypes,
    depth: 1,
    lineage: ["item"] as ContentTypeKeys[],
    descendents: ["folder"] as ContentTypeKeys[],
    fields: [{"name":"created_by","label":"Created by","type":"text","required":true,"source":"item"}]
  },
  project: {
    type: "project",
    label: "Project",
    parent: "item" as ContentTypeKeys,
    allowed_children: [] as ContentTypeKeys[],
    abstract: false,
    color: "green",
    icon: "Article" as SystemIconTypes,
    depth: 1,
    lineage: ["item"] as ContentTypeKeys[],
    descendents: ["project"] as ContentTypeKeys[],
    fields: [{"name":"created_by","label":"Created by","type":"text","required":true,"source":"item"},{"name":"name","label":"Name","type":"text","required":true,"source":"project"}]
  },
  order: {
    type: "order",
    label: "Order",
    parent: "item" as ContentTypeKeys,
    allowed_children: [] as ContentTypeKeys[],
    abstract: false,
    color: "green",
    icon: "Article" as SystemIconTypes,
    depth: 1,
    lineage: ["item"] as ContentTypeKeys[],
    descendents: ["order"] as ContentTypeKeys[],
    fields: [{"name":"created_by","label":"Created by","type":"text","required":true,"source":"item"},{"name":"name","label":"Name","type":"text","required":true,"source":"order"}]
  },
  asset: {
    type: "asset",
    label: "Asset",
    parent: "item" as ContentTypeKeys,
    allowed_children: [] as ContentTypeKeys[],
    abstract: false,
    color: "red",
    icon: "CloudDone" as SystemIconTypes,
    depth: 1,
    lineage: ["item"] as ContentTypeKeys[],
    descendents: ["asset"] as ContentTypeKeys[],
    fields: [{"name":"created_by","label":"Created by","type":"text","required":true,"source":"item"},{"name":"name","label":"Name","type":"text","required":true,"source":"asset"}]
  }
} as const;


/**
 * ContentTypeDataModel - data model for a content type instance
 */
export type ContentTypeDataModel = 
  | {
      _id: string;
      type: "item";
      tenant_id: string;
      parent_id: string;
      data: {
        created_by: string;
      };
    }
  | {
      _id: string;
      type: "collection";
      tenant_id: string;
      parent_id: string;
      data: {
        created_by: string;
				name: string;
      };
    }
  | {
      _id: string;
      type: "collection_asset";
      tenant_id: string;
      parent_id: string;
      data: {
        created_by: string;
				name: string;
      };
    }
  | {
      _id: string;
      type: "workspace";
      tenant_id: string;
      parent_id: string;
      data: {
        created_by: string;
				name: string;
      };
    }
  | {
      _id: string;
      type: "folder";
      tenant_id: string;
      parent_id: string;
      data: {
        created_by: string;
      };
    }
  | {
      _id: string;
      type: "project";
      tenant_id: string;
      parent_id: string;
      data: {
        created_by: string;
				name: string;
      };
    }
  | {
      _id: string;
      type: "order";
      tenant_id: string;
      parent_id: string;
      data: {
        created_by: string;
				name: string;
      };
    }
  | {
      _id: string;
      type: "asset";
      tenant_id: string;
      parent_id: string;
      data: {
        created_by: string;
				name: string;
      };
    };


export const isTypeof = (source: ContentTypeKeys, test: ContentTypeKeys) => {
  const ct = ContentTypeViewModelKeyed[source];
  return ct.lineage.includes(test);
};
export const CastContentType = <t extends ContentTypeKeys>(
  entity: ContentTypeDataModel
): Extract<ContentTypeDataModel, { type: t }> => {
  const ct = ContentTypeViewModelKeyed[entity.type];
  return entity as Extract<ContentTypeDataModel, { type: t }>;
};

