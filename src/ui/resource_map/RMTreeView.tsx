import TreeViewIcon from "@mui/icons-material/AccountTree";
import CloseIcon from "@mui/icons-material/Close";
import { Chip } from "@mui/material";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import * as React from "react";

type Item = { label: string; id: string; parentId: string; path: string[] };
type ItemWithChildren = {
  label: string;
  id: string;
  parentId: string;
  children?: ItemWithChildren[];
};
type ResourceMapSearchSelectorProps = {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => Promise<void>;
  items: Item[];
  readonly: boolean;
};

export function RMTreeView({
  selectedIds,
  onSelectionChange,
  items,
  readonly,
}: ResourceMapSearchSelectorProps) {
  const [searchValue, setSearchValue] = React.useState("");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const handleSelectedItemsChange = async (event: React.SyntheticEvent | null, ids: string[]) => {
    await onSelectionChange(ids);
  };

  const buildTree = React.useCallback((item: Item, items: Item[]): ItemWithChildren => {
    const children = items.filter((i) => i.parentId === item.id);
    return { ...item, children: children.map((c) => buildTree(c, items)) };
  }, []);

  const rmMapsTrees = React.useMemo(() => {
    const rmMaps = items.filter((i) => i.parentId === "");
    return rmMaps.map((map) => buildTree(map, items));
  }, [items, buildTree]);

  return (
    <div style={{ width: "100%" }}>
      {/* <pre>{JSON.stringify({ rmMapsTrees }, undefined, 2)}</pre> */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4 }}>
        {selectedIds
          .map((id) => items.find((i) => i.id === id)!)
          .filter(Boolean)
          .map(({ id, label, path }) => {
            const fullLabel = path.join(" > ");
            return (
              <Tooltip key={id} title={fullLabel} placement="bottom" enterDelay={500} arrow>
                <span>
                  <Chip
                    label={
                      <span
                        style={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 300,
                        }}
                      >
                        {fullLabel}
                      </span>
                    }
                    sx={{
                      borderRadius: 1,
                      fontWeight: 500,
                      mr: 0.5,
                      mb: 0.5,
                      maxWidth: "100%",
                    }}
                    color={"info"}
                    deleteIcon={readonly ? <></> : <CloseIcon sx={{ color: "#fff" }} />}
                    onDelete={async () => {
                      const newSelected = selectedIds.filter((selectedId) => selectedId !== id);
                      await onSelectionChange(newSelected);
                    }}
                  />
                </span>
              </Tooltip>
            );
          })}
        {!readonly && (
          <Chip
            icon={<TreeViewIcon />}
            label="Add Reporting Designation"
            sx={{
              borderRadius: 0,
              backgroundColor: "#eee",
              color: "#333",
              fontWeight: 500,
              mr: 0.5,
              mb: 0.5,
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
            onClick={() => setDrawerOpen(true)}
          />
        )}
      </div>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 350,
            p: 2,
            display: "flex",
            flexDirection: "column",
            height: "100vh",
          },
        }}
      >
        <Box sx={{ p: 2, flex: "none" }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Browse Resource Map
            </Typography>
            <IconButton
              aria-label="close"
              onClick={() => setDrawerOpen(false)}
              size="large"
              edge="end"
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, minWidth: 250, overflowY: "auto", p: 2, pt: 0 }}>
          <TextField
            label="Search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            size="small"
            fullWidth
            margin="dense"
            sx={{ mb: 1 }}
          />
          <RichTreeView
            items={rmMapsTrees}
            checkboxSelection
            multiSelect
            selectionPropagation={{ descendants: false, parents: false }}
            selectedItems={selectedIds}
            onSelectedItemsChange={handleSelectedItemsChange}
          />
        </Box>
      </Drawer>
    </div>
  );
}
