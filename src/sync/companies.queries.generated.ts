/** Types generated for queries found in "src/sync/companies.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'Companies' parameters type */
export type ICompaniesParams = void;

/** 'Companies' return type */
export interface ICompaniesResult {
  company_id: number;
  company_name: string;
  domain: string | null;
  domain_count: string | null;
}

/** 'Companies' query type */
export interface ICompaniesQuery {
  params: ICompaniesParams;
  result: ICompaniesResult;
}

const companiesIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT\n    c.company_id AS company_id,\n    c.name AS company_name,\n    d.domain,\n    d.domain_count\nFROM\n    companies c\n    CROSS JOIN LATERAL (\n        SELECT\n            substring(\n                u.email_address\n                from\n                    '@(.*)$'\n            ) AS domain,\n            count(*) AS domain_count\n        FROM\n            users u\n        WHERE\n            u.company_id = c.company_id\n        GROUP BY\n            domain\n        ORDER BY\n            count(*) DESC\n        LIMIT\n            1\n    ) d"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *     c.company_id AS company_id,
 *     c.name AS company_name,
 *     d.domain,
 *     d.domain_count
 * FROM
 *     companies c
 *     CROSS JOIN LATERAL (
 *         SELECT
 *             substring(
 *                 u.email_address
 *                 from
 *                     '@(.*)$'
 *             ) AS domain,
 *             count(*) AS domain_count
 *         FROM
 *             users u
 *         WHERE
 *             u.company_id = c.company_id
 *         GROUP BY
 *             domain
 *         ORDER BY
 *             count(*) DESC
 *         LIMIT
 *             1
 *     ) d
 * ```
 */
export const companies = new PreparedQuery<ICompaniesParams,ICompaniesResult>(companiesIR);


