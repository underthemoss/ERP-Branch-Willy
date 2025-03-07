import { Box, CssBaseline } from "@mui/joy";

import SideNav from "./SideNav";
import { ContentTypesConfigProvider } from "@/lib/content-types/ContentTypesConfigProvider";
import { getContentTypeConfig } from "@/services/ContentTypeRepository";

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
  breadcrumbs,
  modal,
}: Readonly<{
  children: React.ReactNode;
  breadcrumbs: React.ReactNode;
  modal: React.ReactNode;
  searchParams: any;
}>) {
  return (
    <Box
      display="flex"
      flex={1}
      flexDirection={"column"}
      height={"100%"}
      maxHeight={"100%"}
    >
      {modal}
      <Box flex={1} display={"flex"} overflow={"hidden"}>
        <Box
          display={"flex"}
          width={240}
          sx={{
            backgroundColor: "#FBFCFE",
            borderRight: 1,
            borderColor: "#dfdfdf",
          }}
          overflow={"scroll"}
        >
          <SideNav />
        </Box>
        <Box
          flex={1}
          // overflow={"scroll"}
          sx={{
            overflowY: "scroll",
            overflowX: "hidden",
          }}
          display={"flex"}
          flexDirection={"column"}
        >
          <Box>{breadcrumbs}</Box>
          <Box display={"flex"} flex={1}>
            {/* <ContentTypesConfigProvider
              contentTypesConfig={await getContentTypeConfig()}
            > */}
              {children}
            {/* </ContentTypesConfigProvider> */}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
