-- Create enum for status workflow
CREATE TYPE public.status_pengajuan AS ENUM ('DIAJUKAN', 'DISETUJUI', 'DIPROSES', 'SELESAI');

-- Create enum for admin roles
CREATE TYPE public.admin_role AS ENUM ('super_admin', 'admin');

-- Table: jenis_surat (Master data for letter types)
CREATE TABLE public.jenis_surat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kode VARCHAR(20) NOT NULL UNIQUE,
  nama VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: mahasiswa (Student data - no auth required)
CREATE TABLE public.mahasiswa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  nim VARCHAR(20) NOT NULL UNIQUE,
  program_studi VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  no_hp VARCHAR(20) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: admin profiles
CREATE TABLE public.admin_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nama VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role admin_role DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: pengajuan_surat (Letter requests)
CREATE TABLE public.pengajuan_surat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nomor_pengajuan VARCHAR(50) NOT NULL UNIQUE,
  mahasiswa_id UUID NOT NULL REFERENCES public.mahasiswa(id) ON DELETE CASCADE,
  jenis_surat_id UUID NOT NULL REFERENCES public.jenis_surat(id) ON DELETE RESTRICT,
  keperluan TEXT NOT NULL,
  status status_pengajuan DEFAULT 'DIAJUKAN',
  catatan_admin TEXT,
  file_surat_url TEXT,
  processed_by UUID REFERENCES public.admin_profiles(id),
  diajukan_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  disetujui_at TIMESTAMP WITH TIME ZONE,
  diproses_at TIMESTAMP WITH TIME ZONE,
  selesai_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Function to generate nomor pengajuan
CREATE OR REPLACE FUNCTION public.generate_nomor_pengajuan()
RETURNS TRIGGER AS $$
DECLARE
  year_part VARCHAR(4);
  month_part VARCHAR(2);
  sequence_num INTEGER;
  new_nomor VARCHAR(50);
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  month_part := TO_CHAR(NOW(), 'MM');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(nomor_pengajuan FROM 'SUK-[0-9]{4}[0-9]{2}-([0-9]+)') AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM public.pengajuan_surat
  WHERE nomor_pengajuan LIKE 'SUK-' || year_part || month_part || '-%';
  
  new_nomor := 'SUK-' || year_part || month_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  NEW.nomor_pengajuan := new_nomor;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for auto-generating nomor pengajuan
CREATE TRIGGER trigger_generate_nomor_pengajuan
  BEFORE INSERT ON public.pengajuan_surat
  FOR EACH ROW
  WHEN (NEW.nomor_pengajuan IS NULL OR NEW.nomor_pengajuan = '')
  EXECUTE FUNCTION public.generate_nomor_pengajuan();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_jenis_surat_updated_at
  BEFORE UPDATE ON public.jenis_surat
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mahasiswa_updated_at
  BEFORE UPDATE ON public.mahasiswa
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_profiles_updated_at
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pengajuan_surat_updated_at
  BEFORE UPDATE ON public.pengajuan_surat
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update status timestamps
CREATE OR REPLACE FUNCTION public.update_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'DISETUJUI' AND OLD.status = 'DIAJUKAN' THEN
    NEW.disetujui_at = now();
  ELSIF NEW.status = 'DIPROSES' AND OLD.status = 'DISETUJUI' THEN
    NEW.diproses_at = now();
  ELSIF NEW.status = 'SELESAI' AND OLD.status = 'DIPROSES' THEN
    NEW.selesai_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_update_status_timestamps
  BEFORE UPDATE ON public.pengajuan_surat
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.update_status_timestamps();

-- Enable RLS
ALTER TABLE public.jenis_surat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mahasiswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengajuan_surat ENABLE ROW LEVEL SECURITY;

-- Security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles
    WHERE user_id = _user_id
      AND is_active = true
  )
$$;

-- RLS Policies for jenis_surat (public read, admin write)
CREATE POLICY "Anyone can view active letter types"
  ON public.jenis_surat FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage letter types"
  ON public.jenis_surat FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- RLS Policies for mahasiswa
CREATE POLICY "Anyone can create mahasiswa"
  ON public.mahasiswa FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view mahasiswa"
  ON public.mahasiswa FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage mahasiswa"
  ON public.mahasiswa FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- RLS Policies for admin_profiles
CREATE POLICY "Admins can view admin profiles"
  ON public.admin_profiles FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Admins can manage admin profiles"
  ON public.admin_profiles FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own admin profile"
  ON public.admin_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for pengajuan_surat
CREATE POLICY "Anyone can create pengajuan"
  ON public.pengajuan_surat FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view pengajuan"
  ON public.pengajuan_surat FOR SELECT
  USING (true);

CREATE POLICY "Admins can update pengajuan"
  ON public.pengajuan_surat FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete pengajuan"
  ON public.pengajuan_surat FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Create storage bucket for letter files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('surat-files', 'surat-files', true);

-- Storage policies
CREATE POLICY "Anyone can view surat files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'surat-files');

CREATE POLICY "Admins can upload surat files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'surat-files' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update surat files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'surat-files' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete surat files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'surat-files' AND public.is_admin(auth.uid()));

-- Insert default jenis surat
INSERT INTO public.jenis_surat (kode, nama, deskripsi) VALUES
  ('SK-AKTIF', 'Surat Keterangan Aktif Kuliah', 'Surat keterangan yang menyatakan mahasiswa aktif kuliah'),
  ('SK-CUTI', 'Surat Keterangan Cuti Akademik', 'Surat permohonan cuti akademik'),
  ('SK-PINDAH', 'Surat Keterangan Pindah', 'Surat keterangan pindah kuliah'),
  ('SK-BEASISWA', 'Surat Rekomendasi Beasiswa', 'Surat rekomendasi untuk pengajuan beasiswa'),
  ('SK-MAGANG', 'Surat Pengantar Magang', 'Surat pengantar untuk keperluan magang'),
  ('SK-PENELITIAN', 'Surat Izin Penelitian', 'Surat izin melakukan penelitian'),
  ('SK-KIP', 'Surat Keterangan KIP-Kuliah', 'Surat keterangan untuk keperluan KIP-Kuliah'),
  ('SK-DOMISILI', 'Surat Keterangan Domisili', 'Surat keterangan tempat tinggal mahasiswa');

-- Enable realtime for pengajuan_surat
ALTER PUBLICATION supabase_realtime ADD TABLE public.pengajuan_surat;