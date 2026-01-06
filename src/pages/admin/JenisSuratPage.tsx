import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, Search, Download, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { JenisSurat } from '@/types/database';
import { format } from 'date-fns';

export default function JenisSuratPage() {
  const { toast } = useToast();
  const [jenisSuratList, setJenisSuratList] = useState<JenisSurat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ 
    id: '', 
    kode: '', 
    nama: '', 
    deskripsi: '', 
    tujuan_surat: '', 
    template_surat: '', 
    is_active: true 
  });
  const [isSaving, setIsSaving] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchJenisSurat();
  }, []);

  const fetchJenisSurat = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('jenis_surat')
        .select('*')
        .order('kode');

      if (error) throw error;
      setJenisSuratList(data as JenisSurat[]);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = jenisSuratList.filter(j => 
    j.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.kode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenForm = (jenis?: JenisSurat) => {
    if (jenis) {
      setFormData({
        id: jenis.id,
        kode: jenis.kode,
        nama: jenis.nama,
        deskripsi: jenis.deskripsi || '',
        tujuan_surat: jenis.tujuan_surat || '',
        template_surat: jenis.template_surat || '',
        is_active: jenis.is_active,
      });
      setIsEditing(true);
    } else {
      setFormData({ 
        id: '', 
        kode: '', 
        nama: '', 
        deskripsi: '', 
        tujuan_surat: 'Kepada Yth. Pihak Terkait', 
        template_surat: getDefaultTemplate(),
        is_active: true 
      });
      setIsEditing(false);
    }
    setIsFormOpen(true);
  };

  const getDefaultTemplate = () => {
    return `Yang bertanda tangan di bawah ini, menerangkan bahwa:

Nama: {{nama}}
NIM: {{nim}}
Program Studi: {{program_studi}}

Adalah benar mahasiswa aktif yang memerlukan {{jenis_surat}} untuk keperluan: {{keperluan}}.

Demikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`;
  };

  const handleSave = async () => {
    if (!formData.kode || !formData.nama) {
      toast({ variant: 'destructive', title: 'Error', description: 'Kode dan Nama wajib diisi' });
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('jenis_surat')
          .update({
            kode: formData.kode,
            nama: formData.nama,
            deskripsi: formData.deskripsi || null,
            tujuan_surat: formData.tujuan_surat || null,
            template_surat: formData.template_surat || null,
            is_active: formData.is_active,
          })
          .eq('id', formData.id);

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Data berhasil diperbarui' });
      } else {
        const { error } = await supabase
          .from('jenis_surat')
          .insert({
            kode: formData.kode,
            nama: formData.nama,
            deskripsi: formData.deskripsi || null,
            tujuan_surat: formData.tujuan_surat || null,
            template_surat: formData.template_surat || null,
            is_active: formData.is_active,
          });

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Data berhasil ditambahkan' });
      }

      setIsFormOpen(false);
      fetchJenisSurat();
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
        .from('jenis_surat')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Data berhasil dihapus' });
      setDeleteId(null);
      fetchJenisSurat();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Kode', 'Nama', 'Deskripsi', 'Tujuan Surat', 'Status'];
    const rows = jenisSuratList.map(j => [j.kode, j.nama, j.deskripsi || '', j.tujuan_surat || '', j.is_active ? 'Aktif' : 'Nonaktif']);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `jenis-surat-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
          const [kode, nama, deskripsi, status] = line.split(',').map(s => s.replace(/"/g, '').trim());
          
          if (kode && nama) {
            await supabase.from('jenis_surat').upsert({
              kode,
              nama,
              deskripsi: deskripsi || null,
              is_active: status !== 'Nonaktif',
            }, { onConflict: 'kode' });
          }
        }
        
        toast({ title: 'Import Berhasil' });
        fetchJenisSurat();
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
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Jenis Surat</h1>
            <p className="text-muted-foreground">Kelola master data jenis surat</p>
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
                placeholder="Cari kode atau nama..."
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
            ) : filteredData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Tidak ada data jenis surat
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead className="hidden md:table-cell">Deskripsi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((jenis) => (
                    <TableRow key={jenis.id}>
                      <TableCell className="font-mono">{jenis.kode}</TableCell>
                      <TableCell className="font-medium">{jenis.nama}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {jenis.deskripsi || '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          jenis.is_active 
                            ? 'bg-success/10 text-success' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {jenis.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenForm(jenis)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(jenis.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit' : 'Tambah'} Jenis Surat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div>
              <Label>Kode</Label>
              <Input
                value={formData.kode}
                onChange={(e) => setFormData({ ...formData, kode: e.target.value.toUpperCase() })}
                placeholder="Contoh: SK-AKTIF"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Nama</Label>
              <Input
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Nama jenis surat"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Textarea
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                placeholder="Deskripsi jenis surat"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Tujuan Surat</Label>
              <Input
                value={formData.tujuan_surat}
                onChange={(e) => setFormData({ ...formData, tujuan_surat: e.target.value })}
                placeholder="Contoh: Kepada Yth. Pihak Terkait"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Tujuan surat akan otomatis ditentukan berdasarkan jenis surat
              </p>
            </div>
            <div>
              <Label>Template Surat</Label>
              <Textarea
                value={formData.template_surat}
                onChange={(e) => setFormData({ ...formData, template_surat: e.target.value })}
                placeholder="Template surat dengan placeholder..."
                className="mt-1 min-h-[150px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Placeholder: {"{{nama}}, {{nim}}, {{program_studi}}, {{jenis_surat}}, {{tujuan_surat}}, {{keperluan}}, {{tanggal}}, {{nomor_pengajuan}}"}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Label>Status Aktif</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
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
            <DialogTitle>Hapus Jenis Surat?</DialogTitle>
            <DialogDescription>
              Data jenis surat akan dihapus secara permanen.
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
