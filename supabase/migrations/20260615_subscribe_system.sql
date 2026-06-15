-- ============================================================
-- VIDIND SUBSCRIBE SYSTEM — Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/xlabsrfujunffdnhkzpn/sql/new
-- ============================================================

-- 1. Ensure subscriptions table has proper constraints
-- Add unique constraint on (subscriber_id, creator_id) if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_subscriber_creator_unique'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_subscriber_creator_unique
      UNIQUE (subscriber_id, creator_id);
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- 2. Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can read subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Authenticated users can insert own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Authenticated users can delete own subscriptions" ON public.subscriptions;

-- SELECT: anyone can read
CREATE POLICY "Anyone can read subscriptions"
  ON public.subscriptions FOR SELECT
  USING (true);

-- INSERT: authenticated users can only insert their own subscription
CREATE POLICY "Authenticated users can insert own subscriptions"
  ON public.subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = subscriber_id);

-- DELETE: authenticated users can only delete their own subscription
CREATE POLICY "Authenticated users can delete own subscriptions"
  ON public.subscriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = subscriber_id);

-- 3. Create the toggle_subscribe RPC function
-- This function atomically handles subscribe/unsubscribe with count updates.
CREATE OR REPLACE FUNCTION public.toggle_subscribe(creator_id_input uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calling_user_id uuid;
  existing_sub_id uuid;
  is_subscribed boolean;
  new_count bigint;
BEGIN
  -- Get current authenticated user
  calling_user_id := auth.uid();
  IF calling_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Prevent self-subscribe
  IF calling_user_id = creator_id_input THEN
    RAISE EXCEPTION 'Cannot subscribe to own channel';
  END IF;

  -- Check if subscription already exists
  SELECT id INTO existing_sub_id
  FROM public.subscriptions
  WHERE subscriber_id = calling_user_id
    AND creator_id = creator_id_input;

  IF existing_sub_id IS NOT NULL THEN
    -- UNSUBSCRIBE: delete the subscription
    DELETE FROM public.subscriptions WHERE id = existing_sub_id;

    -- Decrement subscribers_count, never below 0
    UPDATE public.profiles
    SET subscribers_count = GREATEST(0, subscribers_count - 1),
        updated_at = now()
    WHERE user_id = creator_id_input;

    is_subscribed := false;
  ELSE
    -- SUBSCRIBE: insert new subscription
    INSERT INTO public.subscriptions (subscriber_id, creator_id)
    VALUES (calling_user_id, creator_id_input);

    -- Increment subscribers_count
    UPDATE public.profiles
    SET subscribers_count = subscribers_count + 1,
        updated_at = now()
    WHERE user_id = creator_id_input;

    is_subscribed := true;
  END IF;

  -- Get the updated count
  SELECT subscribers_count INTO new_count
  FROM public.profiles
  WHERE user_id = creator_id_input;

  -- Return result as JSON
  RETURN json_build_object(
    'subscribed', is_subscribed,
    'subscribers_count', COALESCE(new_count, 0)
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.toggle_subscribe(uuid) TO authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
