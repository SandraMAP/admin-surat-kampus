import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, Lock, Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const resetSchema = z.object({
  password: z.string().min(8, 'Password minimal 8 karakter'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak sama',
  path: ['confirmPassword'],
});

type ResetValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isValidatingToken, setIsValidatingToken] = useState(true);

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    // Check if we have a valid recovery token in the URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    // Also check query params (some email clients may convert hash to query)
    const queryParams = new URLSearchParams(window.location.search);
    const tokenFromQuery = queryParams.get('token');
    const typeFromQuery = queryParams.get('type');

    const handleRecovery = async () => {
      // If we have access_token in hash (this is the Supabase PKCE flow)
      if (accessToken && type === 'recovery') {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || '',
          });
          
          if (error) {
            setTokenError('Token reset password tidak valid atau sudah kadaluarsa.');
          }
        } catch (err) {
          setTokenError('Terjadi kesalahan saat memvalidasi token.');
        }
        setIsValidatingToken(false);
        return;
      }

      // If we have token in query (older Supabase flow)
      if (tokenFromQuery && typeFromQuery === 'recovery') {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenFromQuery,
            type: 'recovery',
          });
          
          if (error) {
            setTokenError('Token reset password tidak valid atau sudah kadaluarsa.');
          }
        } catch (err) {
          setTokenError('Terjadi kesalahan saat memvalidasi token.');
        }
        setIsValidatingToken(false);
        return;
      }

      // Check if there's already a valid session (user might have already clicked the link)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidatingToken(false);
        return;
      }

      // No valid token or session found
      setTokenError('Link reset password tidak valid. Silakan minta link reset password baru.');
      setIsValidatingToken(false);
    };

    handleRecovery();
  }, []);

  const onSubmit = async (values: ResetValues) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: values.password 
      });
      
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Gagal',
          description: error.message || 'Terjadi kesalahan saat mengubah password',
        });
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      toast({ 
        title: 'Berhasil', 
        description: 'Password berhasil diubah. Silakan login dengan password baru.' 
      });

      // Sign out to clear session and redirect to login
      await supabase.auth.signOut();
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/admin');
      }, 2000);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Terjadi kesalahan. Silakan coba lagi.',
      });
    }
    
    setIsLoading(false);
  };

  // Loading state while validating token
  if (isValidatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <Card className="w-full max-w-md relative animate-scale-in">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Memvalidasi token reset password...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state - invalid or expired token
  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <Card className="w-full max-w-md relative animate-scale-in">
          <CardHeader className="text-center">
            <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Token Tidak Valid</CardTitle>
            <CardDescription className="text-destructive">
              {tokenError}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link to="/admin/forgot-password">
                Minta Link Reset Password Baru
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/admin">
                Kembali ke Login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <Card className="w-full max-w-md relative animate-scale-in">
          <CardHeader className="text-center">
            <div className="h-16 w-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Password Berhasil Diubah</CardTitle>
            <CardDescription>
              Anda akan diarahkan ke halaman login...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/admin">
                Login Sekarang
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 gradient-hero opacity-5" />
      
      <Card className="w-full max-w-md relative animate-scale-in">
        <CardHeader className="text-center">
          <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
            <FileText className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Reset Password Admin</CardTitle>
          <CardDescription>
            Masukkan password baru Anda (minimal 8 karakter)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password Baru</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type={showPassword ? 'text' : 'password'} 
                          placeholder="••••••••" 
                          className="pl-10 pr-10" 
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
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konfirmasi Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type={showPassword ? 'text' : 'password'} 
                          placeholder="••••••••" 
                          className="pl-10" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Password Baru'
                )}
              </Button>

              <div className="text-center">
                <Link to="/admin" className="text-sm text-muted-foreground hover:text-primary">
                  Kembali ke Login
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
