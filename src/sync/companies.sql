/* @name Companies */
SELECT
    c.company_id AS company_id,
    c.name AS company_name,
    d.domain,
    d.domain_count
FROM
    companies c
    CROSS JOIN LATERAL (
        SELECT
            substring(
                u.email_address
                from
                    '@(.*)$'
            ) AS domain,
            count(*) AS domain_count
        FROM
            users u
        WHERE
            u.company_id = c.company_id
        GROUP BY
            domain
        ORDER BY
            count(*) DESC
        LIMIT
            1
    ) d;