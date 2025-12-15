"use client";

import { graphql } from "@/graphql";
import { WorkspaceAccessType } from "@/graphql/graphql";
import {
  useCreateWorkspaceMutation,
  useGetBrandByDomainLazyQuery,
  useValidEnterpriseDomainLazyQuery,
} from "@/graphql/hooks";
import { useAuth0ErpUser } from "@/hooks/useAuth0ErpUser";
import { useNotification } from "@/providers/NotificationProvider";
import {
  Business,
  CheckCircle,
  Domain,
  Facebook,
  Instagram,
  Language,
  LinkedIn,
  Lock,
  Public,
  Twitter,
  Verified,
} from "@mui/icons-material";
import {
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
  Skeleton,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import Image from "next/image";
import { useEffect, useState } from "react";

// Define the GraphQL queries
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

// Define the GraphQL mutation for creating workspace
graphql(`
  mutation CreateWorkspace(
    $name: String!
    $accessType: WorkspaceAccessType!
    $description: String
    $brandId: String
    $logoUrl: String
    $bannerImageUrl: String
    $archived: Boolean
  ) {
    createWorkspace(
      name: $name
      accessType: $accessType
      description: $description
      brandId: $brandId
      logoUrl: $logoUrl
      bannerImageUrl: $bannerImageUrl
      archived: $archived
    ) {
      id
      name
      description
      accessType
      domain
      logoUrl
      bannerImageUrl
      brandId
    }
  }
`);

interface CreateWorkspaceFlowProps {
  onComplete: (workspaceId: string) => void;
  onCancel: () => void;
}

export function CreateWorkspaceFlow({ onComplete, onCancel }: CreateWorkspaceFlowProps) {
  const theme = useTheme();
  const { user } = useAuth0ErpUser();
  const { notifySuccess, notifyError } = useNotification();
  const [step, setStep] = useState<"brand" | "details" | "settings" | "creating">("brand");

  // GraphQL query hooks
  const [getBrandByDomain, { loading, data, error }] = useGetBrandByDomainLazyQuery({
    fetchPolicy: "cache-and-network",
  });

  const [
    validateEnterpriseDomain,
    { loading: domainValidationLoading, data: domainValidationData, error: domainValidationError },
  ] = useValidEnterpriseDomainLazyQuery({
    fetchPolicy: "cache-and-network",
  });

  // GraphQL mutation hook
  const [createWorkspace, { loading: createLoading }] = useCreateWorkspaceMutation();

  // Form state
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [accessType, setAccessType] = useState<"domain" | "invite">("invite");
  const [domainRestriction, setDomainRestriction] = useState("");
  const [selectedBannerUrl, setSelectedBannerUrl] = useState<string | null>(null);
  const [selectedLogoUrl, setSelectedLogoUrl] = useState<string | null>(null);

  // Extract domain from user email
  const userDomain = user?.email ? user.email.split("@")[1] : "";

  // Brand data from API
  const brandData = data?.getBrandByDomain;

  // Domain validation data
  const domainValidation = domainValidationData?.validEnterpriseDomain;
  const isDomainValid = domainValidation?.isValid ?? false;
  const domainValidationReason = domainValidation?.reason;

  // Extract brand colors
  const primaryColor =
    brandData?.colors?.find((c: any) => c.type === "primary")?.hex || theme.palette.primary.main;
  const secondaryColor =
    brandData?.colors?.find((c: any) => c.type === "secondary")?.hex ||
    theme.palette.secondary.main;

  // Get best logo format - logos is now an array
  const firstLogo = brandData?.logos?.[0];
  const logoUrl =
    firstLogo?.formats?.find((f: any) => f.format === "png")?.src ||
    firstLogo?.formats?.[0]?.src ||
    firstLogo?.url;

  // Get all available banners and logos
  const availableBanners = brandData?.images?.filter((img: any) => img.type === "banner") || [];
  const availableLogos = brandData?.logos || [];

  // Get default banner and logo
  const defaultBannerUrl =
    availableBanners[0]?.formats?.find(
      (f: any) => f.format === "jpeg" || f.format === "jpg" || f.format === "png",
    )?.src || availableBanners[0]?.url;

  const defaultLogoUrl = logoUrl;

  // Use selected or default values
  const coverPhotoUrl = selectedBannerUrl || defaultBannerUrl;
  const displayLogoUrl = selectedLogoUrl || defaultLogoUrl;

  useEffect(() => {
    if (userDomain) {
      getBrandByDomain({ variables: { domain: userDomain } });
      validateEnterpriseDomain({ variables: { domain: userDomain } });
      setDomainRestriction(userDomain);
    }
  }, [userDomain, getBrandByDomain, validateEnterpriseDomain]);

  useEffect(() => {
    if (brandData) {
      setWorkspaceName(brandData.name || "");
      // Don't pre-populate description - let user fill it
      // Set default selections
      if (defaultBannerUrl && !selectedBannerUrl) {
        setSelectedBannerUrl(defaultBannerUrl);
      }
      if (defaultLogoUrl && !selectedLogoUrl) {
        setSelectedLogoUrl(defaultLogoUrl);
      }
    }
  }, [brandData, defaultBannerUrl, defaultLogoUrl, selectedBannerUrl, selectedLogoUrl]);

  const handleCreateWorkspace = async () => {
    setStep("creating");

    try {
      const { data } = await createWorkspace({
        variables: {
          name: workspaceName,
          description: workspaceDescription || undefined,
          accessType:
            accessType === "domain"
              ? WorkspaceAccessType.SameDomain
              : WorkspaceAccessType.InviteOnly,
          brandId: brandData?.id || undefined,
          logoUrl: selectedLogoUrl || defaultLogoUrl || undefined,
          bannerImageUrl: selectedBannerUrl || defaultBannerUrl || undefined,
          archived: false,
        },
        refetchQueries: ["WorkspaceProviderListWorkspaces"],
        awaitRefetchQueries: true,
      });

      if (data?.createWorkspace?.id) {
        notifySuccess("Workspace created successfully!");
        onComplete(data.createWorkspace.id);
      } else {
        // Handle error case - workspace creation failed
        notifyError(
          "Failed to create workspace. Please try again or contact support if the issue persists.",
        );
        setStep("settings"); // Go back to last step
      }
    } catch (error: any) {
      console.error("Error creating workspace:", error);

      // Parse error message for user-friendly display
      let userMessage = "An unexpected error occurred while creating your workspace.";

      if (error?.message) {
        if (error.message.includes("duplicate") || error.message.includes("already exists")) {
          userMessage =
            "A workspace with this name already exists. Please choose a different name.";
        } else if (error.message.includes("permission") || error.message.includes("unauthorized")) {
          userMessage =
            "You don't have permission to create a workspace. Please contact your administrator.";
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
          userMessage = "Network error. Please check your connection and try again.";
        } else if (error.message.includes("validation")) {
          userMessage =
            "Please check your input and ensure all required fields are filled correctly.";
        }
      }

      notifyError(userMessage);
      setStep("settings"); // Go back to last step
    }
  };

  if (step === "creating") {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${alpha(
            primaryColor,
            0.05,
          )} 0%, ${alpha(primaryColor, 0.1)} 100%)`,
        }}
      >
        <Card sx={{ maxWidth: 400, width: "100%", textAlign: "center", p: 4 }}>
          <CircularProgress size={60} sx={{ mb: 3, color: primaryColor }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            Creating Your Workspace
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Setting up {workspaceName}...
          </Typography>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${alpha(
          primaryColor,
          0.03,
        )} 0%, ${alpha(primaryColor, 0.08)} 100%)`,
        py: 4,
      }}
    >
      <Card sx={{ maxWidth: 700, width: "100%", mx: 2, overflow: "hidden" }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              {step === "brand"
                ? "Organization Setup"
                : step === "details"
                  ? "Workspace Details"
                  : "Configure Access"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {step === "brand"
                ? "We've detected your organization. Customize how your workspace will appear."
                : step === "details"
                  ? "Enter your workspace name and description. You'll be the administrator of this workspace."
                  : "Choose who can join your workspace"}
            </Typography>
          </Box>

          {loading && step === "brand" ? (
            <Box>
              <Skeleton variant="text" height={56} sx={{ mb: 2 }} />
              <Skeleton variant="text" height={100} sx={{ mb: 2 }} />
            </Box>
          ) : (
            <>
              {/* Workspace Preview Card - Show on all steps */}
              {(brandData || error) && (
                <Card
                  sx={{
                    mb: 3,
                    overflow: "hidden",
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    boxShadow: theme.shadows[2],
                  }}
                >
                  {/* Preview Banner */}
                  {coverPhotoUrl && (
                    <Box
                      sx={{
                        height: 120,
                        backgroundImage: `url(${coverPhotoUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        position: "relative",
                      }}
                    />
                  )}

                  {/* Preview Content */}
                  <Box sx={{ p: 2, bgcolor: "background.paper" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                      <Avatar
                        src={displayLogoUrl || undefined}
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: alpha(primaryColor, 0.1),
                          "& img": { objectFit: "contain", p: 0.5 },
                        }}
                      >
                        {workspaceName?.[0] || "W"}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {workspaceName || "Workspace Name"}
                          </Typography>
                          {accessType === "domain" ? (
                            <Domain sx={{ fontSize: 18, color: primaryColor }} />
                          ) : (
                            <Lock sx={{ fontSize: 16, color: "text.secondary" }} />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {workspaceDescription || brandData?.domain || "company.com"}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Social Links */}
                    {brandData?.links && brandData.links.length > 0 && (
                      <Box sx={{ display: "flex", gap: 1, mt: 2, mb: 1 }}>
                        {brandData.links.map((link: any) => {
                          const linkName = link.name.toLowerCase();
                          let Icon = Language;

                          if (linkName === "twitter" || linkName === "x") Icon = Twitter;
                          else if (linkName === "facebook") Icon = Facebook;
                          else if (linkName === "instagram") Icon = Instagram;
                          else if (linkName === "linkedin") Icon = LinkedIn;

                          return (
                            <Box
                              key={link.name}
                              component="a"
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 32,
                                height: 32,
                                borderRadius: 1,
                                bgcolor: alpha(theme.palette.divider, 0.08),
                                color: "text.secondary",
                                transition: "all 0.2s",
                                textDecoration: "none",
                                "&:hover": {
                                  bgcolor: alpha(primaryColor, 0.1),
                                  color: primaryColor,
                                  transform: "translateY(-2px)",
                                },
                              }}
                            >
                              <Icon sx={{ fontSize: 18 }} />
                            </Box>
                          );
                        })}
                      </Box>
                    )}

                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", display: "block", mt: 1 }}
                    >
                      Preview of your workspace appearance
                    </Typography>
                  </Box>
                </Card>
              )}

              {step === "brand" && (
                <Box>
                  {error && (
                    <Box
                      sx={{
                        p: 2,
                        mb: 3,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.warning.main, 0.04),
                        border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        We couldn&apos;t auto-detect your organization details. Please proceed with
                        manual setup.
                      </Typography>
                    </Box>
                  )}

                  {/* Customization Options */}
                  {brandData && (availableBanners.length > 0 || availableLogos.length > 0) && (
                    <Box
                      sx={{
                        p: 2,
                        mb: 3,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.info.main, 0.04),
                        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 500 }}>
                        Customize Appearance
                      </Typography>

                      {/* Banner Selection */}
                      {availableBanners.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mb: 1 }}
                          >
                            Choose Banner
                          </Typography>
                          <Grid container spacing={1}>
                            {availableBanners.map((banner: any, index: number) => {
                              const bannerUrl =
                                banner.formats?.find(
                                  (f: any) =>
                                    f.format === "jpeg" || f.format === "jpg" || f.format === "png",
                                )?.src || banner.url;

                              return (
                                <Grid size={{ xs: "auto" }} key={index}>
                                  <Box
                                    onClick={() => setSelectedBannerUrl(bannerUrl)}
                                    sx={{
                                      width: 100,
                                      height: 40,
                                      backgroundImage: `url(${bannerUrl})`,
                                      backgroundSize: "cover",
                                      backgroundPosition: "center",
                                      borderRadius: 1,
                                      border: `2px solid ${
                                        selectedBannerUrl === bannerUrl
                                          ? primaryColor
                                          : alpha(theme.palette.divider, 0.3)
                                      }`,
                                      cursor: "pointer",
                                      transition: "all 0.2s",
                                      "&:hover": {
                                        borderColor: primaryColor,
                                        transform: "scale(1.05)",
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
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mb: 1 }}
                          >
                            Choose Logo
                          </Typography>
                          <Grid container spacing={1}>
                            {availableLogos.map((logo: any, index: number) => {
                              const logoOptionUrl =
                                logo.formats?.find(
                                  (f: any) => f.format === "png" || f.format === "svg",
                                )?.src || logo.url;

                              if (!logoOptionUrl) return null;

                              return (
                                <Grid size={{ xs: "auto" }} key={index}>
                                  <Box
                                    onClick={() => setSelectedLogoUrl(logoOptionUrl)}
                                    sx={{
                                      width: 60,
                                      height: 60,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      bgcolor: "background.paper",
                                      borderRadius: 1,
                                      border: `2px solid ${
                                        selectedLogoUrl === logoOptionUrl
                                          ? primaryColor
                                          : alpha(theme.palette.divider, 0.3)
                                      }`,
                                      cursor: "pointer",
                                      transition: "all 0.2s",
                                      p: 1,
                                      "&:hover": {
                                        borderColor: primaryColor,
                                        transform: "scale(1.05)",
                                      },
                                    }}
                                  >
                                    <img
                                      src={logoOptionUrl}
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
                </Box>
              )}

              {step === "details" && (
                <Box>
                  {/* Workspace Name */}
                  <TextField
                    fullWidth
                    label="Workspace Name"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    margin="normal"
                    required
                    helperText="This is how your workspace will appear to members"
                    sx={{
                      "& .MuiOutlinedInput-root.Mui-focused": {
                        "& fieldset": {
                          borderColor: primaryColor,
                        },
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: primaryColor,
                      },
                    }}
                  />

                  {/* Description */}
                  <TextField
                    fullWidth
                    label="Description (Optional)"
                    value={workspaceDescription}
                    onChange={(e) => setWorkspaceDescription(e.target.value)}
                    margin="normal"
                    multiline
                    rows={3}
                    helperText="Brief description of your workspace"
                    sx={{
                      "& .MuiOutlinedInput-root.Mui-focused": {
                        "& fieldset": {
                          borderColor: primaryColor,
                        },
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: primaryColor,
                      },
                    }}
                  />
                </Box>
              )}

              {step === "settings" && (
                <Box>
                  {/* Access Type Selection */}
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                    Workspace Access
                  </Typography>

                  <RadioGroup
                    value={accessType}
                    onChange={(e) => setAccessType(e.target.value as "domain" | "invite")}
                  >
                    <Card
                      sx={{
                        mb: 2,
                        p: 2,
                        cursor: isDomainValid ? "pointer" : "not-allowed",
                        opacity: isDomainValid ? 1 : 0.6,
                        border: `2px solid ${
                          accessType === "domain" ? primaryColor : alpha(theme.palette.divider, 0.3)
                        }`,
                        transition: "all 0.2s",
                        bgcolor:
                          accessType === "domain" ? alpha(primaryColor, 0.02) : "transparent",
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
                              <Typography variant="subtitle2">
                                Allow anyone from @{domainRestriction || "yourdomain.com"}
                              </Typography>
                              {domainValidationLoading && (
                                <CircularProgress size={16} sx={{ ml: 1 }} />
                              )}
                              {!domainValidationLoading && isDomainValid && (
                                <CheckCircle
                                  sx={{ fontSize: 16, color: theme.palette.success.main, ml: 1 }}
                                />
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {isDomainValid
                                ? "Anyone with an email from this domain can automatically join"
                                : domainValidationReason ||
                                  "This domain is not eligible for automatic access"}
                            </Typography>
                          </Box>
                        }
                      />

                      {!isDomainValid && domainValidationReason && (
                        <Box
                          sx={{
                            mt: 2,
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                            border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                          }}
                        >
                          <Typography variant="caption" color="warning.main">
                            <strong>Domain not eligible:</strong> {domainValidationReason}
                          </Typography>
                        </Box>
                      )}
                    </Card>

                    <Card
                      sx={{
                        p: 2,
                        cursor: "pointer",
                        border: `2px solid ${
                          accessType === "invite" ? primaryColor : alpha(theme.palette.divider, 0.3)
                        }`,
                        transition: "all 0.2s",
                        bgcolor:
                          accessType === "invite" ? alpha(primaryColor, 0.02) : "transparent",
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
                              <Typography variant="subtitle2">Invite Only</Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Only people you invite can join this workspace
                            </Typography>
                          </Box>
                        }
                      />
                    </Card>
                  </RadioGroup>

                  {/* Additional Settings */}
                  <Box
                    sx={{
                      mt: 3,
                      p: 2,
                      bgcolor: alpha(theme.palette.info.main, 0.04),
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      <strong>Note:</strong> You can change these settings later in workspace
                      settings. As the workspace creator, you&apos;ll be the administrator.
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Actions */}
              <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={
                    step === "brand"
                      ? onCancel
                      : step === "details"
                        ? () => setStep("brand")
                        : () => setStep("details")
                  }
                  fullWidth
                  sx={{
                    borderColor: alpha(primaryColor, 0.5),
                    color: primaryColor,
                    "&:hover": {
                      borderColor: primaryColor,
                      bgcolor: alpha(primaryColor, 0.04),
                    },
                  }}
                >
                  {step === "brand" ? "Cancel" : "Back"}
                </Button>
                <Button
                  variant="contained"
                  onClick={
                    step === "brand"
                      ? () => setStep("details")
                      : step === "details"
                        ? () => setStep("settings")
                        : handleCreateWorkspace
                  }
                  fullWidth
                  disabled={(step === "details" && !workspaceName.trim()) || createLoading}
                  sx={{
                    bgcolor: primaryColor,
                    "&:hover": {
                      bgcolor: alpha(primaryColor, 0.9),
                    },
                    "&:disabled": {
                      bgcolor: alpha(primaryColor, 0.3),
                    },
                  }}
                >
                  {step === "brand" || step === "details"
                    ? "Next"
                    : createLoading
                      ? "Creating..."
                      : "Create Workspace"}
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
