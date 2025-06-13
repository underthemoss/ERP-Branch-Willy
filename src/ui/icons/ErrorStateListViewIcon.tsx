import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { SvgIcon, SvgIconProps } from "@mui/material";
import React from "react";

/**
 * ErrorStateListViewIcon
 * Large error icon for empty/error state views.
 */
const ErrorStateListViewIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon
    component={ErrorOutlineIcon}
    sx={{
      width: 104,
      height: 101,
      color: "error.main",
      ...props.sx,
    }}
    {...props}
  />
);

export default ErrorStateListViewIcon;
