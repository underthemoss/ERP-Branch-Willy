import { Entity, findEntities } from "@/db/mongoose";
import { Query } from "./actions";
import { QueryTable } from "./query-table/QueryTable";
import { getQueryTableData } from "./query-table/QueryTable.actions";

import { Box, Table } from "@mui/joy";
import { NextLink } from "@/ui/NextLink";
import { ContentTypeComponent } from "@/ui/Icons";

export default async function Page(props: {
  params: Promise<{ item_id: string }>;
  searchParams: Promise<{ sort_by: string; sort_order: string }>;
}) {
  const { item_id } = await props.params;
  const { sort_by, sort_order } = await props.searchParams;

  const {
    results: [parent],
  } = await findEntities({
    id: [item_id],
  });
  return null;
  // if (parent.type_id === "view") {
  //   const items = await findEntities(parent.data.query);
  //   return (
  //     <Box>
  //       <Table>
  //         <thead>
  //           <tr>
  //             {parent.data.view_columns?.map((c) => (
  //               <th key={c.key}>{c.label}</th>
  //             ))}
  //           </tr>
  //         </thead>
  //         <tbody>
  //           {items.map((item) => {
  //             return (
  //               <tr key={item.id}>
  //                 {parent.data.view_columns?.map((c, i) => {
  //                   if (i === 0) {
  //                     return (
  //                       <td key={c.key} style={{ width: c.width }}>
  //                         <NextLink href={`/app/item/${item.id}`} key={item.id}>
  //                           <ContentTypeComponent
  //                             color={"gray"}
  //                             icon={"FolderOpen"}
  //                             label={item.title}
  //                           />
  //                         </NextLink>
  //                       </td>
  //                     );
  //                   }
  //                   return (
  //                     <td key={c.key} width={c.width}>
  //                       {(item.data as any)[c.key]}
  //                     </td>
  //                   );
  //                 })}
  //               </tr>
  //             );
  //           })}
  //         </tbody>
  //       </Table>
  //     </Box>
  //   );
  // }
  // const items = await findEntities({ filters: { parent_id: parent.id } });

  // return (
  //   <Box>
  //     <Table>
  //       <thead>
  //         <tr>
  //           <th>Title</th>
  //           <th>other</th>
  //         </tr>
  //       </thead>
  //       <tbody>
  //         {items.map((item) => {
  //           return (
  //             <tr key={item.id}>
  //               <td>
  //                 <NextLink href={`/app/item/${item.id}`} key={item.id}>
  //                   <ContentTypeComponent
  //                     color={"gray"}
  //                     icon={"FolderOpen"}
  //                     label={item.title}
  //                   />
  //                 </NextLink>
  //               </td>
  //               <td>{item.data.created_at}</td>
  //             </tr>
  //           );
  //         })}
  //       </tbody>
  //     </Table>
  //   </Box>
  // );
}
