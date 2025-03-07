import { findEntities } from "@/db/mongoose";
import { TableCellRenderer, TableHeaderRenderer } from "@/types/FieldRender";
import { encodeUniversalQuery, UniversalQuery } from "@/types/UniversalQuery";
import { Box, Button, Table } from "@mui/joy";
import { get } from "lodash";
import { NextLink } from "@/ui/NextLink";
export const ViewTable: React.FC<{
  query: UniversalQuery;
  data: Awaited<ReturnType<typeof findEntities>>;
}> = ({ query, data }) => {
  const include = query.include || [
    ...new Set(data.results.flatMap((d) => Object.keys(d.data))),
  ];
  const columns = typeof include === "string" ? [include] : include;
  const previousDisabled = (Number(query.offset) || 0) <= 0;
  const order_by =
    typeof query.order_by === "string" ? [query.order_by] : query.order_by;

  return (
    <Table>
      <thead>
        <tr>
          {columns.map((c, i, { length }) => {
            const sorted = order_by?.find((o) => o.startsWith(c + ":"));
            const dir = sorted?.split(":")[1];
            const otherDir = dir === "asc" ? "desc" : "asc";
            return (
              <th
                key={c}
                style={{
                  width: i < length - 1 ? TableHeaderRenderer[c].width : "auto",
                }}
              >
                <Box display={"flex"} gap={1}>
                  <NextLink
                    href={
                      "?" +
                      encodeUniversalQuery({
                        ...query,
                        order_by: [`${c}:${otherDir}`],
                      })
                    }
                  >
                    {TableHeaderRenderer[c].label}
                  </NextLink>
                  {dir === "asc" ? "🔼" : dir === "desc" ? "🔽" : ""}
                </Box>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {data.results.map((item) => {
          return (
            <tr key={item.id} style={{ height: 60 }}>
              {columns.map((c) => {
                const Component =
                  TableCellRenderer[item.type][c] ||
                  ((props: { value: any }) => "");
                return (
                  <td key={c}>
                    <Component value={get(item, c)} />
                  </td>
                );
              })}
            </tr>
          );
        })}
        <tr>
          <td colSpan={columns.length}>
            <Box gap={1} display={"flex"}>
              <NextLink
                disabled={previousDisabled}
                href={
                  "?" +
                  encodeUniversalQuery({
                    ...query,
                    offset:
                      Number(query.offset || 0) - Number(query.limit || 20),
                  })
                }
              >
                <Button disabled={previousDisabled}>Previous</Button>
              </NextLink>
              <NextLink
                href={
                  "?" +
                  encodeUniversalQuery({
                    ...query,
                    offset:
                      Number(query.offset || 0) + Number(query.limit || 20),
                  })
                }
              >
                <Button>Next</Button>
              </NextLink>
            </Box>
          </td>
        </tr>
      </tbody>
    </Table>
  );
};
