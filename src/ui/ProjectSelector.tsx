"use client";

import { graphql } from "@/graphql";
import { ContactType as GqlContactType } from "@/graphql/graphql";
import { useProjectSelectorListSelectorQuery } from "@/graphql/hooks";
import { useSelectedWorkspaceId } from "@/providers/WorkspaceProvider";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import FolderIcon from "@mui/icons-material/Folder";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonIcon from "@mui/icons-material/Person";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  TreeItem,
  TreeItemContent,
  TreeItemProps,
  TreeViewBaseItem,
  useTreeItem,
  UseTreeItemContentSlotOwnProps,
} from "@mui/x-tree-view";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import React, { useCallback, useMemo, useState } from "react";

export const CONTACT_SELECTOR_LIST = graphql(`
  query ProjectSelectorListSelector($workspaceId: String!) {
    listProjects(workspaceId: $workspaceId) {
      parent_project
      id
      name
      project_code
      deleted
    }
  }
`);

type ProjectTreeItem = {
  id: string;
  label: string;
  children: ProjectTreeItem[];
  searchterms: string;
  fullLineageLabel: string;
};
export interface ProjectSelectorProps {
  projectId?: string;
  onChange: (contactId: string) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ projectId, onChange }) => {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const workspaceId = useSelectedWorkspaceId();

  const { data, loading, error } = useProjectSelectorListSelectorQuery({
    variables: { workspaceId: workspaceId || "" },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  const projects = (data?.listProjects || [])
    .filter((i) => i !== null)
    .filter((d) => d.deleted === false);

  const prepareTree = () => {
    const searchLower = search.toLowerCase();
    const rootProjects = projects.filter((d) => !d?.parent_project);

    const findChildren = (
      item: { id: string; label: string },
      lineageSoFar: string,
    ): ProjectTreeItem | null => {
      const fullLineage = lineageSoFar ? `${lineageSoFar} > ${item.label}` : item.label;
      const children = projects
        .filter((p) => p.parent_project === item.id)
        .map((i) => findChildren({ id: i.id, label: i.name }, fullLineage))
        .filter((c): c is ProjectTreeItem => c !== null);

      // Check if this node matches the search
      const matchesSelf = item.label.toLowerCase().includes(searchLower);

      // Check if any children match (already filtered recursively)
      if (matchesSelf || children.length > 0 || searchLower === "") {
        return {
          id: item.id,
          label: item.label,
          searchterms: item.label,
          fullLineageLabel: fullLineage,
          children,
        };
      }
      // If neither this node nor any children match, exclude this node
      return null;
    };

    const items = rootProjects
      .map((i) => findChildren({ id: i.id, label: i.name }, ""))
      .filter((i): i is ProjectTreeItem => i !== null);

    return items;
  };

  const items = prepareTree();

  // Flatten the tree into a hashmap for quick lookup by id
  const projectMap = useMemo(() => {
    const map: Record<string, ProjectTreeItem> = {};
    const traverse = (nodes: ProjectTreeItem[]) => {
      for (const node of nodes) {
        map[node.id] = node;
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      }
    };
    traverse(items);
    return map;
  }, [items]);

  return (
    <Box>
      {projectId ? (
        <Chip
          icon={<FolderIcon />}
          label={projectMap[projectId]?.fullLineageLabel || "Unknown Project"}
          onDelete={() => {
            onChange("");
            setPopoverOpen(false);
          }}
          // sx={{ height: 32, fontSize: 16 }}
        />
      ) : (
        <>
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={(e) => {
              setPopoverOpen(true);
              setAnchorEl(e.currentTarget);
            }}
            placeholder="Search projects..."
            size="small"
            fullWidth
            autoComplete="off"
          />
          <Popover
            open={popoverOpen}
            anchorEl={anchorEl}
            onClose={() => setPopoverOpen(false)}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
            sx={{ maxHeight: 200 }}
            disableAutoFocus
            disableEnforceFocus
          >
            <Box sx={{ p: 1 }}>
              <RichTreeView
                selectedItems={projectId}
                items={items}
                onItemSelectionToggle={(ev, itemId) => {
                  const target = (ev?.target as HTMLElement | undefined)?.tagName;
                  if (["svg", "path"].includes(target ?? "")) {
                    return;
                  }
                  onChange(itemId);
                }}
              />
            </Box>
          </Popover>
        </>
      )}
    </Box>
  );
};

export default ProjectSelector;
