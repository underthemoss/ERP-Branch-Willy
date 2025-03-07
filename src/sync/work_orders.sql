/* @name WorkOrders */
SELECT
    WO.WORK_ORDER_ID AS ID,
    WO.DESCRIPTION,
    WOS.NAME AS STATUS,
    WO.service_company_id,
    WO.date_created,
    WO.date_updated,
    ARRAY_AGG(WOUA.user_id) AS assigned_to,
    WO.date_completed,
    WO.creator_user_id,
    WO.asset_id,
    WO.due_date
FROM
    WORK_ORDERS.WORK_ORDERS AS WO
    LEFT JOIN WORK_ORDERS.WORK_ORDER_STATUSES AS WOS ON WO.WORK_ORDER_STATUS_ID = WOS.WORK_ORDER_STATUS_ID
    LEFT JOIN WORK_ORDERS.WORK_ORDER_USER_ASSIGNMENTS AS WOUA ON WOUA.WORK_ORDER_ID = WO.WORK_ORDER_ID
WHERE
    WO.date_created > NOW() - INTERVAL '6 months'
    AND WO.WORK_ORDER_ID % :num_shards = :current_shard
    AND WO.service_company_id = :tenant_id
GROUP BY
    WO.WORK_ORDER_ID,
    WO.DESCRIPTION,
    WOS.NAME,
    WO.service_company_id,
    WO.date_created,
    WO.date_updated,
    WO.date_completed,
    WO.creator_user_id,
    WO.asset_id,
    WO.due_date;