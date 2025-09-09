"use client";

import { useAuth0ErpUser } from "@/hooks/useAuth0ErpUser";
import { useOrganization } from "@/providers/OrganizationProvider";
import { useWorkspace } from "@/providers/WorkspaceProvider";
import {
  AdminPanelSettings,
  ArrowForward,
  Business,
  Dashboard,
  Warning,
} from "@mui/icons-material";
import {
  Alert,
  alpha,
  Box,
  BoxProps,
  Button,
  Card,
  CardContent,
  Container,
  Fade,
  Grid,
  LinearProgress,
  Typography,
  useTheme,
} from "@mui/material";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

interface AppContextResolverProps {
  children: ReactNode;
}

// Shared gradient background container component
interface GradientBackgroundContainerProps extends BoxProps {
  children: ReactNode;
  withPadding?: boolean;
}

function GradientBackgroundContainer({
  children,
  withPadding = false,
  sx,
  ...props
}: GradientBackgroundContainerProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.main,
          0.05,
        )} 0%, ${alpha(theme.palette.primary.dark, 0.1)} 100%)`,
        ...(withPadding && { py: 4 }),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}

export function AppContextResolver({ children }: AppContextResolverProps) {
  const theme = useTheme();
  const pathname = usePathname();
  const { user } = useAuth0ErpUser();
  const {
    organizations,
    selectedOrganization,
    isLoadingOrganizations,
    isSelectingOrganization,
    organizationError,
    selectOrganization,
    clearOrganization,
    clearOrganizationError,
  } = useOrganization();
  const { workspaces, isLoadingWorkspaces, selectWorkspace } = useWorkspace();

  // Check if user is platform admin accessing admin routes
  const isAdminRoute = pathname?.startsWith("/admin");
  const isPlatformAdminOnAdminRoute = user?.isPlatformAdmin && isAdminRoute;

  // Check if we already have an organization from the token that's valid
  // We need to check both that there's an orgId and that it matches the selected org
  // to avoid infinite loading when the org in token is invalid
  const hasValidOrgInToken =
    user?.orgId &&
    user?.hasOrganization(user.orgId) &&
    (selectedOrganization === user.orgId || (!selectedOrganization && !organizationError));

  // Skip organization selection for platform admins on admin routes
  if (isPlatformAdminOnAdminRoute && !isLoadingOrganizations) {
    return <>{children}</>;
  }

  // Initial auth loading state
  if (isLoadingOrganizations) {
    return (
      <GradientBackgroundContainer>
        {/* Content overlay */}
        <Box
          sx={{
            textAlign: "center",
            width: "100%",
            maxWidth: 400,
            px: 3,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
            <Image
              src="/logo-erp.png"
              alt="EquipmentShare"
              width={200}
              height={60}
              priority
              style={{ objectFit: "contain", width: "auto", height: "auto" }}
            />
          </Box>
          <Box sx={{ position: "relative" }}>
            <LinearProgress
              sx={{
                mb: 3,
                height: 3,
                borderRadius: 1.5,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                "& .MuiLinearProgress-bar": {
                  borderRadius: 1.5,
                  background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                },
              }}
            />
          </Box>
          <Fade in={true} timeout={800}>
            <Typography variant="body1" sx={{ color: "text.secondary", fontWeight: 500 }}>
              Setting up your environment
            </Typography>
          </Fade>
        </Box>
      </GradientBackgroundContainer>
    );
  }

  // Organization selection loading state
  if (isSelectingOrganization) {
    return (
      <GradientBackgroundContainer>
        {/* Content overlay */}
        <Box
          sx={{
            textAlign: "center",
            width: "100%",
            maxWidth: 400,
            px: 3,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
            <Image
              src="/logo-erp.png"
              alt="EquipmentShare"
              width={200}
              height={60}
              priority
              style={{ objectFit: "contain", width: "auto", height: "auto" }}
            />
          </Box>
          <Box sx={{ position: "relative" }}>
            <LinearProgress
              sx={{
                mb: 3,
                height: 3,
                borderRadius: 1.5,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                "& .MuiLinearProgress-bar": {
                  borderRadius: 1.5,
                  background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                },
              }}
            />
          </Box>
          <Fade in={true} timeout={800}>
            <Typography variant="body1" sx={{ color: "text.secondary", fontWeight: 500 }}>
              Connecting to organization
            </Typography>
          </Fade>
        </Box>
      </GradientBackgroundContainer>
    );
  }

  // Organization error screen (permission or other errors)
  if (organizationError) {
    const availableOrgs = organizations?.filter((org) => org.id !== organizationError.orgId) || [];

    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.05,
          )} 0%, ${alpha(theme.palette.primary.dark, 0.1)} 100%)`,
          py: 4,
        }}
      >
        <Container maxWidth="md">
          <Box>
            <Box sx={{ textAlign: "center", mb: 6 }}>
              <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
                <Image
                  src="/logo-erp.png"
                  alt="EquipmentShare"
                  width={200}
                  height={60}
                  priority
                  style={{ objectFit: "contain", width: "auto", height: "auto" }}
                />
              </Box>

              {/* Error Alert */}
              <Alert
                severity="error"
                icon={<Warning />}
                sx={{
                  mb: 4,
                  maxWidth: 600,
                  mx: "auto",
                  "& .MuiAlert-icon": {
                    fontSize: 28,
                  },
                }}
              >
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  Access Denied
                </Typography>
                <Typography variant="body2">{organizationError.message}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Please contact your administrator if you believe you should have access.
                </Typography>
              </Alert>

              {availableOrgs.length > 0 && (
                <>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary", mb: 2 }}>
                    Select a different organization
                  </Typography>
                  <Typography variant="body1" sx={{ color: "text.secondary", mb: 1 }}>
                    You have access to the following organizations:
                  </Typography>
                </>
              )}
            </Box>

            {availableOrgs.length > 0 ? (
              <Grid container spacing={3}>
                {/* Platform Admin Card */}
                {user?.isPlatformAdmin && (
                  <Grid size={{ xs: 12 }}>
                    <Card
                      sx={{
                        cursor: "pointer",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        border: `2px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                        background: `linear-gradient(135deg, ${alpha(
                          theme.palette.warning.main,
                          0.05,
                        )} 0%, ${alpha(theme.palette.warning.dark, 0.1)} 100%)`,
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: theme.shadows[8],
                          borderColor: theme.palette.warning.main,
                          "& .arrow-icon": {
                            transform: "translateX(4px)",
                          },
                        },
                      }}
                      onClick={() => (window.location.href = "/admin")}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Box
                              sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: `linear-gradient(135deg, ${alpha(
                                  theme.palette.warning.main,
                                  0.2,
                                )} 0%, ${alpha(theme.palette.warning.dark, 0.3)} 100%)`,
                              }}
                            >
                              <AdminPanelSettings sx={{ color: theme.palette.warning.dark }} />
                            </Box>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                Platform Administration
                              </Typography>
                              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                Access the platform admin dashboard
                              </Typography>
                            </Box>
                          </Box>
                          <ArrowForward
                            className="arrow-icon"
                            sx={{
                              color: "text.secondary",
                              transition: "transform 0.3s ease",
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Available Organization Cards */}
                {availableOrgs.map((org, index) => (
                  <Grid key={org.id} size={{ xs: 12, sm: 6 }}>
                    <Card
                      sx={{
                        cursor: "pointer",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: theme.shadows[8],
                          borderColor: theme.palette.primary.main,
                          "& .arrow-icon": {
                            transform: "translateX(4px)",
                          },
                        },
                      }}
                      onClick={() => {
                        clearOrganizationError();
                        selectOrganization(org.id);
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Box
                              sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: `linear-gradient(135deg, ${alpha(
                                  theme.palette.primary.main,
                                  0.1,
                                )} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
                              }}
                            >
                              <Business sx={{ color: theme.palette.primary.main }} />
                            </Box>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                {org.display_name || org.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                Organization ID: {org.id}
                              </Typography>
                            </Box>
                          </Box>
                          <ArrowForward
                            className="arrow-icon"
                            sx={{
                              color: "text.secondary",
                              transition: "transform 0.3s ease",
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: "center" }}>
                {user?.isPlatformAdmin ? (
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<AdminPanelSettings />}
                    onClick={() => (window.location.href = "/admin")}
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                      "&:hover": {
                        background: `linear-gradient(135deg, ${theme.palette.warning.dark}, ${theme.palette.warning.main})`,
                      },
                    }}
                  >
                    Go to Platform Administration
                  </Button>
                ) : (
                  <Typography variant="body1" sx={{ color: "text.secondary" }}>
                    You don&apos;t have access to any other organizations.
                    <br />
                    Please contact your administrator for assistance.
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Container>
      </Box>
    );
  }

  // Organization selection screen
  // Show if we don't have a valid selected organization and there's no error being displayed
  if (
    !selectedOrganization &&
    !hasValidOrgInToken &&
    organizations &&
    organizations.length >= 1 &&
    !organizationError
  ) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.05,
          )} 0%, ${alpha(theme.palette.primary.dark, 0.1)} 100%)`,
          py: 4,
        }}
      >
        <Container maxWidth="md">
          <Box>
            <Box sx={{ textAlign: "center", mb: 6 }}>
              <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
                <Image
                  src="/logo-erp.png"
                  alt="EquipmentShare"
                  width={200}
                  height={60}
                  priority
                  style={{ objectFit: "contain", width: "auto", height: "auto" }}
                />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600, color: "text.primary", mb: 2 }}>
                Welcome back{user?.name ? `, ${user.name}` : ""}
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                Select your organization to continue
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {/* Platform Admin Card */}
              {user?.isPlatformAdmin && (
                <Grid size={{ xs: 12 }}>
                  <Card
                    sx={{
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      border: `2px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.warning.main,
                        0.05,
                      )} 0%, ${alpha(theme.palette.warning.dark, 0.1)} 100%)`,
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: theme.shadows[8],
                        borderColor: theme.palette.warning.main,
                        "& .arrow-icon": {
                          transform: "translateX(4px)",
                        },
                      },
                    }}
                    onClick={() => (window.location.href = "/admin")}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: `linear-gradient(135deg, ${alpha(
                                theme.palette.warning.main,
                                0.2,
                              )} 0%, ${alpha(theme.palette.warning.dark, 0.3)} 100%)`,
                            }}
                          >
                            <AdminPanelSettings sx={{ color: theme.palette.warning.dark }} />
                          </Box>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                              Platform Administration
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              Access the platform admin dashboard
                            </Typography>
                          </Box>
                        </Box>
                        <ArrowForward
                          className="arrow-icon"
                          sx={{
                            color: "text.secondary",
                            transition: "transform 0.3s ease",
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Organization Cards */}
              {organizations.map((org, index) => (
                <Grid key={org.id} size={{ xs: 12, sm: 6 }}>
                  <Card
                    sx={{
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: theme.shadows[8],
                        borderColor: theme.palette.primary.main,
                        "& .arrow-icon": {
                          transform: "translateX(4px)",
                        },
                      },
                    }}
                    onClick={() => selectOrganization(org.id)}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: `linear-gradient(135deg, ${alpha(
                                theme.palette.primary.main,
                                0.1,
                              )} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
                            }}
                          >
                            <Business sx={{ color: theme.palette.primary.main }} />
                          </Box>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {org.display_name || org.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              Organization ID: {org.id}
                            </Typography>
                          </Box>
                        </Box>
                        <ArrowForward
                          className="arrow-icon"
                          sx={{
                            color: "text.secondary",
                            transition: "transform 0.3s ease",
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      </Box>
    );
  }

  // Workspace loading state
  if (isLoadingWorkspaces) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.05,
          )} 0%, ${alpha(theme.palette.primary.dark, 0.1)} 100%)`,
        }}
      >
        {/* Content overlay */}
        <Box
          sx={{
            textAlign: "center",
            width: "100%",
            maxWidth: 400,
            px: 3,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
            <Image
              src="/logo-erp.png"
              alt="EquipmentShare"
              width={200}
              height={60}
              priority
              style={{ objectFit: "contain", width: "auto", height: "auto" }}
            />
          </Box>
          <Box sx={{ position: "relative" }}>
            <LinearProgress
              sx={{
                mb: 3,
                height: 3,
                borderRadius: 1.5,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                "& .MuiLinearProgress-bar": {
                  borderRadius: 1.5,
                  background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                },
              }}
            />
          </Box>
          <Fade in={true} timeout={800}>
            <Typography variant="body1" sx={{ color: "text.secondary", fontWeight: 500 }}>
              Loading workspaces
            </Typography>
          </Fade>
        </Box>
      </Box>
    );
  }

  // Workspace selection screen
  if (workspaces && workspaces.length > 1) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.05,
          )} 0%, ${alpha(theme.palette.primary.dark, 0.1)} 100%)`,
          py: 4,
        }}
      >
        <Container maxWidth="md">
          <Box>
            <Box sx={{ textAlign: "center", mb: 6 }}>
              <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
                <Image
                  src="/logo-erp.png"
                  alt="EquipmentShare"
                  width={200}
                  height={60}
                  priority
                  style={{ objectFit: "contain", width: "auto", height: "auto" }}
                />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600, color: "text.primary", mb: 2 }}>
                Select a workspace
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                Choose the workspace you&apos;d like to access
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {workspaces.map((workspace, index) => (
                <Grid key={workspace.id || index} size={{ xs: 12, sm: 6 }}>
                  <Card
                    sx={{
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: theme.shadows[8],
                        borderColor: theme.palette.primary.main,
                        "& .arrow-icon": {
                          transform: "translateX(4px)",
                        },
                      },
                    }}
                    onClick={() => workspace.id && selectWorkspace(workspace.id)}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: `linear-gradient(135deg, ${alpha(
                                theme.palette.primary.main,
                                0.1,
                              )} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
                            }}
                          >
                            <Dashboard sx={{ color: theme.palette.primary.main }} />
                          </Box>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {workspace.name || "Unnamed Workspace"}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              Workspace ID: {workspace.id}
                            </Typography>
                          </Box>
                        </Box>
                        <ArrowForward
                          className="arrow-icon"
                          sx={{
                            color: "text.secondary",
                            transition: "transform 0.3s ease",
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      </Box>
    );
  }

  // If we have a selected organization and workspace (or single workspace), render children
  if (selectedOrganization && workspaces) {
    return <>{children}</>;
  }

  // Fallback loading state
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.main,
          0.05,
        )} 0%, ${alpha(theme.palette.primary.dark, 0.1)} 100%)`,
      }}
    >
      {/* Content overlay */}
      <Box
        sx={{
          textAlign: "center",
          width: "100%",
          maxWidth: 400,
          px: 3,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
          <Image
            src="/logo-erp.png"
            alt="EquipmentShare"
            width={200}
            height={60}
            priority
            style={{ objectFit: "contain", width: "auto", height: "auto" }}
          />
        </Box>
        <Box sx={{ position: "relative" }}>
          <LinearProgress
            sx={{
              mb: 3,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              "& .MuiLinearProgress-bar": {
                borderRadius: 1.5,
                background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
              },
            }}
          />
        </Box>
        <Fade in={true} timeout={800}>
          <Typography variant="body1" sx={{ color: "text.secondary", fontWeight: 500 }}>
            Loading
          </Typography>
        </Fade>
      </Box>
    </Box>
  );
}
