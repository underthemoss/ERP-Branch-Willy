import { Box } from "@mui/joy";
import { useState } from "react";

export const RollupConfig: React.FC<{}> = () => {
  const [data] = useState({});

  return <Box>{JSON.stringify(data, undefined, 2)}</Box>;
};
