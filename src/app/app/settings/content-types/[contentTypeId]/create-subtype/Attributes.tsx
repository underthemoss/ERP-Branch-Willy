"use client";
import { Box, Button, Checkbox, Input, Option, Select, Table } from "@mui/joy";
import { useState } from "react";
import { EntityAttributeValueType } from "../../../../../../../prisma/generated/mongo";

type AttributeType = {
  key: string;
  label: string;
  type: EntityAttributeValueType;
  entityTypeId: string;
  entityTypeName: string;
  isRequired: boolean;
};

export const Attributes = (props: { inheritedAttributes: AttributeType[] }) => {
  const [attrs, setAttrs] = useState<
    Partial<AttributeType & { isInherited?: boolean }>[]
  >([...props.inheritedAttributes.map((a) => ({ ...a, isInherited: true }))]);

  const addAttr = () => {
    setAttrs((attrs) => [
      ...attrs,
      { id: "", name: "", type: "string" satisfies EntityAttributeValueType },
    ]);
  };
  return (
    <>
      <Table variant="soft">
        <thead>
          <tr>
            <th style={{ width: 50 }}>#</th>
            <th>Name</th>
            <th>Type</th>
            <th>Required</th>
          </tr>
        </thead>
        <tbody>
          {attrs.map((attr, i, arr) => {
            const index =
              arr.slice(0, i + 1).filter((i) => !i.isInherited).length - 1;

            const fieldName = (name: string) =>
              attr.isInherited ? "" : `attributes[${index}].${name}`;
            return (
              <tr key={`${i}_${attr.key}`}>
                <td>{i + 1}</td>
                <td>
                  <Input
                    required
                    autoComplete="off"
                    name={fieldName("name")}
                    placeholder="Attribute name"
                    defaultValue={attr.label}
                    disabled={attr.isInherited}
                  />
                </td>
                <td>
                  <Select
                    required
                    disabled={attr.isInherited}
                    name={fieldName("type")}
                    defaultValue={attr.type}
                  >
                    {Object.values(EntityAttributeValueType).map((e) => {
                      return (
                        <Option key={e} value={e}>
                          {e}
                        </Option>
                      );
                    })}
                  </Select>
                </td>
                <td>
                  <Checkbox
                    name={fieldName("isRequired")}
                    disabled={attr.isInherited}
                    defaultChecked={attr.isRequired}
                  ></Checkbox>
                </td>
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
