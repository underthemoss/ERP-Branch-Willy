import { Avatar, Tooltip } from "@mui/joy";
import { AutoImage } from "./AutoImage";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DescriptionIcon from "@mui/icons-material/Description";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { prisma } from "@/lib/prisma";
import { useAuth } from "@/lib/auth";
import DataLoader from "dataloader";

const getEntityContentTypeBatch = async (userIds: string[]) => {
  const { user } = await useAuth();
  const results = await prisma.entity.findMany({
    where: {
      id: { in: userIds },
      tenantId: { in: ["SYSTEM", user.company_id] },
    },
    select: {
      id: true,
      entityType: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  return userIds
    .map((id) => results.find((r) => r.id === id))
    .map((d) => ({
      title: d?.entityType.name,
      id: d?.id,
      entityTypeId: d?.entityType.id,
    }));
};

const entityTypeLoader = new DataLoader<
  string,
  Awaited<ReturnType<typeof getEntityContentTypeBatch>>[number]
>((keys) => getEntityContentTypeBatch(keys as any), {
  batchScheduleFn: (res) => setTimeout(res, 10),
  maxBatchSize: 10000,
});

const Icon: React.FC<{
  entityTypeId: string | undefined;
  entityId: string | undefined;
}> = ({ entityTypeId, entityId }) => {
  if (entityTypeId === "workspace") {
    return (
      <Avatar style={{ height: 24, width: 24 }}>
        <AutoImage size={24} value={entityId || ""}></AutoImage>
      </Avatar>
    );
  }
  if (entityTypeId === "folder") {
    return <FolderOpenIcon style={{ color: "black" }} />;
  }

  if (entityTypeId === "ticket") {
    return <ReceiptLongIcon style={{ color: "black" }} />;
  }

  if (entityTypeId === "order") {
    return <DescriptionIcon style={{ color: "black" }} />;
  }
  if (entityTypeId === "line_item") {
    return <RadioButtonUncheckedIcon style={{ color: "black" }} />;
  }
  if (entityTypeId === "list") {
    return <FormatListBulletedIcon style={{ color: "black" }} />;
  }
  if (entityTypeId === "list_item") {
    return <FiberManualRecordIcon style={{ color: "black" }} />;
  }
  return <>{entityTypeId}</>;
};

export const EntityTypeIcons: React.FC<{
  entityId: string;
}> = async ({ entityId }) => {
  const entity = await entityTypeLoader.load(entityId);
  return (
    <Tooltip title={entity.title}>
      <Icon entityId={entity.id} entityTypeId={entity.entityTypeId} />
    </Tooltip>
  );
};
