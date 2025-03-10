// AUTO GENERATED
import { Asset, Rental, User, WorkOrder } from "../DataModelConfig";

export type ContentTypeDataModel = Asset | Rental | User | WorkOrder;

export type IFieldRenderLookup = {
  asset: {
    _id: React.FC<{ value: Asset["_id"] }>;
    type: React.FC<{ value: Asset["type"] }>;
    updated_at: React.FC<{ value: Asset["updated_at"] }>;
    created_at: React.FC<{ value: Asset["created_at"] }>;
    updated_by: React.FC<{ value: Asset["updated_by"] }>;
    created_by: React.FC<{ value: Asset["created_by"] }>;
    parent_id: React.FC<{ value: Asset["parent_id"] }>;
    tenant_id: React.FC<{ value: Asset["tenant_id"] }>;
    ["data.custom_name"]: React.FC<{ value: Asset["data"]["custom_name"] }>;
    ["data.location"]: React.FC<{ value: Asset["data"]["location"] }>;
    ["data.category_name"]: React.FC<{ value: Asset["data"]["category_name"] }>;
    ["data.company_id"]: React.FC<{ value: Asset["data"]["company_id"] }>;
    ["data.id"]: React.FC<{ value: Asset["data"]["id"] }>;
    ["data.equipment_class_name"]: React.FC<{
      value: Asset["data"]["equipment_class_name"];
    }>;
    ["data.make_name"]: React.FC<{ value: Asset["data"]["make_name"] }>;
    ["data.model_name"]: React.FC<{ value: Asset["data"]["model_name"] }>;
    ["data.custom_model"]: React.FC<{ value: Asset["data"]["custom_model"] }>;
    ["data.photo_filename"]: React.FC<{
      value: Asset["data"]["photo_filename"];
    }>;
  };
  rental: {
    _id: React.FC<{ value: Rental["_id"] }>;
    type: React.FC<{ value: Rental["type"] }>;
    updated_at: React.FC<{ value: Rental["updated_at"] }>;
    created_at: React.FC<{ value: Rental["created_at"] }>;
    updated_by: React.FC<{ value: Rental["updated_by"] }>;
    created_by: React.FC<{ value: Rental["created_by"] }>;
    parent_id: React.FC<{ value: Rental["parent_id"] }>;
    tenant_id: React.FC<{ value: Rental["tenant_id"] }>;
    ["data.custom_name"]: React.FC<{ value: Rental["data"]["custom_name"] }>;
    ["data.location"]: React.FC<{ value: Rental["data"]["location"] }>;
    ["data.category_name"]: React.FC<{
      value: Rental["data"]["category_name"];
    }>;
    ["data.company_id"]: React.FC<{ value: Rental["data"]["company_id"] }>;
    ["data.id"]: React.FC<{ value: Rental["data"]["id"] }>;
    ["data.equipment_class_name"]: React.FC<{
      value: Rental["data"]["equipment_class_name"];
    }>;
    ["data.make_name"]: React.FC<{ value: Rental["data"]["make_name"] }>;
    ["data.model_name"]: React.FC<{ value: Rental["data"]["model_name"] }>;
    ["data.custom_model"]: React.FC<{ value: Rental["data"]["custom_model"] }>;
    ["data.photo_filename"]: React.FC<{
      value: Rental["data"]["photo_filename"];
    }>;
  };
  user: {
    _id: React.FC<{ value: User["_id"] }>;
    type: React.FC<{ value: User["type"] }>;
    updated_at: React.FC<{ value: User["updated_at"] }>;
    created_at: React.FC<{ value: User["created_at"] }>;
    updated_by: React.FC<{ value: User["updated_by"] }>;
    created_by: React.FC<{ value: User["created_by"] }>;
    parent_id: React.FC<{ value: User["parent_id"] }>;
    tenant_id: React.FC<{ value: User["tenant_id"] }>;
    ["data.email"]: React.FC<{ value: User["data"]["email"] }>;
    ["data.first_name"]: React.FC<{ value: User["data"]["first_name"] }>;
    ["data.last_name"]: React.FC<{ value: User["data"]["last_name"] }>;
    ["data.id"]: React.FC<{ value: User["data"]["id"] }>;
  };
  work_order: {
    _id: React.FC<{ value: WorkOrder["_id"] }>;
    type: React.FC<{ value: WorkOrder["type"] }>;
    updated_at: React.FC<{ value: WorkOrder["updated_at"] }>;
    created_at: React.FC<{ value: WorkOrder["created_at"] }>;
    updated_by: React.FC<{ value: WorkOrder["updated_by"] }>;
    created_by: React.FC<{ value: WorkOrder["created_by"] }>;
    parent_id: React.FC<{ value: WorkOrder["parent_id"] }>;
    tenant_id: React.FC<{ value: WorkOrder["tenant_id"] }>;
    ["data.id"]: React.FC<{ value: WorkOrder["data"]["id"] }>;
    ["data.description"]: React.FC<{ value: WorkOrder["data"]["description"] }>;
    ["data.created_by"]: React.FC<{ value: WorkOrder["data"]["created_by"] }>;
    ["data.status"]: React.FC<{ value: WorkOrder["data"]["status"] }>;
    ["data.asset_id"]: React.FC<{ value: WorkOrder["data"]["asset_id"] }>;
    ["data.date_completed"]: React.FC<{
      value: WorkOrder["data"]["date_completed"];
    }>;
    ["data.due_date"]: React.FC<{ value: WorkOrder["data"]["due_date"] }>;
    ["data.assigned_to"]: React.FC<{ value: WorkOrder["data"]["assigned_to"] }>;
  };
};

export type HeaderConfig = { width: number; label: string };
export type IHeaderRenderLookup = {
  "data.custom_name": HeaderConfig;
  "data.location": HeaderConfig;
  "data.category_name": HeaderConfig;
  "data.company_id": HeaderConfig;
  "data.id": HeaderConfig;
  "data.equipment_class_name": HeaderConfig;
  "data.make_name": HeaderConfig;
  "data.model_name": HeaderConfig;
  "data.custom_model": HeaderConfig;
  "data.photo_filename": HeaderConfig;
  _id: HeaderConfig;
  type: HeaderConfig;
  updated_at: HeaderConfig;
  created_at: HeaderConfig;
  updated_by: HeaderConfig;
  created_by: HeaderConfig;
  parent_id: HeaderConfig;
  tenant_id: HeaderConfig;
  "data.email": HeaderConfig;
  "data.first_name": HeaderConfig;
  "data.last_name": HeaderConfig;
  "data.description": HeaderConfig;
  "data.created_by": HeaderConfig;
  "data.status": HeaderConfig;
  "data.asset_id": HeaderConfig;
  "data.date_completed": HeaderConfig;
  "data.due_date": HeaderConfig;
  "data.assigned_to": HeaderConfig;
};

export interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface UIForm<Fields extends string> {
  title: "asset" | string;
  subtitle: "asset" | string;
  fields: {
    [field in Fields]: {
      field_type: "text" | "number";
      title: string;
      position: GridPosition | null;
    } | null;
  };
}

export interface UIConfigInterface {
  asset: {
    primary_display_field:
      | "custom_name"
      | "location"
      | "category_name"
      | "company_id"
      | "id"
      | "equipment_class_name"
      | "make_name"
      | "model_name"
      | "custom_model"
      | "photo_filename";
    create_form: UIForm<
      | "custom_name"
      | "location"
      | "category_name"
      | "company_id"
      | "id"
      | "equipment_class_name"
      | "make_name"
      | "model_name"
      | "custom_model"
      | "photo_filename"
    >;
    edit_form: UIForm<
      | "custom_name"
      | "location"
      | "category_name"
      | "company_id"
      | "id"
      | "equipment_class_name"
      | "make_name"
      | "model_name"
      | "custom_model"
      | "photo_filename"
    >;
    display_page: UIForm<
      | "custom_name"
      | "location"
      | "category_name"
      | "company_id"
      | "id"
      | "equipment_class_name"
      | "make_name"
      | "model_name"
      | "custom_model"
      | "photo_filename"
    >;
  };

  rental: {
    primary_display_field:
      | "custom_name"
      | "location"
      | "category_name"
      | "company_id"
      | "id"
      | "equipment_class_name"
      | "make_name"
      | "model_name"
      | "custom_model"
      | "photo_filename";
    create_form: UIForm<
      | "custom_name"
      | "location"
      | "category_name"
      | "company_id"
      | "id"
      | "equipment_class_name"
      | "make_name"
      | "model_name"
      | "custom_model"
      | "photo_filename"
    >;
    edit_form: UIForm<
      | "custom_name"
      | "location"
      | "category_name"
      | "company_id"
      | "id"
      | "equipment_class_name"
      | "make_name"
      | "model_name"
      | "custom_model"
      | "photo_filename"
    >;
    display_page: UIForm<
      | "custom_name"
      | "location"
      | "category_name"
      | "company_id"
      | "id"
      | "equipment_class_name"
      | "make_name"
      | "model_name"
      | "custom_model"
      | "photo_filename"
    >;
  };

  user: {
    primary_display_field: "email" | "first_name" | "last_name" | "id";
    create_form: UIForm<"email" | "first_name" | "last_name" | "id">;
    edit_form: UIForm<"email" | "first_name" | "last_name" | "id">;
    display_page: UIForm<"email" | "first_name" | "last_name" | "id">;
  };

  work_order: {
    primary_display_field:
      | "id"
      | "description"
      | "created_by"
      | "status"
      | "asset_id"
      | "date_completed"
      | "due_date"
      | "assigned_to";
    create_form: UIForm<
      | "id"
      | "description"
      | "created_by"
      | "status"
      | "asset_id"
      | "date_completed"
      | "due_date"
      | "assigned_to"
    >;
    edit_form: UIForm<
      | "id"
      | "description"
      | "created_by"
      | "status"
      | "asset_id"
      | "date_completed"
      | "due_date"
      | "assigned_to"
    >;
    display_page: UIForm<
      | "id"
      | "description"
      | "created_by"
      | "status"
      | "asset_id"
      | "date_completed"
      | "due_date"
      | "assigned_to"
    >;
  };
}
