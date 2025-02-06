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
import { Box, Button, CardActions, CardOverflow } from "@mui/joy";
import DeckGL from "@deck.gl/react";
import { NextLink } from "../NextLink";
import { DeleteForever } from "@mui/icons-material";

export default function LookupPickerTooltipContents(props: {
  title: string;
  id: string;
  data: { type: ColumnType; label: string; value: any }[] | undefined;
}) {
  const { push } = useRouter();
  const [[imgCol], rest1] = _.partition(
    props.data,
    (d) => d.type === "img_url"
  );

  const [[locationColumn], rest2] = _.partition(
    rest1,
    (d) => d.type === "location"
  );

  return (
    <Card
      sx={{
        textAlign: "center",
        alignItems: "center",
        width: 343,
        // to make the demo resizable
        overflow: "hidden",

        "--icon-size": "100px",
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {locationColumn && locationColumn.value && (
        <DeckGL
          initialViewState={{
            longitude: locationColumn.value[0],
            latitude: locationColumn.value[1],
            zoom: 13,
            maxZoom: 20,
            pitch: 30,
            bearing: 30,
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
            <Marker
              key={`marker`}
              longitude={locationColumn.value[0]}
              latitude={locationColumn.value[1]}
              anchor="bottom"
              onClick={(e) => {
                // If we let the click event propagates to the map, it will immediately close the popup
                // with `closeOnClick: true`
                // e.originalEvent.stopPropagation();
                // setPopupInfo(city);
              }}
            >
              <DeleteForever />
            </Marker>
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
          {imgCol?.value ? (
            <img src={imgCol?.value} alt="" />
          ) : (
            <AutoImage value={props.id} size={90} />
          )}
        </AspectRatio>
      </CardOverflow>
      <Typography level="title-lg" sx={{ mt: "calc(var(--icon-size) / 2)" }}>
        {props.title}
      </Typography>
      <CardContent sx={{ maxWidth: "40ch", pointerEvents: "none" }}>
        {rest2?.map((d, i) => {
          return (
            <Box key={i} display={"flex"} gap={1}>
              <Typography flex={1} level="title-md" textAlign={"right"}>
                {d.label}:
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
                {d.value}
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
        <NextLink href={`/app/item/${props.id}`}>
          <Button variant="solid" color="primary">
            Open
          </Button>
        </NextLink>
      </CardActions>
    </Card>
  );

  return (
    <Card
      variant="plain"
      orientation="horizontal"
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        push(`/app/item/${props.id}`);
      }}
      sx={{
        width: 320,
        "&:hover": {
          boxShadow: "md",
          borderColor: "neutral.outlinedHoverBorder",
        },
        overflow: "hidden",
      }}
    >
      {imgCol?.value ? (
        <AspectRatio ratio="1" sx={{ width: 90 }}>
          <img src={imgCol?.value} loading="lazy" alt="" />
        </AspectRatio>
      ) : (
        <AutoImage value={props.id} />
      )}

      {locationColumn && locationColumn.value && (
        <Box height={100} width={100} display={"flex"} overflow={"hidden"}>
          <DeckGL
            initialViewState={{
              longitude: locationColumn.value[0],
              latitude: locationColumn.value[1],
              zoom: 3,
              maxZoom: 20,
              pitch: 30,
              bearing: 30,
            }}
            controller
            height={100}
            width={100}
          >
            <Map
              reuseMaps
              mapStyle={
                "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
              }
            />
          </DeckGL>
        </Box>
      )}

      <CardContent>
        <Typography level="title-lg" id="card-description">
          {props.title}
        </Typography>

        {/* {JSON.stringify(props.data)} */}
        <Typography
          level="body-sm"
          aria-describedby="card-description"
          sx={{ mb: 1 }}
        >
          <Link
            overlay
            underline="none"
            href="#interactive-card"
            sx={{ color: "text.tertiary" }}
          >
            California, USA
          </Link>
        </Typography>
        {/* <Chip
          variant="outlined"
          color="primary"
          size="sm"
          sx={{ pointerEvents: "none" }}
        >
          Cool weather all day long
        </Chip> */}
      </CardContent>
    </Card>
  );
}
