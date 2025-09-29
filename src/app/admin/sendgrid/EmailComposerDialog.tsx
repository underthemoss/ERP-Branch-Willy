"use client";

import { graphql } from "@/graphql";
import { usePreviewEmailTemplateLazyQuery } from "@/graphql/hooks";
import { useNotification } from "@/providers/NotificationProvider";
import {
  ContentCopyOutlined,
  DataObjectOutlined,
  DesktopWindowsOutlined,
  EmailOutlined,
  PhoneIphoneOutlined,
  RefreshOutlined,
  TabletOutlined,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  DialogContent,
  DialogTitle,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Modal,
  ModalClose,
  ModalDialog,
  Textarea,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/joy";
import { useEffect, useState } from "react";

// GraphQL Query for Email Preview
graphql(`
  query PreviewEmailTemplate(
    $title: String!
    $content: String!
    $subtitle: String
    $bannerImgUrl: String
    $iconUrl: String
    $primaryCtaText: String
    $primaryCtaUrl: String
    $secondaryCtaText: String
    $secondaryCtaUrl: String
  ) {
    admin {
      previewEmailTemplate(
        title: $title
        content: $content
        subtitle: $subtitle
        bannerImgUrl: $bannerImgUrl
        iconUrl: $iconUrl
        primaryCtaText: $primaryCtaText
        primaryCtaUrl: $primaryCtaUrl
        secondaryCtaText: $secondaryCtaText
        secondaryCtaUrl: $secondaryCtaUrl
      ) {
        html
      }
    }
  }
`);

interface EmailComposerDialogProps {
  open: boolean;
  onClose: () => void;
}

type DeviceType = "desktop" | "tablet" | "mobile";

const DEVICE_SIZES: Record<DeviceType, { width: string; height: string; label: string }> = {
  desktop: { width: "100%", height: "600px", label: "Desktop" },
  tablet: { width: "768px", height: "600px", label: "Tablet (768px)" },
  mobile: { width: "375px", height: "600px", label: "Mobile (375px)" },
};

export default function EmailComposerDialog({ open, onClose }: EmailComposerDialogProps) {
  const { notifySuccess, notifyError } = useNotification();
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop");

  // Form fields
  const [title, setTitle] = useState("Welcome to Our Platform!");
  const [subtitle, setSubtitle] = useState("Your journey starts here");
  const [content, setContent] = useState(
    "We're excited to have you on board! This is a sample email body that you can customize. Feel free to add more content here to see how it looks in the preview.",
  );
  const [bannerImgUrl, setBannerImgUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [primaryCtaText, setPrimaryCtaText] = useState("Get Started");
  const [primaryCtaUrl, setPrimaryCtaUrl] = useState("https://example.com/get-started");
  const [secondaryCtaText, setSecondaryCtaText] = useState("Learn More");
  const [secondaryCtaUrl, setSecondaryCtaUrl] = useState("https://example.com/learn-more");

  // Preview HTML state
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // GraphQL query
  const [previewEmailTemplate] = usePreviewEmailTemplateLazyQuery({
    onCompleted: (data) => {
      if (data?.admin?.previewEmailTemplate?.html) {
        setPreviewHtml(data.admin.previewEmailTemplate.html);
        setIsPreviewLoading(false);
      }
    },
    onError: (error) => {
      notifyError(`Failed to generate preview: ${error.message}`);
      setIsPreviewLoading(false);
    },
  });

  // Generate preview when form fields change
  useEffect(() => {
    if (open && title && content) {
      const debounceTimer = setTimeout(() => {
        generatePreview();
      }, 500); // Debounce for 500ms

      return () => clearTimeout(debounceTimer);
    }
  }, [
    open,
    title,
    subtitle,
    content,
    bannerImgUrl,
    iconUrl,
    primaryCtaText,
    primaryCtaUrl,
    secondaryCtaText,
    secondaryCtaUrl,
  ]);

  const generatePreview = async () => {
    setIsPreviewLoading(true);
    await previewEmailTemplate({
      variables: {
        title,
        content,
        subtitle: subtitle || undefined,
        bannerImgUrl: bannerImgUrl || undefined,
        iconUrl: iconUrl || undefined,
        primaryCtaText: primaryCtaText || undefined,
        primaryCtaUrl: primaryCtaUrl || undefined,
        secondaryCtaText: secondaryCtaText || undefined,
        secondaryCtaUrl: secondaryCtaUrl || undefined,
      },
    });
  };

  const handleCopyHtml = () => {
    if (previewHtml) {
      navigator.clipboard.writeText(previewHtml);
      notifySuccess("HTML copied to clipboard");
    }
  };

  const handleCopyArgs = () => {
    const args = {
      title,
      content,
      ...(subtitle && { subtitle }),
      ...(bannerImgUrl && { bannerImgUrl }),
      ...(iconUrl && { iconUrl }),
      ...(primaryCtaText && { primaryCtaText }),
      ...(primaryCtaUrl && { primaryCtaUrl }),
      ...(secondaryCtaText && { secondaryCtaText }),
      ...(secondaryCtaUrl && { secondaryCtaUrl }),
    };
    navigator.clipboard.writeText(JSON.stringify(args, null, 2));
    notifySuccess("Arguments copied to clipboard as JSON");
  };

  const handleRefreshPreview = () => {
    generatePreview();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        sx={{
          width: { xs: "95vw", md: "90vw", lg: "85vw" },
          maxWidth: "1600px",
          height: { xs: "95vh", md: "90vh" },
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ModalClose />
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <EmailOutlined />
            Email Template Preview
          </Box>
        </DialogTitle>

        <DialogContent sx={{ overflow: "hidden", p: 3 }}>
          <Box sx={{ display: "flex", gap: 3, height: "100%" }}>
            {/* Form Fields */}
            <Box sx={{ flex: 1, overflow: "auto", pr: 2 }}>
              <Typography level="title-md" sx={{ mb: 2 }}>
                Email Content
              </Typography>

              <FormControl sx={{ mb: 2 }}>
                <FormLabel>Title *</FormLabel>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter email title..."
                  required
                />
              </FormControl>

              <FormControl sx={{ mb: 2 }}>
                <FormLabel>Subtitle</FormLabel>
                <Input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Optional subtitle..."
                />
              </FormControl>

              <FormControl sx={{ mb: 3 }}>
                <FormLabel>Content *</FormLabel>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  minRows={6}
                  maxRows={12}
                  placeholder="Enter your email message..."
                  required
                />
              </FormControl>

              <Typography level="title-md" sx={{ mb: 2 }}>
                Images (Optional)
              </Typography>

              <FormControl sx={{ mb: 2 }}>
                <FormLabel>Banner Image URL</FormLabel>
                <Input
                  value={bannerImgUrl}
                  onChange={(e) => setBannerImgUrl(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                />
              </FormControl>

              <FormControl sx={{ mb: 3 }}>
                <FormLabel>Icon/Logo URL</FormLabel>
                <Input
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </FormControl>

              <Typography level="title-md" sx={{ mb: 2 }}>
                Call-to-Action Buttons (Optional)
              </Typography>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                <FormControl>
                  <FormLabel>Primary Button Text</FormLabel>
                  <Input
                    value={primaryCtaText}
                    onChange={(e) => setPrimaryCtaText(e.target.value)}
                    placeholder="Get Started"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Primary Button URL</FormLabel>
                  <Input
                    value={primaryCtaUrl}
                    onChange={(e) => setPrimaryCtaUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </FormControl>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <FormControl>
                  <FormLabel>Secondary Button Text</FormLabel>
                  <Input
                    value={secondaryCtaText}
                    onChange={(e) => setSecondaryCtaText(e.target.value)}
                    placeholder="Learn More"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Secondary Button URL</FormLabel>
                  <Input
                    value={secondaryCtaUrl}
                    onChange={(e) => setSecondaryCtaUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </FormControl>
              </Box>
            </Box>

            {/* Live Preview */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography level="title-md">Live Preview</Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <ToggleButtonGroup
                    value={deviceType}
                    onChange={(_, value) => value && setDeviceType(value as DeviceType)}
                    size="sm"
                  >
                    <Button value="mobile" size="sm">
                      <PhoneIphoneOutlined />
                    </Button>
                    <Button value="tablet" size="sm">
                      <TabletOutlined />
                    </Button>
                    <Button value="desktop" size="sm">
                      <DesktopWindowsOutlined />
                    </Button>
                  </ToggleButtonGroup>
                  <Tooltip title="Refresh Preview">
                    <IconButton
                      size="sm"
                      variant="outlined"
                      onClick={handleRefreshPreview}
                      disabled={isPreviewLoading}
                    >
                      <RefreshOutlined />
                    </IconButton>
                  </Tooltip>
                  <Button
                    size="sm"
                    variant="outlined"
                    startDecorator={<DataObjectOutlined />}
                    onClick={handleCopyArgs}
                  >
                    Copy Args
                  </Button>
                  <Button
                    size="sm"
                    variant="outlined"
                    startDecorator={<ContentCopyOutlined />}
                    onClick={handleCopyHtml}
                    disabled={!previewHtml}
                  >
                    Copy HTML
                  </Button>
                </Box>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  bgcolor: "background.level1",
                  borderRadius: "sm",
                  p: 2,
                  overflow: "auto",
                  position: "relative",
                }}
              >
                {isPreviewLoading ? (
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <CircularProgress />
                    <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                      Generating preview...
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: deviceType === "desktop" ? "100%" : DEVICE_SIZES[deviceType].width,
                      height: "100%",
                      border: "2px solid",
                      borderColor: "divider",
                      borderRadius: "md",
                      overflow: "hidden",
                      bgcolor: "background.surface",
                      boxShadow: "lg",
                    }}
                  >
                    {deviceType !== "desktop" && (
                      <Box
                        sx={{
                          height: "24px",
                          bgcolor: "background.level2",
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography level="body-xs" sx={{ color: "text.secondary" }}>
                          {DEVICE_SIZES[deviceType].label}
                        </Typography>
                      </Box>
                    )}
                    <Box
                      sx={{
                        width: "100%",
                        height: deviceType !== "desktop" ? "calc(100% - 24px)" : "100%",
                        overflow: "auto",
                        bgcolor: "white",
                      }}
                    >
                      {previewHtml ? (
                        <iframe
                          srcDoc={previewHtml}
                          style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                            background: "white",
                          }}
                          sandbox="allow-same-origin"
                          title="Email Preview"
                        />
                      ) : (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            p: 3,
                          }}
                        >
                          <Typography
                            level="body-md"
                            sx={{ color: "text.secondary", textAlign: "center" }}
                          >
                            Enter email content to see preview
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </ModalDialog>
    </Modal>
  );
}
