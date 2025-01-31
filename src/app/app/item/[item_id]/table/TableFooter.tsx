import { Box, Button } from "@mui/joy";
import { useItem } from "../ItemProvider";
import { addRow } from "../actions"; // todo: not this

export const TableFooter: React.FC<{}> = () => {
  const { item } = useItem();
  return (
    <Box
      flex={1}
      display={"flex"}
      style={{ backgroundColor: "white", zIndex: 9999 }}
    >
      <Box position={"sticky"} left={0}>
        <Box display={"flex"}>
          <Box>
            <Button
              variant="plain"
              onClick={async () => {
                await addRow(item.id);
              }}
            >
              New row
            </Button>
          </Box>
          <Box flex={1}></Box>
          <Box>
            <Box>Total: {item.count}</Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
