"use client";

import { graphql } from "@/graphql";
import { ContactType as GqlContactType } from "@/graphql/graphql";
import { useContactSelectorListQuery } from "@/graphql/hooks";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import BusinessIcon from "@mui/icons-material/Business";
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
  useTreeItem,
  UseTreeItemContentSlotOwnProps,
} from "@mui/x-tree-view";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import React, { useCallback, useMemo, useState } from "react";

export const CONTACT_SELECTOR_LIST = graphql(`
  query ContactSelectorList(
    $workspaceId: String!
    $page: ListContactsPage!
    $contactType: ContactType
  ) {
    listContacts(filter: { workspaceId: $workspaceId, contactType: $contactType }, page: $page) {
      items {
        __typename
        ... on PersonContact {
          id
          name
          email
          profilePicture
          business {
            id
            name
          }
        }
        ... on BusinessContact {
          id
          name
          website
          profilePicture
          employees {
            items {
              id
              name
              email
              profilePicture
              business {
                id
                name
              }
            }
          }
        }
      }
    }
  }
`);

type ContactType = "person" | "business" | "any";

export interface ContactSelectorProps {
  contactId?: string;
  onChange: (contactId: string) => void;
  type?: ContactType;
  workspaceId: string;
}

function getContactType(type?: ContactType): GqlContactType | undefined {
  if (type === "person") return GqlContactType.Person;
  if (type === "business") return GqlContactType.Business;
  return undefined;
}

// Define tree item types
type BusinessTreeItem = {
  id: string;
  type: "business";
  label: string;
  profilePicture?: string;
  children: PersonTreeItem[];
};
type PersonTreeItem = {
  id: string;
  type: "person";
  label: string;
  profilePicture?: string;
  email?: string;
  business?: { id: string; name: string };
};
type ContactTreeItem = BusinessTreeItem | PersonTreeItem;

interface CustomContentProps extends UseTreeItemContentSlotOwnProps {
  children: React.ReactNode;
  toggleItemDisabled: () => void;
  disabled: boolean;
  contactId: string;
}

export const ContactSelector: React.FC<ContactSelectorProps> = ({
  contactId,
  onChange,
  type = "any",
  workspaceId,
}) => {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { data, loading, error } = useContactSelectorListQuery({
    variables: {
      workspaceId,
      page: { number: 1, size: 1000 },
      contactType: getContactType(type),
    },
    fetchPolicy: "cache-and-network",
  });

  const contacts = useMemo(() => data?.listContacts?.items || [], [data?.listContacts?.items]);

  // Type guard for PersonContact
  function isPersonContact(e: any): e is {
    __typename: "PersonContact";
    id: string;
    name: string;
    email?: string;
    profilePicture?: string;
    business?: { id: string; name: string };
  } {
    return e && e.__typename === "PersonContact";
  }

  // Build tree items for RichTreeView, memoized for performance
  const treeItems: ContactTreeItem[] = useMemo(() => {
    // If type is "business", only show business contacts without children
    if (type === "business") {
      return contacts
        .filter((c) => c.__typename === "BusinessContact")
        .map((business) => ({
          id: business.id,
          label: business.name,
          type: "business" as const,
          profilePicture: business.profilePicture ?? undefined,
          children: [], // Don't show employees when selecting businesses only
        }));
    }

    // If type is "person", only show person contacts
    if (type === "person") {
      return contacts
        .filter((c) => c.__typename === "PersonContact")
        .map((contact) => ({
          id: contact.id,
          label: contact.name,
          type: "person" as const,
          profilePicture: contact.profilePicture ?? undefined,
          email: contact.email ?? undefined,
          business:
            contact.business && contact.business.id && contact.business.name
              ? { id: contact.business.id, name: contact.business.name }
              : undefined,
        }));
    }

    // Default "any" type - show businesses with their employees and standalone persons
    return [
      ...contacts
        .filter((c) => c.__typename === "BusinessContact")
        .map((business) => ({
          id: business.id,
          label: business.name,
          type: "business" as const,
          profilePicture: business.profilePicture ?? undefined,
          children:
            business.employees?.items.filter(isPersonContact).map((employee) => ({
              id: employee.id,
              label: employee.name,
              type: "person" as const,
              profilePicture: employee.profilePicture ?? undefined,
              email: employee.email ?? undefined,
              business: business ? { id: business.id, name: business.name } : undefined,
            })) || [],
        })),
      ...contacts
        .filter((c) => c.__typename === "PersonContact")
        .filter((c) => !c.business)
        .map((contact) => ({
          id: contact.id,
          label: contact.name,
          type: "person" as const,
          profilePicture: contact.profilePicture ?? undefined,
          email: contact.email ?? undefined,
          business:
            contact.business && contact.business.id && contact.business.name
              ? { id: contact.business.id, name: contact.business.name }
              : undefined,
        })),
    ];
  }, [contacts, type]);

  // Filter tree items based on search state
  const filteredTreeItems = useMemo(() => {
    if (!search.trim()) return treeItems;
    const s = search.trim().toLowerCase();
    return treeItems
      .map((item) => {
        if (item.type === "business") {
          const businessMatches = item.label.toLowerCase().includes(s);
          const filteredChildren = item.children.filter(
            (child) =>
              child.label.toLowerCase().includes(s) ||
              (child.email && child.email.toLowerCase().includes(s)),
          );
          if (businessMatches) {
            return { ...item };
          } else if (filteredChildren.length > 0) {
            return { ...item, children: filteredChildren };
          }
          return null;
        } else {
          // person
          if (
            item.label.toLowerCase().includes(s) ||
            (item.email && item.email.toLowerCase().includes(s))
          ) {
            return item;
          }
          return null;
        }
      })
      .filter(Boolean) as ContactTreeItem[];
  }, [treeItems, search]);

  // Memoized handlers for RichTreeView
  const handleItemSelectionToggle = useCallback(
    (e: React.SyntheticEvent<Element, Event> | null, id: string, isSelected: boolean) => {
      const target = (e?.target as HTMLElement | undefined)?.tagName;
      if (["svg", "path"].includes(target ?? "")) {
        return;
      }
      if (isSelected) {
        onChange(id);
        setSearch("");
        setPopoverOpen(false);
      }
    },
    [onChange],
  );

  const handleExpandedItemsChange = useCallback(
    (_event: React.SyntheticEvent<Element, Event> | null, itemIds: string[]) =>
      setExpanded(itemIds),
    [],
  );

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight={80}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography color="error">Failed to load contacts</Typography>
      </Paper>
    );
  }

  function CustomContent({
    children,
    toggleItemDisabled,
    disabled,
    contactId,
    ...props
  }: CustomContentProps) {
    const contact = contacts.find((c) => c.id === contactId);
    const {
      status: { focused },
    } = useTreeItem({ itemId: contactId });

    return (
      <TreeItemContent {...props}>
        {children}

        {contact?.__typename && (
          <Tooltip
            title={
              contact.__typename === "PersonContact"
                ? "Person"
                : contact.__typename === "BusinessContact"
                  ? "Business"
                  : ""
            }
            placement="top"
            arrow
          >
            <Box display={"flex"} alignItems={"center"} sx={{ maxHeight: 8 }}>
              {contact.__typename === "PersonContact" ? (
                <PersonIcon fontSize="small" sx={{ ml: 1, verticalAlign: "middle" }} />
              ) : contact.__typename === "BusinessContact" ? (
                <BusinessIcon fontSize="small" sx={{ ml: 1, verticalAlign: "middle" }} />
              ) : null}
            </Box>
          </Tooltip>
        )}
      </TreeItemContent>
    );
  }

  const CustomTreeItem = React.forwardRef(function CustomTreeItem(
    props: TreeItemProps,
    ref: React.Ref<HTMLLIElement>,
  ) {
    return (
      <TreeItem
        {...props}
        ref={ref}
        slots={{
          content: CustomContent,
        }}
        slotProps={{
          content: {
            contactId: props.itemId,
          } as CustomContentProps,
        }}
      />
    );
  });

  return (
    <Box>
      {contactId ? (
        (() => {
          const selectedContact = contacts.find((c) => c.id === contactId);

          // Format the label for the chip
          let chipLabel = "Unknown";
          if (selectedContact) {
            if (selectedContact.__typename === "PersonContact" && selectedContact.business) {
              // For person contacts with a business, show "Business > Person"
              chipLabel = `${selectedContact.business.name} > ${selectedContact.name}`;
            } else {
              // For business contacts or person contacts without a business
              chipLabel = selectedContact.name;
            }
          }

          return (
            <Tooltip title={chipLabel} arrow>
              <Chip
                size="medium"
                variant="filled"
                icon={
                  <Box p={1} pt={1.5}>
                    {selectedContact?.__typename === "PersonContact" ? (
                      <PersonIcon />
                    ) : selectedContact?.__typename === "BusinessContact" ? (
                      <BusinessIcon />
                    ) : (
                      "?"
                    )}
                  </Box>
                }
                label={chipLabel}
                onDelete={() => {
                  onChange("");
                  setPopoverOpen(false);
                }}
                data-testid="contact-selector-chip"
                sx={{
                  maxWidth: "100%",
                  "& .MuiChip-label": {
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  },
                }}
              />
            </Tooltip>
          );
        })()
      ) : (
        <>
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => {
              setPopoverOpen(true);
              setAnchorEl(e.currentTarget);
            }}
            onBlur={() => {}}
            placeholder="Search contacts…"
            size="small"
            fullWidth
            autoComplete="off"
            sx={{ mb: 1.5 }}
          />
          <Popover
            open={popoverOpen}
            anchorEl={anchorEl}
            onClose={() => setPopoverOpen(false)}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
            PaperProps={{
              sx: {
                p: 1,
                borderRadius: 2,
                minWidth: anchorEl ? anchorEl.clientWidth : 300,
                minHeight: 200,
                maxHeight: 400,
                overflow: "auto",
              },
            }}
            disableAutoFocus
            disableEnforceFocus
          >
            <RichTreeView
              items={filteredTreeItems || []}
              selectedItems={contactId || null}
              expandedItems={expanded}
              slots={{
                item: CustomTreeItem,
              }}
              onItemSelectionToggle={handleItemSelectionToggle}
              onExpandedItemsChange={handleExpandedItemsChange}
              // getItemLabel={(i) => i.label}
              sx={{
                width: "100%",
                "& .MuiTreeItem-label": { width: "100%" },
              }}
            />
          </Popover>
        </>
      )}
    </Box>
  );
};

export default ContactSelector;
