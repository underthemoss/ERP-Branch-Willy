/** Types generated for queries found in "src/sync/work_orders.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type numberArray = (number)[];

/** 'WorkOrders' parameters type */
export interface IWorkOrdersParams {
  current_shard?: number | null | void;
  num_shards?: number | null | void;
  tenant_id?: number | null | void;
}

/** 'WorkOrders' return type */
export interface IWorkOrdersResult {
  asset_id: number | null;
  assigned_to: numberArray | null;
  creator_user_id: number | null;
  date_completed: Date | null;
  date_created: Date;
  date_updated: Date;
  description: string;
  due_date: Date | null;
  id: number;
  service_company_id: number | null;
  status: string;
}

/** 'WorkOrders' query type */
export interface IWorkOrdersQuery {
  params: IWorkOrdersParams;
  result: IWorkOrdersResult;
}

const workOrdersIR: any = {"usedParamSet":{"num_shards":true,"current_shard":true,"tenant_id":true},"params":[{"name":"num_shards","required":false,"transform":{"type":"scalar"},"locs":[{"a":604,"b":614}]},{"name":"current_shard","required":false,"transform":{"type":"scalar"},"locs":[{"a":618,"b":631}]},{"name":"tenant_id","required":false,"transform":{"type":"scalar"},"locs":[{"a":665,"b":674}]}],"statement":"SELECT\n    WO.WORK_ORDER_ID AS ID,\n    WO.DESCRIPTION,\n    WOS.NAME AS STATUS,\n    WO.service_company_id,\n    WO.date_created,\n    WO.date_updated,\n    ARRAY_AGG(WOUA.user_id) AS assigned_to,\n    WO.date_completed,\n    WO.creator_user_id,\n    WO.asset_id,\n    WO.due_date\nFROM\n    WORK_ORDERS.WORK_ORDERS AS WO\n    LEFT JOIN WORK_ORDERS.WORK_ORDER_STATUSES AS WOS ON WO.WORK_ORDER_STATUS_ID = WOS.WORK_ORDER_STATUS_ID\n    LEFT JOIN WORK_ORDERS.WORK_ORDER_USER_ASSIGNMENTS AS WOUA ON WOUA.WORK_ORDER_ID = WO.WORK_ORDER_ID\nWHERE\n    WO.date_created > NOW() - INTERVAL '6 months'\n    AND WO.WORK_ORDER_ID % :num_shards = :current_shard\n    AND WO.service_company_id = :tenant_id\nGROUP BY\n    WO.WORK_ORDER_ID,\n    WO.DESCRIPTION,\n    WOS.NAME,\n    WO.service_company_id,\n    WO.date_created,\n    WO.date_updated,\n    WO.date_completed,\n    WO.creator_user_id,\n    WO.asset_id,\n    WO.due_date"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *     WO.WORK_ORDER_ID AS ID,
 *     WO.DESCRIPTION,
 *     WOS.NAME AS STATUS,
 *     WO.service_company_id,
 *     WO.date_created,
 *     WO.date_updated,
 *     ARRAY_AGG(WOUA.user_id) AS assigned_to,
 *     WO.date_completed,
 *     WO.creator_user_id,
 *     WO.asset_id,
 *     WO.due_date
 * FROM
 *     WORK_ORDERS.WORK_ORDERS AS WO
 *     LEFT JOIN WORK_ORDERS.WORK_ORDER_STATUSES AS WOS ON WO.WORK_ORDER_STATUS_ID = WOS.WORK_ORDER_STATUS_ID
 *     LEFT JOIN WORK_ORDERS.WORK_ORDER_USER_ASSIGNMENTS AS WOUA ON WOUA.WORK_ORDER_ID = WO.WORK_ORDER_ID
 * WHERE
 *     WO.date_created > NOW() - INTERVAL '6 months'
 *     AND WO.WORK_ORDER_ID % :num_shards = :current_shard
 *     AND WO.service_company_id = :tenant_id
 * GROUP BY
 *     WO.WORK_ORDER_ID,
 *     WO.DESCRIPTION,
 *     WOS.NAME,
 *     WO.service_company_id,
 *     WO.date_created,
 *     WO.date_updated,
 *     WO.date_completed,
 *     WO.creator_user_id,
 *     WO.asset_id,
 *     WO.due_date
 * ```
 */
export const workOrders = new PreparedQuery<IWorkOrdersParams,IWorkOrdersResult>(workOrdersIR);


