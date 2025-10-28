-- Allow drivers to select rides where they are the driver
        CREATE POLICY "Drivers can view their accepted rides"
        ON public.rides FOR SELECT
        TO authenticated
        USING (
          auth.uid() = driver_id
        );