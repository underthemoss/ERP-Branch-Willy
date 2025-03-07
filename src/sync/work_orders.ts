import { dataSync, sharded } from "@/sync/shared/DataSync";
import { workOrders } from "./work_orders.queries.generated";
import { deterministicId } from "./shared/deterministicId";

export const syncWorkOrders = async (tenantId: string) => {
  await sharded(
    { number_shards: 20 },
    async ({ current_shard, number_of_shards }) => {
      await dataSync({
        query: workOrders,
        batchSize: 1000,
        params: {
          num_shards: number_of_shards,
          current_shard: current_shard,
          tenant_id: Number(tenantId),
        },
        map(r) {
          if (r.service_company_id?.toString() === tenantId) {
            return [
              {
                _id: deterministicId(
                  r.service_company_id?.toString(),
                  "work_order",
                  r.id.toString()
                ),
                type: "work_order",
                tenant_id: tenantId,
                created_at: r.date_created,
                created_by: "system",
                updated_at: r.date_updated,
                updated_by: "sytem",
                data: {
                  id: r.id.toString() || "",
                  description: r.description,
                  date_completed: r.date_completed,
                  created_by: r.creator_user_id?.toString(),
                  status: r.status,
                  asset_id: r.asset_id?.toString(),
                  due_date: r.due_date,
                  assigned_to: r.assigned_to
                    ?.filter(Boolean)
                    .map((n) => n.toString()),
                },
              },
            ];
          }
          return [];
        },
      });
    }
  );
};
