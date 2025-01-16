"use client";
import { Box, Button, Input, Option, Select, Table } from "@mui/joy";
import { useState } from "react";
import { EntityAttributeValueType } from "../../../../../../prisma/generated/mongo";

export const Attributes = () => {
  const [attrs, setAttrs] = useState<{}[]>([{}]);

  const addAttr = () => {
    setAttrs((attrs) => [
      ...attrs,
      { id: undefined, name: "", type: "string" },
    ]);
  };
  return (
    <>
      <Table>
        <thead>
          <tr>
            <th style={{ width: 50 }}>#</th>
            <th>Name</th>
            <th>Type</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {attrs.map((attr, i) => {
            return (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>
                  <Input
                    name={`attribute_name_${i}`}
                    placeholder="Attribute name"
                  />
                </td>
                <td>
                  <Select name={`attribute_type_${i}`}>
                    {Object.values(EntityAttributeValueType).map((e) => {
                      return (
                        <Option key={e} value={e}>
                          {e}
                        </Option>
                      );
                    })}
                  </Select>
                </td>
                <td></td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <Box display={"flex"}>
        <Box flex={1}></Box>
        <Button
          onClick={() => {
            addAttr();
          }}
          variant="plain"
        >
          Add row
        </Button>
      </Box>
    </>
  );
};
