import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Download, Upload, Search, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ProgramStudi {
  id: string;
  kode: string;
  nama: string;
  fakultas: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ProgramStudiPage() {
  const { toast } = useToast();
  const [programStudiList, setProgramStudiList] = useState<ProgramStudi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    fakultas: '',
    is_active: true,
  });
  
  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProgramStudi();
  }, []);

  const fetchProgramStudi = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('program_studi')
      .select('*')
      .order('kode');

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal memuat data program studi' });
    } else {
      setProgramStudiList(data as ProgramStudi[]);
    }
    setIsLoading(false);
  };

  const filteredData = programStudiList.filter(
    (item) =>
      item.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.fakultas && item.fakultas.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenForm = (item?: ProgramStudi) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        kode: item.kode,
        nama: item.nama,
        fakultas: item.fakultas || '',
        is_active: item.is_active,
      });
    } else {
      setEditingId(null);
      setFormData({ kode: '', nama: '', fakultas: '', is_active: true });
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.kode.trim() || !formData.nama.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Kode dan nama wajib diisi' });
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from('program_studi')
        .update({
          kode: formData.kode.toUpperCase(),
          nama: formData.nama,
          fakultas: formData.fakultas || null,
          is_active: formData.is_active,
        })
        .eq('id', editingId);

      if (error) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      } else {
        toast({ title: 'Berhasil', description: 'Program studi berhasil diperbarui' });
        setIsFormOpen(false);
        fetchProgramStudi();
      }
    } else {
      const { error } = await supabase.from('program_studi').insert({
        kode: formData.kode.toUpperCase(),
        nama: formData.nama,
        fakultas: formData.fakultas || null,
        is_active: formData.is_active,
      });

      if (error) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      } else {
        toast({ title: 'Berhasil', description: 'Program studi berhasil ditambahkan' });
        setIsFormOpen(false);
        fetchProgramStudi();
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase.from('program_studi').delete().eq('id', deleteId);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Berhasil', description: 'Program studi berhasil dihapus' });
      fetchProgramStudi();
    }
    setDeleteId(null);
  };

  const handleExportCSV = () => {
    const headers = ['Kode', 'Nama', 'Fakultas', 'Aktif'];
    const rows = programStudiList.map((item) => [
      item.kode,
      item.nama,
      item.fakultas || '',
      item.is_active ? 'Ya' : 'Tidak',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'program_studi.csv';
    link.click();
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').slice(1); // Skip header
      const records = lines
        .filter((line) => line.trim())
        .map((line) => {
          const [kode, nama, fakultas] = line.split(',');
          return {
            kode: kode?.trim().toUpperCase(),
            nama: nama?.trim(),
            fakultas: fakultas?.trim() || null,
            is_active: true,
          };
        })
        .filter((r) => r.kode && r.nama);

      if (records.length > 0) {
        const { error } = await supabase.from('program_studi').upsert(records, {
          onConflict: 'kode',
        });

        if (error) {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
          toast({ title: 'Berhasil', description: `${records.length} program studi berhasil diimpor` });
          fetchProgramStudi();
        }
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Program Studi</h1>
            <p className="text-muted-foreground">Kelola data master program studi</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportCSV}
            />
            <Button onClick={() => handleOpenForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Program Studi
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Daftar Program Studi
                </CardTitle>
                <CardDescription>Total {filteredData.length} program studi</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari program studi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Tidak ada data</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Kode</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Fakultas</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[100px] text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono font-medium">{item.kode}</TableCell>
                        <TableCell>{item.nama}</TableCell>
                        <TableCell className="text-muted-foreground">{item.fakultas || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={item.is_active ? 'default' : 'secondary'}>
                            {item.is_active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenForm(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Program Studi' : 'Tambah Program Studi'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Ubah data program studi' : 'Tambah program studi baru ke sistem'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="kode">Kode *</Label>
              <Input
                id="kode"
                value={formData.kode}
                onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                placeholder="Contoh: TI"
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama">Nama *</Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: Teknik Informatika"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fakultas">Fakultas</Label>
              <Input
                id="fakultas"
                value={formData.fakultas}
                onChange={(e) => setFormData({ ...formData, fakultas: e.target.value })}
                placeholder="Contoh: Fakultas Teknologi Informasi"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Status Aktif</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Program Studi?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data program studi akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
