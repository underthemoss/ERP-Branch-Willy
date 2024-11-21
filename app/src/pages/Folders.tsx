import { useQuery } from "@tanstack/react-query";
import { getApiReadyzOptions } from "../api/generated/@tanstack/react-query.gen";
import { Box, Table } from "@mui/joy";
export const Folders = () => {
//   const { data } = useQuery({ ...getApiFoldersCommandCreateOptions({}) });
  return (
    <Box m={2}>
      <h1>ES ERP</h1>

      <Table>
        <thead>
          <th>Name</th>
          <th>Status</th>
          <th>Owner</th>
          <th>Created</th>
          <th>Last Updated</th>
        </thead>
        <tbody>
          <tr>
            <td>test</td>
            <td>test</td>
            <td>test</td>
            <td>test</td>
            <td>test</td>
          </tr>
        </tbody>
      </Table>
    </Box>
  );
};
