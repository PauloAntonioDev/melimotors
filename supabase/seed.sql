-- Seed seguro y repetible. No contiene credenciales ni usuarios reales.
insert into public.site_settings (key, value)
values
  ('admin_email', to_jsonb(''::text)),
  ('margin_threshold_pct', to_jsonb(10::numeric)),
  ('financing_terms_months', '[12, 24, 36, 48, 60]'::jsonb),
  ('financing_default_annual_rate_pct', to_jsonb(10::numeric)),
  ('company_name', to_jsonb('Melimotors'::text)),
  ('company_whatsapp', to_jsonb(''::text)),
  ('company_address', to_jsonb(''::text)),
  ('company_hours', to_jsonb(''::text))
on conflict (key) do nothing;

-- Configuracion manual inicial, ejecutar con privilegios de servicio:
-- update public.site_settings
-- set value = to_jsonb('admin@melimotors.cl'::text)
-- where key = 'admin_email';
