import * as React from "react";
import AspectRatio from "@mui/joy/AspectRatio";
import Box from "@mui/joy/Box";
import Drawer from "@mui/joy/Drawer";
import Button from "@mui/joy/Button";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import Checkbox from "@mui/joy/Checkbox";
import DialogTitle from "@mui/joy/DialogTitle";
import DialogContent from "@mui/joy/DialogContent";
import ModalClose from "@mui/joy/ModalClose";
import Divider from "@mui/joy/Divider";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import FormHelperText from "@mui/joy/FormHelperText";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import Stack from "@mui/joy/Stack";
import RadioGroup from "@mui/joy/RadioGroup";
import Radio from "@mui/joy/Radio";
import Sheet from "@mui/joy/Sheet";
import Switch from "@mui/joy/Switch";
import Typography from "@mui/joy/Typography";
import TuneIcon from "@mui/icons-material/TuneRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import MeetingRoomRoundedIcon from "@mui/icons-material/MeetingRoomRounded";
import HotelRoundedIcon from "@mui/icons-material/HotelRounded";
import Done from "@mui/icons-material/Done";

import {
  ContentTypeAttribute,
  ContentTypeAttributeType,
  ContentTypeConfigField,
  ContentTypeConfigFieldType,
} from "../../../../../../prisma/generated/mongo";
import { Input } from "@mui/joy";
import AttributeDataTypeSelect, {
  ContentTypeAttributeDataTypeOptions,
} from "./AttributeDataTypeSelect";
import IconSelector from "./IconSelect";
import { ulid } from "ulid";

export default function AttributeEditor(props: {
  open: boolean;
  setOpen: (val: boolean) => void;
  defaultValue: ContentTypeConfigField | null | undefined;
  onChange: (attr: ContentTypeConfigField) => void;
}) {
  const { open, setOpen, defaultValue, onChange } = props;

  const [type, setType] = React.useState<ContentTypeConfigFieldType>(
    ContentTypeConfigFieldType.text
  );
  const [label, setLabel] = React.useState<string>("");

  React.useEffect(() => {
    setType(defaultValue?.type || ContentTypeConfigFieldType.text);
    setLabel(defaultValue?.label || "");
  }, [defaultValue, setType, setLabel]);

  return (
    <React.Fragment>
      <Drawer
        size="md"
        variant="plain"
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          content: {
            sx: {
              bgcolor: "transparent",
              p: { md: 3, sm: 0 },
              boxShadow: "none",
            },
          },
        }}
      >
        <Sheet
          sx={{
            borderRadius: "md",
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            height: "100%",
            overflow: "auto",
          }}
        >
          <DialogTitle>Attribute</DialogTitle>
          <ModalClose />
          <Divider sx={{ mt: "auto" }} />

          <DialogContent sx={{ gap: 2 }}>
            <FormControl>
              <FormLabel sx={{ typography: "title-md", fontWeight: "bold" }}>
                Data Type
              </FormLabel>

              <AttributeDataTypeSelect
                value={type}
                onChange={(type) => setType(type)}
              />
            </FormControl>

            <FormControl>
              <FormLabel sx={{ typography: "title-md", fontWeight: "bold" }}>
                Label
              </FormLabel>
              <Input
                type="text"
                required
                autoComplete="off"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </FormControl>

            <Typography level="title-md" sx={{ fontWeight: "bold", mt: 2 }}>
              Attribute options
            </Typography>
            <FormControl orientation="horizontal">
              <Box sx={{ flex: 1, pr: 1 }}>
                <FormLabel sx={{ typography: "title-sm" }}>Required</FormLabel>
                <FormHelperText sx={{ typography: "body-sm" }}>
                  Require this field to be provided.
                </FormHelperText>
              </Box>
              <Switch />
            </FormControl>

            <FormControl orientation="horizontal">
              <Box sx={{ flex: 1, mt: 1, mr: 1 }}>
                <FormLabel sx={{ typography: "title-sm" }}>
                  Self check-in
                </FormLabel>
                <FormHelperText sx={{ typography: "body-sm" }}>
                  Easy access to the property when you arrive.
                </FormHelperText>
              </Box>
              <Switch />
            </FormControl>
          </DialogContent>

          <Divider sx={{ mt: "auto" }} />
          <Stack
            direction="row"
            useFlexGap
            spacing={1}
            sx={{ justifyContent: "space-between" }}
          >
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => {
                // setType("");
                // setAmenities([]);
              }}
            >
              Clear
            </Button>
            <Button
              onClick={() => {
                setOpen(false);
                onChange({ label, type, id: defaultValue?.id || ulid() });
              }}
            >
              Accept
            </Button>
          </Stack>
        </Sheet>
      </Drawer>
    </React.Fragment>
  );
}
