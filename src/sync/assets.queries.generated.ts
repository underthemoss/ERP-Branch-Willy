/** Types generated for queries found in "src/sync/assets.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type numberArray = (number)[];

/** 'Assets' parameters type */
export interface IAssetsParams {
  current_shard?: number | null | void;
  num_shards?: number | null | void;
}

/** 'Assets' return type */
export interface IAssetsResult {
  category_name: string;
  company_id: number;
  custom_name: string | null;
  date_created: Date;
  date_updated: Date;
  equipment_class_name: string;
  id: number;
  latitude: number | null;
  longitude: number | null;
  make_name: string;
  model: string | null;
  model_name: string | null;
  photo_filename: string;
  rented_to_company_id: numberArray | null;
}

/** 'Assets' query type */
export interface IAssetsQuery {
  params: IAssetsParams;
  result: IAssetsResult;
}

const assetsIR: any = {"usedParamSet":{"num_shards":true,"current_shard":true},"params":[{"name":"num_shards","required":false,"transform":{"type":"scalar"},"locs":[{"a":1295,"b":1305}]},{"name":"current_shard","required":false,"transform":{"type":"scalar"},"locs":[{"a":1309,"b":1322}]}],"statement":"SELECT\n    a.asset_id AS id,\n    a.custom_name,\n    a.company_id,\n    a.model,\n    ec.name AS equipment_class_name,\n    c.name AS category_name,\n    p.filename AS photo_filename,\n    mk.name AS make_name,\n    em.name AS model_name,\n    ST_Y(ST_AsText(askv_location.value)) as longitude,\n    ST_X(ST_AsText(askv_location.value)) as latitude,\n    a.date_created,\n    a.date_updated,\n    ARRAY_AGG(rental_users.company_id) as rented_to_company_id\nFROM\n    assets a\n    LEFT JOIN equipment_classes ec ON a.equipment_class_id = ec.equipment_class_id\n    LEFT JOIN categories c ON a.category_id = c.category_id\n    LEFT JOIN photos p ON a.photo_id = p.photo_id\n    LEFT JOIN equipment_makes mk ON a.equipment_make_id = mk.equipment_make_id\n    LEFT JOIN equipment_models em ON a.equipment_model_id = em.equipment_model_id\n    LEFT JOIN asset_status_key_values askv_location ON a.asset_id = askv_location.asset_id\n    AND askv_location.name = 'location'\n    LEFT JOIN rentals rentals ON a.asset_id = rentals.asset_id\n    AND rentals.start_date <= now()\n    AND (\n        rentals.end_date >= now()\n        OR rentals.end_date IS NULL\n    )\n    LEFT JOIN orders orders ON rentals.order_id = orders.order_id\n    LEFT JOIN users rental_users ON orders.user_id = rental_users.user_id\nWHERE\n    a.asset_id % :num_shards = :current_shard\nGROUP BY\n    a.asset_id,\n    ec.name,\n    c.name,\n    p.filename,\n    mk.name,\n    em.name,\n    askv_location.value"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *     a.asset_id AS id,
 *     a.custom_name,
 *     a.company_id,
 *     a.model,
 *     ec.name AS equipment_class_name,
 *     c.name AS category_name,
 *     p.filename AS photo_filename,
 *     mk.name AS make_name,
 *     em.name AS model_name,
 *     ST_Y(ST_AsText(askv_location.value)) as longitude,
 *     ST_X(ST_AsText(askv_location.value)) as latitude,
 *     a.date_created,
 *     a.date_updated,
 *     ARRAY_AGG(rental_users.company_id) as rented_to_company_id
 * FROM
 *     assets a
 *     LEFT JOIN equipment_classes ec ON a.equipment_class_id = ec.equipment_class_id
 *     LEFT JOIN categories c ON a.category_id = c.category_id
 *     LEFT JOIN photos p ON a.photo_id = p.photo_id
 *     LEFT JOIN equipment_makes mk ON a.equipment_make_id = mk.equipment_make_id
 *     LEFT JOIN equipment_models em ON a.equipment_model_id = em.equipment_model_id
 *     LEFT JOIN asset_status_key_values askv_location ON a.asset_id = askv_location.asset_id
 *     AND askv_location.name = 'location'
 *     LEFT JOIN rentals rentals ON a.asset_id = rentals.asset_id
 *     AND rentals.start_date <= now()
 *     AND (
 *         rentals.end_date >= now()
 *         OR rentals.end_date IS NULL
 *     )
 *     LEFT JOIN orders orders ON rentals.order_id = orders.order_id
 *     LEFT JOIN users rental_users ON orders.user_id = rental_users.user_id
 * WHERE
 *     a.asset_id % :num_shards = :current_shard
 * GROUP BY
 *     a.asset_id,
 *     ec.name,
 *     c.name,
 *     p.filename,
 *     mk.name,
 *     em.name,
 *     askv_location.value
 * ```
 */
export const assets = new PreparedQuery<IAssetsParams,IAssetsResult>(assetsIR);


