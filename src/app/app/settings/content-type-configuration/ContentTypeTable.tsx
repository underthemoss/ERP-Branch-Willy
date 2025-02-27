"use client";
import { NextLink } from "@/ui/NextLink";
import { Box, Chip, Table, Tooltip, Typography } from "@mui/joy";
import { ContentTypeIcon } from "@/ui/Icons";
import { InheritanceLayer } from "./InheritanceLayer";
import { useContentTypes } from "@/lib/content-types/useContentTypes";
import CopyButton from "@/ui/CopyButton";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  ContentTypesConfig,
  ContentTypesConfigDenormalised,
} from "@/db/ContentTypeViewModel";
import {
  ContentTypeKeys,
  ContentTypeViewModel,
  ContentTypeViewModelKeyed,
} from "@/db/ContentTypes.generated";
export const ContentTypeTable = () => {
  const { config, rawConfig } = useContentTypes();
  return (
    <Box>
      <Box display={"flex"}>
        <Typography level="h1" fontWeight={500}>
          Content Types
        </Typography>

        <Box flex={1}></Box>
      </Box>
      <InheritanceLayer />
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
            </tr>
          </thead>
          <tbody>
            {ContentTypeViewModel.map((ct) => {
              const marginLeft = 3;
              return (
                <tr key={ct.type}>
                  <td>
                    <Box pl={ct.depth * marginLeft}>
                      <NextLink
                        href={`/app/settings/content-type-configuration/${ct.type}`}
                      >
                        <ContentTypeIcon
                          icon={ct.icon}
                          color={ct.color}
                          data-content-type-id={ct.type}
                        />

                        <Box ml={1}>
                          {ct.label}

                          {ct.abstract && (
                            <Tooltip title="Abstract content type">
                              <VisibilityOffIcon />
                            </Tooltip>
                          )}
                        </Box>
                      </NextLink>
                    </Box>
                  </td>
                  <td>
                    <Box display={"flex"} gap={2}>
                      {ct.allowed_children
                        .map(
                          (t) =>
                            ContentTypeViewModelKeyed[
                              t as keyof typeof ContentTypeViewModelKeyed
                            ]
                        )
                        .map((ct) => (
                          <NextLink
                            key={ct.type}
                            href={`/app/settings/content-types/${ct.type}`}
                          >
                            <ContentTypeIcon icon={ct.icon} color={ct.color} />
                            <Box ml={1}>{ct.label}</Box>
                          </NextLink>
                        ))}
                    </Box>
                  </td>{" "}
                  <td>
                    {Object.entries(ct.fields).map(([id, field]) => {
                      // const contentType = field.
                      // field.
                      const { type, icon, color } =
                        ContentTypeViewModelKeyed[
                          field.source as ContentTypeKeys
                        ];
                      return (
                        <Chip
                          key={id}
                          startDecorator={
                            <ContentTypeIcon
                              icon={icon}
                              color={color}
                              data-content-type-id={type}
                            />
                          }
                        >
                          {field.label}
                        </Chip>
                      );
                    })}
                  </td>
                  {/* 
             
                  <td>
                    {ct.computed.inheritedFields.map((field) => (
                      <Chip key={field.id}>{field.label}</Chip>
                    ))}
                  </td> */}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Box>

      {/* <Test config={contentTypes} /> */}
      {/* <pre>{JSON.stringify(ContentTypesConfigDenormalised, undefined, 2)}</pre> */}

      {/* <InheritanceLayer contentTypes={config} /> */}

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
            {config
              .filter(() => false)
              .map((ct) => {
                const marginLeft = 3;
                return (
                  <tr key={ct.id}>
                    <td>
                      <Box pl={ct.computed.depth * marginLeft}>
                        <NextLink
                          href={`/app/settings/content-type-configuration/${ct.id}`}
                        >
                          <ContentTypeIcon
                            icon={ct.icon}
                            color={ct.color}
                            data-content-type-id={ct.id}
                          />

                          <Box ml={1}>
                            {ct.label}{" "}
                            {ct.abstract && (
                              <Tooltip title="Abstract content type">
                                <VisibilityOffIcon />
                              </Tooltip>
                            )}
                          </Box>
                        </NextLink>
                      </Box>
                    </td>
                    <td>
                      <Box display={"flex"} gap={2}>
                        {ct.computed.creatableChildTypes.map((ct) => (
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
                      {ct.fields.map((field) => (
                        <Chip key={field.id}>{field.label}</Chip>
                      ))}
                    </td>
                    <td>
                      {ct.computed.inheritedFields.map((field) => (
                        <Chip key={field.id}>{field.label}</Chip>
                      ))}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
      </Box>
      <Box mt={4}>
        <NextLink href="/app/settings/content-type-configuration/create-new-content-type">
          Create New Content Type
        </NextLink>
      </Box>
      <Box mt={4}>
        <CopyButton
          variant="outlined"
          copyValue={JSON.stringify(rawConfig, undefined, 2)}
        >
          Copy config
        </CopyButton>
      </Box>
    </Box>
  );
};
