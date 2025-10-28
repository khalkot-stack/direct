SELECT
      id,
      pickup_location,
      destination,
      passengers_count,
      status,
      passenger_id,
      driver_id
    FROM
      public.rides
    WHERE
      status IN ('accepted', 'completed') AND driver_id = auth.uid();