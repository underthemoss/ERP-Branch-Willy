import { GlobalColumnData } from "@/config/ColumnConfig";

import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getContentTypes } from "@/services/ContentTypeRepository";

import { NextLinkBack } from "@/ui/NextLink";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Typography,
} from "@mui/joy";
import { randomUUID } from "crypto";

import _ from "lodash";
import { redirect } from "next/navigation";
import { ulid } from "ulid";

export const NewEntityForm = async (props: {
  content_type_id: string;
  parent_id?: string | undefined;
}) => {
  const { content_type_id, parent_id } = props;
  const parentId = parent_id === "null" ? undefined : parent_id;
  const { user } = await getUser();

  const contentTypes = await getContentTypes();
  const contentType = contentTypes.find((ct) => ct.id === content_type_id);
  // console.log(contentType);
  return (
    <Box m={2}>
      <form
        action={async (formData) => {
          "use server";
          const { user } = await getUser();
          const attributes = Object.fromEntries(formData.entries());
          // console.log(attributes);
          // const val = await createContentTypeInstance({
          //   attributes,
          //   contentTypeId: content_type_id,
          //   parentId: parentId,
          // });

          const result = await prisma.entity.create({
            data: {
              id: ulid(),
              tenant_id: user.company_id,
              parent_id: parentId,
              data: { ...(attributes as any) },
              type_id: contentType!.id,
            },
          });

          redirect(`/app/item/${result.parent_id || result.id}`);
        }}
      >
        <Box mb={2}>
          <Typography level="h1">New {contentType?.label}</Typography>
        </Box>
        <Box mb={2}>
          <Typography level="body-md">{contentType?.label}</Typography>
        </Box>
        <Box>
          <Box gap={1} display={"flex"} flexDirection={"column"}>
            {contentType?.allAttributes
              // .filter(({ column }) => !column.readonly)
              .map(({ key, label, type }, i) => {
                return (
                  <FormControl key={key}>
                    <FormLabel required={true}>{label}</FormLabel>
                    <Input
                      required={true}
                      autoComplete="off"
                      type={"text"}
                      name={key}
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
