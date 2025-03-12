import { Box, Typography } from "@mui/joy";
import { AutoImage } from "./AutoImage";

export const GenericEntityDetails = (props: {
  id: string | number;
  label: string;
  secondary: string;
  logo?: React.ReactElement;
}) => {
  return (
    <Box display={"inline-block"}>
      <Box display={"flex"} alignItems={"center"}>
        {props.logo || <AutoImage value={props.id.toString()} />}
        <Box pl={2}>
          <Typography
            level="body-sm"
            fontWeight={600}
            sx={{
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {props.label}
          </Typography>

          <Typography
            level="body-xs"
            sx={{
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {props.secondary}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
