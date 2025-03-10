/* @name Assets */
SELECT
    a.asset_id AS id,
    a.custom_name,
    a.company_id,
    a.model,
    ec.name AS equipment_class_name,
    c.name AS category_name,
    p.filename AS photo_filename,
    mk.name AS make_name,
    em.name AS model_name,
    ST_Y(ST_AsText(askv_location.value)) as longitude,
    ST_X(ST_AsText(askv_location.value)) as latitude,
    a.date_created,
    a.date_updated,
    ARRAY_AGG(rental_users.company_id) as rented_to_company_id
FROM
    assets a
    LEFT JOIN equipment_classes ec ON a.equipment_class_id = ec.equipment_class_id
    LEFT JOIN categories c ON a.category_id = c.category_id
    LEFT JOIN photos p ON a.photo_id = p.photo_id
    LEFT JOIN equipment_makes mk ON a.equipment_make_id = mk.equipment_make_id
    LEFT JOIN equipment_models em ON a.equipment_model_id = em.equipment_model_id
    LEFT JOIN asset_status_key_values askv_location ON a.asset_id = askv_location.asset_id
    AND askv_location.name = 'location'
    LEFT JOIN rentals rentals ON a.asset_id = rentals.asset_id
    AND rentals.start_date <= now()
    AND (
        rentals.end_date >= now()
        OR rentals.end_date IS NULL
    )
    LEFT JOIN orders orders ON rentals.order_id = orders.order_id
    LEFT JOIN users rental_users ON orders.user_id = rental_users.user_id
WHERE
    a.asset_id % :num_shards = :current_shard
GROUP BY
    a.asset_id,
    ec.name,
    c.name,
    p.filename,
    mk.name,
    em.name,
    askv_location.value;