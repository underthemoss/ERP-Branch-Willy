"use client";
// import { Box, Button, Checkbox, Input, Option, Select, Table } from "@mui/joy";
// import { useState } from "react";
// import {
//   Enti,
//   EntityTypeColumn,
// } from "../../../../../../../prisma/generated/mongo";

// type AttributeType = EntityTypeColumn & {
//   sourceEntityTypes: { id: string; name: string }[];
// };

// type AttrState = Partial<AttributeType & { isInherited?: boolean }>;

export const Attributes = (props: { inheritedAttributes: [] }) => {
  return null;
  // const [attrs, setAttrs] = useState<AttrState[]>([
  //   ...props.inheritedAttributes.map((a) => ({ ...a, isInherited: true })),
  // ]);

  // const addAttr = () => {
  //   setAttrs((attrs) => [
  //     ...attrs,
  //     {
  //       id: "",
  //       name: "",
  //       type: "single_line_of_text" satisfies EntityAttributeValueType,
  //     },
  //   ]);
  // };

  // const setAttrVal = <Key extends keyof AttrState>(
  //   index: number,
  //   key: Key,
  //   value: AttrState[Key]
  // ) => {
  //   setAttrs((attrs) =>
  //     attrs.map((attr, i) => (index === i ? { ...attr, [key]: value } : attr))
  //   );
  // };

  // return (
  //   <>
  //     <Table variant="soft">
  //       <thead>
  //         <tr>
  //           <th style={{ width: 50 }}>#</th>
  //           <th>Name</th>
  //           <th>Type</th>
  //           <th>Required</th>
  //         </tr>
  //       </thead>
  //       <tbody>
  //         {attrs.map((attr, i, arr) => {
  //           const index =
  //             arr.slice(0, i + 1).filter((i) => !i.isInherited).length - 1;

  //           const fieldName = (name: string) =>
  //             attr.isInherited ? "" : `attributes[${index}].${name}`;
  //           return (
  //             <tr key={`${i}_${attr.id}`}>
  //               <td>{i + 1}</td>
  //               <td>
  //                 <Input
  //                   required
  //                   autoComplete="off"
  //                   name={fieldName("name")}
  //                   placeholder="Attribute name"
  //                   defaultValue={attr.label}
  //                   disabled={attr.isInherited}
  //                 />
  //               </td>
  //               <td>
  //                 <Box display={"flex"}>
  //                   <Box flex={1}>
  //                     <Select
  //                       required
  //                       disabled={attr.isInherited}
  //                       name={fieldName("type")}
  //                       defaultValue={attr.type}
  //                       onChange={(e, value) =>
  //                         setAttrVal(
  //                           i,
  //                           "type",
  //                           value as EntityAttributeValueType
  //                         )
  //                       }
  //                     >
  //                       {Object.values(EntityAttributeValueType).map((e) => {
  //                         return (
  //                           <Option key={e} value={e}>
  //                             {e}
  //                           </Option>
  //                         );
  //                       })}
  //                     </Select>
  //                   </Box>
  //                   {attr.type === "lookup" && (
  //                     <Input
  //                       required
  //                       autoComplete="off"
  //                       name="lookupSourceEntityId"
  //                       placeholder="Enter source id"
  //                     />
  //                   )}
  //                 </Box>
  //               </td>
  //               <td>
  //                 <Checkbox
  //                   name={fieldName("isRequired")}
  //                   disabled={attr.isInherited}
  //                   defaultChecked={attr.isRequired}
  //                 ></Checkbox>
  //               </td>
  //             </tr>
  //           );
  //         })}
  //       </tbody>
  //     </Table>
  //     <Box display={"flex"}>
  //       <Box flex={1}></Box>
  //       <Button
  //         onClick={() => {
  //           addAttr();
  //         }}
  //         variant="plain"
  //       >
  //         Add column
  //       </Button>
  //     </Box>
  //   </>
  // );
};
