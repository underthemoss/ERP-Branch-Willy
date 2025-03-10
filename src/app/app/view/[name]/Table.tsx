import { findEntities } from "@/db/mongoose";
import { TableCellRenderer, TableHeaderRenderer } from "@/types/FieldRender";

import { Box, Button, Table } from "@mui/joy";
import { get } from "lodash";
import { NextLink } from "@/ui/NextLink";
import { encodeUniversalQuery, UniversalQuery } from "@/lib/UniversalQuery";

export const ViewTable: React.FC<{
  query: UniversalQuery;
  data: Awaited<ReturnType<typeof findEntities>>;
}> = ({ query, data }) => {
  const include = Object.keys(query.include) || [
    ...new Set(data.results.flatMap((d) => Object.keys(d.data))),
  ];
  const columns = typeof include === "string" ? [include] : include;
  const previousDisabled = (Number(query.options?.skip) || 0) <= 0;

  return (
    <Table>
      <thead>
        <tr>
          {columns.map((c, i, { length }) => {
            const dir = query.options?.sort[c] || -1;
            const otherDir = dir * -1;
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
                        options: {
                          sort: {
                            [c]: otherDir,
                          },
                        },
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
                  TableCellRenderer?.[item.type]?.[c] ||
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
                    options: {
                      ...query.options,
                      skip:
                        Number(query.options?.skip || 0) -
                        Number(query.options?.limit || 20),
                    },
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
                    options: {
                      skip:
                        Number(query.options?.skip || 0) +
                        Number(query.options?.limit || 20),
                    },
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
