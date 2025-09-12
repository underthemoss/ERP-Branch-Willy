"use client";

import {
  useDeleteRelationshipMutation,
  useListRelationshipsQuery,
  useListResourceTypesQuery,
} from "@/graphql/hooks";
import {
  AddOutlined,
  DownloadOutlined,
  RefreshOutlined,
  SecurityOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Modal,
  ModalClose,
  ModalDialog,
  Stack,
  Typography,
} from "@mui/joy";
import { useCallback, useState } from "react";
import { RelationshipFilters } from "./components/RelationshipFilters";
import { RelationshipsTable } from "./components/RelationshipsTable";

export default function AuthzPage() {
  const [filters, setFilters] = useState<{
    resourceType?: string;
    resourceId?: string;
    relation?: string;
    subjectType?: string;
    subjectId?: string;
  }>({});
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [relationshipToDelete, setRelationshipToDelete] = useState<any>(null);

  // Fetch resource types for filters
  const { data: resourceTypesData } = useListResourceTypesQuery({
    fetchPolicy: "cache-and-network",
  });

  // Fetch relationships with filters
  const {
    data: relationshipsData,
    loading,
    refetch,
  } = useListRelationshipsQuery({
    variables: {
      limit: 100,
      cursor,
      ...filters,
    },
    fetchPolicy: "cache-and-network",
  });

  const [deleteRelationship] = useDeleteRelationshipMutation({
    onCompleted: () => {
      setDeleteModalOpen(false);
      setRelationshipToDelete(null);
      refetch();
    },
  });

  const handleDelete = useCallback((relationship: any) => {
    setRelationshipToDelete(relationship);
    setDeleteModalOpen(true);
  }, []);

  const confirmDelete = async () => {
    if (!relationshipToDelete) return;

    await deleteRelationship({
      variables: {
        resourceType: relationshipToDelete.resource.type,
        resourceId: relationshipToDelete.resource.id,
        relation: relationshipToDelete.relation,
        subjectType: relationshipToDelete.subject.type,
        subjectId: relationshipToDelete.subject.id,
      },
    });
  };

  const handleExport = () => {
    if (!relationshipsData?.admin?.listRelationships?.relationships) return;

    const csv = [
      [
        "Resource Type",
        "Resource ID",
        "Relation",
        "Subject Type",
        "Subject ID",
        "Subject Relation",
      ],
      ...relationshipsData.admin.listRelationships.relationships.map((rel) => [
        rel.resource.type,
        rel.resource.id,
        rel.relation,
        rel.subject.type,
        rel.subject.id,
        rel.subject.relation || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `authz-relationships-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resourceTypes = resourceTypesData?.admin?.listResourceTypes || [];
  const relationships = relationshipsData?.admin?.listRelationships?.relationships || [];
  const nextCursor = relationshipsData?.admin?.listRelationships?.cursor;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <SecurityOutlined sx={{ fontSize: 28, color: "primary.500" }} />
          <Typography level="h2">Authorization (SpiceDB)</Typography>
        </Box>
        <Typography level="body-md" sx={{ color: "text.secondary" }}>
          Manage and explore authorization relationships
        </Typography>
      </Box>

      {/* Summary Stats */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 3 }}>
        <Card>
          <Typography level="body-sm" sx={{ color: "text.secondary" }}>
            Total Relationships
          </Typography>
          <Typography level="h3">{relationships.length}</Typography>
        </Card>
        <Card>
          <Typography level="body-sm" sx={{ color: "text.secondary" }}>
            Resource Types
          </Typography>
          <Typography level="h3">{resourceTypes.length}</Typography>
        </Card>
        <Card>
          <Typography level="body-sm" sx={{ color: "text.secondary" }}>
            Unique Resources
          </Typography>
          <Typography level="h3">
            {new Set(relationships.map((r) => `${r.resource.type}:${r.resource.id}`)).size}
          </Typography>
        </Card>
        <Card>
          <Typography level="body-sm" sx={{ color: "text.secondary" }}>
            Unique Subjects
          </Typography>
          <Typography level="h3">
            {new Set(relationships.map((r) => `${r.subject.type}:${r.subject.id}`)).size}
          </Typography>
        </Card>
      </Box>

      {/* Main Content */}
      <Box sx={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 3 }}>
        {/* Filters Sidebar */}
        <Box>
          <RelationshipFilters
            resourceTypes={resourceTypes}
            onFiltersChange={setFilters}
            initialFilters={filters}
          />

          <Alert
            sx={{ mt: 2 }}
            color="primary"
            variant="soft"
            startDecorator={<SecurityOutlined />}
          >
            <Box>
              <Typography level="title-sm">SpiceDB Explorer</Typography>
              <Typography level="body-xs">
                Click on any resource or subject to navigate through the relationship graph.
              </Typography>
            </Box>
          </Alert>
        </Box>

        {/* Relationships Table */}
        <Box>
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <Button
              size="sm"
              variant="outlined"
              startDecorator={<RefreshOutlined />}
              onClick={() => refetch()}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              variant="outlined"
              startDecorator={<DownloadOutlined />}
              onClick={handleExport}
              disabled={relationships.length === 0}
            >
              Export CSV
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              size="sm"
              variant="solid"
              startDecorator={<AddOutlined />}
              disabled
              title="Create relationship functionality not yet implemented"
            >
              Add Relationship
            </Button>
          </Box>

          {loading && !relationshipsData ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 400,
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <>
              <RelationshipsTable
                relationships={relationships}
                onDelete={handleDelete}
                loading={loading}
              />

              {nextCursor && (
                <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                  <Button
                    variant="outlined"
                    onClick={() => setCursor(nextCursor)}
                    disabled={loading}
                  >
                    Load More
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <ModalDialog sx={{ width: 400 }}>
          <ModalClose />
          <Typography level="h4" sx={{ mb: 2 }}>
            Delete Relationship
          </Typography>
          {relationshipToDelete && (
            <Stack spacing={2}>
              <Typography level="body-sm">
                Are you sure you want to delete this relationship?
              </Typography>
              <Box
                sx={{
                  p: 2,
                  bgcolor: "background.level1",
                  borderRadius: "sm",
                  fontFamily: "monospace",
                  fontSize: 12,
                }}
              >
                <Typography sx={{ fontFamily: "monospace", fontSize: 12 }}>
                  {relationshipToDelete.resource.type}:{relationshipToDelete.resource.id}
                </Typography>
                <Typography sx={{ fontFamily: "monospace", fontSize: 12, color: "primary.500" }}>
                  #{relationshipToDelete.relation}
                </Typography>
                <Typography sx={{ fontFamily: "monospace", fontSize: 12 }}>
                  @{relationshipToDelete.subject.type}:{relationshipToDelete.subject.id}
                  {relationshipToDelete.subject.relation &&
                    `#${relationshipToDelete.subject.relation}`}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                <Button variant="outlined" onClick={() => setDeleteModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="solid" color="danger" onClick={confirmDelete}>
                  Delete
                </Button>
              </Box>
            </Stack>
          )}
        </ModalDialog>
      </Modal>
    </Box>
  );
}
