import { GlobalColumnData } from "@/config/ColumnConfig";
import { ContentTypeData } from "@/config/ContentTypesConfig";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createContentTypeInstance,
  getContentType,
} from "@/services/ContentService";

import { NextLinkBack } from "@/ui/NextLink";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Typography,
} from "@mui/joy";

import _ from "lodash";
import { redirect } from "next/navigation";

export const NewEntityForm = async (props: {
  content_type_id: string;
  parent_id?: string | undefined;
}) => {
  const { content_type_id, parent_id } = props;
  const parentId = parent_id === "null" ? undefined : parent_id;
  const { user } = await getUser();

  const entityType = await getContentType({
    contentTypeId: content_type_id,
    tenantId: user.company_id,
  });

  return (
    <Box m={2}>
      <form
        action={async (formData) => {
          "use server";
          const { user } = await getUser();
          const attributes = Object.fromEntries(formData.entries());
          const val = await createContentTypeInstance({
            attributes,
            contentTypeId: content_type_id,
            parentId: parentId,
          });

          redirect(`/app/item/${val.parent_id || val.id}`);
        }}
      >
        <Box mb={2}>
          <Typography level="h1">New {entityType.name}</Typography>
        </Box>
        <Box mb={2}>
          <Typography level="body-md">{entityType.name}</Typography>
        </Box>
        <Box>
          <Box gap={1} display={"flex"} flexDirection={"column"}>
            {entityType.entity_type_columns
              .filter(({ column }) => !column.readonly)
              .map(({ required, column }, i) => {
                return (
                  <FormControl key={column.id}>
                    <FormLabel required={required === true}>
                      {column.label}
                    </FormLabel>
                    <Input
                      required={required === true}
                      autoComplete="off"
                      type={column.type}
                      name={column.id}
                      defaultValue={""}
                      autoFocus={i === 0}
                    />
                  </FormControl>
                );
              })}
          </Box>
          <Box mt={2} display={"flex"} gap={1}>
            <Box flex={1}></Box>
            <NextLinkBack>
              <Button variant="outlined">Cancel</Button>
            </NextLinkBack>
            <Button type="submit">Submit</Button>
          </Box>
        </Box>
      </form>
    </Box>
  );
};
