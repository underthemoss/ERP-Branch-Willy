"use client";

import {
  useListAvailableRelationsQuery,
  useListResourceTypesQuery,
  useWriteRelationshipMutation,
} from "@/graphql/hooks";
import { AddOutlined, HelpOutlineOutlined } from "@mui/icons-material";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Modal,
  ModalClose,
  ModalDialog,
  Stack,
  Tooltip,
  Typography,
} from "@mui/joy";
import { useCallback, useEffect, useState } from "react";

interface CreateRelationshipDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  resourceType: string;
  resourceId: string;
  relation: string;
  subjectType: string;
  subjectId: string;
  subjectRelation?: string;
}

const initialFormData: FormData = {
  resourceType: "",
  resourceId: "",
  relation: "",
  subjectType: "",
  subjectId: "",
  subjectRelation: "",
};

export function CreateRelationshipDialog({
  open,
  onClose,
  onSuccess,
}: CreateRelationshipDialogProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch resource types
  const { data: resourceTypesData } = useListResourceTypesQuery({
    fetchPolicy: "cache-and-network",
  });

  // Fetch available relations based on selected resource type
  const { data: availableRelationsData } = useListAvailableRelationsQuery({
    variables: {
      resourceType: formData.resourceType || undefined,
    },
    skip: !formData.resourceType,
    fetchPolicy: "cache-and-network",
  });

  const [writeRelationship] = useWriteRelationshipMutation({
    onCompleted: (data) => {
      if (data.admin?.writeRelationship?.success) {
        onSuccess?.();
        handleClose();
      }
    },
    onError: (error) => {
      console.error("Error creating relationship:", error);
    },
  });

  const resourceTypes = resourceTypesData?.admin?.listResourceTypes || [];
  const availableRelations = availableRelationsData?.admin?.listAvailableRelations || [];

  // Get allowed subject types for the selected relation
  const selectedRelation = availableRelations.find((r) => r.relation === formData.relation);
  const allowedSubjectTypes = selectedRelation?.allowedSubjectTypes || [];

  const handleClose = useCallback(() => {
    setFormData(initialFormData);
    setErrors({});
    setIsSubmitting(false);
    onClose();
  }, [onClose]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.resourceType.trim()) {
      newErrors.resourceType = "Resource type is required";
    }
    if (!formData.resourceId.trim()) {
      newErrors.resourceId = "Resource ID is required";
    }
    if (!formData.relation.trim()) {
      newErrors.relation = "Relation is required";
    }
    if (!formData.subjectType.trim()) {
      newErrors.subjectType = "Subject type is required";
    }
    if (!formData.subjectId.trim()) {
      newErrors.subjectId = "Subject ID is required";
    }

    // Validate that subject type is allowed for the selected relation
    if (
      formData.relation &&
      formData.subjectType &&
      allowedSubjectTypes.length > 0 &&
      !allowedSubjectTypes.includes(formData.subjectType)
    ) {
      newErrors.subjectType = `Subject type must be one of: ${allowedSubjectTypes.join(", ")}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await writeRelationship({
        variables: {
          resourceType: formData.resourceType,
          resourceId: formData.resourceId,
          relation: formData.relation,
          subjectType: formData.subjectType,
          subjectId: formData.subjectId,
          subjectRelation: formData.subjectRelation || undefined,
        },
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Reset relation and subject type when resource type changes
  useEffect(() => {
    if (formData.resourceType) {
      setFormData((prev) => ({
        ...prev,
        relation: "",
        subjectType: "",
        subjectRelation: "",
      }));
    }
  }, [formData.resourceType]);

  // Reset subject type when relation changes
  useEffect(() => {
    if (formData.relation) {
      setFormData((prev) => ({
        ...prev,
        subjectType: "",
        subjectRelation: "",
      }));
    }
  }, [formData.relation]);

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog sx={{ width: 600, maxWidth: "90vw" }}>
        <ModalClose />
        <Typography level="h4" sx={{ mb: 2 }}>
          Create Relationship
        </Typography>

        <Alert
          sx={{ mb: 3 }}
          color="primary"
          variant="soft"
          startDecorator={<HelpOutlineOutlined />}
        >
          <Box>
            <Typography level="title-sm">SpiceDB Relationship</Typography>
            <Typography level="body-xs">
              Create a new authorization relationship between a resource and a subject. This will
              grant the specified permission to the subject on the resource.
            </Typography>
          </Box>
        </Alert>

        <Stack spacing={3}>
          {/* Resource Section */}
          <Box>
            <Typography level="title-sm" sx={{ mb: 2, color: "primary.500" }}>
              Resource
            </Typography>
            <Stack spacing={2}>
              <FormControl error={!!errors.resourceType}>
                <FormLabel>Resource Type</FormLabel>
                <Autocomplete
                  placeholder="Select resource type (e.g., erp/workspace)"
                  options={resourceTypes}
                  value={formData.resourceType}
                  onChange={(_, value) => updateFormData("resourceType", value || "")}
                  freeSolo
                />
                {errors.resourceType && <FormHelperText>{errors.resourceType}</FormHelperText>}
              </FormControl>

              <FormControl error={!!errors.resourceId}>
                <FormLabel>Resource ID</FormLabel>
                <Input
                  placeholder="Enter resource ID (e.g., workspace-123)"
                  value={formData.resourceId}
                  onChange={(e) => updateFormData("resourceId", e.target.value)}
                />
                {errors.resourceId && <FormHelperText>{errors.resourceId}</FormHelperText>}
              </FormControl>
            </Stack>
          </Box>

          <Divider />

          {/* Relation Section */}
          <Box>
            <Typography level="title-sm" sx={{ mb: 2, color: "primary.500" }}>
              Relation
            </Typography>
            <FormControl error={!!errors.relation}>
              <FormLabel>
                Relation
                <Tooltip title="The permission or role being granted">
                  <HelpOutlineOutlined sx={{ fontSize: 16, ml: 0.5 }} />
                </Tooltip>
              </FormLabel>
              <Autocomplete
                placeholder="Select relation (e.g., member, admin)"
                options={availableRelations.map((r) => r.relation)}
                value={formData.relation}
                onChange={(_, value) => updateFormData("relation", value || "")}
                disabled={!formData.resourceType}
                renderOption={(props, option) => {
                  const relation = availableRelations.find((r) => r.relation === option);
                  return (
                    <li {...props}>
                      <Box>
                        <Typography level="body-sm" sx={{ fontWeight: 500 }}>
                          {option}
                        </Typography>
                        {relation?.description && (
                          <Typography level="body-xs" sx={{ color: "text.secondary" }}>
                            {relation.description}
                          </Typography>
                        )}
                      </Box>
                    </li>
                  );
                }}
              />
              {errors.relation && <FormHelperText>{errors.relation}</FormHelperText>}
              {!formData.resourceType && (
                <FormHelperText>Select a resource type first</FormHelperText>
              )}
            </FormControl>
          </Box>

          <Divider />

          {/* Subject Section */}
          <Box>
            <Typography level="title-sm" sx={{ mb: 2, color: "primary.500" }}>
              Subject
            </Typography>
            <Stack spacing={2}>
              <FormControl error={!!errors.subjectType}>
                <FormLabel>Subject Type</FormLabel>
                <Autocomplete
                  placeholder="Select subject type (e.g., erp/user)"
                  options={allowedSubjectTypes}
                  value={formData.subjectType}
                  onChange={(_, value) => updateFormData("subjectType", value || "")}
                  disabled={!formData.relation}
                  freeSolo
                />
                {errors.subjectType && <FormHelperText>{errors.subjectType}</FormHelperText>}
                {!formData.relation && <FormHelperText>Select a relation first</FormHelperText>}
                {allowedSubjectTypes.length > 0 && (
                  <FormHelperText>Allowed types: {allowedSubjectTypes.join(", ")}</FormHelperText>
                )}
              </FormControl>

              <FormControl error={!!errors.subjectId}>
                <FormLabel>Subject ID</FormLabel>
                <Input
                  placeholder="Enter subject ID (e.g., user-456)"
                  value={formData.subjectId}
                  onChange={(e) => updateFormData("subjectId", e.target.value)}
                />
                {errors.subjectId && <FormHelperText>{errors.subjectId}</FormHelperText>}
              </FormControl>

              <FormControl>
                <FormLabel>
                  Subject Relation (Optional)
                  <Tooltip title="For indirect relationships through groups or sets">
                    <HelpOutlineOutlined sx={{ fontSize: 16, ml: 0.5 }} />
                  </Tooltip>
                </FormLabel>
                <Input
                  placeholder="Enter subject relation (e.g., member)"
                  value={formData.subjectRelation}
                  onChange={(e) => updateFormData("subjectRelation", e.target.value)}
                />
                <FormHelperText>
                  Use this for set-based relationships (e.g., all members of a group)
                </FormHelperText>
              </FormControl>
            </Stack>
          </Box>

          {/* Preview */}
          {formData.resourceType &&
            formData.resourceId &&
            formData.relation &&
            formData.subjectType &&
            formData.subjectId && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: "background.level1",
                  borderRadius: "sm",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography level="body-sm" sx={{ mb: 1, fontWeight: 500 }}>
                  Relationship Preview:
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    wordBreak: "break-all",
                  }}
                >
                  {formData.resourceType}:{formData.resourceId}#{formData.relation}@
                  {formData.subjectType}:{formData.subjectId}
                  {formData.subjectRelation && `#${formData.subjectRelation}`}
                </Typography>
              </Box>
            )}

          {/* Actions */}
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", pt: 2 }}>
            <Button variant="outlined" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="solid"
              startDecorator={<AddOutlined />}
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={
                !formData.resourceType ||
                !formData.resourceId ||
                !formData.relation ||
                !formData.subjectType ||
                !formData.subjectId
              }
            >
              Create Relationship
            </Button>
          </Box>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}
