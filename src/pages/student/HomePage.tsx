import { FileText, Search, Clock, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StudentLayout } from '@/components/layout/StudentLayout';

const features = [
  {
    icon: FileText,
    title: 'Ajukan Surat',
    description: 'Ajukan berbagai jenis surat non-akademik dengan mudah dan cepat',
    path: '/ajukan',
    color: 'primary',
  },
  {
    icon: Search,
    title: 'Lacak Pengajuan',
    description: 'Pantau status pengajuan surat Anda secara real-time',
    path: '/lacak',
    color: 'accent',
  },
];

const stats = [
  { icon: FileText, value: '8+', label: 'Jenis Surat' },
  { icon: Clock, value: '24 Jam', label: 'Proses Cepat' },
  { icon: CheckCircle, value: '100%', label: 'Online' },
];

export default function HomePage() {
  return (
    <StudentLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15)_0%,transparent_50%)]" />
        
        <div className="container relative py-12 md:py-20">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
              <Sparkles className="h-4 w-4" />
              Layanan Digital Kampus
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-slide-up">
              Surat Menyurat
              <span className="block mt-2 text-primary">
                Non-Akademik
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Ajukan surat keterangan, rekomendasi, dan dokumen lainnya 
              secara online. Tanpa antri, tanpa ribet.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/ajukan">
                <Button size="lg" className="gap-2 shadow-glow">
                  Ajukan Surat Sekarang
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/lacak">
                <Button size="lg" variant="outline" className="gap-2">
                  <Search className="h-4 w-4" />
                  Lacak Pengajuan
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 border-y bg-card/50">
        <div className="container">
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="flex flex-col items-center text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <stat.icon className="h-6 w-6 md:h-8 md:w-8 text-primary mb-2" />
                <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Layanan Kami
            </h2>
            <p className="text-muted-foreground">
              Pilih layanan yang Anda butuhkan
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <Link key={feature.path} to={feature.path}>
                <Card 
                  className="group h-full border-2 hover:border-primary/50 hover:shadow-card-hover transition-all duration-300 cursor-pointer animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6 md:p-8">
                    <div className={`h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-glow`}>
                      <feature.icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                    <div className="flex items-center gap-1 mt-4 text-primary font-medium">
                      <span>Mulai</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Cara Kerja
            </h2>
            <p className="text-muted-foreground">
              Proses pengajuan surat dalam 4 langkah mudah
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
            {[
              { step: 1, title: 'Isi Form', desc: 'Lengkapi data diri' },
              { step: 2, title: 'Disetujui', desc: 'Verifikasi admin' },
              { step: 3, title: 'Diproses', desc: 'Pembuatan surat' },
              { step: 4, title: 'Selesai', desc: 'Unduh surat' },
            ].map((item, index) => (
              <div 
                key={item.step}
                className="relative flex flex-col items-center text-center animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg mb-3 shadow-glow">
                  {item.step}
                </div>
                <h4 className="font-semibold text-foreground">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </StudentLayout>
  );
}
