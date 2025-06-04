import TreeViewIcon from "@mui/icons-material/AccountTree";
import CloseIcon from "@mui/icons-material/Close";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import SearchIcon from "@mui/icons-material/Search";
import { Chip } from "@mui/material";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { TreeViewBaseItem, TreeViewSelectionPropagation } from "@mui/x-tree-view/models";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import * as React from "react";

export const EMPLOYEES_DATASET: TreeViewBaseItem[] = [
  {
    id: "0",
    label: "Sarah",
  },
  {
    id: "1",
    label: "Thomas",
    children: [
      { id: "2", label: "Robert" },
      { id: "3", label: "Karen" },
      { id: "4", label: "Nancy" },
      { id: "5", label: "Daniel" },
      { id: "6", label: "Christopher" },
      { id: "7", label: "Donald" },
    ],
  },
  {
    id: "8",
    label: "Mary",
    children: [
      {
        id: "9",
        label: "Jennifer",
        children: [{ id: "10", label: "Anna" }],
      },
      { id: "11", label: "Michael" },
      {
        id: "12",
        label: "Linda",
        children: [
          { id: "13", label: "Elizabeth" },
          { id: "14", label: "William" },
        ],
      },
    ],
  },
];

type Item = { label: string; id: string; parentId: string; path: string[] };
type ItemWithChildren = {
  label: string;
  id: string;
  parentId: string;
  children?: ItemWithChildren[];
};
type ResourceMapSearchSelectorProps = {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  items: Item[];
};

export function RMTreeView({
  selectedIds,
  onSelectionChange,
  items,
}: ResourceMapSearchSelectorProps) {
  const [searchValue, setSearchValue] = React.useState("");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const handleSelectedItemsChange = (event: React.SyntheticEvent | null, ids: string[]) => {
    onSelectionChange(ids);
  };

  const buildTree = (item: Item, items: Item[]): ItemWithChildren => {
    const children = items.filter((i) => i.parentId === item.id);
    return { ...item, children: children.map((c) => buildTree(c, items)) };
  };

  const rmMapsTrees = React.useMemo(() => {
    const rmMaps = items.filter((i) => i.parentId === "");
    return rmMaps.map((map) => buildTree(map, items));
  }, [items]);

  return (
    <div style={{ width: "100%" }}>
      {/* <pre>{JSON.stringify({ rmMapsTrees }, undefined, 2)}</pre> */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4 }}>
        {selectedIds
          .map((id) => items.find((i) => i.id === id)!)
          .filter(Boolean)
          .map(({ id, label, path }) => {
            return (
              <Chip
                key={id}
                label={path.join(" > ")}
                sx={{
                  borderRadius: 1,

                  fontWeight: 500,
                  mr: 0.5,
                  mb: 0.5,
                }}
                color={"info"}
                deleteIcon={<CloseIcon sx={{ color: "#fff" }} />}
                onDelete={() => {
                  const newSelected = selectedIds.filter((selectedId) => selectedId !== id);
                  onSelectionChange(newSelected);
                }}
              />
            );
          })}
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
