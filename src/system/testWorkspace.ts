import { esdb } from "@/lib/esdb";
import { prisma } from "@/lib/prisma";
import { SystemEntityTypes } from "@/lib/SystemTypes";

import { sourceSystemIdHash, tenantScopedSystemEntityId } from "./hashingUtils";
import { upsertColumn } from "./upsertSystemTypes";
import _ from "lodash";

const upsertSystemEntity = async (props: {
  id: string;
  type: SystemEntityTypes;
  name: string;
  tenant: string;
}) => {
  const { id, type, name, tenant } = props;
  const update = {
    data: {
      name: name,
    },
    tenant_id: tenant,
    type_id: type,
  };
  await prisma.entity.upsert({
    where: { id: id },
    create: {
      id: id,
      ...update,
    },
    update,
  });
};

const testWorkspace = async () => {
  const testWorkspace = tenantScopedSystemEntityId("1854", "test-workspace");

  await upsertSystemEntity({
    id: testWorkspace,
    tenant: "1854",
    type: "system_workspace",
    name: "Test Workspace",
  });
  const values = Array.from({ length: 300_000 }).map((_, i) => i);

  const getId = (id: number) => {
    return tenantScopedSystemEntityId("1854", "test-doc-" + id);
  };

  const chunks = _.chunk(values, 10_000);
  let count = 0;
  for (const chunk of chunks) {
    console.log(count++);
    await prisma.$transaction([
      prisma.entity.deleteMany({
        where: {
          id: {
            in: chunk.map((i) => getId(i)),
          },
        },
      }),
      prisma.entity.createMany({
        data: chunk.map((i) => ({
          id: getId(i),
          tenant_id: "1854",
          type_id: "system_item" satisfies SystemEntityTypes,
          parent_id: testWorkspace,
          data: {
            name: "test-doc-" + i,
          },
        })),
      }),
    ]);
  }
};
testWorkspace();
