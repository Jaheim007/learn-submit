-- Remove the problematic trigger that causes http_post errors
DROP TRIGGER IF EXISTS on_notification_created ON public.notifications;

-- Drop the trigger function that uses pg_net (which may not be available)
DROP FUNCTION IF EXISTS public.trigger_push_notification();

-- Alternative: We'll handle push notifications from the edge functions instead
-- This way we avoid database-level HTTP calls which require pg_net extension

-- The notifications will still be created in the database,
-- but push notifications will be sent by the application layer
-- when needed (e.g., from edge functions or frontend)