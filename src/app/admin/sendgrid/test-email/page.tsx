"use client";

import { graphql } from "@/graphql";
import { useSendTemplatedEmailMutation, useSendTestEmailMutation } from "@/graphql/hooks";
import { useNotification } from "@/providers/NotificationProvider";
import { ArrowBackOutlined, SendOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  FormControl,
  FormLabel,
  Input,
  Option,
  Select,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Textarea,
  Typography,
} from "@mui/joy";
import { useRouter } from "next/navigation";
import { useState } from "react";

// GraphQL Mutations
graphql(`
  mutation SendTestEmail($to: String!, $subject: String, $message: String) {
    admin {
      sendTestEmail(to: $to, subject: $subject, message: $message) {
        success
        message
        error
      }
    }
  }
`);

graphql(`
  mutation SendTemplatedEmail(
    $to: String!
    $subject: String!
    $title: String!
    $content: String!
    $subtitle: String
    $replyTo: String
    $primaryCtaText: String
    $primaryCtaUrl: String
    $secondaryCtaText: String
    $secondaryCtaUrl: String
  ) {
    admin {
      sendTemplatedEmail(
        to: $to
        subject: $subject
        title: $title
        content: $content
        subtitle: $subtitle
        replyTo: $replyTo
        primaryCtaText: $primaryCtaText
        primaryCtaUrl: $primaryCtaUrl
        secondaryCtaText: $secondaryCtaText
        secondaryCtaUrl: $secondaryCtaUrl
      ) {
        success
        message
        error
      }
    }
  }
`);

export default function TestEmailPage() {
  const router = useRouter();
  const { notifySuccess, notifyError } = useNotification();
  const [emailType, setEmailType] = useState<"simple" | "templated">("simple");

  // Simple email state
  const [simpleForm, setSimpleForm] = useState({
    to: "",
    subject: "Test Email from ES ERP",
    message: "This is a test email to verify your SendGrid configuration is working correctly.",
  });

  // Templated email state
  const [templatedForm, setTemplatedForm] = useState({
    to: "",
    subject: "",
    title: "",
    content: "",
    subtitle: "",
    replyTo: "",
    primaryCtaText: "",
    primaryCtaUrl: "",
    secondaryCtaText: "",
    secondaryCtaUrl: "",
  });

  const [sendTestEmail, { loading: simpleLoading }] = useSendTestEmailMutation({
    onCompleted: (data) => {
      if (data?.admin?.sendTestEmail?.success) {
        notifySuccess(data.admin.sendTestEmail.message || "Test email sent successfully!");
        // Reset form
        setSimpleForm({
          to: "",
          subject: "Test Email from ES ERP",
          message:
            "This is a test email to verify your SendGrid configuration is working correctly.",
        });
      } else {
        notifyError(data?.admin?.sendTestEmail?.error || "Failed to send test email");
      }
    },
    onError: (error) => {
      notifyError(`Failed to send test email: ${error.message}`);
    },
  });

  const [sendTemplatedEmail, { loading: templatedLoading }] = useSendTemplatedEmailMutation({
    onCompleted: (data) => {
      if (data?.admin?.sendTemplatedEmail?.success) {
        notifySuccess(
          data.admin.sendTemplatedEmail.message || "Templated email sent successfully!",
        );
        // Reset form
        setTemplatedForm({
          to: "",
          subject: "",
          title: "",
          content: "",
          subtitle: "",
          replyTo: "",
          primaryCtaText: "",
          primaryCtaUrl: "",
          secondaryCtaText: "",
          secondaryCtaUrl: "",
        });
      } else {
        notifyError(data?.admin?.sendTemplatedEmail?.error || "Failed to send templated email");
      }
    },
    onError: (error) => {
      notifyError(`Failed to send templated email: ${error.message}`);
    },
  });

  const handleSendSimpleEmail = () => {
    if (!simpleForm.to) {
      notifyError("Please enter a recipient email address");
      return;
    }

    sendTestEmail({
      variables: {
        to: simpleForm.to,
        subject: simpleForm.subject || undefined,
        message: simpleForm.message || undefined,
      },
    });
  };

  const handleSendTemplatedEmail = () => {
    if (
      !templatedForm.to ||
      !templatedForm.subject ||
      !templatedForm.title ||
      !templatedForm.content
    ) {
      notifyError("Please fill in all required fields");
      return;
    }

    sendTemplatedEmail({
      variables: {
        to: templatedForm.to,
        subject: templatedForm.subject,
        title: templatedForm.title,
        content: templatedForm.content,
        subtitle: templatedForm.subtitle || undefined,
        replyTo: templatedForm.replyTo || undefined,
        primaryCtaText: templatedForm.primaryCtaText || undefined,
        primaryCtaUrl: templatedForm.primaryCtaUrl || undefined,
        secondaryCtaText: templatedForm.secondaryCtaText || undefined,
        secondaryCtaUrl: templatedForm.secondaryCtaUrl || undefined,
      },
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <Button
          variant="outlined"
          color="neutral"
          startDecorator={<ArrowBackOutlined />}
          onClick={() => router.push("/admin/sendgrid")}
        >
          Back
        </Button>
        <Box>
          <Typography level="h2">Send Test Email</Typography>
          <Typography level="body-md" sx={{ color: "text.secondary" }}>
            Send test emails to verify your SendGrid configuration
          </Typography>
        </Box>
      </Box>

      {/* Email Type Tabs */}
      <Card>
        <Tabs
          value={emailType}
          onChange={(_, value) => setEmailType(value as "simple" | "templated")}
        >
          <TabList>
            <Tab value="simple">Simple Email</Tab>
            <Tab value="templated">Templated Email</Tab>
          </TabList>

          {/* Simple Email Tab */}
          <TabPanel value="simple">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                Send a simple test email with a plain text message
              </Typography>

              <FormControl required>
                <FormLabel>Recipient Email</FormLabel>
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={simpleForm.to}
                  onChange={(e) => setSimpleForm({ ...simpleForm, to: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Subject</FormLabel>
                <Input
                  placeholder="Test Email Subject"
                  value={simpleForm.subject}
                  onChange={(e) => setSimpleForm({ ...simpleForm, subject: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Message</FormLabel>
                <Textarea
                  placeholder="Enter your test message here..."
                  minRows={4}
                  value={simpleForm.message}
                  onChange={(e) => setSimpleForm({ ...simpleForm, message: e.target.value })}
                />
              </FormControl>

              <Button
                startDecorator={<SendOutlined />}
                onClick={handleSendSimpleEmail}
                loading={simpleLoading}
                disabled={!simpleForm.to}
              >
                Send Simple Test Email
              </Button>
            </Box>
          </TabPanel>

          {/* Templated Email Tab */}
          <TabPanel value="templated">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                Send a professional HTML email using the template system
              </Typography>

              {/* Required Fields */}
              <Typography level="title-md" sx={{ mt: 2 }}>
                Required Fields
              </Typography>

              <FormControl required>
                <FormLabel>Recipient Email</FormLabel>
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={templatedForm.to}
                  onChange={(e) => setTemplatedForm({ ...templatedForm, to: e.target.value })}
                />
              </FormControl>

              <FormControl required>
                <FormLabel>Email Subject</FormLabel>
                <Input
                  placeholder="Email subject line"
                  value={templatedForm.subject}
                  onChange={(e) => setTemplatedForm({ ...templatedForm, subject: e.target.value })}
                />
              </FormControl>

              <FormControl required>
                <FormLabel>Email Title</FormLabel>
                <Input
                  placeholder="Title displayed in the email header"
                  value={templatedForm.title}
                  onChange={(e) => setTemplatedForm({ ...templatedForm, title: e.target.value })}
                />
              </FormControl>

              <FormControl required>
                <FormLabel>Email Content (HTML)</FormLabel>
                <Textarea
                  placeholder="Enter your HTML content here..."
                  minRows={6}
                  value={templatedForm.content}
                  onChange={(e) => setTemplatedForm({ ...templatedForm, content: e.target.value })}
                />
                <Typography level="body-xs" sx={{ mt: 0.5 }}>
                  You can use HTML tags like &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, etc.
                </Typography>
              </FormControl>

              {/* Optional Fields */}
              <Typography level="title-md" sx={{ mt: 2 }}>
                Optional Fields
              </Typography>

              <FormControl>
                <FormLabel>Subtitle</FormLabel>
                <Input
                  placeholder="Optional subtitle below the title"
                  value={templatedForm.subtitle}
                  onChange={(e) => setTemplatedForm({ ...templatedForm, subtitle: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Reply-To Email</FormLabel>
                <Input
                  type="email"
                  placeholder="reply-to@example.com"
                  value={templatedForm.replyTo}
                  onChange={(e) => setTemplatedForm({ ...templatedForm, replyTo: e.target.value })}
                />
              </FormControl>

              {/* Primary CTA */}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 2 }}>
                <FormControl>
                  <FormLabel>Primary Button Text</FormLabel>
                  <Input
                    placeholder="e.g., View Details"
                    value={templatedForm.primaryCtaText}
                    onChange={(e) =>
                      setTemplatedForm({ ...templatedForm, primaryCtaText: e.target.value })
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Primary Button URL</FormLabel>
                  <Input
                    placeholder="https://example.com/action"
                    value={templatedForm.primaryCtaUrl}
                    onChange={(e) =>
                      setTemplatedForm({ ...templatedForm, primaryCtaUrl: e.target.value })
                    }
                  />
                </FormControl>
              </Box>

              {/* Secondary CTA */}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 2 }}>
                <FormControl>
                  <FormLabel>Secondary Button Text</FormLabel>
                  <Input
                    placeholder="e.g., Learn More"
                    value={templatedForm.secondaryCtaText}
                    onChange={(e) =>
                      setTemplatedForm({ ...templatedForm, secondaryCtaText: e.target.value })
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Secondary Button URL</FormLabel>
                  <Input
                    placeholder="https://example.com/info"
                    value={templatedForm.secondaryCtaUrl}
                    onChange={(e) =>
                      setTemplatedForm({ ...templatedForm, secondaryCtaUrl: e.target.value })
                    }
                  />
                </FormControl>
              </Box>

              <Button
                startDecorator={<SendOutlined />}
                onClick={handleSendTemplatedEmail}
                loading={templatedLoading}
                disabled={
                  !templatedForm.to ||
                  !templatedForm.subject ||
                  !templatedForm.title ||
                  !templatedForm.content
                }
              >
                Send Templated Email
              </Button>
            </Box>
          </TabPanel>
        </Tabs>
      </Card>
    </Box>
  );
}
