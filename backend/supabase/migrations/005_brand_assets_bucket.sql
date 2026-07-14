-- Cria um bucket storage chamado 'brand-assets' para armazenar as logos dos relatórios

INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para o bucket 'brand-assets'
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-assets');

DROP POLICY IF EXISTS "Authenticated users can upload brand assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload brand assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'brand-assets');

DROP POLICY IF EXISTS "Users can update their own brand assets" ON storage.objects;
CREATE POLICY "Users can update their own brand assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'brand-assets' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete their own brand assets" ON storage.objects;
CREATE POLICY "Users can delete their own brand assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'brand-assets' AND auth.uid() = owner);
