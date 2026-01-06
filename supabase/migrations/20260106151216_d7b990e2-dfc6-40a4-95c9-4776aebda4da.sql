-- Add tujuan_surat field to jenis_surat table
ALTER TABLE public.jenis_surat 
ADD COLUMN tujuan_surat text DEFAULT NULL;

-- Add template_surat field to jenis_surat table for letter template
ALTER TABLE public.jenis_surat 
ADD COLUMN template_surat text DEFAULT NULL;

-- Update existing jenis_surat with default tujuan
UPDATE public.jenis_surat SET tujuan_surat = 'Kepada Yth. Pihak Terkait' WHERE tujuan_surat IS NULL;

-- Insert a default template example for reference
COMMENT ON COLUMN public.jenis_surat.template_surat IS 'Template surat dengan placeholder: {{nama}}, {{nim}}, {{program_studi}}, {{jenis_surat}}, {{tujuan_surat}}, {{keperluan}}, {{tanggal}}, {{nomor_pengajuan}}';