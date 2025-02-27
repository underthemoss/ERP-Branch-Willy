

export type ContentTypeKeys = "item" | "workspace" | "project" | "order";

export const ContentTypeViewModel = 
[
  {
    "label": "Item",
    "type": "item",
    "allowed_children": [],
    "color": "red",
    "icon": "AccountTree",
    "abstract": true,
    "parent": null,
    "depth": 0,
    "lineage": [],
    "fields": [
      {
        "name": "created_by",
        "label": "Created by",
        "type": "text",
        "required": true,
        "source": "item"
      }
    ],
    "descendants": [
      "workspace",
      "project",
      "order"
    ]
  },
  {
    "type": "workspace",
    "abstract": false,
    "allowed_children": [
      "project"
    ],
    "color": "green",
    "icon": "Article",
    "label": "Workspace",
    "parent": "item",
    "depth": 1,
    "lineage": [
      "item"
    ],
    "fields": [
      {
        "name": "created_by",
        "label": "Created by",
        "type": "text",
        "required": true,
        "source": "item"
      },
      {
        "name": "name",
        "label": "Name",
        "type": "text",
        "required": true,
        "source": "workspace"
      }
    ],
    "descendants": []
  },
  {
    "type": "project",
    "abstract": false,
    "allowed_children": [],
    "color": "green",
    "icon": "Article",
    "label": "Project",
    "parent": "item",
    "depth": 1,
    "lineage": [
      "item"
    ],
    "fields": [
      {
        "name": "created_by",
        "label": "Created by",
        "type": "text",
        "required": true,
        "source": "item"
      },
      {
        "name": "name",
        "label": "Name",
        "type": "text",
        "required": true,
        "source": "project"
      }
    ],
    "descendants": [
      "order"
    ]
  },
  {
    "type": "order",
    "abstract": false,
    "allowed_children": [],
    "color": "green",
    "icon": "Article",
    "label": "Order",
    "parent": "project",
    "depth": 2,
    "lineage": [
      "item",
      "project"
    ],
    "fields": [
      {
        "name": "created_by",
        "label": "Created by",
        "type": "text",
        "required": true,
        "source": "item"
      },
      {
        "name": "name",
        "label": "Name",
        "type": "text",
        "required": true,
        "source": "order"
      }
    ],
    "descendants": []
  }
];

export const ContentTypeViewModelKeyed = 
{
  "item": {
    "label": "Item",
    "type": "item",
    "allowed_children": [],
    "color": "red",
    "icon": "AccountTree",
    "abstract": true,
    "parent": null,
    "depth": 0,
    "lineage": [],
    "fields": [
      {
        "name": "created_by",
        "label": "Created by",
        "type": "text",
        "required": true,
        "source": "item"
      }
    ],
    "descendants": [
      "workspace",
      "project",
      "order"
    ]
  },
  "workspace": {
    "type": "workspace",
    "abstract": false,
    "allowed_children": [
      "project"
    ],
    "color": "green",
    "icon": "Article",
    "label": "Workspace",
    "parent": "item",
    "depth": 1,
    "lineage": [
      "item"
    ],
    "fields": [
      {
        "name": "created_by",
        "label": "Created by",
        "type": "text",
        "required": true,
        "source": "item"
      },
      {
        "name": "name",
        "label": "Name",
        "type": "text",
        "required": true,
        "source": "workspace"
      }
    ],
    "descendants": []
  },
  "project": {
    "type": "project",
    "abstract": false,
    "allowed_children": [],
    "color": "green",
    "icon": "Article",
    "label": "Project",
    "parent": "item",
    "depth": 1,
    "lineage": [
      "item"
    ],
    "fields": [
      {
        "name": "created_by",
        "label": "Created by",
        "type": "text",
        "required": true,
        "source": "item"
      },
      {
        "name": "name",
        "label": "Name",
        "type": "text",
        "required": true,
        "source": "project"
      }
    ],
    "descendants": [
      "order"
    ]
  },
  "order": {
    "type": "order",
    "abstract": false,
    "allowed_children": [],
    "color": "green",
    "icon": "Article",
    "label": "Order",
    "parent": "project",
    "depth": 2,
    "lineage": [
      "item",
      "project"
    ],
    "fields": [
      {
        "name": "created_by",
        "label": "Created by",
        "type": "text",
        "required": true,
        "source": "item"
      },
      {
        "name": "name",
        "label": "Name",
        "type": "text",
        "required": true,
        "source": "order"
      }
    ],
    "descendants": []
  }
} as const;

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
    };

