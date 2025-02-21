"use client";
import { Query } from "./actions";
import { QueryTable } from "./query-table/QueryTable";
import { Box, Tab, TabList, TabPanel, Tabs } from "@mui/joy";

export const EntityView: React.FC<{
  tables: { query: Query; label: string }[];
}> = ({ tables }) => {
  return (
    <Box display={"flex"} flex={1} flexDirection={"column"}>
      <Box>{/* <EntityCard show_cta={false} item_id={item.id} /> */}</Box>
      <Tabs aria-label="Basic tabs" defaultValue={0}>
        <TabList>
          {tables.map((t) => (
            <Tab key={t.label}>{t.label}</Tab>
          ))}
        </TabList>
        {tables.map((table, i) => (
          <TabPanel
            value={i}
            key={table.label}
            style={{
              display: "flex",
              flex: 1,

              padding: 0,
              backgroundColor: "white",
            }}
          >
            <Box height={500} display={"flex"} flex={1}>
              <QueryTable query={table.query} />
            </Box>
          </TabPanel>
        ))}
      </Tabs>
    </Box>
  );
};
