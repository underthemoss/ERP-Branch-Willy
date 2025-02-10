import _ from "lodash";
import { pulse } from "../pulse";
import { mongodbClient } from "../changeStreams";
import { prisma } from "@/lib/prisma";
import { Entity } from "../../../prisma/generated/mongo";

let count = 0;
export const dispatchRecalculateJob = async (item_id: string) => {
  //   await pulse.cancel({ name: "recalculate", "data.item_id": item_id });
  await pulse.now("recalculate", { item_id });
};

pulse.define<{ item_id: string }>(
  "recalculate",
  async (job) => {
    console.log(count++);

    // return;
    const item_id = job.attrs.data.item_id;
    // await pulse.cancel({ name: "recalculate", "data.item_id": item_id });

    console.log("recalc", item_id, new Date());

    const item = await prisma.entity.findFirstOrThrow({
      where: { id: item_id },
      include: { parent: true },
    });
    const parent = item?.parent;

    // resolve formula cells

    // resolve aggregations

    const mutations: [string, any][] = [];

    const totalChildrenCols = parent?.column_config.filter(
      (c) => c.type === "total_children"
    );

    if (totalChildrenCols?.length) {
      const immediateChildCount = await prisma.entity.count({
        where: { parent_id: item_id },
      });
      totalChildrenCols.forEach((c) => {
        mutations.push([`data.${c.key}`, immediateChildCount || 0]);
      });
    }

    if (mutations.length) {
      await mongodbClient
        .collection("Entity")
        .updateOne(
          { _id: item_id as any },
          { $set: Object.fromEntries(mutations) }
        );
    }
    if (parent) {
      await dispatchRecalculateJob(parent.id);
      //   await pulse.now("recalculate", {
      //     document: { _id: parent.id, ...parent },
      //   });
    }
    // // propogate up

    await job.remove();
  },
  { concurrency: 200 }
);
