/** Types generated for queries found in "src/system/assets.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'Assets' parameters type */
export interface IAssetsParams {
  company_id?: number | null | void;
}

/** 'Assets' return type */
export interface IAssetsResult {
  category_name: string;
  company_id: number;
  custom_name: string | null;
  equipment_class_name: string;
  id: number;
  latitude: number | null;
  longitude: number | null;
  make_name: string;
  model: string | null;
  model_name: string | null;
  photo_filename: string;
}

/** 'Assets' query type */
export interface IAssetsQuery {
  params: IAssetsParams;
  result: IAssetsResult;
}

const assetsIR: any = {"usedParamSet":{"company_id":true},"params":[{"name":"company_id","required":false,"transform":{"type":"scalar"},"locs":[{"a":868,"b":878}]}],"statement":"SELECT\n    a.asset_id AS id,\n    a.custom_name,\n    a.company_id,\n    a.model,\n    ec.name AS equipment_class_name,\n    c.name AS category_name,\n    p.filename AS photo_filename,\n    mk.name AS make_name,\n    em.name AS model_name,\n    ST_Y(ST_AsText(askv_location.value)) as longitude,\n    ST_X(ST_AsText(askv_location.value)) as latitude\nFROM\n    assets a\n    LEFT JOIN equipment_classes ec ON a.equipment_class_id = ec.equipment_class_id\n    LEFT JOIN categories c ON a.category_id = c.category_id\n    LEFT JOIN photos p ON a.photo_id = p.photo_id\n    LEFT JOIN equipment_makes mk ON a.equipment_make_id = mk.equipment_make_id\n    LEFT JOIN equipment_models em ON a.equipment_model_id = em.equipment_model_id\n    LEFT JOIN asset_status_key_values askv_location ON a.asset_id = askv_location.asset_id\n    AND askv_location.name = 'location'\nWHERE\n    a.company_id = :company_id\nGROUP BY\n    a.asset_id,\n    ec.name,\n    c.name,\n    p.filename,\n    mk.name,\n    em.name,\n    askv_location.value"};

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
 *     ST_X(ST_AsText(askv_location.value)) as latitude
 * FROM
 *     assets a
 *     LEFT JOIN equipment_classes ec ON a.equipment_class_id = ec.equipment_class_id
 *     LEFT JOIN categories c ON a.category_id = c.category_id
 *     LEFT JOIN photos p ON a.photo_id = p.photo_id
 *     LEFT JOIN equipment_makes mk ON a.equipment_make_id = mk.equipment_make_id
 *     LEFT JOIN equipment_models em ON a.equipment_model_id = em.equipment_model_id
 *     LEFT JOIN asset_status_key_values askv_location ON a.asset_id = askv_location.asset_id
 *     AND askv_location.name = 'location'
 * WHERE
 *     a.company_id = :company_id
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


