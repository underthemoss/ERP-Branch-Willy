import {
  HeaderConfig,
  IFieldRenderLookup,
  IHeaderRenderLookup,
} from "./generated/content-types";
import { Avatar } from "@mui/joy";
import { UserDetail } from "./../ui/UserDetail";
const StringRenderer: React.FC<{ value?: string | null }> = ({ value }) => {
  return value;
};
const PhotoRenderer: React.FC<{ value?: string | null }> = ({ value }) => {
  if (!value) return null;
  return <Avatar src={value}></Avatar>;
};
const DateRenderer: React.FC<{ value?: Date | null }> = ({ value }) => {
  if (!value) return null;
  return value.toDateString();
};
const PeopleRenderer: React.FC<{ value?: string[] | null }> = ({ value }) => {
  if (!value) return null;
  return [...new Set(value)].map((v) => <UserDetail key={v} userId={v} />);
};

export const TableCellRenderer: Record<
  string,
  Record<string, React.FC<{ value: any }>>
> = {
  asset: {
    _id: StringRenderer,
    created_at: DateRenderer,
    created_by: StringRenderer,
    updated_at: DateRenderer,
    updated_by: StringRenderer,
    parent_id: StringRenderer,
    tenant_id: StringRenderer,
    type: StringRenderer,
    "data.category_name": StringRenderer,
    "data.company_id": StringRenderer,
    "data.custom_model": StringRenderer,
    "data.custom_name": StringRenderer,
    "data.equipment_class_name": StringRenderer,
    "data.id": StringRenderer,
    "data.location": () => <div></div>,
    "data.make_name": StringRenderer,
    "data.model_name": StringRenderer,
    "data.photo_filename": PhotoRenderer,
  },
  rental: {
    _id: StringRenderer,
    created_at: DateRenderer,
    created_by: StringRenderer,
    updated_at: DateRenderer,
    updated_by: StringRenderer,
    parent_id: StringRenderer,
    tenant_id: StringRenderer,
    type: StringRenderer,
    "data.category_name": StringRenderer,
    "data.company_id": StringRenderer,
    "data.custom_model": StringRenderer,
    "data.custom_name": StringRenderer,
    "data.equipment_class_name": StringRenderer,
    "data.id": StringRenderer,
    "data.location": () => <div></div>,
    "data.make_name": StringRenderer,
    "data.model_name": StringRenderer,
    "data.photo_filename": PhotoRenderer,
  },
  user: {
    _id: StringRenderer,
    created_at: DateRenderer,
    created_by: StringRenderer,
    updated_at: DateRenderer,
    updated_by: StringRenderer,
    parent_id: StringRenderer,
    tenant_id: StringRenderer,
    type: StringRenderer,
    "data.email": StringRenderer,
    "data.first_name": StringRenderer,
    "data.id": StringRenderer,
    "data.last_name": StringRenderer,
  },
  work_order: {
    _id: StringRenderer,
    created_at: DateRenderer,
    created_by: StringRenderer,
    updated_at: DateRenderer,
    updated_by: StringRenderer,
    parent_id: StringRenderer,
    tenant_id: StringRenderer,
    type: StringRenderer,
    "data.id": StringRenderer,
    "data.description": StringRenderer,
    "data.status": StringRenderer,
    "data.asset_id": StringRenderer,
    "data.created_by": StringRenderer,
    "data.date_completed": DateRenderer,
    "data.due_date": DateRenderer,
    "data.assigned_to": PeopleRenderer,
  },
} satisfies IFieldRenderLookup;

export const TableHeaderRenderer: Record<string, HeaderConfig> = {
  _id: { label: "Internal ID", width: 100 },
  created_at: { label: "Created At", width: 200 },
  created_by: { label: "Created By", width: 200 },
  updated_at: { label: "Updated At", width: 200 },
  updated_by: { label: "Updated By", width: 200 },
  parent_id: { label: "Parent ID", width: 100 },
  tenant_id: { label: "Tenant ID", width: 100 },
  type: { label: "Type", width: 100 },
  "data.category_name": { label: "Category Name", width: 200 },
  "data.company_id": { label: "Company ID", width: 100 },
  "data.custom_model": { label: "Custom Model", width: 100 },
  "data.custom_name": { label: "Custom Name", width: 220 },
  "data.equipment_class_name": { label: "Equipment Class Name", width: 100 },
  "data.id": { label: "ID", width: 100 },
  "data.location": { label: "Location", width: 100 },
  "data.make_name": { label: "Make Name", width: 200 },
  "data.model_name": { label: "Model Name", width: 200 },
  "data.photo_filename": { label: "", width: 55 },
  "data.email": { label: "Email", width: 100 },
  "data.first_name": { label: "First Name", width: 200 },
  "data.last_name": { label: "Last Name", width: 200 },
  "data.description": { label: "Description", width: 350 },
  "data.status": { label: "Status", width: 100 },
  "data.asset_id": { label: "Asset ID", width: 100 },
  "data.created_by": { label: "Created By", width: 100 },
  "data.date_completed": { label: "Date Completed", width: 100 },
  "data.due_date": { label: "Due Date", width: 135 },
  "data.assigned_to": { label: "Assigned To", width: 350 },

} satisfies IHeaderRenderLookup;
