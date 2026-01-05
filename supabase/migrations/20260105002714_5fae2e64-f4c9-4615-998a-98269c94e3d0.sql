-- Create program_studi table
CREATE TABLE public.program_studi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kode VARCHAR(10) NOT NULL UNIQUE,
  nama VARCHAR(100) NOT NULL,
  fakultas VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.program_studi ENABLE ROW LEVEL SECURITY;

-- Anyone can view active program studi
CREATE POLICY "Anyone can view active program studi"
ON public.program_studi
FOR SELECT
USING (is_active = true);

-- Admins can manage program studi
CREATE POLICY "Admins can manage program studi"
ON public.program_studi
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_program_studi_updated_at
BEFORE UPDATE ON public.program_studi
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default data
INSERT INTO public.program_studi (kode, nama, fakultas) VALUES
('TI', 'Teknik Informatika', 'Fakultas Teknologi Informasi'),
('BD', 'Bisnis Digital', 'Fakultas Ekonomi dan Bisnis'),
('MJ', 'Manajemen', 'Fakultas Ekonomi dan Bisnis'),
('AK', 'Akuntansi', 'Fakultas Ekonomi dan Bisnis'),
('HK', 'Hukum', 'Fakultas Hukum'),
('SI', 'Sistem Informasi', 'Fakultas Teknologi Informasi'),
('TK', 'Teknik Komputer', 'Fakultas Teknologi Informasi'),
('TE', 'Teknik Elektro', 'Fakultas Teknik'),
('TM', 'Teknik Mesin', 'Fakultas Teknik'),
('TS', 'Teknik Sipil', 'Fakultas Teknik');