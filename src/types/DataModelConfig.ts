interface IBaseItem<T, D> {
  _id: string;
  type: T;
  updated_at: Date;
  created_at: Date;
  updated_by: string;
  created_by: string;
  parent_id?: string;
  tenant_id: string;
  data: D;
}

export type Asset = IBaseItem<
  "asset",
  {
    custom_name: string;
    location?: { lat: number; lng: number };
    category_name?: string;
    company_id?: string;
    id?: string;
    equipment_class_name?: string;
    make_name?: string;
    model_name?: string;
    custom_model?: string;
    photo_filename?: string | null;
  }
>;

export type User = IBaseItem<
  "user",
  {
    email?: string;
    first_name?: string;
    last_name?: string;
    id?: string;
  }
>;

export type WorkOrder = IBaseItem<
  "work_order",
  {
    id?: string;
    description: string;
    created_by?: string | null;
    status?: string | null;
    asset_id?: string | null;
    date_completed?: Date | null;
    due_date?: Date | null;
    assigned_to?: string[] | null;
  }
>;
