import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Send, Loader2, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { JenisSurat } from '@/types/database';

const formSchema = z.object({
  nama: z.string().min(3, 'Nama minimal 3 karakter').max(100),
  nim: z.string().min(5, 'NIM tidak valid').max(20),
  program_studi: z.string().min(3, 'Program studi wajib diisi').max(100),
  email: z.string().email('Email tidak valid'),
  no_hp: z.string().min(10, 'Nomor HP tidak valid').max(15),
  jenis_surat_id: z.string().uuid('Pilih jenis surat'),
  keperluan: z.string().min(10, 'Keperluan minimal 10 karakter').max(1000),
});

type FormValues = z.infer<typeof formSchema>;

export default function SubmitPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [jenisSuratList, setJenisSuratList] = useState<JenisSurat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [nomorPengajuan, setNomorPengajuan] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: '',
      nim: '',
      program_studi: '',
      email: '',
      no_hp: '',
      jenis_surat_id: '',
      keperluan: '',
    },
  });

  useEffect(() => {
    fetchJenisSurat();
  }, []);

  const fetchJenisSurat = async () => {
    const { data, error } = await supabase
      .from('jenis_surat')
      .select('*')
      .eq('is_active', true)
      .order('nama');

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal memuat jenis surat' });
      return;
    }

    setJenisSuratList(data as JenisSurat[]);
  };

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);

    try {
      // Check if mahasiswa exists
      let mahasiswaId: string;
      
      const { data: existingMahasiswa } = await supabase
        .from('mahasiswa')
        .select('id')
        .eq('nim', values.nim)
        .maybeSingle();

      if (existingMahasiswa) {
        mahasiswaId = existingMahasiswa.id;
        
        // Update mahasiswa data
        await supabase
          .from('mahasiswa')
          .update({
            nama: values.nama,
            program_studi: values.program_studi,
            email: values.email,
            no_hp: values.no_hp,
          })
          .eq('id', mahasiswaId);
      } else {
        // Create new mahasiswa
        const { data: newMahasiswa, error: mahasiswaError } = await supabase
          .from('mahasiswa')
          .insert({
            nama: values.nama,
            nim: values.nim,
            program_studi: values.program_studi,
            email: values.email,
            no_hp: values.no_hp,
          })
          .select('id')
          .single();

        if (mahasiswaError) throw mahasiswaError;
        mahasiswaId = newMahasiswa.id;
      }

      // Create pengajuan
      const { data: pengajuan, error: pengajuanError } = await supabase
        .from('pengajuan_surat')
        .insert({
          mahasiswa_id: mahasiswaId,
          jenis_surat_id: values.jenis_surat_id,
          keperluan: values.keperluan,
        })
        .select('nomor_pengajuan')
        .single();

      if (pengajuanError) throw pengajuanError;

      setNomorPengajuan(pengajuan.nomor_pengajuan);
      setIsSuccess(true);

      toast({
        title: 'Berhasil!',
        description: 'Pengajuan surat berhasil disubmit',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Gagal mengajukan surat',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <StudentLayout>
        <div className="container py-8 md:py-12">
          <Card className="max-w-lg mx-auto text-center animate-scale-in">
            <CardContent className="pt-8 pb-8">
              <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Pengajuan Berhasil!
              </h2>
              <p className="text-muted-foreground mb-6">
                Simpan nomor pengajuan berikut untuk melacak status surat Anda
              </p>
              <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-4 mb-6">
                <p className="text-sm text-muted-foreground mb-1">Nomor Pengajuan</p>
                <p className="text-2xl font-bold text-primary font-mono">{nomorPengajuan}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsSuccess(false);
                    form.reset();
                  }}
                >
                  Ajukan Lagi
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => navigate(`/lacak?nomor=${nomorPengajuan}`)}
                >
                  Lacak Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="container py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
              <FileText className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Ajukan Surat
            </h1>
            <p className="text-muted-foreground">
              Lengkapi form berikut untuk mengajukan surat
            </p>
          </div>

          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>Form Pengajuan Surat</CardTitle>
              <CardDescription>
                Pastikan data yang Anda masukkan sudah benar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="nama"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Lengkap</FormLabel>
                          <FormControl>
                            <Input placeholder="Masukkan nama lengkap" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nim"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NIM</FormLabel>
                          <FormControl>
                            <Input placeholder="Masukkan NIM" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="program_studi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program Studi</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Teknik Informatika" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="no_hp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor HP</FormLabel>
                          <FormControl>
                            <Input placeholder="08xxxxxxxxxx" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="jenis_surat_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jenis Surat</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih jenis surat" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {jenisSuratList.map((jenis) => (
                              <SelectItem key={jenis.id} value={jenis.id}>
                                {jenis.nama}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="keperluan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Keperluan / Keterangan</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Jelaskan keperluan pengajuan surat Anda..." 
                            className="min-h-[120px] resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full gap-2" size="lg" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Ajukan Surat
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
}
