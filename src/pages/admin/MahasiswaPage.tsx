import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Loader2, Search, Download, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mahasiswa } from '@/types/database';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 10;

export default function MahasiswaPage() {
  const { toast } = useToast();
  const [mahasiswaList, setMahasiswaList] = useState<Mahasiswa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: '', nama: '', nim: '', program_studi: '', email: '', no_hp: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchMahasiswa();
  }, []);

  const fetchMahasiswa = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('mahasiswa')
        .select('*')
        .order('nama');

      if (error) throw error;
      setMahasiswaList(data as Mahasiswa[]);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return mahasiswaList.filter(m => 
      m.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.nim.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [mahasiswaList, searchQuery]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const handleOpenForm = (mahasiswa?: Mahasiswa) => {
    if (mahasiswa) {
      setFormData({
        id: mahasiswa.id,
        nama: mahasiswa.nama,
        nim: mahasiswa.nim,
        program_studi: mahasiswa.program_studi,
        email: mahasiswa.email,
        no_hp: mahasiswa.no_hp,
      });
      setIsEditing(true);
    } else {
      setFormData({ id: '', nama: '', nim: '', program_studi: '', email: '', no_hp: '' });
      setIsEditing(false);
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nama || !formData.nim || !formData.email) {
      toast({ variant: 'destructive', title: 'Error', description: 'Nama, NIM, dan Email wajib diisi' });
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('mahasiswa')
          .update({
            nama: formData.nama,
            nim: formData.nim,
            program_studi: formData.program_studi,
            email: formData.email,
            no_hp: formData.no_hp,
          })
          .eq('id', formData.id);

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Data berhasil diperbarui' });
      } else {
        const { error } = await supabase
          .from('mahasiswa')
          .insert({
            nama: formData.nama,
            nim: formData.nim,
            program_studi: formData.program_studi,
            email: formData.email,
            no_hp: formData.no_hp,
          });

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Data berhasil ditambahkan' });
      }

      setIsFormOpen(false);
      fetchMahasiswa();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('mahasiswa')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Data berhasil dihapus' });
      setDeleteId(null);
      fetchMahasiswa();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['NIM', 'Nama', 'Program Studi', 'Email', 'No HP'];
    const rows = mahasiswaList.map(m => [m.nim, m.nama, m.program_studi, m.email, m.no_hp]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mahasiswa-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast({ title: 'Export Berhasil' });
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').slice(1); // Skip header
        
        for (const line of lines) {
          if (!line.trim()) continue;
          const [nim, nama, program_studi, email, no_hp] = line.split(',').map(s => s.replace(/"/g, '').trim());
          
          if (nim && nama && email) {
            await supabase.from('mahasiswa').upsert({
              nim,
              nama,
              program_studi: program_studi || '',
              email,
              no_hp: no_hp || '',
            }, { onConflict: 'nim' });
          }
        }
        
        toast({ title: 'Import Berhasil' });
        fetchMahasiswa();
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Data Mahasiswa</h1>
            <p className="text-muted-foreground">Kelola data mahasiswa</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <label>
              <Button variant="outline" className="gap-2" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                  Import
                </span>
              </Button>
              <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
            </label>
            <Button onClick={() => handleOpenForm()} className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, NIM, atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
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
                Tidak ada data mahasiswa
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>NIM</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead className="hidden md:table-cell">Program Studi</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead className="hidden lg:table-cell">No. HP</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((mahasiswa) => (
                        <TableRow key={mahasiswa.id}>
                          <TableCell className="font-mono">{mahasiswa.nim}</TableCell>
                          <TableCell className="font-medium">{mahasiswa.nama}</TableCell>
                          <TableCell className="hidden md:table-cell">{mahasiswa.program_studi}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">{mahasiswa.email}</TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">{mahasiswa.no_hp}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleOpenForm(mahasiswa)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteId(mahasiswa.id)}>
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

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit' : 'Tambah'} Mahasiswa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>NIM</Label>
              <Input
                value={formData.nim}
                onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                placeholder="Nomor Induk Mahasiswa"
                className="mt-1"
                disabled={isEditing}
              />
            </div>
            <div>
              <Label>Nama Lengkap</Label>
              <Input
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Nama lengkap mahasiswa"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Program Studi</Label>
              <Input
                value={formData.program_studi}
                onChange={(e) => setFormData({ ...formData, program_studi: e.target.value })}
                placeholder="Program studi"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email mahasiswa"
                className="mt-1"
              />
            </div>
            <div>
              <Label>No. HP</Label>
              <Input
                value={formData.no_hp}
                onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                placeholder="Nomor HP"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Mahasiswa?</DialogTitle>
            <DialogDescription>
              Data mahasiswa akan dihapus secara permanen beserta semua pengajuan surat terkait.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
