import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, Loader, CheckCheck, TrendingUp, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { StatusPengajuan, WORKFLOW_ORDER } from '@/types/database';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface DashboardStats {
  total: number;
  diajukan: number;
  disetujui: number;
  diproses: number;
  selesai: number;
  totalMahasiswa: number;
}

interface RecentPengajuan {
  id: string;
  nomor_pengajuan: string;
  status: StatusPengajuan;
  created_at: string;
  mahasiswa: { nama: string } | null;
  jenis_surat: { nama: string } | null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    diajukan: 0,
    disetujui: 0,
    diproses: 0,
    selesai: 0,
    totalMahasiswa: 0,
  });
  const [recentPengajuan, setRecentPengajuan] = useState<RecentPengajuan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pengajuan_surat' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const [pengajuanResult, mahasiswaResult] = await Promise.all([
        supabase.from('pengajuan_surat').select('status'),
        supabase.from('mahasiswa').select('id', { count: 'exact', head: true }),
      ]);

      const pengajuanData = pengajuanResult.data || [];
      
      setStats({
        total: pengajuanData.length,
        diajukan: pengajuanData.filter(p => p.status === 'DIAJUKAN').length,
        disetujui: pengajuanData.filter(p => p.status === 'DISETUJUI').length,
        diproses: pengajuanData.filter(p => p.status === 'DIPROSES').length,
        selesai: pengajuanData.filter(p => p.status === 'SELESAI').length,
        totalMahasiswa: mahasiswaResult.count || 0,
      });

      // Fetch recent pengajuan
      const { data: recentData } = await supabase
        .from('pengajuan_surat')
        .select(`
          id,
          nomor_pengajuan,
          status,
          created_at,
          mahasiswa:mahasiswa_id (nama),
          jenis_surat:jenis_surat_id (nama)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentPengajuan((recentData as RecentPengajuan[]) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { 
      label: 'Total Pengajuan', 
      value: stats.total, 
      icon: FileText, 
      color: 'primary',
      bgClass: 'bg-primary/10 text-primary'
    },
    { 
      label: 'Diajukan', 
      value: stats.diajukan, 
      icon: Clock, 
      color: 'warning',
      bgClass: 'bg-warning/10 text-warning'
    },
    { 
      label: 'Disetujui', 
      value: stats.disetujui, 
      icon: CheckCircle, 
      color: 'info',
      bgClass: 'bg-info/10 text-info'
    },
    { 
      label: 'Diproses', 
      value: stats.diproses, 
      icon: Loader, 
      color: 'primary',
      bgClass: 'bg-primary/10 text-primary'
    },
    { 
      label: 'Selesai', 
      value: stats.selesai, 
      icon: CheckCheck, 
      color: 'success',
      bgClass: 'bg-success/10 text-success'
    },
    { 
      label: 'Total Mahasiswa', 
      value: stats.totalMahasiswa, 
      icon: Users, 
      color: 'accent',
      bgClass: 'bg-accent/10 text-accent'
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Ringkasan data pengajuan surat</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat, index) => (
            <Card 
              key={stat.label} 
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardContent className="p-4">
                <div className={`h-10 w-10 rounded-xl ${stat.bgClass} flex items-center justify-center mb-3`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Pengajuan */}
        <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pengajuan Terbaru</CardTitle>
              <CardDescription>5 pengajuan surat terakhir</CardDescription>
            </div>
            <Link to="/admin/pengajuan">
              <span className="text-sm text-primary hover:underline cursor-pointer">
                Lihat Semua →
              </span>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : recentPengajuan.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada pengajuan surat
              </div>
            ) : (
              <div className="space-y-4">
                {recentPengajuan.map((pengajuan) => (
                  <div 
                    key={pengajuan.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-medium text-foreground">
                          {pengajuan.nomor_pengajuan}
                        </span>
                        <StatusBadge status={pengajuan.status} />
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {pengajuan.mahasiswa?.nama} - {pengajuan.jenis_surat?.nama}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(pengajuan.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
