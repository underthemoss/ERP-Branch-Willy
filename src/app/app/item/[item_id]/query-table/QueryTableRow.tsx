"use client";

import { Box } from "@mui/joy";
// import { minimumColWidth } from "./TableHeaderCell";
import { NextLink } from "@/ui/NextLink";
import { QueryTableRowCellRender } from "./QueryTableRowCellRender";

import { EntityCardToolTip } from "@/ui/entity-card/EntityCard";
import { ContentTypeComponent } from "@/ui/Icons";
import { useTable } from "./QueryTableProvider";

export const QueryTableRow: React.FC<{
  width: number;
  index: number;
  rowHeight: number;
}> = ({ index: index, width, rowHeight }) => {
  const { columns, rows, contentTypes } = useTable();
  const row = rows[index];

  const contentType = contentTypes.find((ct) => ct.id === row?.type_id);
  if (!row) {
    return (
      <Box flex={1} width={width} sx={{ backgroundColor: "white" }}>
        LOADING
      </Box>
    );
  }
  const firstColumnIndent = 44;

  return (
    <Box
      key={index}
      flex={1}
      display={"flex"}
      width={width}
      // borderBottom={"1px solid #e0e1e3"}
    >
      <Box
        width={firstColumnIndent}
        position={"sticky"}
        left={0}
        alignContent={"center"}
      >
        <Box display={"flex"} justifySelf={"center"}>
          <EntityCardToolTip item_id={row.id} placement="right">
            <NextLink href={`/app/item/${row.id}`}>
              {contentType && (
                <ContentTypeComponent
                  color={contentType?.color}
                  icon={contentType?.icon}
                  label={""}
                />
              )}
            </NextLink>
          </EntityCardToolTip>
        </Box>
      </Box>

      {columns.map((column, colIndex, all) => {
        const value = row.values[colIndex];
        const isFirstColumn = colIndex === 0;
        const indent = colIndex === 0 ? firstColumnIndent : 0;

        const width = isFirstColumn ? 200 - indent : 200;
        const left = indent + width * colIndex;

        // const width = Math.max(column.width - indent, 0);
        return (
          <Box
            key={column.id}
            width={width}
            alignContent={"center"}
            className={`col-${colIndex} row-${index}`}
            sx={{
              transition: "left 0.3s ease-in-out",
              position: "absolute",
              left: left,
              height: rowHeight,
              backgroundColor: "white",
            }}
            //   display={"flex"}
          >
            {
              <QueryTableRowCellRender
                // key={value}
                type={column.type}
                colIndex={colIndex}
                rowIndex={index}
                totalColumns={columns.length}
                value={value}
                // columnLookupConfig={item.column_config[colIndex].lookup} // todo: dont need this?
                columnLookupConfig={null} // todo: dont need this?
                readonly={false}
                onBlur={async (value) => {
                  // await updateItemValue({
                  //   columnIndex: colIndex,
                  //   item_id: row.id,
                  //   value: value || null,
                  // });
                }}
              ></QueryTableRowCellRender>
            }
          </Box>
        );
      })}
    </Box>
  );
};
