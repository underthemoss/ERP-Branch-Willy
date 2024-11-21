import { ListItemDecorator, MenuItem } from "@mui/joy";

import PaymentIcon from "@mui/icons-material/Payment";

export const NewPaymentOrderMenuItem = () => {
  return (
    <MenuItem>
      <ListItemDecorator>
        <PaymentIcon />
      </ListItemDecorator>
      Payment Order
    </MenuItem>
  );
};
