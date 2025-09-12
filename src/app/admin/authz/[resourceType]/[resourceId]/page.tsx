"use client";

import { useDeleteRelationshipMutation, useListRelationshipsQuery } from "@/graphql/hooks";
import {
  ArrowBackOutlined,
  DeleteOutlined,
  RefreshOutlined,
  SecurityOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Divider,
  Modal,
  ModalClose,
  ModalDialog,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Typography,
} from "@mui/joy";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { RelationshipsTable } from "../../components/RelationshipsTable";
import { ResourceBreadcrumbs } from "../../components/ResourceBreadcrumbs";

export default function ResourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const resourceType = decodeURIComponent(params.resourceType as string);
  const resourceId = decodeURIComponent(params.resourceId as string);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [relationshipToDelete, setRelationshipToDelete] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"outgoing" | "incoming">("outgoing");

  // Fetch outgoing relationships (where this resource is the resource)
  const {
    data: outgoingData,
    loading: outgoingLoading,
    refetch: refetchOutgoing,
  } = useListRelationshipsQuery({
    variables: {
      resourceType,
      resourceId,
      limit: 100,
    },
    fetchPolicy: "cache-and-network",
  });

  // Fetch incoming relationships (where this resource is the subject)
  const {
    data: incomingData,
    loading: incomingLoading,
    refetch: refetchIncoming,
  } = useListRelationshipsQuery({
    variables: {
      subjectType: resourceType,
      subjectId: resourceId,
      limit: 100,
    },
    fetchPolicy: "cache-and-network",
  });

  const [deleteRelationship] = useDeleteRelationshipMutation({
    onCompleted: () => {
      setDeleteModalOpen(false);
      setRelationshipToDelete(null);
      refetchOutgoing();
      refetchIncoming();
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

  const outgoingRelationships = outgoingData?.admin?.listRelationships?.relationships || [];
  const incomingRelationships = incomingData?.admin?.listRelationships?.relationships || [];

  const breadcrumbItems = [
    {
      label: `${resourceType}:${resourceId}`,
      type: resourceType,
      id: resourceId,
    },
  ];

  const loading = outgoingLoading || incomingLoading;

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 2 }}>
        <ResourceBreadcrumbs items={breadcrumbItems} />
      </Box>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <Button
            size="sm"
            variant="plain"
            startDecorator={<ArrowBackOutlined />}
            onClick={() => router.push("/admin/authz")}
          >
            Back to All
          </Button>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <SecurityOutlined sx={{ fontSize: 28, color: "primary.500" }} />
          <Typography level="h2">Resource Details</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            component="span"
            sx={{
              fontFamily: "monospace",
              fontSize: 16,
              color: "text.secondary",
            }}
          >
            {resourceType}:
          </Typography>
          <Typography
            component="span"
            sx={{
              fontFamily: "monospace",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {resourceId}
          </Typography>
        </Box>
      </Box>

      {/* Summary Stats */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 3 }}>
        <Card>
          <Typography level="body-sm" sx={{ color: "text.secondary" }}>
            Outgoing Relations
          </Typography>
          <Typography level="h3">{outgoingRelationships.length}</Typography>
        </Card>
        <Card>
          <Typography level="body-sm" sx={{ color: "text.secondary" }}>
            Incoming Relations
          </Typography>
          <Typography level="h3">{incomingRelationships.length}</Typography>
        </Card>
        <Card>
          <Typography level="body-sm" sx={{ color: "text.secondary" }}>
            Unique Relations
          </Typography>
          <Typography level="h3">
            {
              new Set([
                ...outgoingRelationships.map((r) => r.relation),
                ...incomingRelationships.map((r) => r.relation),
              ]).size
            }
          </Typography>
        </Card>
        <Card>
          <Typography level="body-sm" sx={{ color: "text.secondary" }}>
            Total Connections
          </Typography>
          <Typography level="h3">
            {outgoingRelationships.length + incomingRelationships.length}
          </Typography>
        </Card>
      </Box>

      {/* Actions */}
      <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
        <Button
          size="sm"
          variant="outlined"
          startDecorator={<RefreshOutlined />}
          onClick={() => {
            refetchOutgoing();
            refetchIncoming();
          }}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Relationships Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value as "outgoing" | "incoming")}
      >
        <TabList>
          <Tab value="outgoing">Outgoing Relationships ({outgoingRelationships.length})</Tab>
          <Tab value="incoming">Incoming Relationships ({incomingRelationships.length})</Tab>
        </TabList>

        <TabPanel value="outgoing" sx={{ p: 0, pt: 2 }}>
          {outgoingLoading && !outgoingData ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 300,
              }}
            >
              <CircularProgress />
            </Box>
          ) : outgoingRelationships.length === 0 ? (
            <Alert color="neutral" variant="soft">
              <Typography level="body-sm">
                No outgoing relationships found for this resource.
              </Typography>
            </Alert>
          ) : (
            <>
              <Typography level="body-sm" sx={{ mb: 2, color: "text.secondary" }}>
                Relationships where this resource is the source
              </Typography>
              <RelationshipsTable
                relationships={outgoingRelationships}
                onDelete={handleDelete}
                loading={outgoingLoading}
                searchable={false}
              />
            </>
          )}
        </TabPanel>

        <TabPanel value="incoming" sx={{ p: 0, pt: 2 }}>
          {incomingLoading && !incomingData ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 300,
              }}
            >
              <CircularProgress />
            </Box>
          ) : incomingRelationships.length === 0 ? (
            <Alert color="neutral" variant="soft">
              <Typography level="body-sm">
                No incoming relationships found for this resource.
              </Typography>
            </Alert>
          ) : (
            <>
              <Typography level="body-sm" sx={{ mb: 2, color: "text.secondary" }}>
                Relationships where this resource is the target/subject
              </Typography>
              <RelationshipsTable
                relationships={incomingRelationships}
                onDelete={handleDelete}
                loading={incomingLoading}
                searchable={false}
              />
            </>
          )}
        </TabPanel>
      </Tabs>

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
