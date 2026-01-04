import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Eye, 
  Edit, 
  Trash2, 
  Loader2,
  FileUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { useToast } from '@/hooks/use-toast';
import { PengajuanSurat, StatusPengajuan, WORKFLOW_ORDER } from '@/types/database';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';

const ITEMS_PER_PAGE = 10;

export default function PengajuanPage() {
  const { toast } = useToast();
  const { adminProfile } = useAuth();
  const [pengajuanList, setPengajuanList] = useState<PengajuanSurat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Detail/Edit Dialog
  const [selectedPengajuan, setSelectedPengajuan] = useState<PengajuanSurat | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState<StatusPengajuan>('DIAJUKAN');
  const [editCatatan, setEditCatatan] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // File Upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Delete Dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPengajuan();

    const channel = supabase
      .channel('pengajuan-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pengajuan_surat' }, () => {
        fetchPengajuan();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPengajuan = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pengajuan_surat')
        .select(`
          *,
          mahasiswa:mahasiswa_id (*),
          jenis_surat:jenis_surat_id (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPengajuanList(data as PengajuanSurat[]);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return pengajuanList.filter(p => {
      const matchesSearch = 
        p.nomor_pengajuan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.mahasiswa?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.mahasiswa?.nim?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [pengajuanList, searchQuery, statusFilter]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const handleViewDetail = (pengajuan: PengajuanSurat) => {
    setSelectedPengajuan(pengajuan);
    setEditStatus(pengajuan.status);
    setEditCatatan(pengajuan.catatan_admin || '');
    setIsEditing(false);
    setIsDetailOpen(true);
  };

  const getNextStatus = (current: StatusPengajuan): StatusPengajuan | null => {
    const currentIndex = WORKFLOW_ORDER.indexOf(current);
    if (currentIndex < WORKFLOW_ORDER.length - 1) {
      return WORKFLOW_ORDER[currentIndex + 1];
    }
    return null;
  };

  const handleUpdateStatus = async () => {
    if (!selectedPengajuan) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('pengajuan_surat')
        .update({
          status: editStatus,
          catatan_admin: editCatatan,
          processed_by: adminProfile?.id,
        })
        .eq('id', selectedPengajuan.id);

      if (error) throw error;

      toast({ title: 'Berhasil', description: 'Status pengajuan berhasil diperbarui' });
      setIsDetailOpen(false);
      fetchPengajuan();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedPengajuan || !uploadFile) return;

    setIsUploading(true);
    try {
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${selectedPengajuan.nomor_pengajuan}.${fileExt}`;
      const filePath = `surat/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('surat-files')
        .upload(filePath, uploadFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('surat-files')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('pengajuan_surat')
        .update({ file_surat_url: publicUrl })
        .eq('id', selectedPengajuan.id);

      if (updateError) throw updateError;

      toast({ title: 'Berhasil', description: 'File surat berhasil diupload' });
      setUploadFile(null);
      fetchPengajuan();
      setIsDetailOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('pengajuan_surat')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast({ title: 'Berhasil', description: 'Pengajuan berhasil dihapus' });
      setDeleteId(null);
      fetchPengajuan();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Nomor Pengajuan', 'Nama', 'NIM', 'Program Studi', 'Email', 'No HP', 'Jenis Surat', 'Keperluan', 'Status', 'Tanggal'];
    const rows = filteredData.map(p => [
      p.nomor_pengajuan,
      p.mahasiswa?.nama || '',
      p.mahasiswa?.nim || '',
      p.mahasiswa?.program_studi || '',
      p.mahasiswa?.email || '',
      p.mahasiswa?.no_hp || '',
      p.jenis_surat?.nama || '',
      p.keperluan,
      p.status,
      format(new Date(p.created_at), 'yyyy-MM-dd HH:mm'),
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pengajuan-surat-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast({ title: 'Export Berhasil', description: 'Data berhasil diexport ke CSV' });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pengajuan Surat</h1>
            <p className="text-muted-foreground">Kelola semua pengajuan surat mahasiswa</p>
          </div>
          <Button onClick={handleExportCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nomor pengajuan, nama, atau NIM..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {WORKFLOW_ORDER.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : paginatedData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Tidak ada data pengajuan
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No. Pengajuan</TableHead>
                        <TableHead>Mahasiswa</TableHead>
                        <TableHead className="hidden md:table-cell">Jenis Surat</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Tanggal</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((pengajuan) => (
                        <TableRow key={pengajuan.id}>
                          <TableCell className="font-mono text-sm">
                            {pengajuan.nomor_pengajuan}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{pengajuan.mahasiswa?.nama}</div>
                              <div className="text-sm text-muted-foreground">{pengajuan.mahasiswa?.nim}</div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {pengajuan.jenis_surat?.nama}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={pengajuan.status} />
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {format(new Date(pengajuan.created_at), 'dd MMM yyyy', { locale: localeId })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleViewDetail(pengajuan)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setDeleteId(pengajuan.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="text-sm text-muted-foreground">
                      Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} dari {filteredData.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm">
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pengajuan</DialogTitle>
            <DialogDescription>
              {selectedPengajuan?.nomor_pengajuan}
            </DialogDescription>
          </DialogHeader>

          {selectedPengajuan && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-4">
                <StatusBadge status={selectedPengajuan.status} />
                {selectedPengajuan.file_surat_url && (
                  <a 
                    href={selectedPengajuan.file_surat_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Lihat File Surat →
                  </a>
                )}
              </div>

              {/* Mahasiswa Info */}
              <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-xl">
                <div>
                  <Label className="text-muted-foreground">Nama</Label>
                  <p className="font-medium">{selectedPengajuan.mahasiswa?.nama}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">NIM</Label>
                  <p className="font-medium">{selectedPengajuan.mahasiswa?.nim}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Program Studi</Label>
                  <p className="font-medium">{selectedPengajuan.mahasiswa?.program_studi}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedPengajuan.mahasiswa?.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">No. HP</Label>
                  <p className="font-medium">{selectedPengajuan.mahasiswa?.no_hp}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Jenis Surat</Label>
                  <p className="font-medium">{selectedPengajuan.jenis_surat?.nama}</p>
                </div>
              </div>

              {/* Keperluan */}
              <div>
                <Label className="text-muted-foreground">Keperluan</Label>
                <p className="mt-1 p-3 bg-muted/30 rounded-lg">{selectedPengajuan.keperluan}</p>
              </div>

              {/* Edit Form */}
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <Label>Ubah Status</Label>
                  <Select value={editStatus} onValueChange={(v) => setEditStatus(v as StatusPengajuan)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKFLOW_ORDER.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Catatan Admin</Label>
                  <Textarea
                    value={editCatatan}
                    onChange={(e) => setEditCatatan(e.target.value)}
                    placeholder="Tambahkan catatan jika diperlukan..."
                    className="mt-1"
                  />
                </div>

                {/* File Upload - Only show for DIPROSES or SELESAI */}
                {(editStatus === 'DIPROSES' || editStatus === 'SELESAI') && (
                  <div>
                    <Label>Upload File Surat (PDF)</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        className="flex-1"
                      />
                      {uploadFile && (
                        <Button 
                          onClick={handleUploadFile} 
                          disabled={isUploading}
                          size="sm"
                        >
                          {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileUp className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateStatus} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Pengajuan?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data pengajuan akan dihapus secara permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
