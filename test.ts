export type ContentTypeViewModel = 
{
  "item": {
    "label": "Item",
    "type": "item",
    "allowed_children": [],
    "color": "white",
    "icon": "AccountTree",
    "abstract": true,
    "depth": 0,
    "lineage": [],
    "fields": [
      {
        "name": "created_by",
        "type": "text",
        "required": true,
        "source": "item"
      }
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
        "type": "text",
        "required": true,
        "source": "item"
      },
      {
        "name": "name",
        "type": "text",
        "required": true,
        "source": "workspace"
      }
    ]
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
        "type": "text",
        "required": true,
        "source": "item"
      },
      {
        "name": "name",
        "type": "text",
        "required": true,
        "source": "project"
      }
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
        "type": "text",
        "required": true,
        "source": "item"
      },
      {
        "name": "name",
        "type": "text",
        "required": true,
        "source": "order"
      }
    ]
  }
};