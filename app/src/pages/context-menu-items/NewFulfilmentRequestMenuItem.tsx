import { ListItemDecorator, MenuItem } from "@mui/joy";


import FulfilmentOrderIcon from "@mui/icons-material/LocalShipping";

export const NewFulfilmentRequestMenuItem = () => {
  return (
    <MenuItem>
      <ListItemDecorator>
        <FulfilmentOrderIcon />
      </ListItemDecorator>
      Fulfilment Order
    </MenuItem>
  );
};
