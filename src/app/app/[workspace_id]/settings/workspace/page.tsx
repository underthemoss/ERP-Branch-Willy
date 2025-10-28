"use client";

import { graphql } from "@/graphql";
import { WorkspaceAccessType } from "@/graphql/graphql";
import {
  useGetBrandByDomainLazyQuery,
  useUpdateWorkspaceAccessTypeMutation,
  useUpdateWorkspaceSettingsMutation,
  useValidEnterpriseDomainLazyQuery,
} from "@/graphql/hooks";
import { useAuth0ErpUser } from "@/hooks/useAuth0ErpUser";
import { useSelectedWorkspace, useWorkspace } from "@/providers/WorkspaceProvider";
import {
  AddPhotoAlternate,
  Business,
  CheckCircle,
  Domain,
  Facebook,
  Instagram,
  Language,
  Link,
  LinkedIn,
  Lock,
  Public,
  Save,
  Twitter,
  Warning,
} from "@mui/icons-material";
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";

// Define the GraphQL queries (reusing from CreateWorkspaceFlow)
graphql(`
  query GetBrandByDomain($domain: String!) {
    getBrandByDomain(domain: $domain) {
      id
      name
      domain
      description
      longDescription
      logos {
        url
        formats {
          src
          format
          width
          height
        }
      }
      images {
        url
        type
        formats {
          src
          format
          width
          height
        }
      }
      colors {
        hex
        type
        brightness
      }
      links {
        name
        url
      }
    }
  }
`);

graphql(`
  query ValidEnterpriseDomain($domain: String!) {
    validEnterpriseDomain(domain: $domain) {
      domain
      isValid
      reason
    }
  }
`);

// Define the GraphQL mutations for updating workspace settings
graphql(`
  mutation UpdateWorkspaceSettings(
    $workspaceId: String!
    $name: String
    $description: String
    $logoUrl: String
    $bannerImageUrl: String
    $brandId: String
  ) {
    updateWorkspaceSettings(
      workspaceId: $workspaceId
      name: $name
      description: $description
      logoUrl: $logoUrl
      bannerImageUrl: $bannerImageUrl
      brandId: $brandId
    ) {
      id
      name
      description
      logoUrl
      bannerImageUrl
      brandId
      updatedAt
    }
  }
`);

graphql(`
  mutation UpdateWorkspaceAccessType($workspaceId: String!, $accessType: WorkspaceAccessType!) {
    updateWorkspaceAccessType(workspaceId: $workspaceId, accessType: $accessType) {
      id
      accessType
      updatedAt
    }
  }
`);

export default function WorkspaceSettingsPage() {
  const theme = useTheme();
  const { user } = useAuth0ErpUser();
  const currentWorkspace = useSelectedWorkspace();
  const { permissions, isLoadingPermissions } = useWorkspace();

  const [activeTab, setActiveTab] = useState(0);

  // Form 1: Workspace Settings (General + Visual Identity)
  const [workspaceName, setWorkspaceName] = useState(currentWorkspace?.name || "");
  const [workspaceDescription, setWorkspaceDescription] = useState(
    currentWorkspace?.description || "",
  );
  const [selectedLogoUrl, setSelectedLogoUrl] = useState<string | null>(
    currentWorkspace?.logoUrl || null,
  );
  const [selectedBannerUrl, setSelectedBannerUrl] = useState<string | null>(
    currentWorkspace?.bannerImageUrl || null,
  );
  const [customLogoUrl, setCustomLogoUrl] = useState("");
  const [customBannerUrl, setCustomBannerUrl] = useState("");
  const [hasSettingsChanges, setHasSettingsChanges] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Form 2: Access Type
  const [accessType, setAccessType] = useState<"domain" | "invite">(
    currentWorkspace?.accessType === "SAME_DOMAIN" ? "domain" : "invite",
  );
  const [hasAccessChanges, setHasAccessChanges] = useState(false);
  const [isSavingAccess, setIsSavingAccess] = useState(false);

  // Error and success states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // GraphQL query hooks
  const [getBrandByDomain, { loading: brandLoading, data: brandData, error: brandError }] =
    useGetBrandByDomainLazyQuery({
      fetchPolicy: "cache-and-network",
    });

  const [
    validateEnterpriseDomain,
    { loading: domainValidationLoading, data: domainValidationData, error: domainValidationError },
  ] = useValidEnterpriseDomainLazyQuery({
    fetchPolicy: "cache-and-network",
  });

  // GraphQL mutation hooks
  const [updateWorkspaceSettings] = useUpdateWorkspaceSettingsMutation();
  const [updateWorkspaceAccessType] = useUpdateWorkspaceAccessTypeMutation();

  // Extract domain from user email
  const userDomain = user?.email ? user.email.split("@")[1] : "";

  // Brand data from API
  const brand = brandData?.getBrandByDomain;

  // Domain validation data
  const domainValidation = domainValidationData?.validEnterpriseDomain;
  const isDomainValid = domainValidation?.isValid ?? false;
  const domainValidationReason = domainValidation?.reason;

  // Extract brand colors
  const primaryColor =
    brand?.colors?.find((c: any) => c.type === "primary")?.hex || theme.palette.primary.main;

  // Get available banners and logos
  const availableBanners = brand?.images?.filter((img: any) => img.type === "banner") || [];
  const availableLogos = brand?.logos || [];

  // Check for settings changes (General + Visual Identity)
  useEffect(() => {
    const nameChanged = workspaceName !== (currentWorkspace?.name || "");
    const descriptionChanged = workspaceDescription !== (currentWorkspace?.description || "");
    const logoChanged = selectedLogoUrl !== (currentWorkspace?.logoUrl || null);
    const bannerChanged = selectedBannerUrl !== (currentWorkspace?.bannerImageUrl || null);

    setHasSettingsChanges(nameChanged || descriptionChanged || logoChanged || bannerChanged);
  }, [workspaceName, workspaceDescription, selectedLogoUrl, selectedBannerUrl, currentWorkspace]);

  // Check for access changes
  useEffect(() => {
    const accessChanged =
      (accessType === "domain" ? "SAME_DOMAIN" : "INVITE_ONLY") !== currentWorkspace?.accessType;

    setHasAccessChanges(accessChanged);
  }, [accessType, currentWorkspace]);

  // Load brand data when component mounts
  useEffect(() => {
    if (currentWorkspace?.domain) {
      getBrandByDomain({ variables: { domain: currentWorkspace.domain } });
      validateEnterpriseDomain({ variables: { domain: currentWorkspace.domain } });
    }
  }, [currentWorkspace, getBrandByDomain, validateEnterpriseDomain]);

  const handleSaveSettings = async () => {
    if (!currentWorkspace?.id) return;

    setIsSavingSettings(true);
    setErrorMessage(null);

    try {
      await updateWorkspaceSettings({
        variables: {
          workspaceId: currentWorkspace.id,
          name: workspaceName,
          description: workspaceDescription,
          logoUrl: selectedLogoUrl,
          bannerImageUrl: selectedBannerUrl,
          brandId: brand?.id || undefined,
        },
      });

      setSuccessMessage("Workspace settings saved successfully!");
      setShowSuccess(true);
      setHasSettingsChanges(false);
    } catch (error: any) {
      console.error("Error saving workspace settings:", error);

      let userMessage = "Failed to save workspace settings. Please try again.";

      if (error?.message) {
        if (error.message.includes("permission") || error.message.includes("unauthorized")) {
          userMessage = "You don't have permission to update workspace settings.";
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
          userMessage = "Network error. Please check your connection and try again.";
        } else if (error.message.includes("validation")) {
          userMessage =
            "Please check your input and ensure all required fields are filled correctly.";
        }
      }

      setErrorMessage(userMessage);
      setShowError(true);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveAccess = async () => {
    if (!currentWorkspace?.id) return;

    setIsSavingAccess(true);
    setErrorMessage(null);

    try {
      await updateWorkspaceAccessType({
        variables: {
          workspaceId: currentWorkspace.id,
          accessType:
            accessType === "domain"
              ? WorkspaceAccessType.SameDomain
              : WorkspaceAccessType.InviteOnly,
        },
      });

      setSuccessMessage("Access settings saved successfully!");
      setShowSuccess(true);
      setHasAccessChanges(false);
    } catch (error: any) {
      console.error("Error saving access settings:", error);

      let userMessage = "Failed to save access settings. Please try again.";

      if (error?.message) {
        if (error.message.includes("permission") || error.message.includes("unauthorized")) {
          userMessage = "You don't have permission to update access settings.";
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
          userMessage = "Network error. Please check your connection and try again.";
        } else if (error.message.includes("validation")) {
          userMessage =
            "Please check your input and ensure all required fields are filled correctly.";
        }
      }

      setErrorMessage(userMessage);
      setShowError(true);
    } finally {
      setIsSavingAccess(false);
    }
  };

  const handleCloseError = () => {
    setShowError(false);
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
  };

  if (!currentWorkspace) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Loading workspace...</Typography>
      </Box>
    );
  }

  // Check if permissions are still loading
  if (isLoadingPermissions) {
    return (
      <Box
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Check if user has manage permissions
  if (!permissions?.permissionMap?.ERP_WORKSPACE_MANAGE) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: "auto", mt: 8 }}>
        <Card sx={{ p: 4, textAlign: "center" }}>
          <Warning sx={{ fontSize: 64, color: "warning.main", mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You don&apos;t have permission to manage workspace settings. Only workspace
            administrators can access this page.
          </Typography>
          <Button variant="contained" onClick={() => window.history.back()} sx={{ mt: 2 }}>
            Go Back
          </Button>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: 1000 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4">Workspace Settings</Typography>
      </Box>

      {/* Workspace Preview Card */}
      <Card sx={{ mb: 4, overflow: "hidden" }}>
        {selectedBannerUrl && (
          <Box
            sx={{
              height: 120,
              backgroundImage: `url(${selectedBannerUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
        <Box sx={{ p: 3, bgcolor: "background.paper" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Avatar
              src={selectedLogoUrl || undefined}
              sx={{
                width: 56,
                height: 56,
                bgcolor: alpha(primaryColor, 0.1),
                "& img": { objectFit: "contain", p: 0.5 },
              }}
            >
              {workspaceName?.[0] || "W"}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {workspaceName || "Workspace Name"}
                </Typography>
                {accessType === "domain" ? (
                  <Domain sx={{ fontSize: 20, color: primaryColor }} />
                ) : (
                  <Lock sx={{ fontSize: 18, color: "text.secondary" }} />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {workspaceDescription || "No description"}
              </Typography>
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Preview of how your workspace appears
          </Typography>
        </Box>
      </Card>

      {/* Settings Tabs */}
      <Card>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="General Information" />
          <Tab label="Visual Identity" />
          <Tab label="Access & Invitations" />
        </Tabs>

        <CardContent sx={{ p: 4 }}>
          {/* General Information Tab */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3 }}>
                General Information
              </Typography>

              <TextField
                fullWidth
                label="Workspace Name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                margin="normal"
                required
                helperText="This is how your workspace appears to members"
                sx={{
                  "& .MuiOutlinedInput-root.Mui-focused": {
                    "& fieldset": { borderColor: primaryColor },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: primaryColor,
                  },
                }}
              />

              <TextField
                fullWidth
                label="Description"
                value={workspaceDescription}
                onChange={(e) => setWorkspaceDescription(e.target.value)}
                margin="normal"
                multiline
                rows={3}
                helperText="Brief description of your workspace (optional)"
                sx={{
                  "& .MuiOutlinedInput-root.Mui-focused": {
                    "& fieldset": { borderColor: primaryColor },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: primaryColor,
                  },
                }}
              />

              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  startIcon={isSavingSettings ? <CircularProgress size={16} /> : <Save />}
                  onClick={handleSaveSettings}
                  disabled={!hasSettingsChanges || isSavingSettings}
                  sx={{
                    bgcolor: primaryColor,
                    "&:hover": {
                      bgcolor: alpha(primaryColor, 0.9),
                    },
                  }}
                >
                  {isSavingSettings ? "Saving..." : "Save General Information"}
                </Button>
              </Box>
            </Box>
          )}

          {/* Visual Identity Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Visual Identity
              </Typography>

              {brandLoading && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    Loading brand assets...
                  </Typography>
                </Box>
              )}

              {brand && (
                <Box>
                  {/* Banner Selection */}
                  {availableBanners.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                        Banner Image
                      </Typography>
                      <Grid container spacing={2}>
                        {availableBanners.map((banner: any, index: number) => {
                          const bannerUrl =
                            banner.formats?.find(
                              (f: any) =>
                                f.format === "jpeg" || f.format === "jpg" || f.format === "png",
                            )?.src || banner.url;

                          return (
                            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={index}>
                              <Box
                                onClick={() => setSelectedBannerUrl(bannerUrl)}
                                sx={{
                                  width: "100%",
                                  height: 80,
                                  backgroundImage: `url(${bannerUrl})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                  borderRadius: 2,
                                  border: `3px solid ${
                                    selectedBannerUrl === bannerUrl
                                      ? primaryColor
                                      : alpha(theme.palette.divider, 0.3)
                                  }`,
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                  "&:hover": {
                                    borderColor: primaryColor,
                                    transform: "scale(1.02)",
                                  },
                                }}
                              />
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Box>
                  )}

                  {/* Logo Selection */}
                  {availableLogos.length > 0 && (
                    <Box>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                        Logo
                      </Typography>
                      <Grid container spacing={2}>
                        {availableLogos.map((logo: any, index: number) => {
                          const logoUrl =
                            logo.formats?.find((f: any) => f.format === "png" || f.format === "svg")
                              ?.src || logo.url;

                          if (!logoUrl) return null;

                          return (
                            <Grid size={{ xs: "auto" }} key={index}>
                              <Box
                                onClick={() => setSelectedLogoUrl(logoUrl)}
                                sx={{
                                  width: 80,
                                  height: 80,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  bgcolor: "background.paper",
                                  borderRadius: 2,
                                  border: `3px solid ${
                                    selectedLogoUrl === logoUrl
                                      ? primaryColor
                                      : alpha(theme.palette.divider, 0.3)
                                  }`,
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                  p: 1,
                                  "&:hover": {
                                    borderColor: primaryColor,
                                    transform: "scale(1.02)",
                                  },
                                }}
                              >
                                <img
                                  src={logoUrl}
                                  alt="Logo option"
                                  style={{
                                    maxWidth: "100%",
                                    maxHeight: "100%",
                                    objectFit: "contain",
                                  }}
                                />
                              </Box>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Box>
                  )}
                </Box>
              )}

              {brandError && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Brand assets could not be loaded automatically. You can still upload custom images
                  below.
                </Alert>
              )}

              {/* Custom URL Section */}
              <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 500 }}>
                  Custom Media URLs
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Provide your own URLs for logo and banner images. Make sure the URLs are publicly
                  accessible.
                </Typography>

                {/* Custom Banner URL */}
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Custom Banner URL"
                    value={customBannerUrl}
                    onChange={(e) => setCustomBannerUrl(e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                    helperText="Enter a URL for your banner image (recommended size: 1200x300px)"
                    InputProps={{
                      startAdornment: <Link sx={{ mr: 1, color: "text.secondary" }} />,
                      endAdornment: customBannerUrl && (
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedBannerUrl(customBannerUrl);
                            setCustomBannerUrl("");
                          }}
                          sx={{ ml: 1 }}
                        >
                          Apply
                        </Button>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root.Mui-focused": {
                        "& fieldset": { borderColor: primaryColor },
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: primaryColor,
                      },
                    }}
                  />
                  {customBannerUrl && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: "background.default", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Preview:
                      </Typography>
                      <Box
                        sx={{
                          mt: 0.5,
                          height: 60,
                          backgroundImage: `url(${customBannerUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          borderRadius: 1,
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                        onError={() => {
                          setErrorMessage(
                            "Invalid banner URL. Please check the URL and try again.",
                          );
                          setShowError(true);
                        }}
                      />
                    </Box>
                  )}
                </Box>

                {/* Custom Logo URL */}
                <Box>
                  <TextField
                    fullWidth
                    label="Custom Logo URL"
                    value={customLogoUrl}
                    onChange={(e) => setCustomLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    helperText="Enter a URL for your logo image (recommended size: 200x200px)"
                    InputProps={{
                      startAdornment: <Link sx={{ mr: 1, color: "text.secondary" }} />,
                      endAdornment: customLogoUrl && (
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedLogoUrl(customLogoUrl);
                            setCustomLogoUrl("");
                          }}
                          sx={{ ml: 1 }}
                        >
                          Apply
                        </Button>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root.Mui-focused": {
                        "& fieldset": { borderColor: primaryColor },
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: primaryColor,
                      },
                    }}
                  />
                  {customLogoUrl && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: "background.default", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Preview:
                      </Typography>
                      <Box
                        sx={{
                          mt: 0.5,
                          width: 60,
                          height: 60,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "background.paper",
                          borderRadius: 1,
                          border: `1px solid ${theme.palette.divider}`,
                          p: 1,
                        }}
                      >
                        <img
                          src={customLogoUrl}
                          alt="Logo preview"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                          }}
                          onError={() => {
                            setErrorMessage(
                              "Invalid logo URL. Please check the URL and try again.",
                            );
                            setShowError(true);
                          }}
                        />
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Clear Custom URLs Button */}
                {(selectedLogoUrl || selectedBannerUrl) && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setSelectedLogoUrl(null);
                        setSelectedBannerUrl(null);
                        setCustomLogoUrl("");
                        setCustomBannerUrl("");
                      }}
                      startIcon={<AddPhotoAlternate />}
                    >
                      Clear All Media
                    </Button>
                  </Box>
                )}
              </Box>

              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  startIcon={isSavingSettings ? <CircularProgress size={16} /> : <Save />}
                  onClick={handleSaveSettings}
                  disabled={!hasSettingsChanges || isSavingSettings}
                  sx={{
                    bgcolor: primaryColor,
                    "&:hover": {
                      bgcolor: alpha(primaryColor, 0.9),
                    },
                  }}
                >
                  {isSavingSettings ? "Saving..." : "Save Visual Identity"}
                </Button>
              </Box>
            </Box>
          )}

          {/* Access & Invitations Tab */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Access & Invitations
              </Typography>

              <RadioGroup
                value={accessType}
                onChange={(e) => setAccessType(e.target.value as "domain" | "invite")}
              >
                <Card
                  sx={{
                    mb: 2,
                    p: 3,
                    cursor: isDomainValid ? "pointer" : "not-allowed",
                    opacity: isDomainValid ? 1 : 0.6,
                    border: `2px solid ${
                      accessType === "domain" ? primaryColor : alpha(theme.palette.divider, 0.3)
                    }`,
                    transition: "all 0.2s",
                    bgcolor: accessType === "domain" ? alpha(primaryColor, 0.02) : "transparent",
                  }}
                  onClick={() => isDomainValid && setAccessType("domain")}
                >
                  <FormControlLabel
                    value="domain"
                    control={
                      <Radio
                        disabled={!isDomainValid}
                        sx={{ color: primaryColor, "&.Mui-checked": { color: primaryColor } }}
                      />
                    }
                    label={
                      <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Domain color={accessType === "domain" ? "primary" : "action"} />
                          <Typography variant="subtitle1">
                            Allow anyone from @{currentWorkspace?.domain || "yourdomain.com"}
                          </Typography>
                          {domainValidationLoading && <CircularProgress size={16} sx={{ ml: 1 }} />}
                          {!domainValidationLoading && isDomainValid && (
                            <CheckCircle
                              sx={{ fontSize: 16, color: theme.palette.success.main, ml: 1 }}
                            />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {isDomainValid
                            ? "Anyone with an email from this domain can automatically join"
                            : domainValidationReason ||
                              "This domain is not eligible for automatic access"}
                        </Typography>
                      </Box>
                    }
                  />
                </Card>

                <Card
                  sx={{
                    p: 3,
                    cursor: "pointer",
                    border: `2px solid ${
                      accessType === "invite" ? primaryColor : alpha(theme.palette.divider, 0.3)
                    }`,
                    transition: "all 0.2s",
                    bgcolor: accessType === "invite" ? alpha(primaryColor, 0.02) : "transparent",
                  }}
                  onClick={() => setAccessType("invite")}
                >
                  <FormControlLabel
                    value="invite"
                    control={
                      <Radio
                        sx={{ color: primaryColor, "&.Mui-checked": { color: primaryColor } }}
                      />
                    }
                    label={
                      <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Lock color={accessType === "invite" ? "primary" : "action"} />
                          <Typography variant="subtitle1">Invite Only</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Only people you invite can join this workspace
                        </Typography>
                      </Box>
                    }
                  />
                </Card>
              </RadioGroup>

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> Changing access settings will affect how new members can
                  join your workspace. Existing members will not be affected.
                </Typography>
              </Alert>

              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  startIcon={isSavingAccess ? <CircularProgress size={16} /> : <Save />}
                  onClick={handleSaveAccess}
                  disabled={!hasAccessChanges || isSavingAccess}
                  sx={{
                    bgcolor: primaryColor,
                    "&:hover": {
                      bgcolor: alpha(primaryColor, 0.9),
                    },
                  }}
                >
                  {isSavingAccess ? "Saving..." : "Save Access Settings"}
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: "100%" }}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: "100%" }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
