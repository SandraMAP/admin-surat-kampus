import { FileText, Menu, LogIn, LogOut, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

const navLinks = [
  { label: 'Beranda', path: '/' },
  { label: 'Ajukan Surat', path: '/ajukan' },
  { label: 'Lacak Pengajuan', path: '/lacak' },
];

export function Header() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 glass-effect border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-foreground">SURATKU</h1>
            <p className="text-xs text-muted-foreground">Layanan Surat Kampus</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/riwayat">
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  Riwayat
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth">
                <Button variant="outline" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
              <Link to="/admin">
                <Button variant="ghost" size="sm">
                  Admin
                </Button>
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="flex flex-col gap-4 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setOpen(false)}
                  className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link to="/riwayat" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full gap-2">
                      <User className="h-4 w-4" />
                      Riwayat Pengajuan
                    </Button>
                  </Link>
                  <Button onClick={() => { handleLogout(); setOpen(false); }} variant="ghost" className="w-full gap-2">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setOpen(false)}>
                    <Button className="w-full gap-2">
                      <LogIn className="h-4 w-4" />
                      Login Mahasiswa
                    </Button>
                  </Link>
                  <Link to="/admin" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full">Admin Login</Button>
                  </Link>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
