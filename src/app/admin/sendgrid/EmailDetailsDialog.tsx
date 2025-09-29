"use client";

import { graphql } from "@/graphql";
import { useSendGridEmailDetailsLazyQuery } from "@/graphql/hooks";
import { useNotification } from "@/providers/NotificationProvider";
import {
  CloseOutlined,
  ContentCopyOutlined,
  EmailOutlined,
  HtmlOutlined,
  TextFieldsOutlined,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Modal,
  ModalClose,
  ModalDialog,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Textarea,
  Typography,
} from "@mui/joy";
import { format } from "date-fns";
import { useEffect, useState } from "react";

// GraphQL Query for Email Details
graphql(`
  query SendGridEmailDetails($msgId: String!) {
    admin {
      sendGridEmailDetails(msgId: $msgId) {
        from
        to
        subject
        htmlContent
        plainContent
        status
        timestamp
        msgId
      }
    }
  }
`);

interface EmailDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  msgId: string | null;
  initialData?: {
    email: string;
    event: string;
    timestamp: number;
  };
}

export default function EmailDetailsDialog({
  open,
  onClose,
  msgId,
  initialData,
}: EmailDetailsDialogProps) {
  const { notifyError, notifySuccess } = useNotification();
  const [activeTab, setActiveTab] = useState<"html" | "plain" | "raw">("html");

  const [fetchEmailDetails, { data, loading, error }] = useSendGridEmailDetailsLazyQuery({
    onError: (error) => {
      notifyError(`Failed to load email details: ${error.message}`);
    },
  });

  useEffect(() => {
    if (open && msgId) {
      fetchEmailDetails({
        variables: { msgId },
      });
    }
  }, [open, msgId, fetchEmailDetails]);

  const emailDetails = data?.admin?.sendGridEmailDetails;

  const formatTimestamp = (timestamp: number) => {
    try {
      return format(new Date(timestamp * 1000), "MMM dd, yyyy HH:mm:ss");
    } catch {
      return "—";
    }
  };

  const handleCopyContent = (content: string, type: string) => {
    navigator.clipboard.writeText(content);
    notifySuccess(`${type} content copied to clipboard`);
  };

  const renderHtmlPreview = (htmlContent: string) => {
    // Create a sandboxed iframe to safely render HTML content
    return (
      <Box
        sx={{
          width: "100%",
          height: "400px",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "sm",
          overflow: "hidden",
          bgcolor: "background.surface",
        }}
      >
        <iframe
          srcDoc={htmlContent}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            background: "white",
          }}
          sandbox="allow-same-origin"
          title="Email HTML Preview"
        />
      </Box>
    );
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        sx={{
          width: { xs: "90vw", md: "80vw", lg: "70vw" },
          maxWidth: "1200px",
          height: { xs: "90vh", md: "85vh" },
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ModalClose />
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <EmailOutlined />
            Email Details
          </Box>
        </DialogTitle>

        <DialogContent sx={{ overflow: "auto", p: 0 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography level="body-md" sx={{ color: "danger.500" }}>
                Failed to load email details
              </Typography>
              <Typography level="body-sm" sx={{ color: "text.secondary", mt: 1 }}>
                {error.message}
              </Typography>
            </Box>
          ) : emailDetails ? (
            <Box>
              {/* Email Metadata */}
              <Box sx={{ p: 3, bgcolor: "background.level1" }}>
                <Box sx={{ display: "grid", gap: 2 }}>
                  <Box>
                    <Typography level="body-xs" sx={{ color: "text.secondary", mb: 0.5 }}>
                      Subject
                    </Typography>
                    <Typography level="title-md">{emailDetails.subject}</Typography>
                  </Box>

                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                    <Box>
                      <Typography level="body-xs" sx={{ color: "text.secondary", mb: 0.5 }}>
                        From
                      </Typography>
                      <Typography level="body-sm">{emailDetails.from}</Typography>
                    </Box>
                    <Box>
                      <Typography level="body-xs" sx={{ color: "text.secondary", mb: 0.5 }}>
                        To
                      </Typography>
                      <Typography level="body-sm">{emailDetails.to}</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
                    <Box>
                      <Typography level="body-xs" sx={{ color: "text.secondary", mb: 0.5 }}>
                        Sent At
                      </Typography>
                      <Typography level="body-sm" sx={{ fontFamily: "monospace" }}>
                        {formatTimestamp(emailDetails.timestamp)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography level="body-xs" sx={{ color: "text.secondary", mb: 0.5 }}>
                        Status
                      </Typography>
                      <Chip size="sm" color="success" variant="soft">
                        {emailDetails.status}
                      </Chip>
                    </Box>
                    <Box>
                      <Typography level="body-xs" sx={{ color: "text.secondary", mb: 0.5 }}>
                        Message ID
                      </Typography>
                      <Typography
                        level="body-xs"
                        sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
                      >
                        {emailDetails.msgId}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* Content Tabs */}
              <Box sx={{ p: 3 }}>
                <Tabs
                  value={activeTab}
                  onChange={(_, value) => setActiveTab(value as "html" | "plain" | "raw")}
                >
                  <TabList>
                    <Tab value="html">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <HtmlOutlined />
                        HTML Preview
                      </Box>
                    </Tab>
                    <Tab value="plain">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <TextFieldsOutlined />
                        Plain Text
                      </Box>
                    </Tab>
                    <Tab value="raw">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <HtmlOutlined />
                        Raw HTML
                      </Box>
                    </Tab>
                  </TabList>

                  <TabPanel value="html" sx={{ p: 0, pt: 2 }}>
                    {emailDetails.htmlContent ? (
                      <Box>
                        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                          <Button
                            size="sm"
                            variant="outlined"
                            startDecorator={<ContentCopyOutlined />}
                            onClick={() =>
                              handleCopyContent(emailDetails.htmlContent || "", "HTML")
                            }
                          >
                            Copy HTML
                          </Button>
                        </Box>
                        {renderHtmlPreview(emailDetails.htmlContent)}
                      </Box>
                    ) : (
                      <Typography
                        level="body-sm"
                        sx={{ color: "text.secondary", textAlign: "center", py: 4 }}
                      >
                        No HTML content available
                      </Typography>
                    )}
                  </TabPanel>

                  <TabPanel value="plain" sx={{ p: 0, pt: 2 }}>
                    {emailDetails.plainContent ? (
                      <Box>
                        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                          <Button
                            size="sm"
                            variant="outlined"
                            startDecorator={<ContentCopyOutlined />}
                            onClick={() =>
                              handleCopyContent(emailDetails.plainContent || "", "Plain text")
                            }
                          >
                            Copy Text
                          </Button>
                        </Box>
                        <Textarea
                          value={emailDetails.plainContent}
                          readOnly
                          minRows={15}
                          maxRows={25}
                          sx={{
                            fontFamily: "monospace",
                            fontSize: "13px",
                          }}
                        />
                      </Box>
                    ) : (
                      <Typography
                        level="body-sm"
                        sx={{ color: "text.secondary", textAlign: "center", py: 4 }}
                      >
                        No plain text content available
                      </Typography>
                    )}
                  </TabPanel>

                  <TabPanel value="raw" sx={{ p: 0, pt: 2 }}>
                    {emailDetails.htmlContent ? (
                      <Box>
                        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                          <Button
                            size="sm"
                            variant="outlined"
                            startDecorator={<ContentCopyOutlined />}
                            onClick={() =>
                              handleCopyContent(emailDetails.htmlContent || "", "Raw HTML")
                            }
                          >
                            Copy Raw HTML
                          </Button>
                        </Box>
                        <Textarea
                          value={emailDetails.htmlContent}
                          readOnly
                          minRows={15}
                          maxRows={25}
                          sx={{
                            fontFamily: "monospace",
                            fontSize: "12px",
                          }}
                        />
                      </Box>
                    ) : (
                      <Typography
                        level="body-sm"
                        sx={{ color: "text.secondary", textAlign: "center", py: 4 }}
                      >
                        No HTML content available
                      </Typography>
                    )}
                  </TabPanel>
                </Tabs>
              </Box>
            </Box>
          ) : (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography level="body-md" sx={{ color: "text.secondary" }}>
                No email details available
              </Typography>
            </Box>
          )}
        </DialogContent>
      </ModalDialog>
    </Modal>
  );
}
