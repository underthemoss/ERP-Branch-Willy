"use client";

import { graphql } from "@/graphql";
import { useGetUsersByIdQuery, useUsersSearchQuery } from "@/graphql/hooks";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import {
  Avatar,
  CircularProgress,
  IconButton,
  InputAdornment,
  ListItemText,
  MenuItem,
  Popover,
  TextField,
} from "@mui/material";
import React, { useRef, useState } from "react";

graphql(`
  query usersSearch($searchTerm: String) {
    usersSearch(searchTerm: $searchTerm) {
      id
      firstName
      lastName
      email
    }
  }
`);

graphql(`
  query getUsersById($userIds: [String!]!) {
    getUsersById(userIds: $userIds) {
      id
      firstName
      lastName
      email
    }
  }
`);

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type UserPickerProps = {
  userId?: string;
  onChange: (userId: string | undefined) => void;
  label?: string;
  disabled?: boolean;
  placeholder?: string;
};

export function UserPicker({
  userId,
  onChange,
  label = "User",
  disabled = false,
  placeholder = "Search users...",
}: UserPickerProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [touched, setTouched] = useState(false);

  // Fetch selected user for display
  const {
    data: selectedData,
    loading: loadingSelected,
    refetch: refetchSelected,
  } = useGetUsersByIdQuery({
    variables: { userIds: userId ? [userId] : [] },
    skip: !userId,
    fetchPolicy: "cache-and-network",
  });
  const selectedUser = selectedData?.getUsersById?.[0];

  // Search users
  const {
    data: searchData,
    loading: loadingSearch,
    refetch: refetchSearch,
  } = useUsersSearchQuery({
    variables: { searchTerm: search },
    skip: !open,
    fetchPolicy: "cache-and-network",
  });
  const users = (searchData?.usersSearch ?? []).filter(Boolean);

  // Handlers
  const handleOpen = () => {
    setOpen(true);
    setTouched(true);
    refetchSearch();
  };

  const handleClose = () => {
    setOpen(false);
    setSearch("");
  };

  const handleSelect = (user: User) => {
    onChange(user.id);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setSearch("");
  };

  // Avatar initials
  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "?";
    return ((firstName?.[0] ?? "") + (lastName?.[0] ?? "")).toUpperCase();
  };

  return (
    <div ref={anchorRef}>
      <TextField
        label={label}
        value={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : ""}
        onClick={handleOpen}
        onChange={() => {}}
        placeholder={placeholder}
        fullWidth
        disabled={disabled}
        InputProps={{
          startAdornment:
            selectedUser && !open ? (
              <InputAdornment position="start">
                <Avatar sx={{ width: 28, height: 28, fontSize: 14 }}>
                  {getInitials(selectedUser.firstName, selectedUser.lastName)}
                </Avatar>
              </InputAdornment>
            ) : undefined,
          endAdornment: (
            <>
              {loadingSearch || loadingSelected ? (
                <InputAdornment position="end">
                  <CircularProgress size={18} />
                </InputAdornment>
              ) : null}
              {selectedUser && !open ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClear} tabIndex={-1} aria-label="Clear">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : (
                <InputAdornment position="end">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )}
            </>
          ),
          readOnly: !open,
        }}
        autoComplete="off"
        sx={{ cursor: disabled ? "not-allowed" : "pointer" }}
      />

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        PaperProps={{ sx: { minWidth: 300, maxHeight: 350 } }}
      >
        <MenuItem disableRipple disableGutters sx={{ px: 2, py: 1 }}>
          <TextField
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            size="small"
            fullWidth
            InputProps={{
              endAdornment: search ? (
                <IconButton
                  size="small"
                  onClick={() => setSearch("")}
                  tabIndex={-1}
                  aria-label="Clear"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              ) : (
                <InputAdornment position="end">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </MenuItem>
        {loadingSearch ? (
          <MenuItem disabled>
            <CircularProgress size={20} sx={{ mr: 2 }} />
            Searching...
          </MenuItem>
        ) : users.length === 0 && touched ? (
          <MenuItem disabled>No users found</MenuItem>
        ) : (
          users.map((user) =>
            user ? (
              <MenuItem
                key={user.id}
                selected={user.id === userId}
                onClick={() => handleSelect(user)}
                sx={{ gap: 1 }}
              >
                <Avatar sx={{ width: 28, height: 28, fontSize: 14 }}>
                  {getInitials(user.firstName, user.lastName)}
                </Avatar>
                <ListItemText
                  primary={`${user.firstName} ${user.lastName}`}
                  secondary={user.email}
                  primaryTypographyProps={{ fontWeight: user.id === userId ? 600 : 400 }}
                />
              </MenuItem>
            ) : null,
          )
        )}
      </Popover>
    </div>
  );
}

export default UserPicker;
