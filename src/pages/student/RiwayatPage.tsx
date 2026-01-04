import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Eye, Loader2, History, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PengajuanSurat } from '@/types/database';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { User } from '@supabase/supabase-js';

export default function RiwayatPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [pengajuanList, setPengajuanList] = useState<PengajuanSurat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPengajuan, setSelectedPengajuan] = useState<PengajuanSurat | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    setUser(user);
    fetchRiwayat(user.id);
  };

  const fetchRiwayat = async (userId: string) => {
    setIsLoading(true);
    try {
      // First get mahasiswa by user_id
      const { data: mahasiswa, error: mahasiswaError } = await supabase
        .from('mahasiswa')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (mahasiswaError) throw mahasiswaError;
      
      if (!mahasiswa) {
        setPengajuanList([]);
        setIsLoading(false);
        return;
      }

      // Then get all pengajuan for this mahasiswa
      const { data, error } = await supabase
        .from('pengajuan_surat')
        .select(`
          *,
          mahasiswa:mahasiswa_id (*),
          jenis_surat:jenis_surat_id (*)
        `)
        .eq('mahasiswa_id', mahasiswa.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPengajuanList(data as PengajuanSurat[]);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMM yyyy, HH:mm', { locale: localeId });
  };

  return (
    <StudentLayout>
      <div className="container py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
                <History className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Riwayat Pengajuan
                </h1>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* List */}
          <div className="space-y-4 animate-slide-up">
            {isLoading ? (
              <Card className="py-12">
                <CardContent className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
              </Card>
            ) : pengajuanList.length === 0 ? (
              <Card className="py-12 text-center">
                <CardContent>
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Belum Ada Pengajuan
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Anda belum pernah mengajukan surat
                  </p>
                  <Button onClick={() => navigate('/ajukan')}>
                    Ajukan Surat
                  </Button>
                </CardContent>
              </Card>
            ) : (
              pengajuanList.map((pengajuan) => (
                <Card key={pengajuan.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-mono text-sm font-medium text-primary">
                            {pengajuan.nomor_pengajuan}
                          </p>
                          <StatusBadge status={pengajuan.status} />
                        </div>
                        <h3 className="font-semibold text-foreground truncate">
                          {pengajuan.jenis_surat?.nama}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(pengajuan.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedPengajuan(pengajuan)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {pengajuan.file_surat_url && pengajuan.status === 'SELESAI' && (
                          <a href={pengajuan.file_surat_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedPengajuan} onOpenChange={() => setSelectedPengajuan(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Pengajuan</DialogTitle>
            <DialogDescription>
              {selectedPengajuan?.nomor_pengajuan}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPengajuan && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <StatusBadge status={selectedPengajuan.status} />
              </div>

              <div className="grid gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Jenis Surat</p>
                  <p className="font-medium">{selectedPengajuan.jenis_surat?.nama}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Keperluan</p>
                  <p className="font-medium">{selectedPengajuan.keperluan}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tanggal Pengajuan</p>
                  <p className="font-medium">{formatDate(selectedPengajuan.diajukan_at)}</p>
                </div>
                {selectedPengajuan.catatan_admin && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs mb-1">Catatan Admin</p>
                    <p className="font-medium">{selectedPengajuan.catatan_admin}</p>
                  </div>
                )}
              </div>

              {selectedPengajuan.file_surat_url && selectedPengajuan.status === 'SELESAI' && (
                <a 
                  href={selectedPengajuan.file_surat_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Download Surat
                  </Button>
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
}
