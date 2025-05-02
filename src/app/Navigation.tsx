"use client";

import BarChartIcon from "@mui/icons-material/BarChart";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DescriptionIcon from "@mui/icons-material/Description";
import LayersIcon from "@mui/icons-material/Layers";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import type { Navigation } from "@toolpad/core"; // purely for typing
import { useParams } from "next/navigation";
import * as React from "react";

export const useNavigation: () => Navigation = () => {
  const { workspace_id } = useParams<{ workspace_id: string }>();
  return [
    {
      kind: "header",
      title: "Main items",
    },
    {
      segment: `app/${workspace_id}/dashboard`,
      title: "Dashboard",
      icon: <DashboardIcon />,
    },
    {
      segment: `app/${workspace_id}/transactions`,
      title: "Transactions",
      icon: <ShoppingCartIcon />,
    },
    {
      kind: "divider",
    },
    {
      kind: "header",
      title: "Analytics",
    },
    {
      segment: "reports",
      title: "Reports",
      icon: <BarChartIcon />,
      children: [
        {
          segment: "sales",
          title: "Sales",
          icon: <DescriptionIcon />,
        },
        {
          segment: "traffic",
          title: "Traffic",
          icon: <DescriptionIcon />,
        },
      ],
    },
    {
      segment: "integrations",
      title: "Integrations",
      icon: <LayersIcon />,
    },
  ];
};
