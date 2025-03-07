export type UniversalQuery = {
  id?: string | string[];
  type?: string | string[];
  parent_id?: string | string[];
  created_by?: string | string[];
  updated_by?: string | string[];
  limit?: number;
  offset?: number;
  include?: string | string[];
  order_by?: string | string[];
};

export const encodeUniversalQuery = (query: UniversalQuery) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (typeof value === "number") {
      params.append(key, value.toString());
    }
    if (typeof value === "string") {
      params.append(key, value.toString());
    }
    if (typeof value === "object") {
      Object.values(value).forEach((value) => {
        params.append(key, value.toString());
      });
    }
  });
  return params.toString();
};
