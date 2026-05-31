import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Footer from '@/components/Footer';

interface LegalPageLayoutProps {
  badge: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

interface LegalSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  emphasis?: boolean;
}

export const LegalPageLayout = ({ badge, title, subtitle, icon, children, footer }: LegalPageLayoutProps) => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_82%_8%,rgba(186,218,156,.22),transparent_24%),radial-gradient(circle_at_12%_14%,rgba(45,64,93,.10),transparent_28%),linear-gradient(180deg,#FBFCF8_0%,#F4F7F2_48%,#FFFFFF_100%)]">
      <main className="relative overflow-hidden px-4 py-14 md:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(45,64,93,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(45,64,93,.035)_1px,transparent_1px)] bg-[size:56px_56px] opacity-70" />

        <div className="relative mx-auto max-w-5xl">
          <section className="mx-auto mb-12 max-w-4xl text-center">
            <div className="mx-auto mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-home-line bg-white/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-home-900 shadow-home-glass">
              <span className="h-2 w-2 rounded-full bg-home-800 shadow-[0_0_0_5px_rgba(29,140,90,.14)]" />
              {badge}
            </div>

            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-home-line bg-white/90 text-home-800 shadow-home-glass">
              {icon}
            </div>

            <h1 className="mb-6 font-display text-4xl font-extrabold leading-[.98] tracking-[-.038em] text-home-900 md:text-6xl">
              {title}
            </h1>

            <p className="mx-auto max-w-3xl text-base leading-relaxed text-home-muted md:text-lg">
              {subtitle}
            </p>
          </section>

          <section className="space-y-6 md:space-y-8">
            {children}
          </section>

          {footer && <section className="mt-12">{footer}</section>}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export const LegalSection = ({ title, icon, children, emphasis = false }: LegalSectionProps) => {
  return (
    <Card className={`overflow-hidden rounded-[30px] border-home-line shadow-home-glass ${emphasis ? 'bg-gradient-to-br from-home-900 to-home-800 text-white' : 'bg-white/92 text-home-900 backdrop-blur-xl'}`}>
      <CardHeader className={`${emphasis ? 'border-white/10 bg-white/[0.04]' : 'border-home-line/70 bg-white/72'} border-b px-6 py-5 md:px-8`}>
        <CardTitle className={`flex items-center gap-3 font-display text-xl font-extrabold tracking-[-.025em] ${emphasis ? 'text-white' : 'text-home-900'}`}>
          {icon && (
            <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${emphasis ? 'bg-white/10 text-home-gold' : 'border border-home-line bg-white text-home-800'}`}>
              {icon}
            </span>
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={`legal-content px-6 py-6 leading-relaxed md:px-8 ${emphasis ? 'text-white/72' : 'text-home-muted'}`}>
        {children}
      </CardContent>
    </Card>
  );
};

export const LegalCTA = ({ children }: { children: ReactNode }) => (
  <div className="overflow-hidden rounded-[38px] bg-gradient-to-br from-home-900 to-home-800 p-8 text-center text-white shadow-home-card md:p-12">
    {children}
  </div>
);
