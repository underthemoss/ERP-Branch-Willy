import * as React from "react";
import AspectRatio from "@mui/joy/AspectRatio";
import Link from "@mui/joy/Link";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import Chip from "@mui/joy/Chip";
import Typography from "@mui/joy/Typography";
import { ColumnType } from "../../../prisma/generated/mongo";
import _ from "lodash";
import { AutoImage } from "../AutoImage";
import { useRouter } from "next/navigation";
import { Map, Marker } from "react-map-gl/maplibre";
import {
  Box,
  Button,
  CardActions,
  CardOverflow,
  Skeleton,
  Tooltip,
} from "@mui/joy";
import DeckGL from "@deck.gl/react";
import { NextLink } from "../NextLink";
import { DeleteForever } from "@mui/icons-material";
import { getEntityCardData } from "./actions";

export const EntityCard: React.FC<{
  item_id: string;
}> = ({ item_id }) => {
  const [item, setData] = React.useState<Awaited<
    ReturnType<typeof getEntityCardData>
  > | null>();

  React.useEffect(() => {
    getEntityCardData(item_id).then((d) => {
      setData(d);
    });
  }, [item_id]);

  if (!item) {
    return <Box width={300} height={320}></Box>;
  }

  const imageKey = item?.parent?.column_config.find(
    (c) => c.type === "img_url"
  )?.key;

  const locationKey = item?.parent?.column_config.find(
    (c) => c.type === "location"
  )?.key;

  const image: string = imageKey ? (item?.data as any)[imageKey] : null;
  const location: [number, number] = locationKey
    ? (item?.data as any)[locationKey]
    : null;

  const title = (item?.data as any)["name"];

  return (
    <Card
      sx={{
        textAlign: "center",
        alignItems: "center",
        // width: 343,
        flex: 1,
        // to make the demo resizable
        overflow: "hidden",

        "--icon-size": "100px",
      }}
    >
      {location && (
        <DeckGL
          initialViewState={{
            longitude: location[0],
            latitude: location[1],
            zoom: 13,
            maxZoom: 20,
            pitch: 30,
            // bearing: 30,
          }}
          controller
          height={"100%"}
          // width={100}
        >
          <Map
            reuseMaps
            attributionControl={false}
            mapStyle={
              "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
            }
          >
            {/* <Marker
              key={`marker`}
              longitude={location[0]}
              latitude={location[1]}
              anchor="bottom"
              onClick={(e) => {
                // If we let the click event propagates to the map, it will immediately close the popup
                // with `closeOnClick: true`
                // e.originalEvent.stopPropagation();
                // setPopupInfo(city);
              }}
            >
              <DeleteForever />
            </Marker> */}
          </Map>
        </DeckGL>
      )}
      <CardOverflow variant="solid" color="primary" sx={{ mt: -2 }}>
        <AspectRatio
          variant="outlined"
          color="primary"
          ratio="1"
          sx={{
            m: "auto",
            transform: "translateY(50%)",
            borderRadius: "50%",
            width: "var(--icon-size)",
            boxShadow: "sm",
            bgcolor: "background.surface",
            position: "relative",
          }}
        >
          {image ? (
            <img src={image} alt="" />
          ) : (
            <AutoImage value={item?.id} size={90} />
          )}
        </AspectRatio>
      </CardOverflow>
      <Typography level="title-lg" sx={{ mt: "calc(var(--icon-size) / 2)" }}>
        {title}
      </Typography>
      <CardContent sx={{ maxWidth: "40ch", pointerEvents: "none" }}>
        {item.parent?.column_config?.map((column_config, i) => {
          return (
            <Box key={i} display={"flex"} gap={1}>
              <Typography flex={1} level="title-md" textAlign={"right"}>
                {column_config.label}:
              </Typography>
              <Typography
                flex={1}
                level="body-md"
                textOverflow={"ellipsis"}
                noWrap
                overflow={"hidden"}
                width={200}
                textAlign={"left"}
              >
                {(item.data as any)[column_config.key]}
              </Typography>
            </Box>
          );
        })}
      </CardContent>
      <CardActions
        orientation="vertical"
        buttonFlex={1}
        sx={{
          "--Button-radius": "40px",
          width: "clamp(min(100%, 160px), 50%, min(100%, 200px))",
        }}
      >
        <NextLink href={`/app/item/${item.id}`}>
          <Button variant="solid" color="primary">
            Open
          </Button>
        </NextLink>
      </CardActions>
    </Card>
  );
};

export const EntityCardToolTip: React.FC<{
  item_id: string;
  children: React.ReactElement;
  placement?:
    | "bottom-end"
    | "bottom-start"
    | "bottom"
    | "left-end"
    | "left-start"
    | "left"
    | "right-end"
    | "right-start"
    | "right"
    | "top-end"
    | "top-start"
    | "top";
}> = ({ item_id, children, placement }) => {
  return (
    <Tooltip
      arrow={true}
      placement={placement}
      variant="outlined"
      title={<EntityCard item_id={item_id} />}
    >
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {children}
      </div>
    </Tooltip>
  );
};
