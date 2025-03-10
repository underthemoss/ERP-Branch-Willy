import { dataSync, sharded } from "@/sync/shared/DataSync";
import { users } from "./users.queries.generated";
import { deterministicId } from "./shared/deterministicId";

export const syncUsers = async () => {
  await sharded(
    { number_shards: 20 },
    async ({ current_shard, number_of_shards }) => {
      await dataSync({
        query: users,
        params: {
          num_shards: number_of_shards,
          current_shard,
        },
        batchSize: 1000,
        map(r) {
          if (!r.company_id) return [];
          return [
            {
              _id: deterministicId(
                r.company_id?.toString(),
                "user",
                r.user_id.toString()
              ),
              type: "user",
              tenant_id: r.company_id.toString(),
              created_at: r.date_created,
              created_by: "system",
              updated_at: r.date_updated,
              updated_by: "sytem",
              data: {
                email: r.username,
                first_name: r.first_name || undefined,
                last_name: r.last_name || undefined,
                id: r.user_id.toString(),
              },
            },
          ];
        },
      });
    }
  );
};
