"use client";
import { Input, Option, Select, Table } from "@mui/joy";
import { ColumnType } from "../../../../../../prisma/generated/mongo";
import { useState } from "react";

export const ColumnForm = () => {
  const [type, setType] = useState<ColumnType | null>("single_line_of_text");

  return (
    <Table variant="plain" sx={{ width: 700 }}>
      <tbody>
        <tr>
          <th style={{ width: 200 }}>Label</th>
          <td>
            <Input autoComplete="off" name="name" required />
          </td>
        </tr>
        <tr>
          <th>Type</th>
          <td>
            <Select
              required
              name={"type"}
              value={type}
              onChange={(e, value) => setType(value)}
            >
              {Object.values(ColumnType).map((e) => {
                return (
                  <Option key={e} value={e}>
                    {e}
                  </Option>
                );
              })}
            </Select>
          </td>
        </tr>
        {type === "lookup" && (
          <tr>
            <th>Lookup</th>
            <td>
              <Input
                type="text"
                placeholder="TODO: add parent id here"
                name="lookup"
              />
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
};
