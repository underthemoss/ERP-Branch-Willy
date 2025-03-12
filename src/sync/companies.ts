import { dataSync, sharded } from "@/sync/shared/DataSync";
import { companies } from "./companies.queries.generated";
import { deterministicId } from "./shared/deterministicId";
import { Rental } from "@/types/DataModelConfig";

export const syncCompanies = async () => {
  await sharded(
    { number_shards: 1 },
    async ({ current_shard, number_of_shards }) => {
      await dataSync({
        query: companies,
        params: undefined,
        batchSize: 1000,
        map(r) {
          return [
            {
              _id: deterministicId("1854", "company", r.company_id.toString()),
              type: "company",
              tenant_id: "1854",
              created_at: new Date(),
              created_by: "system",
              updated_at: new Date(),
              updated_by: "sytem",
              data: {
                id: r.company_id.toString(),
                name: r.company_name,
                domain: r.domain || undefined,
              },
            },
          ];
        },
      });
    }
  );
};
