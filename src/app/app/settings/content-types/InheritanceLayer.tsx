"use client";
import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/joy";
import { ContentTypeDefinition } from "@/services/ContentTypeRepository";
type Connection = {
  from: { x: number; y: number };
  to: { x: number; y: number };
};
export const InheritanceLayer: React.FC<{
  contentTypes: ContentTypeDefinition[];
}> = ({ contentTypes }) => {
  const ref = useRef<HTMLElement>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  useEffect(() => {
    if (ref.current) {
      const el = ref.current;
      const { x: xOffset, y: yOffset } = el.getBoundingClientRect();
      const connections: Connection[] = [];
      for (const ct of contentTypes) {
        const from = ct.inheritsFrom?.id;
        const to = ct.id;
        const fromElement = document.querySelector(
          `[data-content-type-id='${from}']`
        );
        const toElement = document.querySelector(
          `[data-content-type-id='${to}']`
        );
        if (fromElement && toElement) {

          const from = fromElement.getBoundingClientRect();
          const to = toElement.getBoundingClientRect();
          connections.push({
            from: {
              x: from.x + from.width / 2 - xOffset,
              y: from.bottom - yOffset,
            },
            to: { x: to.x - xOffset, y: to.top + to.height / 2 - yOffset },
          });
        }
      }
      setConnections(connections);
    }
  }, [ref]);
  const width = useMemo(
    () =>
      connections.reduce(
        (acc, curr) => Math.max(acc, curr.from.x, curr.to.x),
        0
      ),
    [connections]
  );
  const height = useMemo(
    () =>
      connections.reduce(
        (acc, curr) => Math.max(acc, curr.from.y, curr.to.y),
        0
      ),
    [connections]
  );

  return (
    <Box ref={ref} position={"relative"} left={0} top={0} width={0} height={0}>
      <svg
        width={width + 10}
        height={height + 10}
        viewBox={`0 0 ${width + 10} ${height + 10}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {connections.map((c, i) => {
          return (
            <Fragment key={i}>
              <line
                x1={c.from.x}
                y1={c.from.y + 5}
                x2={c.from.x}
                y2={c.to.y}
                stroke={"#336699"}
                strokeWidth={1}
                strokeDasharray={"5 3"}
                strokeLinecap="round"
              />

              <line
                x1={c.from.x}
                y1={c.to.y}
                x2={c.to.x}
                y2={c.to.y}
                stroke={"#336699"}
                strokeWidth={1}
                strokeDasharray={"5 3"}
                strokeLinecap="round"
              />
              <line
                x1={c.from.x}
                y1={c.from.y}
                x2={c.from.x - 5}
                y2={c.from.y + 5}
                stroke={"#336699"}
                strokeWidth={1}
                // strokeDasharray={"2"}
                strokeLinecap="round"
              />
              <line
                x1={c.from.x}
                y1={c.from.y}
                x2={c.from.x + 5}
                y2={c.from.y + 5}
                stroke={"#336699"}
                strokeWidth={1}
                // strokeDasharray={"2"}
                strokeLinecap="round"
              />

              {/* <path
                d={`M${c.from.x} ${c.from.y} L${c.from.x - 5} ${
                  c.from.y + 5
                }  M${c.from.x} ${c.from.y} L${c.from.x - 5} L${c.from.x + 5} ${
                  c.from.y + 5
                } L${c.from.x} ${c.from.y}`}
                stroke={"#336699"}
                strokeWidth={1}
                // fill="black"
                strokeLinecap="round"
                strokeLinejoin="round"
              /> */}
            </Fragment>
          );
        })}
        {/*         
        <line
          x1="12"
          y1="0"
          x2="12"
          y2="41"
          stroke={"#336699"}
          strokeWidth={1}
          strokeDasharray={"0"}
          strokeLinecap="round"
        />
        <line
          x1="12"
          y1="41"
          x2="25"
          y2="41"
          stroke={"#336699"}
          strokeWidth={1}
          strokeDasharray={"0"}
          strokeLinecap="round"
        /> */}
      </svg>
    </Box>
  );
};

// {ct.inheritageLineage.length > 0 && (
//     <Box>
//       <Box
//         width={0}
//         height={0}
//         ml={(ct.inheritageLineage.length - 1) * marginLeft}
//       >
//         <Box position={"relative"} mt={-marginTop}>
//           <svg
//             width={24}
//             height={50}
//             viewBox="0 0 24 50"
//             fill="none"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             {/* <path
//             d="M14 12L18 8L22 12"
//             stroke={"black"}
//             strokeWidth={1}
//             strokeLinecap="round"
//             strokeLinejoin="round"
//           /> */}

//             <line
//               x1="12"
//               y1="0"
//               x2="12"
//               y2="41"
//               stroke={"#336699"}
//               strokeWidth={1}
//               strokeDasharray={"0"}
//               strokeLinecap="round"
//             />
//             <line
//               x1="12"
//               y1="41"
//               x2="25"
//               y2="41"
//               stroke={"#336699"}
//               strokeWidth={1}
//               strokeDasharray={"0"}
//               strokeLinecap="round"
//             />
//           </svg>
//         </Box>
//       </Box>
//     </Box>
//   )}
