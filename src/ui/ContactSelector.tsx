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
  Chip,
  CircularProgress,
  IconButton,
  Paper,
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
import React, { useMemo, useState } from "react";

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

  const { data, loading, error } = useContactSelectorListQuery({
    variables: {
      workspaceId,
      page: { number: 1, size: 1000 },
      contactType: getContactType(type),
    },
    fetchPolicy: "cache-and-network",
  });

  const contacts = data?.listContacts?.items || [];

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

  // Build tree items for RichTreeView
  const treeItems: ContactTreeItem[] = [
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
            <span>
              {contact.__typename === "PersonContact" ? (
                <PersonIcon fontSize="small" sx={{ ml: 1, verticalAlign: "middle" }} />
              ) : contact.__typename === "BusinessContact" ? (
                <BusinessIcon fontSize="small" sx={{ ml: 1, verticalAlign: "middle" }} />
              ) : null}
            </span>
          </Tooltip>
        )}
      </TreeItemContent>
    );
  }

  const CustomTreeItem = React.forwardRef(function CustomTreeItem(
    props: TreeItemProps,
    ref: React.Ref<HTMLLIElement>,
  ) {
    const { publicAPI, status } = useTreeItem(props);

    const toggleItemDisabled = () =>
      publicAPI.setIsItemDisabled({
        itemId: props.itemId,
      });

    return (
      <TreeItem
        {...props}
        ref={ref}
        slots={{
          content: CustomContent,
        }}
        slotProps={{
          content: {
            toggleItemDisabled,
            disabled: status.disabled,
            contactId: props.itemId,
          } as CustomContentProps,
        }}
      />
    );
  });

  return (
    <Box>
      <TextField
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search contacts…"
        size="small"
        fullWidth
        sx={{ mb: 1.5 }}
      />
      <Paper
        variant="outlined"
        sx={{
          p: 1,
          borderRadius: 2,
          minHeight: 200,
          maxHeight: 400,
          overflow: "auto",
        }}
      >
        <RichTreeView
          items={treeItems || []}
          selectedItems={contactId}
          expandedItems={expanded}
          slots={{
            item: CustomTreeItem,
          }}
          onExpandedItemsChange={(_event: any, itemIds: string[]) => setExpanded(itemIds)}
          // getItemLabel={(i) => i.label}
          sx={{
            width: "100%",
            "& .MuiTreeItem-label": { width: "100%" },
          }}
        />
      </Paper>
    </Box>
  );
};

export default ContactSelector;
