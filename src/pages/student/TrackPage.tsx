import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, FileText, Download, Clock, Calendar, User, Mail, Phone, BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { useToast } from '@/hooks/use-toast';
import { PengajuanSurat, WORKFLOW_ORDER, StatusPengajuan } from '@/types/database';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function TrackPage() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [nomorPengajuan, setNomorPengajuan] = useState(searchParams.get('nomor') || '');
  const [pengajuan, setPengajuan] = useState<PengajuanSurat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (searchParams.get('nomor')) {
      handleSearch();
    }
  }, []);

  const handleSearch = async () => {
    if (!nomorPengajuan.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Masukkan nomor pengajuan' });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase
        .from('pengajuan_surat')
        .select(`
          *,
          mahasiswa:mahasiswa_id (*),
          jenis_surat:jenis_surat_id (*)
        `)
        .eq('nomor_pengajuan', nomorPengajuan.toUpperCase().trim())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setPengajuan(null);
        toast({ 
          variant: 'destructive', 
          title: 'Tidak Ditemukan', 
          description: 'Nomor pengajuan tidak ditemukan' 
        });
        return;
      }

      setPengajuan(data as PengajuanSurat);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIndex = (status: StatusPengajuan) => {
    return WORKFLOW_ORDER.indexOf(status);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd MMM yyyy, HH:mm', { locale: id });
  };

  return (
    <StudentLayout>
      <div className="container py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
              <Search className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Lacak Pengajuan
            </h1>
            <p className="text-muted-foreground">
              Masukkan nomor pengajuan untuk melihat status
            </p>
          </div>

          {/* Search Form */}
          <Card className="mb-6 animate-slide-up">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Input
                  placeholder="Contoh: SUK-202501-0001"
                  value={nomorPengajuan}
                  onChange={(e) => setNomorPengajuan(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="font-mono"
                />
                <Button onClick={handleSearch} disabled={isLoading} className="gap-2">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Cari
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          {hasSearched && !isLoading && (
            pengajuan ? (
              <div className="space-y-6 animate-slide-up">
                {/* Status Card */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <CardDescription>Nomor Pengajuan</CardDescription>
                        <CardTitle className="text-xl font-mono">{pengajuan.nomor_pengajuan}</CardTitle>
                      </div>
                      <StatusBadge status={pengajuan.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Workflow Progress */}
                    <div className="mb-6">
                      <div className="flex justify-between relative">
                        <div className="absolute top-4 left-0 right-0 h-1 bg-muted rounded-full" />
                        <div 
                          className="absolute top-4 left-0 h-1 bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${(getStatusIndex(pengajuan.status) / (WORKFLOW_ORDER.length - 1)) * 100}%` }}
                        />
                        {WORKFLOW_ORDER.map((status, index) => {
                          const isComplete = index <= getStatusIndex(pengajuan.status);
                          const isCurrent = status === pengajuan.status;
                          return (
                            <div key={status} className="relative z-10 flex flex-col items-center">
                              <div className={`
                                h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold
                                ${isComplete ? 'gradient-primary text-primary-foreground shadow-glow' : 'bg-muted text-muted-foreground'}
                                ${isCurrent ? 'ring-4 ring-primary/20 animate-pulse-slow' : ''}
                              `}>
                                {index + 1}
                              </div>
                              <span className={`text-xs mt-2 ${isComplete ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                {status.charAt(0) + status.slice(1).toLowerCase()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Diajukan: {formatDate(pengajuan.diajukan_at)}</span>
                      </div>
                      {pengajuan.disetujui_at && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Disetujui: {formatDate(pengajuan.disetujui_at)}</span>
                        </div>
                      )}
                      {pengajuan.diproses_at && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Diproses: {formatDate(pengajuan.diproses_at)}</span>
                        </div>
                      )}
                      {pengajuan.selesai_at && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Selesai: {formatDate(pengajuan.selesai_at)}</span>
                        </div>
                      )}
                    </div>

                    {/* Download Button */}
                    {pengajuan.file_surat_url && pengajuan.status === 'SELESAI' && (
                      <a 
                        href={pengajuan.file_surat_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block mt-6"
                      >
                        <Button className="w-full gap-2">
                          <Download className="h-4 w-4" />
                          Download Surat
                        </Button>
                      </a>
                    )}
                  </CardContent>
                </Card>

                {/* Detail Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Detail Pengajuan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <div className="flex items-start gap-3">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Nama Mahasiswa</p>
                          <p className="font-medium">{pengajuan.mahasiswa?.nama}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">NIM / Program Studi</p>
                          <p className="font-medium">{pengajuan.mahasiswa?.nim} - {pengajuan.mahasiswa?.program_studi}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{pengajuan.mahasiswa?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">No. HP</p>
                          <p className="font-medium">{pengajuan.mahasiswa?.no_hp}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Jenis Surat</p>
                          <p className="font-medium">{pengajuan.jenis_surat?.nama}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Keperluan</p>
                          <p className="font-medium">{pengajuan.keperluan}</p>
                        </div>
                      </div>
                      {pengajuan.catatan_admin && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground mb-1">Catatan Admin</p>
                          <p className="font-medium">{pengajuan.catatan_admin}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="text-center py-12 animate-fade-in">
                <CardContent>
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Tidak Ditemukan</h3>
                  <p className="text-muted-foreground">
                    Pengajuan dengan nomor tersebut tidak ditemukan. 
                    Pastikan nomor yang Anda masukkan sudah benar.
                  </p>
                </CardContent>
              </Card>
            )
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
