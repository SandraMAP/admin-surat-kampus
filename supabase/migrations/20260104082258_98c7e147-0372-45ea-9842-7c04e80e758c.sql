-- Make nomor_pengajuan have a default empty string so trigger can work
ALTER TABLE public.pengajuan_surat 
ALTER COLUMN nomor_pengajuan SET DEFAULT '';