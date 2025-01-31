"use client";
import "../../../../../../node_modules/react-grid-layout/css/styles.css";
import "../../../../../../node_modules/react-resizable/css/styles.css";
import { useItem } from "../ItemProvider";
import {
  Box,
  Button,
  Dropdown,
  ListDivider,
  ListItemDecorator,
  Menu,
  MenuButton,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/joy";
import AddIcon from "@mui/icons-material/Add";
import Check from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import { VirtualAsyncTable } from "../../../../../ui/VirtualAsyncTable";
import { TableHeaderCell } from "./TableHeaderCell";
import { MenuItemLink } from "@/ui/MenuItemLink";
import { NextLink } from "@/ui/NextLink";
import { CellRender } from "./CellRender";
import { addRow, deleteItem, updateToggleSelectedColumns } from "../actions";
import { EntityTypeIcon } from "@/ui/EntityTypeIcons";
import { Fragment, useEffect, useRef, useState } from "react";
import GridLayout from "react-grid-layout";
import _ from "lodash";
// const minWidth = 120;
// const leftOffset = (
//   arr: ReturnType<typeof useItem>["item"]["columns"],
//   index: number
// ) =>
//   arr
//     .slice(0, index)
//     .reduce((acc, { column_width }) => acc + (column_width || minWidth), 0);

// function moveElement<T>(
//   arr: T[],
//   indexToMove: number,
//   targetIndex: number
// ): T[] {
//   if (
//     indexToMove < 0 ||
//     indexToMove >= arr.length ||
//     targetIndex < 0 ||
//     targetIndex >= arr.length
//   ) {
//     throw new Error("Invalid indices");
//   }

//   const element = arr.splice(indexToMove, 1)[0];
//   arr.splice(targetIndex, 0, element);

//   return arr;
// }

// const Resizable: React.FC<{ columnWidth: number; colIndex: number }> = ({
//   columnWidth,
//   colIndex,
// }) => {
//   const { item } = useItem();
//   const boxRef = useRef<HTMLDivElement>(null);
//   const newWidthRef = useRef(columnWidth);

//   useEffect(() => {
//     if (!boxRef.current) return;

//     const commit = _.debounce(() => {
//       if (newWidthRef.current === columnWidth) {
//         return;
//       }
//       document
//         .querySelectorAll<HTMLElement>(`.header-${colIndex}`)
//         .forEach((el) => {
//           el.style.width = `${newWidthRef.current}px`;
//         });
//       //   updateColumnWidth({ columnIndex: colIndex, width: newWidthRef.current });
//     }, 2000);

//     const resize = _.debounce((newWidth: number) => {
//       const safeWidth = Math.max(newWidth, minimumColWidth);
//       newWidthRef.current = safeWidth;
//       document
//         .querySelectorAll<HTMLElement>(`.col-${colIndex}`)
//         .forEach((el) => {
//           el.style.width = `${safeWidth}px`;
//         });
//       const diff = safeWidth - columnWidth;
//       item.columns.map((_, i) => {
//         if (i > colIndex) {
//           const left = leftOffset(item.columns, i);
//           const newLeft = left + diff;

//           document
//             .querySelectorAll<HTMLElement>(`.col-${i}, .header-${i}`)
//             .forEach((el) => {
//               el.style.left = `${newLeft}px`;
//             });
//         }
//       });
//       //   commit();
//     }, 30);

//     const resizeObserver = new ResizeObserver((entries) => {
//       const width = entries[entries.length - 1].contentRect.width;
//       //   if (width === columnWidth) {
//       //     return;
//       //   }
//       //   updateColumnWidth({ columnIndex: colIndex, width: width });
//       //   console.log(width);
//       resize(entries[entries.length - 1].contentRect.width);
//     });
//     resizeObserver.observe(boxRef.current);

//     return () => {
//       resizeObserver.disconnect();
//     };
//   }, []);

//   return (
//     <Box
//       ref={boxRef}
//       sx={{
//         flex: 1,
//         display: "flex",
//         resize: "horizontal",
//         overflow: "hidden",
//         width: columnWidth,
//       }}
//     >
//       <TableHeaderCell index={colIndex} />
//       <Box
//         position="relative"
//         width={20}
//         left={0}
//         // mr={-2}
//         sx={{ backgroundColor: "red", cursor: "ew-resize" }}
//         draggable
//         onDrag={(e) => {
//           //   e.preventDefault();
//           //   e.stopPropagation();
//         }}
//       ></Box>
//     </Box>
//   );
// };

// export const TableHeader2: React.FC<{ headerHeight: number }> = ({
//   headerHeight,
// }) => {
//   const { item, moveColumn } = useItem();
//   const draggingIndex = useRef(-1); // Store dragged item outside of state
//   const droppingIndex = useRef(-1); // Store dragged item outside of state
//   const dropZoneRowRef = useRef<HTMLElement>(null);

//   return (
//     <Fragment>
//       {item.columns.map((column, colIndex, all) => {
//         const columnWidth = item.columns[colIndex].column_width;

//         return (
//           <Box
//             key={column.column_id}
//             className={`header-${colIndex}`}
//             draggable
//             sx={{
//               display: "flex",
//               position: "absolute",
//               opacity: 1,
//               left: leftOffset(all, colIndex),
//               height: headerHeight,
//               transition: "left 0.3s ease-in-out",
//               overflow: "hidden",
//             }}
//             onDragStart={(e) => {
//               draggingIndex.current = colIndex;
//               requestAnimationFrame(() => {
//                 if (dropZoneRowRef.current) {
//                   dropZoneRowRef.current.style.marginTop = "0px";
//                   document
//                     .querySelectorAll<HTMLElement>(".drop-zone")
//                     .forEach((el) => (el.style.height = "100vh"));

//                   document.querySelector<HTMLElement>(
//                     ".table-scroll-window"
//                   )!.style.overflow = "hidden";
//                 }
//               });
//             }}
//             onDragEnd={(e) => {
//               // cancelled - reset everything
//               draggingIndex.current = -1;

//               document.querySelector<HTMLElement>(
//                 ".table-scroll-window"
//               )!.style.overflow = "auto";

//               document
//                 .querySelectorAll<HTMLElement>(".drop-zone")
//                 .forEach((el) => (el.style.height = "0px"));

//               item.columns.forEach((curr, i, all) => {
//                 const columnEls = document.querySelectorAll<HTMLElement>(
//                   `.col-${i}, .header-${i}`
//                 )!;
//                 columnEls.forEach(
//                   (el) => (el.style.left = `${leftOffset(all, i)}px`)
//                 );
//               });
//             }}
//           >
//             <Resizable
//               columnWidth={columnWidth}
//               colIndex={colIndex}
//             ></Resizable>
//           </Box>
//         );
//       })}

//       <Box
//         ref={dropZoneRowRef}
//         style={{
//           display: "flex",
//           flex: 1,
//           height: headerHeight,
//           backgroundColor: "white",
//           //   zIndex: 100,
//         }}
//       >
//         {item.columns.map((column, colIndex, all) => {
//           const columnWidth = item.columns[colIndex].column_width;

//           return (
//             <Box
//               className={"drop-zone"}
//               position={"absolute"}
//               left={leftOffset(item.columns, colIndex)}
//               height={0}
//               onDragOver={(e) => {
//                 e.preventDefault();
//               }}
//               onDragEnter={(e) => {
//                 droppingIndex.current = colIndex;

//                 const reshuffledIndexes = moveElement(
//                   item.columns.map((_, i) => i),
//                   draggingIndex.current,
//                   droppingIndex.current
//                 );
//                 const reshuffledColumns = reshuffledIndexes.map(
//                   (i) => item.columns[i]
//                 );
//                 reshuffledIndexes.forEach((index, i) => {
//                   const columnEls = document.querySelectorAll<HTMLElement>(
//                     `.col-${index}, .header-${index}`
//                   );
//                   const left = leftOffset(reshuffledColumns, i);
//                   columnEls.forEach((el) => (el.style.left = `${left}px`));
//                 });
//               }}
//               onDrop={async (e) => {
//                 document.querySelector<HTMLElement>(
//                   ".table-scroll-window"
//                 )!.style.overflow = "auto";
//                 if (draggingIndex.current !== droppingIndex.current) {
//                   await moveColumn({
//                     draggedColumnIndex: draggingIndex.current,
//                     destinationIndex: droppingIndex.current,
//                   });
//                 }
//               }}
//               key={column.column_id}
//               width={columnWidth}
//               sx={{
//                 opacity: 0, // REMOVE THIS TO DEBUG
//                 backgroundColor:
//                   "#" +
//                   Math.floor(Math.random() * 16777215)
//                     .toString(16)
//                     .padStart(6, "0"),
//               }}
//               display={"flex"}
//             ></Box>
//           );
//         })}
//       </Box>
//     </Fragment>
//   );
// };

export const TableHeader: React.FC<{ headerHeight: number }> = ({
  headerHeight,
}) => {
  const { item, updateColumnOrder, updateColumnWidths } = useItem();

  const tableColumnWinWidth = 100;
  const tableColumnMaxWidth = 600;
  const tableMaxColumns = item.columns.length * tableColumnMaxWidth;
  //   const layout = item.columns.map((c, i) => {
  //     return {
  //       i: c.id,
  //       x: i,
  //       y: 0,
  //       w: Math.floor(c.column_width),
  //       h: 1,
  //       maxW: tableColumnMaxWidth,
  //       minW: tableColumnWinWidth,
  //       isResizable: true,
  //       isDraggable: true,

  //       resizeHandles: ["e"],
  //     } satisfies GridLayout.Layout;
  //   });

  //   const adjustedLayout = [
  //     {
  //       i: "icon",
  //       w: 200,
  //       static: true,
  //       x: 0,
  //       h: 1,
  //       y: 0,
  //     } satisfies GridLayout.Layout,
  //     ...layout,
  //   ];

  //   console.log(layout);

  return (
    <GridLayout
      //   layout={adjustedLayout}
      cols={tableMaxColumns}
      width={tableMaxColumns}
      maxRows={1}
      isResizable
      rowHeight={headerHeight}
      useCSSTransforms
      compactType={"horizontal"}
      onDrop={(e, item) => console.log(e, item)}
      onLayoutChange={(newLayout) => {
        const newColumnOrderIds = _.sortBy(newLayout, (d) => d.x).map(
          (c) => c.i
        );
        const oldColumnOrderIds = item.columns.map((c) => c.id);
        if (!_.isEqual(newColumnOrderIds, oldColumnOrderIds)) {
          updateColumnOrder({ columnIds: newColumnOrderIds });
        }
        const newColumnWidths = _.sortBy(newLayout, (d) => d.x).map((c) => c.w);
        const oldColumnWidths = item.columns.map((c) => c.column_width);
        if (!_.isEqual(newColumnWidths, oldColumnWidths)) {
          updateColumnWidths({ widths: newColumnWidths });
        }
        // console.log(newColumnWidths, oldColumnWidths);
      }}
      containerPadding={[0, 0]}
      margin={[0, 0]}
      draggableHandle=".column-drag-handle"
    >
      {item.columns.map((c, index) => {
        return (
          <Box
            key={c.id}
            data-grid={{
              x: index + 100,
              y: 0,
              w: c.column_width,
              h: 1,
              static: false,
              isResizable: true,
              isDraggable: true,

              resizeHandles: ["e"],
            }}
            display={"flex"}
          >
            {/* {index} */}
            <TableHeaderCell index={index} />
          </Box>
        );
      })}
    </GridLayout>
  );
};
