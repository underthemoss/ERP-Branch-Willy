// App.tsx
import * as React from "react";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import AspectRatio from "@mui/joy/AspectRatio";
import Typography from "@mui/joy/Typography";
import Box from "@mui/joy/Box";
import { ColumnType } from "../../../../../../prisma/generated/mongo";
import { Button, CardActions, CardOverflow } from "@mui/joy";

interface ColumnTypeDef {
  id: ColumnType | string;
  title: string;
  description: string;
  svg: React.ReactNode;
}

const columnTypes: ColumnTypeDef[] = [
  {
    id: "single_line_of_text",
    title: "Single Line of Text",
    description: "A short text field.",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        // stroke="currentColor"
        strokeWidth="2"
      >
        {/* Represents text as a horizontal line */}
        <line x1="4" y1="12" x2="20" y2="12" />
      </svg>
    ),
  },
  {
    id: "multi_line_text",
    title: "Multi Line Text",
    description: "A long text field that can span multiple lines.",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        // stroke="currentColor"
        strokeWidth="2"
      >
        {/* <rect x="0" y="0" width="24" height="24" fill="white" /> */}
        {/* Multiple lines representing text */}
        <line x1="4" y1="7" x2="20" y2="7" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="17" x2="20" y2="17" />
      </svg>
    ),
  },
  {
    id: "user",
    title: "User",
    description: "A reference to a user.",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        // stroke="currentColor"
        strokeWidth="2"
      >
        {/* A simple user avatar */}
        <circle cx="12" cy="8" r="4" />
        <path d="M6 20c0-4 4-6 6-6s6 2 6 6" />
      </svg>
    ),
  },
  {
    id: "integer",
    title: "Integer",
    description: "A number field.",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
      >
        {/* Using a text element to display a number */}
        <text x="4" y="18" fontFamily="Arial" fontSize="16" fill="currentColor">
          123
        </text>
      </svg>
    ),
  },
  {
    id: "date",
    title: "Date",
    description: "A calendar date selection.",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        // stroke="currentColor"
        strokeWidth="2"
      >
        {/* A simple calendar icon */}
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: "lookup",
    title: "Lookup",
    description: "A reference to another record.",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        // stroke="currentColor"
        strokeWidth="2"
      >
        {/* A magnifying glass icon */}
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    id: "img_url",
    title: "Image URL",
    description: "A reference to an image.",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        // stroke="currentColor"
        strokeWidth="2"
      >
        {/* An image icon with a frame and a mountain/polyline */}
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    id: "location",
    title: "Location",
    description: "A geographical location.",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        // stroke="currentColor"
        strokeWidth="2"
      >
        {/* A location pin icon */}
        <path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "formula",
    title: "Formula",
    description: "Perform basic math on sibling columns.",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        // stroke="currentColor"
        strokeWidth="0.5"
      >
        {/* White background */}
        {/* <rect x="0" y="0" width="24" height="24" fill="white" /> */}
        {/* A simple text representation for a formula */}
        <text
          x="12"
          y="16"
          textAnchor="middle"
          fontFamily="Arial"
          fontSize="12"
          fill="currentColor"
        >
          f(x)
        </text>
      </svg>
    ),
  },
  {
    id: "email",
    title: "Email",
    description: "An email address field.",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        // stroke="currentColor"
        strokeWidth="2"
      >
        {/* An envelope icon */}
        <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
        <polyline points="3,4 12,13 21,4" />
      </svg>
    ),
  },
  {
    id: "polygon",
    title: "Polygon",
    description: "A geographical polygon.",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        // stroke="currentColor"
        strokeWidth="2"
      >
        {/* <rect x="0" y="0" width="24" height="24" fill="white" /> */}
        {/* A hexagon shape */}
        <polygon
          points="12,2 22,8 22,16 12,22 2,16 2,8"
          fill="none"
          // stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
  },
  {
    id: "attachment",
    title: "Attachment",
    description: "A file attachment field.",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        // stroke="currentColor"
        strokeWidth="2"
      >
        {/* <rect x="0" y="0" width="24" height="24" fill="white" /> */}
        {/* A paperclip-like shape */}
        <path d="M18 6l-8 8a3 3 0 0 1-4.24-4.24l8-8a5 5 0 0 1 7.07 7.07l-8 8" />
      </svg>
    ),
  },
  {
    id: "rollup",
    title: "Rollup",
    description: "A rollup column that aggregates child values.",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        // stroke="currentColor"
        strokeWidth="2"
      >
        {/* <rect x="0" y="0" width="24" height="24" fill="white" /> */}
        {/* A simple bar chart representation */}
        <rect
          x="4"
          y="10"
          width="3"
          height="10"
          // stroke="currentColor"
          fill="none"
          strokeWidth="2"
        />
        <rect
          x="10"
          y="6"
          width="3"
          height="14"
          // stroke="currentColor"
          fill="none"
          strokeWidth="2"
        />
        <rect
          x="16"
          y="2"
          width="3"
          height="18"
          // stroke="currentColor"
          fill="none"
          strokeWidth="2"
        />
      </svg>
    ),
  },
  {
    id: "date_and_time",
    title: "Date and Time",
    description: "A column type for selecting both date and time.",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        // stroke="currentColor"
        strokeWidth="1.5"
      >
        {/* White background */}
        {/* <rect x="0" y="0" width="24" height="24" fill="white" /> */}
        {/* Calendar outline */}
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="16" y1="2" x2="16" y2="6" />
        {/* Clock overlay in the bottom-right corner */}
        <circle
          cx="17"
          cy="17"
          r="3"
          fill="none"
          // stroke="currentColor"
          strokeWidth="1.2"
        />
        <line
          x1="17"
          y1="17"
          x2="17"
          y2="15"
          // stroke="currentColor"
          strokeWidth="1.5"
        />
        <line
          x1="17"
          y1="17"
          x2="19"
          y2="17"
          // stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
];

const ColCard: React.FC<{
  id: ColumnType | string;
  title: string;
  description: string;
  svgIcon: React.ReactNode;
  enabled: boolean;
  onSelect: (col: ColumnType | null | string) => void;
  hidden: boolean;
  isSelected: boolean;
}> = ({
  title,
  description,
  svgIcon,
  enabled,
  onSelect,
  id,
  hidden,
  isSelected,
}) => {
  return (
    <Card
      data-resizable
      sx={{
        textAlign: "center",
        alignItems: "center",
        width: 190,
        display: hidden ? "none" : undefined,

        // visibility: hidden ? "hidden" : undefined,
        // opacity: 0,
        // transition: "visibility 0s, opacity 0.5s linear",
        // transition: "width 0.3s ease",
        // to make the demo resizable
        // overflow: "auto",
        // overflowX: "hidden",
        // resize: "horizontal",
        "--icon-size": "80px",
        opacity: enabled ? 1 : 0.5,
      }}
    >
      <CardOverflow variant="solid" color="primary">
        <AspectRatio
          variant="outlined"
          color="primary"
          ratio="1"
          sx={{
            m: "auto",
            transform: "translateY(50%)",
            borderRadius: "50%",
            width: "var(--icon-size)",
            boxShadow: "lg",
            bgcolor: "background.surface",
            position: "relative",
            stroke: "currentcolor",
            fill: "currentcolor",
          }}
        >
          <div>
            {svgIcon}
            {/* <BakeryDiningIcon color="warning" sx={{ fontSize: '4rem' }} /> */}
          </div>
        </AspectRatio>
      </CardOverflow>
      <Typography level="title-lg" sx={{ mt: "calc(var(--icon-size) / 2)" }}>
        {title}
      </Typography>
      <CardContent sx={{ maxWidth: "40ch" }}>{description}</CardContent>
      <CardActions
        orientation="vertical"
        buttonFlex={1}
        sx={{
          "--Button-radius": "40px",
          width: "clamp(min(100%, 160px), 50%, min(100%, 200px))",
        }}
      >
        <Button
          variant="solid"
          color="primary"
          disabled={!enabled}
          onClick={() => onSelect(isSelected ? null : id)}
        >
          {isSelected ? "Change" : "Select"}
        </Button>
      </CardActions>
    </Card>
  );
};

const ColumnTypes: React.FC<{
  value: ColumnType | null;
  onChange: (value: ColumnType | null | string) => void;
}> = ({ value, onChange }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        p: 2,
        justifyContent: "center",
      }}
    >
      {/* <input type="hidden" name="type" value={col} /> */}
      {columnTypes.map((col) => {
        return (
          <ColCard
            key={col.id}
            id={col.id}
            title={col.title}
            description={col.description}
            svgIcon={col.svg}
            enabled={Object.keys(ColumnType).includes(col.id)}
            onSelect={onChange}
            hidden={value ? col.id !== value : false}
            isSelected={col.id === value}
          />
        );
      })}
    </Box>
  );
};

export default ColumnTypes;
