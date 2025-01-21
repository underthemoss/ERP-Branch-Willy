import { Attributes } from "@/app/app/settings/content-types/[contentTypeId]/create-subtype/Attributes";
import {
  Box,
  Button,
  Checkbox,
  Input,
  Option,
  Select,
  Table,
  Typography,
} from "@mui/joy";
import { EntityAttributeValueType } from "../../../../../../../prisma/generated/mongo";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { useAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Page(props: {
  params: Promise<{ item_id: string; content_type_id: string }>;
}) {
  const { item_id, content_type_id } = await props.params;
  return (
    <form
      action={async (formData) => {
        "use server";
        const data = Object.fromEntries(formData.entries());
        const { user } = await useAuth();
        const col = await prisma.entityTypeColumn.create({
          data: {
            id: randomUUID(),
            isRequired: data.required === "on",
            label: data.name.toString(),
            tenantId: user.company_id,
            type: data.type.toString() as EntityAttributeValueType,
          },
        });
        await prisma.entityType.update({
          where: { id: content_type_id },
          data: {
            columnIds: {
              push: [col.id],
            },
          },
        });
        redirect(`/app/item/${item_id}`);
      }}
    >
      <Box>
        <Box>
          <Typography level="h1">Add column</Typography>
        </Box>
        <Box mt={2}>
          <Table variant="plain" sx={{ width: 700 }}>
            <tbody>
              <tr>
                <th style={{ width: 200 }}>Name</th>
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
                    defaultValue={Object.values(EntityAttributeValueType)[0]}
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
              </tr>
              <tr>
                <th>Required</th>
                <td>
                  <Checkbox name={"required"} defaultChecked={false}></Checkbox>
                </td>
              </tr>
            </tbody>
          </Table>
        </Box>
        <Box display={"flex"} gap={1}>
          <Box flex={1}></Box>
          <Button variant="outlined">Cancel</Button>
          <Button type="submit">Submit</Button>
        </Box>
      </Box>
    </form>
  );
}
