"use client";

import React, { useState } from "react";

import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Option,
  Typography,
  Stack,
  IconButton,
  Table,
  Chip,
  ChipDelete,
} from "@mui/joy";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import { NextLink } from "@/ui/NextLink";
import LockIcon from "@mui/icons-material/Lock";
import { useRouter } from "next/navigation";
import EditIcon from "@mui/icons-material/Edit";
import AttributeEditor from "./AttributeEditor";
import IconSelector from "./IconSelect";

import { ContentTypeComponent, ContentTypeIcon } from "@/ui/Icons";

import { ulid } from "ulid";
import { ContentTypeAttributeDataTypeOptions } from "./AttributeDataTypeSelect";
import { useContentTypes } from "@/lib/content-types/useContentTypes";

const CreateContentTypeForm: React.FC<{
  id?: string;
}> = ({ id }) => {
  const { config, saveConfig, rawConfig } = useContentTypes();
  const defaultState = config.find((ct) => ct.id === id);

  const [attributes, setAttributes] = useState(defaultState?.fields || []);
  const [label, setLabel] = useState(defaultState?.label || "");
  const [icon, setIcon] = useState(defaultState?.icon || "");
  const [parentId, setParentId] = useState(defaultState?.parent_id || null);
  const [color, setColor] = useState(defaultState?.color || null);

  const [allowedChildContentTypes, setAllowedChildContentTypes] = useState<
    string[]
  >(defaultState?.allowed_child_content_types || []);

  const [editingAssetKey, setEditingAssetKey] = useState<
    (typeof attributes)[number]["id"] | null
  >(null);
  const { push } = useRouter();

  const allAttributes = [
    ...(config.find((c) => c.id === parentId)?.computed.allFields || []).map(
      (ct) => ({
        ...ct,
        inherited: true,
      })
    ),
    ...attributes.map((ct) => ({ ...ct, inherited: false, contentType: null })),
  ];

  const onSubmit = async () => {
    const newContentType = {
      fields: attributes,
      id: id || ulid(),
      label: label,
      parent_id: parentId || "",
      color: color || "",
      icon: icon,
      abstract: false,
      allowed_child_content_types: allowedChildContentTypes,
    };

    await saveConfig({
      ...rawConfig,
      types: id
        ? rawConfig.types.map((ct) => (ct.id === id ? newContentType : ct))
        : [...rawConfig.types, newContentType],
    });
    push("/app/settings/content-type-configuration");
  };

  return (
    <Box
      sx={{
        minWidth: 600,
        mx: "auto",
        mt: 4,
        p: 2,
      }}
    >
      <Typography level="h4" component="h1" mb={2}>
        Create New Content Type
      </Typography>

      <Stack spacing={2}>
        <Box display={"flex"} gap={2}>
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControl>
              <FormLabel>Label</FormLabel>
              <Input
                value={label}
                autoComplete="off"
                onChange={(e) => setLabel(e.target.value)}
                required
                name="label"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Icon </FormLabel>
              <Box display="flex" gap={1}>
                <Box>
                  <IconSelector
                    value={{ icon, color }}
                    onChange={({ icon, color }) => {
                      setIcon(icon || "");
                      setColor(color || "");
                    }}
                  />
                </Box>
              </Box>
            </FormControl>

            <FormControl>
              <FormLabel>Base type</FormLabel>
              <Select
                value={parentId}
                onChange={(e, value) => setParentId(value)}
                renderValue={(option) => {
                  const ct = config.find((ct) => ct.id === option?.value);
                  if (!ct) return null;
                  return (
                    <ContentTypeComponent
                      color={ct.color}
                      icon={ct.icon}
                      label={ct.label}
                    />
                  );
                }}
              >
                {config.map((ct) => {
                  return (
                    <Option
                      key={ct.id}
                      value={ct.id}
                      disabled={
                        id
                          ? ct.computed.ancestors.some((ct) => ct.id === id)
                          : false
                      }
                    >
                      <ContentTypeComponent
                        ml={ct.computed.depth * 3}
                        color={ct.color}
                        icon={ct.icon}
                        label={ct.label}
                      />
                    </Option>
                  );
                })}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Can contain</FormLabel>
              <Select
                multiple
                value={allowedChildContentTypes}
                onChange={(e, value) => setAllowedChildContentTypes(value)}
                renderValue={(options) => {
                  return (
                    <Box maxWidth={500} display={"flex"} gap={1}>
                      {options.map((o: any) => {
                        const ct = config.find((c) => c.id === o.value);
                        if (!ct) return null;
                        return (
                          <Chip
                            key={o.value}
                            endDecorator={
                              <ChipDelete
                                onDelete={() =>
                                  setAllowedChildContentTypes(
                                    allowedChildContentTypes.filter(
                                      (t) => t !== ct?.id
                                    )
                                  )
                                }
                              />
                            }
                          >
                            <ContentTypeComponent
                              color={ct.color}
                              icon={ct.icon}
                              label={ct.label}
                            />
                          </Chip>
                        );
                      })}
                    </Box>
                  );
                  // const ct = contentTypes.find((ct) => ct.id === option?.value);
                  // if (!ct) return null;
                  // return (
                  //   <Box
                  //     display={"flex"}
                  //     alignContent={"center"}
                  //     alignItems={"center"}
                  //   >
                  //     <Box mr={1}>
                  //       <ContentTypeIcon color={ct.color} icon={ct.icon} />
                  //     </Box>
                  //     <Box>{ct.label}</Box>
                  //   </Box>
                  // );
                }}
              >
                {config.map((ct) => {
                  return (
                    <Option key={ct.id} value={ct.id}>
                      <ContentTypeComponent
                        ml={ct.computed.depth * 3}
                        color={ct.color}
                        label={ct.label}
                        icon={ct.icon}
                      />
                    </Option>
                  );
                })}
              </Select>
            </FormControl>
          </Box>
        </Box>
        <Typography level="title-md">Attributes</Typography>
        <Table width={700}>
          <thead>
            <tr>
              <th>Label</th>
              <th>Value type</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {allAttributes.map((attr, index) => {
              const isDisabled = attr.inherited;
              const isinherited = attr.inherited;
              return (
                <tr key={attr.id}>
                  <td>{attr.label}</td>
                  <td>
                    <Box
                      display={"flex"}
                      alignItems={"center"}
                      alignContent={"center"}
                      gap={1}
                    >
                      <Box fontSize={20}>
                        {
                          ContentTypeAttributeDataTypeOptions.find(
                            (d) => d.value === attr.type
                          )?.icon
                        }
                      </Box>
                      <Box>
                        {
                          ContentTypeAttributeDataTypeOptions.find(
                            (d) => d.value === attr.type
                          )?.label
                        }
                      </Box>
                    </Box>
                  </td>
                  <td>
                    {!isinherited ? (
                      <Box display={"flex"} gap={1}>
                        <Box flex={1} />
                        <IconButton
                          variant="outlined"
                          color="primary"
                          onClick={() => setEditingAssetKey(attr.id)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          variant="outlined"
                          color="danger"
                          onClick={() =>
                            setAttributes([
                              ...attributes.filter(({ id }) => id !== attr.id),
                            ])
                          }
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ) : (
                      <Box display={"flex"} gap={1}>
                        <Box flex={1} />

                        <Box fontSize={20} pt={1}>
                          {" "}
                          {isinherited && <LockIcon />}
                        </Box>
                        <NextLink
                          href={`/app//settings/content-types/${attr.contentType?.id}`}
                        >
                          <Box display={"flex"} gap={1}>
                            <ContentTypeIcon
                              color={attr.contentType?.color || ""}
                              icon={attr.contentType?.icon || ""}
                            />
                            {attr.contentType?.label}
                          </Box>
                        </NextLink>
                      </Box>
                    )}
                  </td>
                </tr>
              );
            })}
            <tr>
              <td>
                <Box mt={2}>
                  <Button
                    variant="outlined"
                    startDecorator={<AddIcon />}
                    onClick={
                      () => setEditingAssetKey(ulid())
                      // setAttributes([
                      //   ...attributes,
                      //   {
                      //     key: uniqueId("temp"),
                      //     label: "",
                      //     type: "single_line_of_text",
                      //   },
                      // ])
                    }
                  >
                    Add Attribute
                  </Button>
                </Box>
              </td>
              <td></td>
            </tr>
          </tbody>
        </Table>
        <Box display={"flex"}>
          <Box flex={1}></Box>
          <Button type="submit" variant="solid" onClick={() => onSubmit()}>
            Save Content Type
          </Button>
        </Box>
      </Stack>
      <AttributeEditor
        defaultValue={
          attributes.find((attr) => attr.id === editingAssetKey) || {
            id: ulid(),
            label: "",
            type: "text",
          }
        }
        open={!!editingAssetKey}
        setOpen={(val) => {
          if (!val) setEditingAssetKey(null);
        }}
        onChange={(attr) => {
          if (attributes.find((a) => a.id === attr.id)) {
            setAttributes(attributes.map((a) => (attr.id === a.id ? attr : a)));
          } else {
            setAttributes([...attributes, attr]);
          }
        }}
      />
    </Box>
  );
};

export default CreateContentTypeForm;
