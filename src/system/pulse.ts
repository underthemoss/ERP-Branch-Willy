import { prisma } from "@/lib/prisma";
import Pulse from "@pulsecron/pulse";

import { setupTenant } from "./setupTenant";

import { Entity } from "../../prisma/generated/mongo";
import { mongodbClient } from "./changeStreams";
import { syncAssets } from "@/sync/assets";
import { syncUsers } from "@/sync/users";
import { syncWorkOrders } from "@/sync/work_orders";
import { syncCompanies } from "@/sync/companies";
const mongoConnectionString = process.env.DATABASE_URL || "";

export const pulse = new Pulse({
  db: { address: mongoConnectionString },
  defaultConcurrency: 4,
  maxConcurrency: 200,
  processEvery: "10 seconds",
  resumeOnRestart: true,
});

const tenants: string[] = ["1854"];

const tenantSyncJobName = (tenant: string) => `tenant-sync-${tenant}`;

tenants.forEach((tenantId) => {
  pulse.define<{ tenantId: string }>(
    tenantSyncJobName(tenantId),
    async (job) => {
      const msg = `[SYNC] ${tenantId}`;
      console.log(msg);
      console.time(msg);
      await Promise.all([
        // syncWorkOrders(tenantId),
        syncUsers(),
        syncAssets(),
        syncCompanies(),
      ]);
      console.timeEnd(msg);
    },
    {}
  );
});

export const run = async () => {
  await pulse.start();

  for (const tenant of tenants) {
    await pulse.every("30 minutes", tenantSyncJobName(tenant), {
      tenantId: tenant,
    });
  }
};
