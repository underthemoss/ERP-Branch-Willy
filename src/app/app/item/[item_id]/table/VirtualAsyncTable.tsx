/* eslint-disable react/display-name */
import { Box } from "@mui/joy";
import _ from "lodash";
import { useSearchParams } from "next/navigation";
import { forwardRef, useEffect, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";

export const VirtualAsyncTable = <T,>(props: {
  rowHeight: number;
  headerHeight: number;
  footerHeight: number;
  totalRows: number;
  resolveRows: (props: { take: number; skip: number }) => Promise<void>;
  renderRow: (item: T, index: number) => React.ReactNode;
  renderHeader: () => React.ReactNode;
  renderFooter: () => React.ReactNode;
  items: T[];
}) => {
  const load = async (startIndex: number, stopIndex: number) => {
    const skip = startIndex;
    const take = stopIndex - startIndex + 1;
    await props.resolveRows({ skip, take });
  };

  const loadMoreItems = _.debounce(
    load,
    0
    // { maxWait: 10_000 }
  );

  return (
    <Box display={"flex"} flexDirection={"column"} flex={1}>
      <AutoSizer>
        {({ height, width }) => {
          return (
            <InfiniteLoader
              minimumBatchSize={60}
              threshold={60}
              isItemLoaded={(index) => !!props.items[index]}
              loadMoreItems={loadMoreItems}
              itemCount={props.totalRows}
            >
              {({ onItemsRendered, ref }) => (
                <FixedSizeList
                  ref={ref}
                  overscanCount={60}
                  itemCount={props.totalRows}
                  itemSize={props.rowHeight}
                  height={height}
                  width={width}
                  onItemsRendered={onItemsRendered}
                  itemData={props.items}
                  initialScrollOffset={Number(
                    localStorage.getItem("v-table-scrolloffset") || 0
                  )}
                  innerElementType={forwardRef(
                    ({ children, style, ...rest }: any, ref: any) => (
                      <Box
                        ref={ref}
                        style={{
                          ...style,
                          height: `${
                            parseFloat(style.height) +
                            props.headerHeight +
                            props.footerHeight
                          }px`,
                        }}
                        {...rest}
                      >
                        {children}
                        <Box
                          style={{
                            top: 0,
                            left: 0,
                            // right: 0,
                            width: style.width,
                            // width: "100%",
                            height: props.headerHeight,
                            position: "sticky",
                            display: "flex",
                          }}
                        >
                          {props.renderHeader()}
                        </Box>
                        <Box
                          style={{
                            top: height - props.footerHeight,
                            left: 0,
                            width: style.width,
                            height: props.footerHeight,
                            position: "sticky",
                            display: "flex",
                          }}
                        >
                          {props.renderFooter()}
                        </Box>
                      </Box>
                    )
                  )}
                >
                  {({ style, data, index }) => {
                    const item = data[index];

                    return (
                      <Box
                        style={{
                          ...style,
                          top:
                            parseFloat(style.top?.toString() || "0") +
                            props.headerHeight,
                        }}
                        display={"flex"}
                      >
                        {item && props.renderRow(item, index)}
                      </Box>
                    );
                  }}
                </FixedSizeList>
              )}
            </InfiniteLoader>
          );
        }}
      </AutoSizer>
    </Box>
  );
};
