"use client";

import {
  useListAvailableRelationsQuery,
  useListResourceTypesQuery,
  useWriteRelationshipMutation,
} from "@/graphql/hooks";
import {
  AddOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  ErrorOutlined,
  HelpOutlineOutlined,
  WarningOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  Input,
  Modal,
  ModalClose,
  ModalDialog,
  Stack,
  Tab,
  Table,
  TabList,
  TabPanel,
  Tabs,
  Textarea,
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

interface ParsedTuple extends FormData {
  originalText: string;
  isValid: boolean;
  error?: string;
}

interface SubmissionResult {
  tuple: ParsedTuple;
  success: boolean;
  error?: string;
}

const initialFormData: FormData = {
  resourceType: "",
  resourceId: "",
  relation: "",
  subjectType: "",
  subjectId: "",
  subjectRelation: "",
};

// Tuple parser function
function parseTuple(tupleString: string): ParsedTuple {
  const trimmed = tupleString.trim();

  if (!trimmed) {
    return {
      originalText: tupleString,
      resourceType: "",
      resourceId: "",
      relation: "",
      subjectType: "",
      subjectId: "",
      subjectRelation: "",
      isValid: false,
      error: "Empty tuple",
    };
  }

  // Regex to parse the tuple format: resourceType:resourceId#relation@subjectType:subjectId[#subjectRelation]
  const tupleRegex = /^([^:]+):([^#]+)#([^@]+)@([^:]+):([^#]+)(?:#(.+))?$/;
  const match = trimmed.match(tupleRegex);

  if (!match) {
    return {
      originalText: tupleString,
      resourceType: "",
      resourceId: "",
      relation: "",
      subjectType: "",
      subjectId: "",
      subjectRelation: "",
      isValid: false,
      error:
        "Invalid tuple format. Expected: resourceType:resourceId#relation@subjectType:subjectId[#subjectRelation]",
    };
  }

  const [, resourceType, resourceId, relation, subjectType, subjectId, subjectRelation] = match;

  return {
    originalText: tupleString,
    resourceType,
    resourceId,
    relation,
    subjectType,
    subjectId,
    subjectRelation: subjectRelation || "",
    isValid: true,
  };
}

// Parse multiple tuples from input
function parseTuples(input: string): ParsedTuple[] {
  if (!input.trim()) return [];

  // Split by newlines or commas
  const lines = input
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map(parseTuple);
}

export function CreateRelationshipDialog({
  open,
  onClose,
  onSuccess,
}: CreateRelationshipDialogProps) {
  const [mode, setMode] = useState<"form" | "tuple">("form");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tuple mode state
  const [tupleInput, setTupleInput] = useState("");
  const [parsedTuples, setParsedTuples] = useState<ParsedTuple[]>([]);
  const [submissionResults, setSubmissionResults] = useState<SubmissionResult[]>([]);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);

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
      if (data.admin?.writeRelationship?.success && mode === "form") {
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
    setMode("form");
    setTupleInput("");
    setParsedTuples([]);
    setSubmissionResults([]);
    setIsSubmittingBatch(false);
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

  // Parse tuples when input changes
  const handleTupleInputChange = (value: string) => {
    setTupleInput(value);
    const parsed = parseTuples(value);
    setParsedTuples(parsed);
    setSubmissionResults([]); // Clear previous results
  };

  // Remove a tuple from the list
  const removeTuple = (index: number) => {
    setParsedTuples((prev) => prev.filter((_, i) => i !== index));
    // Update the input text to reflect the removal
    const remainingTuples = parsedTuples
      .filter((_, i) => i !== index)
      .map((t) => t.originalText)
      .join("\n");
    setTupleInput(remainingTuples);
  };

  // Submit all valid tuples
  const handleBatchSubmit = async () => {
    const validTuples = parsedTuples.filter((t) => t.isValid);
    if (validTuples.length === 0) return;

    setIsSubmittingBatch(true);
    const results: SubmissionResult[] = [];

    // Process tuples sequentially to avoid overwhelming the server
    for (const tuple of validTuples) {
      try {
        const result = await writeRelationship({
          variables: {
            resourceType: tuple.resourceType,
            resourceId: tuple.resourceId,
            relation: tuple.relation,
            subjectType: tuple.subjectType,
            subjectId: tuple.subjectId,
            subjectRelation: tuple.subjectRelation || undefined,
          },
        });

        results.push({
          tuple,
          success: result.data?.admin?.writeRelationship?.success || false,
          error: result.data?.admin?.writeRelationship?.message || undefined,
        });
      } catch (error: any) {
        results.push({
          tuple,
          success: false,
          error: error.message || "Unknown error",
        });
      }
    }

    setSubmissionResults(results);
    setIsSubmittingBatch(false);

    // If all succeeded, close the dialog
    const allSucceeded = results.every((r) => r.success);
    if (allSucceeded) {
      onSuccess?.();
      handleClose();
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

  const validTuplesCount = parsedTuples.filter((t) => t.isValid).length;
  const invalidTuplesCount = parsedTuples.filter((t) => !t.isValid).length;

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog sx={{ width: 800, maxWidth: "90vw", maxHeight: "90vh", overflow: "auto" }}>
        <ModalClose />
        <Typography level="h4" sx={{ mb: 2 }}>
          Create Relationship
        </Typography>

        <Tabs value={mode} onChange={(_, value) => setMode(value as "form" | "tuple")}>
          <TabList>
            <Tab value="form">Form Input</Tab>
            <Tab value="tuple">Tuple Syntax</Tab>
          </TabList>

          <TabPanel value="form">
            <Alert
              sx={{ mb: 3 }}
              color="primary"
              variant="soft"
              startDecorator={<HelpOutlineOutlined />}
            >
              <Box>
                <Typography level="title-sm">SpiceDB Relationship</Typography>
                <Typography level="body-xs">
                  Create a new authorization relationship between a resource and a subject. This
                  will grant the specified permission to the subject on the resource.
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
                      <FormHelperText>
                        Allowed types: {allowedSubjectTypes.join(", ")}
                      </FormHelperText>
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
          </TabPanel>

          <TabPanel value="tuple">
            <Alert
              sx={{ mb: 3 }}
              color="primary"
              variant="soft"
              startDecorator={<HelpOutlineOutlined />}
            >
              <Box>
                <Typography level="title-sm">Bulk Tuple Import</Typography>
                <Typography level="body-xs">
                  Enter multiple relationships using tuple syntax. Each line or comma-separated
                  value should follow the format:
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "monospace",
                    fontSize: 11,
                    mt: 1,
                    p: 1,
                    bgcolor: "background.level2",
                    borderRadius: "xs",
                  }}
                >
                  resourceType:resourceId#relation@subjectType:subjectId[#subjectRelation]
                </Typography>
                <Typography level="body-xs" sx={{ mt: 1 }}>
                  Example: erp/sales_order:SO-123#workspace@erp/workspace:456
                </Typography>
              </Box>
            </Alert>

            <Stack spacing={3}>
              {/* Tuple Input */}
              <FormControl>
                <FormLabel>Tuple Input</FormLabel>
                <Textarea
                  placeholder={`Enter tuples (one per line or comma-separated):
erp/sales_order:SO-E25BHGZLSRGXAF3V#workspace@erp/workspace:6814e283d48cc6fc777be956
erp/project:PROJ-123#member@erp/user:user-789
erp/workspace:ws-456#admin@erp/user:user-123#member`}
                  value={tupleInput}
                  onChange={(e) => handleTupleInputChange(e.target.value)}
                  minRows={6}
                  maxRows={12}
                  sx={{ fontFamily: "monospace", fontSize: 12 }}
                />
                {parsedTuples.length > 0 && (
                  <FormHelperText>
                    <Stack direction="row" spacing={2}>
                      {validTuplesCount > 0 && (
                        <Chip
                          size="sm"
                          color="success"
                          variant="soft"
                          startDecorator={<CheckCircleOutlined />}
                        >
                          {validTuplesCount} valid
                        </Chip>
                      )}
                      {invalidTuplesCount > 0 && (
                        <Chip
                          size="sm"
                          color="danger"
                          variant="soft"
                          startDecorator={<ErrorOutlined />}
                        >
                          {invalidTuplesCount} invalid
                        </Chip>
                      )}
                    </Stack>
                  </FormHelperText>
                )}
              </FormControl>

              {/* Parsed Tuples Table */}
              {parsedTuples.length > 0 && (
                <Box>
                  <Typography level="title-sm" sx={{ mb: 2 }}>
                    Parsed Relationships
                  </Typography>
                  <Box sx={{ overflowX: "auto" }}>
                    <Table
                      size="sm"
                      sx={{
                        "& th": { fontSize: 12, fontWeight: 600 },
                        "& td": { fontSize: 12 },
                      }}
                    >
                      <thead>
                        <tr>
                          <th style={{ width: 40 }}>Status</th>
                          <th>Resource</th>
                          <th>Relation</th>
                          <th>Subject</th>
                          <th style={{ width: 60 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedTuples.map((tuple, index) => (
                          <tr key={index}>
                            <td>
                              {tuple.isValid ? (
                                <CheckCircleOutlined color="success" fontSize="small" />
                              ) : (
                                <Tooltip title={tuple.error}>
                                  <ErrorOutlined color="error" fontSize="small" />
                                </Tooltip>
                              )}
                            </td>
                            <td>
                              {tuple.isValid ? (
                                <Typography sx={{ fontFamily: "monospace", fontSize: 11 }}>
                                  {tuple.resourceType}:{tuple.resourceId}
                                </Typography>
                              ) : (
                                <Typography sx={{ color: "text.secondary", fontSize: 11 }}>
                                  Invalid
                                </Typography>
                              )}
                            </td>
                            <td>
                              {tuple.isValid ? (
                                <Typography sx={{ fontFamily: "monospace", fontSize: 11 }}>
                                  {tuple.relation}
                                </Typography>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td>
                              {tuple.isValid ? (
                                <Typography sx={{ fontFamily: "monospace", fontSize: 11 }}>
                                  {tuple.subjectType}:{tuple.subjectId}
                                  {tuple.subjectRelation && `#${tuple.subjectRelation}`}
                                </Typography>
                              ) : (
                                <Typography
                                  sx={{
                                    color: "danger.500",
                                    fontSize: 11,
                                    fontStyle: "italic",
                                  }}
                                >
                                  {tuple.error}
                                </Typography>
                              )}
                            </td>
                            <td>
                              <IconButton
                                size="sm"
                                variant="plain"
                                color="danger"
                                onClick={() => removeTuple(index)}
                              >
                                <DeleteOutlined fontSize="small" />
                              </IconButton>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Box>
                </Box>
              )}

              {/* Submission Results */}
              {submissionResults.length > 0 && (
                <Box>
                  <Typography level="title-sm" sx={{ mb: 2 }}>
                    Submission Results
                  </Typography>
                  <Stack spacing={1}>
                    {submissionResults.map((result, index) => (
                      <Alert
                        key={index}
                        color={result.success ? "success" : "danger"}
                        variant="soft"
                        startDecorator={
                          result.success ? <CheckCircleOutlined /> : <ErrorOutlined />
                        }
                      >
                        <Box>
                          <Typography
                            sx={{
                              fontFamily: "monospace",
                              fontSize: 11,
                              wordBreak: "break-all",
                            }}
                          >
                            {result.tuple.resourceType}:{result.tuple.resourceId}#
                            {result.tuple.relation}@{result.tuple.subjectType}:
                            {result.tuple.subjectId}
                            {result.tuple.subjectRelation && `#${result.tuple.subjectRelation}`}
                          </Typography>
                          {result.error && (
                            <Typography level="body-xs" sx={{ mt: 0.5 }}>
                              {result.error}
                            </Typography>
                          )}
                        </Box>
                      </Alert>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Actions */}
              <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", pt: 2 }}>
                <Button variant="outlined" onClick={handleClose} disabled={isSubmittingBatch}>
                  Cancel
                </Button>
                <Button
                  variant="solid"
                  startDecorator={
                    isSubmittingBatch ? <CircularProgress size="sm" /> : <AddOutlined />
                  }
                  onClick={handleBatchSubmit}
                  disabled={validTuplesCount === 0 || isSubmittingBatch}
                >
                  {isSubmittingBatch
                    ? `Creating (${submissionResults.length}/${validTuplesCount})...`
                    : `Create ${validTuplesCount} Relationship${validTuplesCount !== 1 ? "s" : ""}`}
                </Button>
              </Box>
            </Stack>
          </TabPanel>
        </Tabs>
      </ModalDialog>
    </Modal>
  );
}
