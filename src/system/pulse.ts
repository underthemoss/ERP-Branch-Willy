import { prisma } from "@/lib/prisma";
import Pulse from "@pulsecron/pulse";

import { setupTenant } from "./setupTenant";
import { syncAssets } from "./syncAssets";
import { syncUsers } from "./syncUsers";
const mongoConnectionString = process.env.DATABASE_URL || "";

const pulse = new Pulse({
  db: { address: mongoConnectionString },
  defaultConcurrency: 4,
  maxConcurrency: 4,
  processEvery: "10 seconds",
  resumeOnRestart: true,
});

const tenants = ["1854", "420"];

const tenantSyncJobName = (tenant: string) => `tenant-sync-${tenant}`;

tenants.forEach((tenantId) => {
  pulse.define<{ tenantId: string }>(
    tenantSyncJobName(tenantId),
    async (job) => {
      const msg = `[SYNC] ${tenantId}`;
      console.log(msg);
      console.time(msg);
      await setupTenant(tenantId);
      await syncAssets(tenantId);
      await syncUsers(tenantId);
      console.timeEnd(msg);
    }
  );
});

export const run = async () => {
  await pulse.start();

  for (const tenant of tenants) {
    await pulse.every("5 minutes", tenantSyncJobName(tenant), {
      tenantId: tenant,
    });
  }
};
