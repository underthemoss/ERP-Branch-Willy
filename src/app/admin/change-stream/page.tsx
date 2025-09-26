"use client";

import { graphql } from "@/graphql";
import { useCdcCollectionStatusQuery, useCollectionSnapshotMutation } from "@/graphql/hooks";
import { useNotification } from "@/providers/NotificationProvider";
import {
  CameraOutlined,
  CheckCircleOutlined,
  CloudSyncOutlined,
  DatasetOutlined,
  ErrorOutlineOutlined,
  FilterListOutlined,
  RefreshOutlined,
  SearchOutlined,
  StorageOutlined,
  SyncOutlined,
  SyncProblemOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  Input,
  Modal,
  ModalClose,
  ModalDialog,
  Option,
  Select,
  Sheet,
  Stack,
  Table,
  Tooltip,
  Typography,
} from "@mui/joy";
import { useCallback, useMemo, useState } from "react";

// GraphQL queries and mutations
const CDC_COLLECTION_STATUS_QUERY = graphql(`
  query CdcCollectionStatus {
    admin {
      cdcCollectionStatus {
        collections {
          collectionName
          isSynced
          reason
        }
        totalCollections
        syncedCollections
        notSyncedCollections
      }
    }
  }
`);

const COLLECTION_SNAPSHOT_MUTATION = graphql(`
  mutation CollectionSnapshot($collectionName: String!) {
    admin {
      collectionSnapshot(collectionName: $collectionName) {
        success
        collectionName
        documentsUpdated
        timestamp
        error
      }
    }
  }
`);

interface SnapshotHistory {
  collectionName: string;
  timestamp: string;
  documentsUpdated: number;
  success: boolean;
}

interface Collection {
  collectionName: string;
  isSynced: boolean;
  reason?: string | null;
}

export default function ChangeStreamPage() {
  const { notifySuccess, notifyError, notifyInfo } = useNotification();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "synced" | "not-synced">("all");
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [snapshotHistory, setSnapshotHistory] = useState<Record<string, SnapshotHistory>>({});
  const [snapshotInProgress, setSnapshotInProgress] = useState<string | null>(null);

  // Fetch CDC status
  const { data, loading, refetch } = useCdcCollectionStatusQuery({
    fetchPolicy: "cache-and-network",
  });

  // Snapshot mutation
  const [performSnapshot] = useCollectionSnapshotMutation({
    onCompleted: (data) => {
      const result = data.admin?.collectionSnapshot;
      if (result) {
        if (result.success) {
          notifySuccess(
            `Snapshot completed for ${result.collectionName}: ${result.documentsUpdated} documents updated`,
          );
          // Store in ephemeral history
          setSnapshotHistory((prev) => ({
            ...prev,
            [result.collectionName]: {
              collectionName: result.collectionName,
              timestamp: result.timestamp || new Date().toISOString(),
              documentsUpdated: result.documentsUpdated || 0,
              success: true,
            },
          }));
        } else {
          notifyError(
            `Snapshot failed for ${result.collectionName}: ${result.error || "Unknown error"}`,
          );
        }
      }
      setSnapshotInProgress(null);
      refetch();
    },
    onError: (error) => {
      notifyError(`Snapshot operation failed: ${error.message}`);
      setSnapshotInProgress(null);
    },
  });

  const cdcStatus = data?.admin?.cdcCollectionStatus;
  const collections = cdcStatus?.collections || [];

  // Filter collections
  const filteredCollections = useMemo(() => {
    return collections.filter((collection) => {
      // Status filter
      if (statusFilter === "synced" && !collection.isSynced) return false;
      if (statusFilter === "not-synced" && collection.isSynced) return false;

      // Search filter
      if (searchQuery) {
        return collection.collectionName.toLowerCase().includes(searchQuery.toLowerCase());
      }

      return true;
    });
  }, [collections, statusFilter, searchQuery]);

  const handleSnapshot = useCallback((collectionName: string) => {
    setSelectedCollection(collectionName);
    setConfirmModalOpen(true);
  }, []);

  const confirmSnapshot = useCallback(async () => {
    if (selectedCollection) {
      setConfirmModalOpen(false);
      setSnapshotInProgress(selectedCollection);
      notifyInfo(`Starting snapshot for ${selectedCollection}...`);
      await performSnapshot({
        variables: {
          collectionName: selectedCollection,
        },
      });
    }
  }, [selectedCollection, performSnapshot, notifyInfo]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography level="h2" sx={{ mb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
          <CloudSyncOutlined sx={{ fontSize: 32 }} />
          Change Data Capture (CDC) Management
        </Typography>
        <Typography level="body-md" sx={{ color: "text.secondary" }}>
          Monitor and manage MongoDB Change Stream synchronization status
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <DatasetOutlined sx={{ color: "primary.500" }} />
            <Box>
              <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                Total Collections
              </Typography>
              <Typography level="h3">{cdcStatus?.totalCollections || 0}</Typography>
            </Box>
          </Box>
        </Card>

        <Card sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleOutlined sx={{ color: "success.500" }} />
            <Box>
              <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                Synced
              </Typography>
              <Typography level="h3" sx={{ color: "success.500" }}>
                {cdcStatus?.syncedCollections || 0}
              </Typography>
            </Box>
          </Box>
        </Card>

        <Card sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SyncProblemOutlined sx={{ color: "warning.500" }} />
            <Box>
              <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                Not Synced
              </Typography>
              <Typography level="h3" sx={{ color: "warning.500" }}>
                {cdcStatus?.notSyncedCollections || 0}
              </Typography>
            </Box>
          </Box>
        </Card>

        <Card sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SyncOutlined sx={{ color: "neutral.500" }} />
            <Box>
              <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                Sync Rate
              </Typography>
              <Typography level="h3">
                {cdcStatus?.totalCollections
                  ? Math.round((cdcStatus.syncedCollections / cdcStatus.totalCollections) * 100)
                  : 0}
                %
              </Typography>
            </Box>
          </Box>
        </Card>
      </Box>

      {/* Controls */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
        <Input
          placeholder="Search collections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startDecorator={<SearchOutlined />}
          sx={{ flex: 1, maxWidth: 400 }}
          size="sm"
        />

        <Select
          value={statusFilter}
          onChange={(_, value) => setStatusFilter(value as typeof statusFilter)}
          size="sm"
          sx={{ minWidth: 150 }}
          startDecorator={<FilterListOutlined />}
        >
          <Option value="all">All Collections</Option>
          <Option value="synced">Synced Only</Option>
          <Option value="not-synced">Not Synced Only</Option>
        </Select>

        <Box sx={{ flex: 1 }} />

        <Tooltip title="Refresh">
          <IconButton onClick={handleRefresh} variant="outlined" size="sm">
            <RefreshOutlined />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Collections Table */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Sheet
          variant="outlined"
          sx={{
            borderRadius: "sm",
            overflow: "auto",
          }}
        >
          <Table
            stickyHeader
            hoverRow
            sx={{
              "--TableCell-headBackground": "transparent",
              "--Table-headerUnderlineThickness": "1px",
              "& thead th": {
                fontSize: "13px",
                fontWeight: 600,
              },
              "& tbody td": {
                fontSize: "13px",
              },
            }}
          >
            <thead>
              <tr>
                <th style={{ width: "35%" }}>Collection Name</th>
                <th style={{ width: "15%" }}>Status</th>
                <th style={{ width: "25%" }}>Reason</th>
                <th style={{ width: "15%" }}>Last Action</th>
                <th style={{ width: "10%" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCollections.map((collection) => {
                const history = snapshotHistory[collection.collectionName];
                const isSnapshotting = snapshotInProgress === collection.collectionName;

                return (
                  <tr key={collection.collectionName}>
                    <td>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <StorageOutlined sx={{ fontSize: 18, color: "neutral.500" }} />
                        <Typography level="body-sm" sx={{ fontFamily: "monospace" }}>
                          {collection.collectionName}
                        </Typography>
                      </Box>
                    </td>
                    <td>
                      <Chip
                        size="sm"
                        color={collection.isSynced ? "success" : "warning"}
                        variant="soft"
                        startDecorator={
                          collection.isSynced ? (
                            <CheckCircleOutlined sx={{ fontSize: 14 }} />
                          ) : (
                            <WarningAmberOutlined sx={{ fontSize: 14 }} />
                          )
                        }
                      >
                        {collection.isSynced ? "Synced" : "Not Synced"}
                      </Chip>
                    </td>
                    <td>
                      {collection.reason ? (
                        <Typography level="body-sm" sx={{ color: "warning.600" }}>
                          {collection.reason}
                        </Typography>
                      ) : (
                        <Typography level="body-sm" sx={{ color: "text.tertiary" }}>
                          -
                        </Typography>
                      )}
                    </td>
                    <td>
                      {history ? (
                        <Stack spacing={0.25}>
                          <Typography level="body-xs" sx={{ color: "success.600" }}>
                            Snapshot: {history.documentsUpdated} docs
                          </Typography>
                          <Typography level="body-xs" sx={{ color: "text.tertiary" }}>
                            {formatTimestamp(history.timestamp)}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography level="body-sm" sx={{ color: "text.tertiary" }}>
                          -
                        </Typography>
                      )}
                    </td>
                    <td>
                      <Tooltip
                        title={
                          collection.isSynced
                            ? "Trigger snapshot to force re-sync"
                            : "Collection not synced - no snapshot needed"
                        }
                      >
                        <span>
                          <Button
                            size="sm"
                            variant={collection.isSynced ? "soft" : "plain"}
                            color={collection.isSynced ? "primary" : "neutral"}
                            onClick={() => handleSnapshot(collection.collectionName)}
                            disabled={isSnapshotting || !collection.isSynced}
                            loading={isSnapshotting}
                            startDecorator={!isSnapshotting && <CameraOutlined />}
                          >
                            {isSnapshotting ? "Processing..." : "Snapshot"}
                          </Button>
                        </span>
                      </Tooltip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>

          {filteredCollections.length === 0 && (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <ErrorOutlineOutlined sx={{ fontSize: 48, color: "neutral.400", mb: 2 }} />
              <Typography level="body-md" sx={{ color: "text.secondary" }}>
                No collections found matching your filters
              </Typography>
            </Box>
          )}
        </Sheet>
      )}

      {/* Confirmation Modal */}
      <Modal open={confirmModalOpen} onClose={() => setConfirmModalOpen(false)}>
        <ModalDialog sx={{ width: 400 }}>
          <ModalClose />
          <Typography level="h4" sx={{ mb: 2 }}>
            Confirm Snapshot
          </Typography>
          <Typography level="body-md" sx={{ mb: 3 }}>
            Are you sure you want to trigger a snapshot for collection{" "}
            <strong>{selectedCollection}</strong>? This will update the _touch timestamp on all
            documents in the collection to trigger CDC synchronization.
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="solid" color="primary" onClick={confirmSnapshot} sx={{ flex: 1 }}>
              Confirm Snapshot
            </Button>
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => setConfirmModalOpen(false)}
              sx={{ flex: 1 }}
            >
              Cancel
            </Button>
          </Box>
        </ModalDialog>
      </Modal>
    </Box>
  );
}
