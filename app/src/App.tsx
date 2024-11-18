import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DefaultPage } from "./pages/DefaultPage";

import { RouterProvider, createHashRouter } from "react-router-dom";
import ErrorPage from "./pages/ErrorPage";
import { Folders } from "./pages/Folders";

const router = createHashRouter([
  {
    path: "/",
    element: <DefaultPage />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
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
