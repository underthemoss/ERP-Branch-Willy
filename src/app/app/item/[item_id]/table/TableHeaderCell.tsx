"use client";
import {
  Box,
  Dropdown,
  IconButton,
  ListDivider,
  ListItemDecorator,
  Menu,
  MenuButton,
  MenuItem,
  Typography,
} from "@mui/joy";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { useState } from "react";
import { NextLink } from "@/ui/NextLink";

import { useItem } from "../ItemProvider";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import { MenuItemLink } from "@/ui/MenuItemLink";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import _ from "lodash";
import { deleteItem } from "../actions";
// export const minimumColWidth = 120;

const ColumnHeaderSortOptions: React.FC<{
  index: number;
}> = ({ index }) => {
  const { item, query } = useItem();
  const column = item.columns[index];
  const isOrderedColumn = query.sort_by === column.column_id;

  if (isOrderedColumn) {
    const sortOrder = isOrderedColumn ? query.sort_order : null;
    const toggleOption = sortOrder === "asc" ? "desc" : "asc";
    return (
      <Box>
        <NextLink
          href={`/app/item/${item.id}?sort_by=${column.column_id}&sort_order=${toggleOption}`}
        >
          <IconButton size="sm" color="neutral" sx={{ opacity: 0.9 }}>
            {sortOrder === "desc" ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
          </IconButton>
        </NextLink>
      </Box>
    );
  }
  return (
    <Box className={isOrderedColumn ? "" : "sort-options"}>
      <NextLink
        href={`/app/item/${item.id}?sort_by=${column.column_id}&sort_order=${
          !isOrderedColumn
            ? "asc"
            : query.sort_order === "desc"
            ? "asc"
            : "desc"
        }`}
      >
        <IconButton size="sm" color="neutral" sx={{ opacity: 0.5 }}>
          <ArrowUpwardIcon />
        </IconButton>
      </NextLink>
    </Box>
  );
};

const ColumnHeaderMoreOptions: React.FC<{
  index: number;
}> = ({ index }) => {
  const { item, query } = useItem();
  const column = item.columns[index];
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Box className={!isOpen ? "hover-option" : ""}>
      <Dropdown onOpenChange={(_, v) => setIsOpen(v)}>
        <MenuButton
          slots={{ root: IconButton }}
          slotProps={{
            root: {
              variant: "plain",
              color: "neutral",
              size: "sm",
              sx: { opacity: 0.5 },
            },
          }}
        >
          <MoreVertIcon />
        </MenuButton>
        <Menu placement="bottom-end" sx={{ width: 250 }}>
          <MenuItemLink
            href={`/app/item/${item.id}?sort_by=${column.column_id}&sort_order=asc`}
          >
            <ListItemDecorator>
              <ArrowUpwardIcon />
            </ListItemDecorator>
            Sort by ASC
          </MenuItemLink>
          <MenuItemLink
            href={`/app/item/${item.id}?sort_by=${column.column_id}&sort_order=desc`}
          >
            <ListItemDecorator>
              <ArrowDownwardIcon />
            </ListItemDecorator>
            Sort by DESC
          </MenuItemLink>
          <ListDivider />
          <MenuItem>
            <ListItemDecorator>
              <ViewColumnIcon />
            </ListItemDecorator>
            Manage columns
          </MenuItem>
          <MenuItem
            disabled={index === 0}
            onClick={() => {
              deleteItem(column.id);
            }}
          >
            <ListItemDecorator>
              <ChevronLeftIcon />
            </ListItemDecorator>
            Hide column
          </MenuItem>
        </Menu>
      </Dropdown>
    </Box>
  );
};

// const ColumnHeaderResizeHandle: React.FC<{}> = ({}) => {
//   return (
//     <Box
//       sx={{
//         minWidth: "2px",
//         width: "2px",
//         zIndex: 999,
//         height: "100%",
//       }}
//       alignItems={"center"}
//       display={"flex"}
//     >
//       <Box
//         width={1}
//         flex={1}
//         sx={{ backgroundColor: "rgba(0,0,0,0.1)", height: 20 }}
//       ></Box>
//     </Box>
//   );
// };

// const ColumnHeaderDraggable: React.FC<{
//   index: number;
//   children: React.ReactNode;
// }> = ({ index, children }) => {
//   const { item, moveColumn } = useItem();

//   const resetStyles = () => {
//     item.columns.map((_, i) => {
//       const el = getElementByIndex(i);
//       el.style.outline = "";
//       el.style.opacity = "";
//       el.style.position = "relative";
//       el.style.left = "0px";
//       getElementsByColIndex(i).forEach((el) => {
//         el.style.left = "0px";

//         el.style.position = ``;
//       });
//     });
//   };
//   const getElementByIndex = (index: number) => {
//     return document.querySelector(`.col-header-${index}`) as HTMLElement;
//   };
//   const getElementsByColIndex = (index: number) => {
//     return document.querySelectorAll(
//       `.col-${index}`
//     ) as NodeListOf<HTMLElement>;
//   };
//   return (
//     <Box
//       display={"flex"}
//       flex={1}
//       alignContent={"center"}
//       alignItems={"center"}
//       overflow={"hidden"}
//       textOverflow={"ellipsis"}
//       sx={{
//         backgroundColor: "white",
//         overflow: "hidden",
//         "& .hover-option": {
//           width: 0,
//           margin: 0,
//           opacity: 0,
//           transition: "all 0.2s ease",
//         },
//         "&:hover .hover-option": {
//           opacity: 1,
//           margin: 1,
//           width: 30,
//         },
//         "& .sort-options": {
//           width: 0,
//           // margin: 0,
//           opacity: 0,
//           transition: "opacity 0.0s ease",
//         },
//         "&:hover .sort-options": {
//           opacity: 1,
//           margin: 1,
//           width: 30,
//         },
//       }}
//       draggable
//       onDragStart={(e) => {
//         draggingColumnIndex = index;
//         e.dataTransfer.setData("text/plain", index.toString());
//       }}
//       // onDrop={() => {
//       //   resetStyles();
//       // }}
//       onDragEnd={async (e) => {
//         await moveColumn({
//           destinationIndex: dropColumnIndex,
//           draggedColumnIndex: draggingColumnIndex,
//         });
//         resetStyles();
//       }}
//       onDragEnter={(e) => {
//         resetStyles();
//         dropColumnIndex = index;
//         item.columns.forEach((__, i) => {
//           const columnIndex = getElementByIndex(i);
//           if (draggingColumnIndex === i) {
//             columnIndex.style.opacity = "0";
//             const isLeft = draggingColumnIndex > index;
//             if (isLeft) {
//               const offset = _.range(draggingColumnIndex - 1, index - 1).reduce(
//                 (acc, i) => acc + item.columns[i].column_width,
//                 0
//               );

//               getElementsByColIndex(i).forEach((el) => {
//                 el.style.position = "relative";
//                 el.style.left = `${-offset}px`;
//               });
//             } else {
//               const offset = _.range(index, draggingColumnIndex).reduce(
//                 (acc, i) => acc + item.columns[i].column_width,
//                 0
//               );
//               getElementsByColIndex(i).forEach((el) => {
//                 el.style.position = "relative";
//                 el.style.left = `${offset}px`;
//               });
//             }
//           }
//           if (i < draggingColumnIndex && i > index - 1) {
//             columnIndex.style.position = "relative";
//             columnIndex.style.left = `${item.columns[draggingColumnIndex].column_width}px`;
//             getElementsByColIndex(i).forEach((el) => {
//               el.style.position = "relative";
//               el.style.left = `${item.columns[draggingColumnIndex].column_width}px`;
//             });
//           }
//           if (i > draggingColumnIndex && i < index + 1) {
//             columnIndex.style.position = "relative";
//             columnIndex.style.left = `-${item.columns[draggingColumnIndex].column_width}px`;
//             getElementsByColIndex(i).forEach((el) => {
//               el.style.position = "relative";
//               el.style.left = `-${item.columns[draggingColumnIndex].column_width}px`;
//             });
//           }
//         });
//         e.preventDefault();
//       }}
//       // onDragOver={(e) => {
//       //   e.preventDefault(); // Required for onDrop to work
//       //   e.dataTransfer.dropEffect = "none"; // Optional, improves UX
//       // }}
//     >
//       {children}
//     </Box>
//   );
// };

// export const TableHeaderCell2: React.FC<{ index: number }> = ({ index }) => {
//   const { item, query } = useItem();
//   const column = item.columns[index];

//   return (
//     <ColumnHeaderContainer index={index}>
//       {/* <ColumnHeaderDraggable index={index}> */}
//       <Box width={16} minWidth={16}></Box>
//       <Typography
//         textOverflow={"ellipsis"}
//         noWrap
//         level="title-sm"
//         fontSize={14}
//       >
//         {column.column_type?.label}
//       </Typography>
//       <Box width={16}></Box>
//       {<ColumnHeaderSortOptions index={index} />}
//       <Box flex={1}></Box>
//       {<ColumnHeaderMoreOptions index={index} />}
//       <ColumnHeaderResizeHandle />
//       {/* </ColumnHeaderDraggable> */}
//     </ColumnHeaderContainer>
//   );
// };

export const TableHeaderCell: React.FC<{ index: number }> = ({ index }) => {
  const { item, query } = useItem();
  const column = item.columns[index];
  return (
    <Box
      flex={1}
      display={"flex"}
      overflow={"hidden"}
      sx={{
        backgroundColor: "white",
        borderBottom: "1px solid #e0e0e0",
        "&:hover .react-resizable-handle-e": {
          borderLeft: "3px solid red !important",
        },
        "& .hover-option": {
          width: 0,
          margin: 0,
          opacity: 0,
          transition: "all 0.2s ease",
        },
        "&:hover .hover-option": {
          opacity: 1,
          margin: 1,
          width: 30,
        },
        "& .sort-options": {
          width: 0,
          // margin: 0,
          opacity: 0,
          transition: "opacity 0.0s ease",
        },
        "&:hover .sort-options": {
          opacity: 1,
          margin: 1,
          width: 30,
        },
      }}
      alignItems={"center"}
    >
      <Box
        overflow={"hidden"}
        ml={2}
        sx={{ cursor: "move" }}
        className="column-drag-handle"
      >
        <Typography
          textOverflow={"ellipsis"}
          noWrap
          level="title-sm"
          fontSize={14}
        >
          {column.column_type?.label}
        </Typography>
      </Box>
      <Box flex={1} className="column-drag-handle"></Box>
      {<ColumnHeaderSortOptions index={index} />}
      {<ColumnHeaderMoreOptions index={index} />}
      <Box width={"8px"}></Box>
    </Box>
  );
};
