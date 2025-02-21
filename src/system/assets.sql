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
    ST_X(ST_AsText(askv_location.value)) as latitude
FROM
    assets a
    LEFT JOIN equipment_classes ec ON a.equipment_class_id = ec.equipment_class_id
    LEFT JOIN categories c ON a.category_id = c.category_id
    LEFT JOIN photos p ON a.photo_id = p.photo_id
    LEFT JOIN equipment_makes mk ON a.equipment_make_id = mk.equipment_make_id
    LEFT JOIN equipment_models em ON a.equipment_model_id = em.equipment_model_id
    LEFT JOIN asset_status_key_values askv_location ON a.asset_id = askv_location.asset_id
    AND askv_location.name = 'location'
WHERE
    a.company_id = :company_id
GROUP BY
    a.asset_id,
    ec.name,
    c.name,
    p.filename,
    mk.name,
    em.name,
    askv_location.value;