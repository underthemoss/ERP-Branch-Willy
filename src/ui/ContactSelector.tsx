import { graphql } from "@/graphql";
import { ContactType as GqlContactType } from "@/graphql/graphql";
import { useContactSelectorListQuery } from "@/graphql/hooks";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";

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

export const ContactSelector: React.FC<ContactSelectorProps> = ({
  contactId,
  onChange,
  type = "any",
  workspaceId,
}) => {
  // Use the generated hook from codegen
  const { data, loading, error } = useContactSelectorListQuery({
    variables: {
      workspaceId,
      page: { number: 1, size: 50 },
      contactType: getContactType(type),
    },
    fetchPolicy: "cache-and-network",
  });

  const contacts = data?.listContacts?.items || [];

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

  return (
    <Select
      value={contactId ?? ""}
      onChange={(e: SelectChangeEvent<string>) => onChange(e.target.value)}
      displayEmpty
      fullWidth
      IconComponent={ArrowDropDownIcon}
      renderValue={(selected) => {
        const contact = contacts.find((c) => c.id === selected);
        if (!contact) {
          return (
            <Paper
              variant="outlined"
              sx={{
                display: "flex",
                alignItems: "center",
                p: 2,
                width: "100%",
                boxShadow: "none",
                borderRadius: 2,
              }}
            >
              <Avatar sx={{ width: 40, height: 40, mr: 2, bgcolor: "grey.400" }}>
                {/* Placeholder circle */}
              </Avatar>
              <Box flex={1}>
                <Typography fontWeight={500} fontSize={16} color="text.secondary">
                  Select contact…
                </Typography>
              </Box>
            </Paper>
          );
        }
        return (
          <Paper
            variant="outlined"
            sx={{
              display: "flex",
              alignItems: "center",
              p: 2,
              width: "100%",
              boxShadow: "none",
              borderRadius: 2,
              marginRight: 3,
              gap: 2,
            }}
          >
            <Avatar
              src={
                contact.__typename === "PersonContact"
                  ? (contact.profilePicture ?? undefined)
                  : contact.__typename === "BusinessContact"
                    ? (contact.profilePicture ?? undefined)
                    : undefined
              }
              sx={{ width: 44, height: 44, mr: 2, bgcolor: "grey.400" }}
            >
              {(!contact.profilePicture || contact.profilePicture === "") && contact.name[0]}
            </Avatar>
            <Box flex={1} minWidth={0}>
              <Typography fontWeight={700} fontSize={17} noWrap>
                {contact.name}
              </Typography>
              <Stack spacing={0.2}>
                {"email" in contact && (
                  <Box display="flex" gap={0.5} alignItems="center">
                    <Typography fontSize={12} color="text.secondary" fontWeight={600} noWrap>
                      Email:
                    </Typography>
                    <Typography fontSize={14} color="text.secondary" noWrap>
                      {contact.email}
                    </Typography>
                  </Box>
                )}
                {"email" in contact && contact.business?.name && (
                  <Box display="flex" gap={0.5} alignItems="center">
                    <Typography fontSize={12} color="text.secondary" fontWeight={600} noWrap>
                      Business:
                    </Typography>
                    <Typography fontSize={13} color="text.secondary" noWrap>
                      {contact.business.name}
                    </Typography>
                  </Box>
                )}
                {"website" in contact && contact.website && (
                  <Box display="flex" gap={0.5} alignItems="center">
                    <Typography fontSize={12} color="text.secondary" fontWeight={600} noWrap>
                      Website:
                    </Typography>
                    <Typography fontSize={14} color="text.secondary" noWrap>
                      {contact.website}
                    </Typography>
                  </Box>
                )}
                {"employees" in contact && contact.employees && (
                  <Box display="flex" gap={0.5} alignItems="center">
                    <Typography fontSize={12} color="text.secondary" fontWeight={600} noWrap>
                      Employees:
                    </Typography>
                    <Typography fontSize={13} color="text.secondary" noWrap>
                      {`${contact.employees.items.length} employee${contact.employees.items.length === 1 ? "" : "s"}`}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
            <Chip
              label={contact.__typename === "BusinessContact" ? "Business" : "Person"}
              color={contact.__typename === "BusinessContact" ? "primary" : "default"}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: 13,
                minWidth: 70,
                ml: 2,
                mr: 2,
                bgcolor: contact.__typename === "BusinessContact" ? "primary.light" : "grey.200",
                color:
                  contact.__typename === "BusinessContact"
                    ? "primary.contrastText"
                    : "text.secondary",
              }}
            />
          </Paper>
        );
      }}
      sx={{
        background: "transparent",
        borderRadius: 2,
        "& .MuiSelect-select": { p: 0 },
      }}
      MenuProps={{
        PaperProps: {
          sx: { minWidth: 350, maxHeight: 400 },
        },
      }}
    >
      <MenuItem value="">
        <Typography color="text.secondary">Select contact…</Typography>
      </MenuItem>
      {contacts.map((contact) => (
        <MenuItem key={contact.id} value={contact.id} sx={{ py: 1 }}>
          <Box display="flex" alignItems="center" width="100%" gap={2} minWidth={0}>
            <Avatar
              src={
                contact.__typename === "PersonContact"
                  ? (contact.profilePicture ?? undefined)
                  : contact.__typename === "BusinessContact"
                    ? (contact.profilePicture ?? undefined)
                    : undefined
              }
              sx={{ width: 36, height: 36, bgcolor: "grey.400" }}
            >
              {(!contact.profilePicture || contact.profilePicture === "") && contact.name[0]}
            </Avatar>
            <Box flex={1} minWidth={0}>
              <Typography fontWeight={700} fontSize={16} noWrap>
                {contact.name}
              </Typography>
              <Stack spacing={0.2}>
                {"email" in contact && (
                  <Box display="flex" gap={0.5} alignItems="center">
                    <Typography fontSize={12} color="text.secondary" fontWeight={600} noWrap>
                      Email:
                    </Typography>
                    <Typography fontSize={14} color="text.secondary" noWrap>
                      {contact.email}
                    </Typography>
                  </Box>
                )}
                {"email" in contact && contact.business?.name && (
                  <Box display="flex" gap={0.5} alignItems="center">
                    <Typography fontSize={12} color="text.secondary" fontWeight={600} noWrap>
                      Business:
                    </Typography>
                    <Typography fontSize={13} color="text.secondary" noWrap>
                      {contact.business.name}
                    </Typography>
                  </Box>
                )}
                {"website" in contact && contact.website && (
                  <Box display="flex" gap={0.5} alignItems="center">
                    <Typography fontSize={12} color="text.secondary" fontWeight={600} noWrap>
                      Website:
                    </Typography>
                    <Typography fontSize={14} color="text.secondary" noWrap>
                      {contact.website}
                    </Typography>
                  </Box>
                )}
                {"employees" in contact && contact.employees && (
                  <Box display="flex" gap={0.5} alignItems="center">
                    <Typography fontSize={12} color="text.secondary" fontWeight={600} noWrap>
                      Employees:
                    </Typography>
                    <Typography fontSize={13} color="text.secondary" noWrap>
                      {`${contact.employees.items.length} employee${contact.employees.items.length === 1 ? "" : "s"}`}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
            <Chip
              label={contact.__typename === "BusinessContact" ? "Business" : "Person"}
              color={contact.__typename === "BusinessContact" ? "primary" : "default"}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: 13,
                minWidth: 70,
                ml: 2,
                bgcolor: contact.__typename === "BusinessContact" ? "primary.light" : "grey.200",
                color:
                  contact.__typename === "BusinessContact"
                    ? "primary.contrastText"
                    : "text.secondary",
              }}
            />
          </Box>
        </MenuItem>
      ))}
    </Select>
  );
};

export default ContactSelector;
