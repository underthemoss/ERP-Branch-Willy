"use client";
import * as React from "react";
import { Autocomplete, CircularProgress, List, ListItem } from "@mui/joy";
// import { LazyUserDetail } from "../LazyUserDetails";
// import { searchUsers } from "./Picker.actions";
import _ from "lodash";

export const GenericPicker = (props: {
  value: string | null;
  itemRenderer: (id: string) => React.ReactElement;
  search: (term: string) => Promise<string[]>;
  onChange: (value: string) => Promise<void>;
}) => {
  const [options, setOptions] = React.useState<string[]>([]);
  const [term, setTerm] = React.useState("");
  const [optimisticValue, setOptimisticValue] = React.useState(props.value);
  const [hasFocus, setHasFocus] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const debounceSearch = React.useCallback(
    _.debounce(async (searchTerm: string) => {
      setIsLoading(true);
      const ids = await props.search(searchTerm);
      setOptions(ids);
      setIsLoading(false);
    }, 300),
    []
  );

  return (
    <Autocomplete
      endDecorator={isLoading && <CircularProgress size="sm" />}
      tabIndex={-1}
      onInputChange={(event, value) => {
        if (event) {
          event?.stopPropagation();
          setTerm(value);
          debounceSearch(value);
        }
      }}
      inputValue={term}
      inputMode="search"
      filterOptions={(o) => o}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 0,
        outline: 0,
        backgroundColor: "transparent",
      }}
      onFocus={() => {
        setHasFocus(true);
        props.search("").then(setOptions);
      }}
      onBlur={() => {
        setHasFocus(false);
      }}
      onChange={async (el, [val]) => {
        if (val) {
          setOptimisticValue(val);
          setHasFocus(false);
          await props.onChange(val);
        } else {
          setOptimisticValue(null);
        }
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }}
      noOptionsText=""
      placeholder={hasFocus ? "Search..." : ""}
      variant="plain"
      options={options}
      value={hasFocus ? [] : optimisticValue ? [optimisticValue] : []}
      getOptionLabel={(option) => option}
      renderOption={(optionProps, id) => {
        const { key, ...rest } = optionProps as any;
        return (
          <ListItem key={id} {...rest}>
            {props.itemRenderer(id)}
            {/* <LazyUserDetail userId={id} /> */}
          </ListItem>
        );
      }}
      slotProps={{
        listbox: {
          sx: {
            "--ListItemDecorator-size": "48px",
          },
        },
      }}
      getOptionKey={(id) => id}
      multiple={true}
      disableListWrap
      renderTags={([id]) => (
        <ListItem key={id}>{props.itemRenderer(id)}</ListItem>
      )}
    />
  );
};
