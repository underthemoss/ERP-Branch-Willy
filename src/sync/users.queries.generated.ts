/** Types generated for queries found in "src/sync/users.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'Users' parameters type */
export interface IUsersParams {
  current_shard?: number | null | void;
  num_shards?: number | null | void;
}

/** 'Users' return type */
export interface IUsersResult {
  company_id: number | null;
  date_created: Date;
  date_updated: Date;
  email_address: string;
  first_name: string | null;
  last_name: string | null;
  user_id: number;
  username: string;
}

/** 'Users' query type */
export interface IUsersQuery {
  params: IUsersParams;
  result: IUsersResult;
}

const usersIR: any = {"usedParamSet":{"num_shards":true,"current_shard":true},"params":[{"name":"num_shards","required":false,"transform":{"type":"scalar"},"locs":[{"a":140,"b":150}]},{"name":"current_shard","required":false,"transform":{"type":"scalar"},"locs":[{"a":154,"b":167}]}],"statement":"SELECT\n\tuser_id,\n\tusername,\n\temail_address,\n\tfirst_name,\n\tlast_name,\n\tcompany_id,\n\tdate_created,\n\tdate_updated\nFROM\n\tusers\nWHERE\n\tuser_id % :num_shards = :current_shard"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 * 	user_id,
 * 	username,
 * 	email_address,
 * 	first_name,
 * 	last_name,
 * 	company_id,
 * 	date_created,
 * 	date_updated
 * FROM
 * 	users
 * WHERE
 * 	user_id % :num_shards = :current_shard
 * ```
 */
export const users = new PreparedQuery<IUsersParams,IUsersResult>(usersIR);


