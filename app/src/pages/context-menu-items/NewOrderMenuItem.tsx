import { ListItemDecorator, MenuItem } from "@mui/joy";

import OrderIcon from "@mui/icons-material/Article";
import { useDrawer } from "../../components/DrawerContext";
import { NewOrderForm } from "../../forms/NewOrder.form";
import { useParams } from "react-router-dom";

export const NewOrderMenuItem = () => {
  const { addDrawer, removeDrawer } = useDrawer();
  const { folder_id = "" } = useParams();
  return (
    <MenuItem
      onClick={() =>
        addDrawer(
          "new-order",
          <NewOrderForm
            folderId={folder_id}
            onCancel={() => {
              removeDrawer("new-order");
            }}
            onSuccess={() => {
              removeDrawer("new-order");
            }}
          />
        )
      }
    >
      <ListItemDecorator>
        <OrderIcon />
      </ListItemDecorator>
      Order
    </MenuItem>
  );
};
