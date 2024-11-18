import { Routing } from "express-zod-api";
import { k8sRoutes } from "./k8s/k8s";
import { foldersRoutes } from "./folders/folders";

// import { usersRoutes } from "./users/users.routes";
// import { itemsRoutes } from "./items/items.routes";
// import { assetsRoutes } from "./assets/assets.routes";
// import { pimRoutes } from "./pim/pim.routes";
// import { ordersRoutes } from "./orders/orders.routes";
// import { entitiesRoutes } from "./entities/entities.routes";
// import { eventsRoutes } from "./events/events.routes";

const routing: Routing = {
  api: {
    ...k8sRoutes,
    ...foldersRoutes,
    // v1: {
    //   //   ...usersRoutes,
    //   //   ...itemsRoutes,
    //   //   ...assetsRoutes,
    //   //   ...pimRoutes,
    //   //   ...ordersRoutes,
    //   //   ...entitiesRoutes,
    //   //   ...eventsRoutes,
    // },
  },
};
export default routing;
