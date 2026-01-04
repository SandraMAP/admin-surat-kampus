import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, Loader2, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PROGRAM_STUDI } from '@/data/programStudi';

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

const registerSchema = z.object({
  nama: z.string().min(3, 'Nama minimal 3 karakter'),
  nim: z.string().min(5, 'NIM tidak valid'),
  program_studi: z.string().min(3, 'Program studi wajib diisi'),
  email: z.string().email('Email tidak valid'),
  no_hp: z.string().min(10, 'Nomor HP tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nama: '',
      nim: '',
      program_studi: '',
      email: '',
      no_hp: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onLogin = async (values: LoginValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      toast({ title: 'Berhasil', description: 'Login berhasil!' });
      navigate('/ajukan');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message === 'Invalid login credentials' 
          ? 'Email atau password salah' 
          : error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (values: RegisterValues) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/ajukan`,
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create mahasiswa record linked to user
        const { error: mahasiswaError } = await supabase
          .from('mahasiswa')
          .insert({
            nama: values.nama,
            nim: values.nim,
            program_studi: values.program_studi,
            email: values.email,
            no_hp: values.no_hp,
            user_id: data.user.id,
          });

        if (mahasiswaError && !mahasiswaError.message.includes('duplicate')) {
          throw mahasiswaError;
        }
      }

      toast({
        title: 'Berhasil',
        description: 'Registrasi berhasil! Silakan login.',
      });
      navigate('/ajukan');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message.includes('already registered')
          ? 'Email sudah terdaftar'
          : error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="container py-8 md:py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
              <FileText className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Login Mahasiswa
            </h1>
            <p className="text-muted-foreground">
              Masuk untuk mengajukan surat dan melihat riwayat pengajuan
            </p>
          </div>

          <Card className="animate-slide-up">
            <CardContent className="pt-6">
              <Tabs defaultValue="login">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    Login
                  </TabsTrigger>
                  <TabsTrigger value="register" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Daftar
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
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
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="••••••••"
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LogIn className="h-4 w-4" />
                        )}
                        Masuk
                      </Button>

                      <div className="text-center">
                        <Link
                          to="/lupa-password"
                          className="text-sm text-primary hover:underline"
                        >
                          Lupa password?
                        </Link>
                      </div>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
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

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="nim"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>NIM</FormLabel>
                              <FormControl>
                                <Input placeholder="NIM" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="no_hp"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>No. HP</FormLabel>
                              <FormControl>
                                <Input placeholder="08xxx" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={registerForm.control}
                        name="program_studi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Program Studi</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih program studi" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {PROGRAM_STUDI.map((prodi) => (
                                  <SelectItem key={prodi} value={prodi}>
                                    {prodi}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
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

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ulangi Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                        Daftar
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Atau{' '}
            <button
              onClick={() => navigate('/lacak')}
              className="text-primary hover:underline"
            >
              lacak pengajuan tanpa login
            </button>
          </p>
        </div>
      </div>
    </StudentLayout>
  );
}
