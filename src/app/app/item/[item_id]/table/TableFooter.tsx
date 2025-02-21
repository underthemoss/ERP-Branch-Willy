import { Box, Button, Typography } from "@mui/joy";
import { useItem } from "../ItemProvider";
import { addRecord, addRow } from "../actions"; // todo: not this
import {
  createContentTypeInstance,
  createSystemContentTypeInstance,
} from "@/services/ContentService";

export const TableFooter: React.FC<{ width: number; height: number }> = ({
  height,
  width,
}) => {
  const { item, columns } = useItem();
  const actualWidth = Math.max(
    // item.column_config.reduce((t, i) => t + i.width, 0),
    width
  );
  return (
    <Box
      flex={1}
      display={"flex"}
      style={{
        zIndex: 9999,
        height,
        width: actualWidth,
        backgroundColor: "white",
        borderTop: "1px solid #e0e0e0",
      }}
    >
      <Box
        position={"sticky"}
        left={0}
        display={"flex"}
        width={width}
        alignItems={"center"}
      >
        <Box ml={1}>
          <Button
            variant="plain"
            onClick={async () => {
              // await addRecord(item.id);
            }}
            // disabled
          >
            New record
          </Button>
        </Box>
        <Box flex={1}></Box>
        <Box mr={2}>
          <Typography level="title-sm">
            {/* Total rows: {item.rows?.length}{" "} */}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
