"use client";

import { ChevronRightOutlined, HomeOutlined } from "@mui/icons-material";
import { Breadcrumbs, Link as JoyLink, Typography } from "@mui/joy";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  type?: string;
  id?: string;
}

interface ResourceBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function ResourceBreadcrumbs({ items }: ResourceBreadcrumbsProps) {
  return (
    <Breadcrumbs
      separator={<ChevronRightOutlined sx={{ fontSize: 16 }} />}
      sx={{ p: 0, fontSize: 13 }}
    >
      <JoyLink
        component={Link}
        href="/admin/authz"
        underline="hover"
        color="neutral"
        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
      >
        <HomeOutlined sx={{ fontSize: 16 }} />
        Authz
      </JoyLink>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        if (isLast || !item.href) {
          return (
            <Typography
              key={index}
              level="body-sm"
              sx={{
                fontFamily: item.type || item.id ? "monospace" : "inherit",
                fontWeight: isLast ? 600 : 400,
              }}
            >
              {item.type && item.id ? (
                <>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "text.secondary",
                    }}
                  >
                    {item.type}:
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      fontWeight: 600,
                      ml: 0.5,
                    }}
                  >
                    {item.id}
                  </Typography>
                </>
              ) : (
                item.label
              )}
            </Typography>
          );
        }

        return (
          <JoyLink
            key={index}
            component={Link}
            href={item.href}
            underline="hover"
            color="neutral"
            sx={{
              fontFamily: item.type || item.id ? "monospace" : "inherit",
              fontSize: 13,
            }}
          >
            {item.type && item.id ? (
              <>
                <Typography
                  component="span"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    color: "text.secondary",
                  }}
                >
                  {item.type}:
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    fontWeight: 500,
                    ml: 0.5,
                  }}
                >
                  {item.id}
                </Typography>
              </>
            ) : (
              item.label
            )}
          </JoyLink>
        );
      })}
    </Breadcrumbs>
  );
}
