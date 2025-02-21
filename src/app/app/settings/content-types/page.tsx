import { getUser } from "@/lib/auth";
import { NextLink } from "@/ui/NextLink";
import { prisma } from "@/lib/prisma";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Table,
  Tooltip,
  Typography,
} from "@mui/joy";
import Link from "next/link";
import KeyboardDoubleArrowUpIcon from "@mui/icons-material/KeyboardDoubleArrowUp";
import { EntityTypeIcon } from "@/ui/EntityTypeIcons";
import {
  ContentType,
  ContentTypeAttribute,
} from "../../../../../prisma/generated/mongo";
import { Fragment } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { getContentTypes } from "@/services/ContentTypeRepository";
import { ContentTypeComponent, ContentTypeIcon } from "@/ui/Icons";
import { InheritanceLayer } from "./InheritanceLayer";

export default async function Page(props: {
  params: Promise<{ item_id: string }>;
}) {
  const contentTypes = (await getContentTypes());

  return (
    <Box>
      <Box display={"flex"}>
        <Typography level="h1" fontWeight={500}>
          Content Types
        </Typography>

        <Box flex={1}></Box>
      </Box>

      <InheritanceLayer contentTypes={contentTypes} />

      <Box mt={3}>
        <Box mb={2}>
          <Typography level="h4" fontWeight={500}>
            Content Types
          </Typography>
        </Box>
        <Table>
          <thead>
            <tr>
              <th style={{ width: 250 }}>Type</th>
              <th>Allowed content</th>

              <th>Attributes</th>
              <th>Inherited Attributes</th>
            </tr>
          </thead>
          <tbody>
            {contentTypes.map((ct) => {
              const marginLeft = 3;
              return (
                <tr key={ct.id}>
                  <td>
                    <Box pl={ct.inheritageLineage.length * marginLeft}>
                      <NextLink href={`/app/settings/content-types/${ct.id}`}>
                        <ContentTypeIcon
                          icon={ct.icon}
                          color={ct.color}
                          data-content-type-id={ct.id}
                        />

                        <Box ml={1}>{ct.label}</Box>
                      </NextLink>
                    </Box>
                  </td>
                  <td>
                    <Box display={"flex"} gap={2}>
                      {ct.validChildContentTypes.map((ct) => (
                        <NextLink
                          key={ct.id}
                          href={`/app/settings/content-types/${ct.id}`}
                        >
                          <ContentTypeIcon icon={ct.icon} color={ct.color} />
                          <Box ml={1}>{ct.label}</Box>
                        </NextLink>
                      ))}
                    </Box>
                  </td>
                  <td>
                    {ct.attributes.map((attr) => (
                      <Chip key={attr.key}>{attr.label}</Chip>
                    ))}
                  </td>
                  <td>
                    {ct.inheritedAttributes.map((attr) => (
                      <Chip key={attr.key}>{attr.label}</Chip>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Box>
      <Box mt={4}>
        <NextLink href="/app/settings/content-types/create-new-content-type">
          Create New Content Type
        </NextLink>
      </Box>
    </Box>
  );
}
