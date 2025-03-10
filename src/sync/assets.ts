import { dataSync, sharded } from "@/sync/shared/DataSync";
import { assets } from "./assets.queries.generated";
import { deterministicId } from "./shared/deterministicId";
import { Rental } from "@/types/DataModelConfig";

export const syncAssets = async () => {
  await sharded(
    { number_shards: 20 },
    async ({ current_shard, number_of_shards }) => {
      await dataSync({
        query: assets,
        params: {
          num_shards: number_of_shards,
          current_shard,
        },
        batchSize: 1000,
        map(r) {
          return [
            ...(r.rented_to_company_id || [])
              .filter(Boolean)
              .map((company_id) => {
                return {
                  _id: deterministicId(
                    company_id?.toString(),
                    "rental",
                    r.id.toString()
                  ),
                  type: "rental",
                  tenant_id: company_id?.toString(),
                  created_at: r.date_created,
                  created_by: "system",
                  updated_at: r.date_updated,
                  updated_by: "sytem",
                  data: {
                    custom_name: r.custom_name || "",
                    location: {
                      lat: r.latitude || 0,
                      lng: r.longitude || 0,
                    },
                    category_name: r.category_name || "",
                    company_id: r.company_id.toString(),
                    equipment_class_name: r.equipment_class_name || "",
                    id: r.id.toString(),
                    make_name: r.make_name || "",
                    custom_model: r.model || "",
                    model_name: r.model_name || "",
                    photo_filename: r.photo_filename
                      ? `https://appcdn.equipmentshare.com/uploads/small/${r.photo_filename}`
                      : null,
                  },
                } satisfies Rental;
              }),
            {
              _id: deterministicId(
                r.company_id.toString(),
                "asset",
                r.id.toString()
              ),
              type: "asset",
              tenant_id: r.company_id.toString(),
              created_at: r.date_created,
              created_by: "system",
              updated_at: r.date_updated,
              updated_by: "sytem",
              data: {
                custom_name: r.custom_name || "",
                location: {
                  lat: r.latitude || 0,
                  lng: r.longitude || 0,
                },
                category_name: r.category_name || "",
                company_id: r.company_id.toString(),
                equipment_class_name: r.equipment_class_name || "",
                id: r.id.toString(),
                make_name: r.make_name || "",
                custom_model: r.model || "",
                model_name: r.model_name || "",
                photo_filename: r.photo_filename
                  ? `https://appcdn.equipmentshare.com/uploads/small/${r.photo_filename}`
                  : null,
              },
            },
          ];
        },
      });
    }
  );
};
