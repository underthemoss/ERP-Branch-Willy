import { useQuery } from "@tanstack/react-query";
import { getApiFoldersCommandCreateOptions } from "../api/generated/@tanstack/react-query.gen";
import { Box, Button } from "@mui/joy";
export const Folders = () => {
  const { data } = useQuery({ ...getApiFoldersCommandCreateOptions({}) });
  return (
    <Box>
      <h1>ES ERP - {data?.data.user}</h1>
      <Button variant="solid">Hello world</Button>
    </Box>
  );
};
