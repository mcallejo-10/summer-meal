-- Taula per guardar configuració de l'app (clau-valor)
CREATE TABLE IF NOT EXISTS public.settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Tothom autenticat pot llegir la configuració
CREATE POLICY "settings_read_authenticated"
  ON public.settings FOR SELECT
  TO authenticated
  USING (true);

-- Només admins poden modificar
CREATE POLICY "settings_write_admin"
  ON public.settings FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Valors per defecte
INSERT INTO public.settings (key, value) VALUES
  ('voting_cutoff_hour', '10'),
  ('results_cutoff_hour', '22')
ON CONFLICT (key) DO NOTHING;
