/* @name Users */
SELECT
	user_id,
	username,
	email_address,
	first_name,
	last_name,
	company_id,
	date_created,
	date_updated
FROM
	users
WHERE
	user_id % :num_shards = :current_shard;