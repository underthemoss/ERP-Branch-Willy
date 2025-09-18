"use client";

import { useGoogleMaps } from "@/providers/GoogleMapsProvider";
import { Close, LocationOn, Person } from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import { GoogleMap, InfoWindow, Marker, OverlayView } from "@react-google-maps/api";
import { useCallback, useMemo, useState } from "react";

interface Member {
  userId: string;
  role: string;
  user?: {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    picture?: string | null;
    lastLoginLocation?: {
      city?: string | null;
      countryCode?: string | null;
      countryName?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      timezone?: string | null;
    } | null;
  } | null;
}

interface MembersMapDialogProps {
  open: boolean;
  onClose: () => void;
  members: Member[];
}

const mapContainerStyle = {
  width: "100%",
  height: "600px",
};

const defaultCenter = {
  lat: 39.8283,
  lng: -98.5795, // Center of USA
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: true,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: true,
};

export default function MembersMapDialog({ open, onClose, members }: MembersMapDialogProps) {
  const { isReady, mapId } = useGoogleMaps();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Filter members with valid location data
  const membersWithLocation = useMemo(() => {
    return members.filter(
      (member) =>
        member.user?.lastLoginLocation?.latitude && member.user?.lastLoginLocation?.longitude,
    );
  }, [members]);

  // Calculate map bounds to fit all markers
  const bounds = useMemo(() => {
    if (membersWithLocation.length === 0) return null;

    const bounds = new google.maps.LatLngBounds();
    membersWithLocation.forEach((member) => {
      if (member.user?.lastLoginLocation?.latitude && member.user?.lastLoginLocation?.longitude) {
        bounds.extend({
          lat: member.user.lastLoginLocation.latitude,
          lng: member.user.lastLoginLocation.longitude,
        });
      }
    });
    return bounds;
  }, [membersWithLocation]);

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      setMap(map);
      // For single member, use a fixed zoom level instead of fitBounds
      if (membersWithLocation.length === 1) {
        const member = membersWithLocation[0];
        if (member.user?.lastLoginLocation?.latitude && member.user?.lastLoginLocation?.longitude) {
          map.setCenter({
            lat: member.user.lastLoginLocation.latitude,
            lng: member.user.lastLoginLocation.longitude,
          });
          map.setZoom(10); // City-level zoom for single member
        }
      } else if (bounds) {
        map.fitBounds(bounds);
        // Add padding to ensure markers aren't at the edge
        const padding = { top: 50, right: 50, bottom: 50, left: 50 };
        map.fitBounds(bounds, padding);
      }
    },
    [bounds, membersWithLocation],
  );

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return "??";
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "primary";
      case "MEMBER":
        return "success";
      case "INVITED":
        return "warning";
      default:
        return "default";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Admin";
      case "MEMBER":
        return "Member";
      case "INVITED":
        return "Invited";
      default:
        return role;
    }
  };

  const handleMarkerClick = (member: Member) => {
    setSelectedMember(member);
  };

  const handleInfoWindowClose = () => {
    setSelectedMember(null);
  };

  const center = useMemo(() => {
    if (membersWithLocation.length === 1) {
      const member = membersWithLocation[0];
      return {
        lat: member.user?.lastLoginLocation?.latitude || defaultCenter.lat,
        lng: member.user?.lastLoginLocation?.longitude || defaultCenter.lng,
      };
    }
    return defaultCenter;
  }, [membersWithLocation]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LocationOn color="primary" />
            <Typography variant="h6">Team Members Map</Typography>
            <Chip
              label={`${membersWithLocation.length} of ${members.length} with location`}
              size="small"
              variant="outlined"
            />
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {!isReady ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 600,
              flexDirection: "column",
              gap: 2,
            }}
          >
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Loading map...
            </Typography>
          </Box>
        ) : membersWithLocation.length === 0 ? (
          <Box sx={{ p: 4 }}>
            <Alert severity="info">
              No team members have location data available. Location data is captured when members
              log in.
            </Alert>
          </Box>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={membersWithLocation.length === 1 ? 10 : 4}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{ ...mapOptions, mapId }}
          >
            {membersWithLocation.map((member) => {
              const location = member.user?.lastLoginLocation;
              if (!location?.latitude || !location?.longitude) return null;

              const position = {
                lat: location.latitude,
                lng: location.longitude,
              };

              return (
                <OverlayView
                  key={member.userId}
                  position={position}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <Box
                    onClick={() => handleMarkerClick(member)}
                    sx={{
                      transform: "translate(-50%, -50%)",
                      cursor: "pointer",
                      position: "relative",
                    }}
                  >
                    <Avatar
                      src={member.user?.picture || undefined}
                      sx={{
                        bgcolor: "primary.main",
                        width: 40,
                        height: 40,
                        border: "3px solid white",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                        transition: "transform 0.2s",
                        "&:hover": {
                          transform: "scale(1.1)",
                        },
                      }}
                    >
                      {!member.user?.picture &&
                        getInitials(
                          member.user?.firstName,
                          member.user?.lastName,
                          member.user?.email,
                        )}
                    </Avatar>
                  </Box>
                </OverlayView>
              );
            })}

            {selectedMember && selectedMember.user?.lastLoginLocation && (
              <InfoWindow
                position={{
                  lat: selectedMember.user.lastLoginLocation.latitude!,
                  lng: selectedMember.user.lastLoginLocation.longitude!,
                }}
                onCloseClick={handleInfoWindowClose}
              >
                <Box sx={{ p: 1, minWidth: 250 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <Avatar
                      src={selectedMember.user?.picture || undefined}
                      sx={{
                        bgcolor: "primary.main",
                        width: 48,
                        height: 48,
                      }}
                    >
                      {!selectedMember.user?.picture &&
                        getInitials(
                          selectedMember.user?.firstName,
                          selectedMember.user?.lastName,
                          selectedMember.user?.email,
                        )}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {selectedMember.user?.firstName && selectedMember.user?.lastName
                          ? `${selectedMember.user.firstName} ${selectedMember.user.lastName}`
                          : selectedMember.user?.firstName ||
                            selectedMember.user?.lastName ||
                            "Unknown User"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedMember.user?.email}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Person fontSize="small" color="action" />
                      <Chip
                        label={getRoleLabel(selectedMember.role)}
                        color={getRoleColor(selectedMember.role)}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body2">
                        {selectedMember.user.lastLoginLocation.city &&
                        selectedMember.user.lastLoginLocation.countryName
                          ? `${selectedMember.user.lastLoginLocation.city}, ${selectedMember.user.lastLoginLocation.countryName}`
                          : selectedMember.user.lastLoginLocation.countryName || "Unknown"}
                      </Typography>
                    </Box>

                    {selectedMember.user.lastLoginLocation.timezone && (
                      <Typography variant="caption" color="text.secondary">
                        Timezone: {selectedMember.user.lastLoginLocation.timezone}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </DialogContent>
    </Dialog>
  );
}
