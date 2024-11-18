import { useQuery } from "@tanstack/react-query";
import { getApiReadyzOptions } from "../api/generated/@tanstack/react-query.gen";
import { Box, Button } from "@mui/joy";
export const Folders = () => {
  const { data } = useQuery({ ...getApiReadyzOptions({}) });
  return (
    <Box>
      <h1>ES ERP - {data?.status}</h1>
      <Button variant="solid">Hello world</Button>
    </Box>
  );
};
