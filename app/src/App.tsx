import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Chrome } from "./pages/chrome/Chrome";

import { RouterProvider, createHashRouter } from "react-router-dom";
import ErrorPage from "./pages/ErrorPage";
import { Folders } from "./pages/Folders";
import { DrawerProvider } from "./components/DrawerContext";

const router = createHashRouter([
  {
    path: "/",
    element: (
      <DrawerProvider>
        <Chrome />
      </DrawerProvider>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/:folder_id?",
        element: <Folders />,
      },
    ],
  },
]);

const queryClient = new QueryClient();
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
