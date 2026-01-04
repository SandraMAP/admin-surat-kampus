import { useState } from 'react';
import { User, Lock, Mail, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const profileSchema = z.object({
  nama: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email('Email tidak valid'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Password minimal 6 karakter'),
  newPassword: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Password tidak sama',
  path: ['confirmPassword'],
});

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { adminProfile, user, updatePassword } = useAuth();
  const { toast } = useToast();
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nama: adminProfile?.nama || '',
      email: adminProfile?.email || user?.email || '',
    },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onProfileSubmit = async (values: ProfileValues) => {
    if (!adminProfile) return;
    
    setIsProfileLoading(true);
    try {
      const { error } = await supabase
        .from('admin_profiles')
        .update({
          nama: values.nama,
          email: values.email,
        })
        .eq('id', adminProfile.id);

      if (error) throw error;

      toast({ title: 'Berhasil', description: 'Profil berhasil diperbarui' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (values: PasswordValues) => {
    setIsPasswordLoading(true);
    
    const { error } = await updatePassword(values.newPassword);
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      setIsPasswordLoading(false);
      return;
    }

    toast({ title: 'Berhasil', description: 'Password berhasil diperbarui' });
    passwordForm.reset();
    setIsPasswordLoading(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pengaturan</h1>
          <p className="text-muted-foreground">Kelola profil dan keamanan akun</p>
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profil Admin
            </CardTitle>
            <CardDescription>
              Perbarui informasi profil Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="nama"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama Anda" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
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

                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm text-muted-foreground">
                    Role: <span className="font-medium text-foreground capitalize">{adminProfile?.role || 'Admin'}</span>
                  </span>
                </div>

                <Button type="submit" disabled={isProfileLoading}>
                  {isProfileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Profil
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Ubah Password
            </CardTitle>
            <CardDescription>
              Perbarui password akun Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password Saat Ini</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? 'text' : 'password'} 
                            placeholder="••••••••" 
                            {...field} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password Baru</FormLabel>
                      <FormControl>
                        <Input 
                          type={showPassword ? 'text' : 'password'} 
                          placeholder="••••••••" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konfirmasi Password Baru</FormLabel>
                      <FormControl>
                        <Input 
                          type={showPassword ? 'text' : 'password'} 
                          placeholder="••••••••" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isPasswordLoading}>
                  {isPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ubah Password
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
