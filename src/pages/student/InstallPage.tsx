import { StudentLayout } from '@/components/layout/StudentLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Smartphone, Download, MoreVertical, Plus, Share, Check } from 'lucide-react';

export default function InstallPage() {
  return (
    <StudentLayout>
      <div className="container py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
              <Smartphone className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Install Aplikasi SURATKU
            </h1>
            <p className="text-muted-foreground">
              Pasang SURATKU di perangkat Anda untuk akses lebih cepat
            </p>
          </div>

          {/* Android Instructions */}
          <Card className="mb-6 animate-slide-up">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Android (Chrome)
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Menggunakan browser Chrome
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    1
                  </div>
                  <div className="pt-1">
                    <p className="font-medium text-foreground">Buka menu browser</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ketuk ikon <MoreVertical className="inline h-4 w-4" /> di pojok kanan atas browser Chrome
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    2
                  </div>
                  <div className="pt-1">
                    <p className="font-medium text-foreground">Pilih "Tambahkan ke Layar utama"</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Atau pilih "Install app" / "Add to Home screen"
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    3
                  </div>
                  <div className="pt-1">
                    <p className="font-medium text-foreground">Konfirmasi instalasi</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ketuk "Tambah" atau "Install" untuk konfirmasi
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                    <Check className="h-4 w-4" />
                  </div>
                  <div className="pt-1">
                    <p className="font-medium text-foreground">Selesai!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      SURATKU sekarang tersedia di layar utama perangkat Anda
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* iOS Instructions */}
          <Card className="mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    iPhone / iPad (Safari)
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Menggunakan browser Safari
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    1
                  </div>
                  <div className="pt-1">
                    <p className="font-medium text-foreground">Buka tombol Share</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ketuk ikon <Share className="inline h-4 w-4" /> di bagian bawah browser Safari
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    2
                  </div>
                  <div className="pt-1">
                    <p className="font-medium text-foreground">Pilih "Add to Home Screen"</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Scroll ke bawah dan cari opsi <Plus className="inline h-4 w-4" /> "Add to Home Screen"
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    3
                  </div>
                  <div className="pt-1">
                    <p className="font-medium text-foreground">Konfirmasi dengan "Add"</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ketuk "Add" di pojok kanan atas
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                    <Check className="h-4 w-4" />
                  </div>
                  <div className="pt-1">
                    <p className="font-medium text-foreground">Selesai!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      SURATKU sekarang tersedia di layar utama perangkat Anda
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-foreground mb-4">
                Keuntungan Install Aplikasi
              </h3>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm text-foreground">Akses lebih cepat dari layar utama</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm text-foreground">Tampilan fullscreen tanpa address bar</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm text-foreground">Pengalaman seperti aplikasi native</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm text-foreground">Tidak perlu download dari App Store</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
}
