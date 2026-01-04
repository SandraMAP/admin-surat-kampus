export type StatusPengajuan = 'DIAJUKAN' | 'DISETUJUI' | 'DIPROSES' | 'SELESAI';

export interface JenisSurat {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Mahasiswa {
  id: string;
  nama: string;
  nim: string;
  program_studi: string;
  email: string;
  no_hp: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminProfile {
  id: string;
  user_id: string;
  nama: string;
  email: string;
  role: 'super_admin' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PengajuanSurat {
  id: string;
  nomor_pengajuan: string;
  mahasiswa_id: string;
  jenis_surat_id: string;
  keperluan: string;
  status: StatusPengajuan;
  catatan_admin: string | null;
  file_surat_url: string | null;
  processed_by: string | null;
  diajukan_at: string;
  disetujui_at: string | null;
  diproses_at: string | null;
  selesai_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  mahasiswa?: Mahasiswa;
  jenis_surat?: JenisSurat;
  admin?: AdminProfile;
}

export interface PengajuanFormData {
  nama: string;
  nim: string;
  program_studi: string;
  email: string;
  no_hp: string;
  jenis_surat_id: string;
  keperluan: string;
}

export const STATUS_CONFIG: Record<StatusPengajuan, { 
  label: string; 
  color: string; 
  bgClass: string;
  icon: string;
}> = {
  DIAJUKAN: { 
    label: 'Diajukan', 
    color: 'warning',
    bgClass: 'status-diajukan',
    icon: 'Clock'
  },
  DISETUJUI: { 
    label: 'Disetujui', 
    color: 'info',
    bgClass: 'status-disetujui',
    icon: 'CheckCircle'
  },
  DIPROSES: { 
    label: 'Diproses', 
    color: 'primary',
    bgClass: 'status-diproses',
    icon: 'Loader'
  },
  SELESAI: { 
    label: 'Selesai', 
    color: 'success',
    bgClass: 'status-selesai',
    icon: 'CheckCheck'
  },
};

export const WORKFLOW_ORDER: StatusPengajuan[] = ['DIAJUKAN', 'DISETUJUI', 'DIPROSES', 'SELESAI'];
