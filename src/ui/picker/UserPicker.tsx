"use client";
import { LazyUserDetail } from "../LazyUserDetails";
import { GenericPicker } from "./GenericPicker";
import { searchUsers } from "./UserPicker.actions";

export const UserPicker = (props: {
  value: string;
  onChange: (value: string | undefined | null) => Promise<void>;
}) => {
  return (
    <GenericPicker
      value={props.value}
      onChange={props.onChange}
      search={searchUsers}
      itemRenderer={(id) => <LazyUserDetail userId={id} />}
    />
  );
};
