import { Avatar } from "@mui/joy";
import { AutoImage } from "./AutoImage";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DescriptionIcon from "@mui/icons-material/Description";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import HelpIcon from "@mui/icons-material/Help";
import { EntityTypeIcon as EntityTypeIconEnum } from "../../prisma/generated/mongo";
import SettingsIcon from "@mui/icons-material/Settings";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

export const Icon: React.FC<{
  entityTypeId: string | undefined;
  entityId?: string | undefined;
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
  return <HelpIcon style={{ color: "black" }} />;
};

export const EntityTypeIcon: React.FC<{
  entityTypeIcon: EntityTypeIconEnum;
  entityId?: string | undefined;
}> = ({ entityTypeIcon, entityId }) => {
  if (entityTypeIcon === "system") {
    return <SettingsIcon style={{ color: "black" }} />;
  }
  if (entityTypeIcon === "workspace") {
    return (
      <Avatar style={{ height: 24, width: 24 }}>
        <AutoImage size={24} value={entityId || ""}></AutoImage>
      </Avatar>
    );
  }
  if (entityTypeIcon === "folder") {
    return <FolderOpenIcon style={{ color: "black" }} />;
  }
  if (entityTypeIcon === "document") {
    return <InsertDriveFileIcon style={{ color: "black" }} />;
  }

  if (entityTypeIcon === "ticket") {
    return <ReceiptLongIcon style={{ color: "black" }} />;
  }

  if (entityTypeIcon === "order") {
    return <DescriptionIcon style={{ color: "black" }} />;
  }
  if (entityTypeIcon === "line_item") {
    return <RadioButtonUncheckedIcon style={{ color: "black" }} />;
  }
  if (entityTypeIcon === "list") {
    return <FormatListBulletedIcon style={{ color: "black" }} />;
  }
  if (entityTypeIcon === "list_item") {
    return <FiberManualRecordIcon style={{ color: "black" }} />;
  }
  return <HelpIcon style={{ color: "black" }} />;
};
