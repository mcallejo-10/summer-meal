-- Taula per guardar les subscripcions de push notifications de cada usuari
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  endpoint   TEXT UNIQUE NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Cada usuari autenticat pot guardar/veure la seva pròpia subscripció
CREATE POLICY "push_subscriptions_own"
  ON public.push_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND id = push_subscriptions.user_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND id = push_subscriptions.user_id)
  );

-- Admins poden veure totes les subscripcions (per enviar notificacions)
CREATE POLICY "push_subscriptions_admin_read"
  ON public.push_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );
