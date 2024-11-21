import { ListItemDecorator, MenuItem } from "@mui/joy";

import OrderIcon from "@mui/icons-material/Article";

export const NewOrderMenuItem = () => {
  return (
    <MenuItem>
      <ListItemDecorator>
        <OrderIcon />
      </ListItemDecorator>
      Order
    </MenuItem>
  );
};
