import { Box, Typography } from "@mui/material";
import { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { EntityDisplayPage, EntityDisplayPageProps } from "./EntityDisplayPage";

const meta: Meta<typeof EntityDisplayPage> = {
  title: "EntityDisplayPage",
  component: EntityDisplayPage,
};
export default meta;

const mockOverviewFields = [
  { label: "Title", value: "How to Build a Modern Web App" },
  { label: "Status", value: "Published" },
  { label: "Category", value: "Tech" },
];

const mockInfoCards = [
  {
    title: "Author Information",
    content: (
      <Box>
        <Typography>
          Name: <b>Jane Doe</b>
        </Typography>
        <Typography>Email: jane.doe@example.com</Typography>
        <Typography>Bio: Full-stack developer and blogger.</Typography>
      </Box>
    ),
    buttonLabel: "View Author",
    buttonDisabled: true,
  },
  {
    title: "Publication Information",
    content: (
      <Box>
        <Typography>Published: 2025-06-01</Typography>
        <Typography>Last Updated: 2025-06-05</Typography>
        <Typography>Views: 1,234</Typography>
      </Box>
    ),
    buttonLabel: "View Publication",
    buttonDisabled: true,
  },
] as [any, any];

const mockItemsSection = (
  <Box>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
      No comments yet.
    </Typography>
    <Typography variant="caption" color="text.secondary">
      Comments will appear here when available.
    </Typography>
  </Box>
);

const mockMetadata = [
  { label: "ID", value: "blog-12345" },
  { label: "Created At", value: "2025-05-30 10:00" },
  { label: "Updated At", value: "2025-06-05 14:30" },
  { label: "Created By", value: "Jane Doe (jane.doe@example.com)" },
  { label: "Updated By", value: "Jane Doe (jane.doe@example.com)" },
];

const Template: StoryObj<EntityDisplayPageProps> = {
  render: (args) => <EntityDisplayPage {...args} />,
};

export const BlogPost = {
  ...Template,
  args: {
    entityName: "Blog Post",
    entityId: "12345",
    overviewFields: mockOverviewFields,
    infoCards: mockInfoCards,
    itemsSection: mockItemsSection,
    metadata: mockMetadata,
    loading: false,
    error: undefined,
  },
};
