import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Send, Paperclip, Shield, Zap, Heart, MessageCircle, FileQuestion, BadgeCheck } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    title: '',
    message: '',
    attachment: null as File | null
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        category: formData.category,
        title: formData.title,
        subject: formData.title,
        message: formData.message,
        hasAttachment: !!formData.attachment
      };

      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: payload
      });

      if (error || data?.success === false) {
        const invokeError = error as any;
        let functionErrorBody: unknown = null;
        if (invokeError?.context && typeof invokeError.context.clone === 'function') {
          const clonedResponse = invokeError.context.clone();
          functionErrorBody = await clonedResponse.json().catch(async () => clonedResponse.text().catch(() => null));
        }

        console.error('[Contact] send-contact-email failed', {
          invokeError: error,
          status: invokeError?.context?.status || invokeError?.status,
          statusText: invokeError?.context?.statusText,
          functionErrorBody,
          response: data,
          payload: {
            ...payload,
            message: `${payload.message.slice(0, 120)}${payload.message.length > 120 ? '...' : ''}`,
          },
        });
        throw error || new Error(data?.error || 'Contact email function returned an unsuccessful response');
      }

      toast.success('Mensagem enviada com sucesso! Responderemos em breve.');
      setFormData({ name: '', email: '', category: '', title: '', message: '', attachment: null });
    } catch (error: any) {
      console.error('[Contact] Erro ao enviar mensagem:', {
        message: error?.message,
        status: error?.status,
        name: error?.name,
        details: error?.details,
      });
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, attachment: file }));
  };

  const supportCards = [
    {
      icon: Shield,
      title: 'Segurança e governança',
      description: 'Canal para dúvidas sobre conta, segurança, privacidade, validação e regras da plataforma.'
    },
    {
      icon: Zap,
      title: 'Atendimento objetivo',
      description: 'Envie sua solicitação com contexto para que a equipe consiga responder com mais precisão.'
    },
    {
      icon: Heart,
      title: 'Apoio ao usuário',
      description: 'Suporte para apoiadores, criadores e pessoas interessadas em entender melhor a Raiz Token.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Fale com a Raiz Token</title>
        <meta name="description" content="Entre em contato com a equipe da Raiz Token para tirar dúvidas sobre projetos, campanhas de crowdfunding ou sua conta na plataforma." />
        <link rel="canonical" href="https://raiztoken.com.br/contato" />
      </Helmet>

      <div className="min-h-screen bg-[radial-gradient(circle_at_82%_8%,rgba(186,218,156,.22),transparent_24%),radial-gradient(circle_at_12%_14%,rgba(45,64,93,.10),transparent_28%),linear-gradient(180deg,#FBFCF8_0%,#F4F7F2_48%,#FFFFFF_100%)]">
      <main className="relative overflow-hidden px-4 py-14 md:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(45,64,93,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(45,64,93,.035)_1px,transparent_1px)] bg-[size:56px_56px] opacity-70" />

        <div className="relative mx-auto max-w-7xl">
          <section className="mx-auto mb-14 max-w-4xl text-center">
            <div className="mx-auto mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-home-line bg-white/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-home-900 shadow-home-glass">
              <span className="h-2 w-2 rounded-full bg-home-800 shadow-[0_0_0_5px_rgba(29,140,90,.14)]" />
              Falar conosco
            </div>

            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-home-line bg-white/90 text-home-800 shadow-home-glass">
              <Mail className="h-8 w-8" />
            </div>

            <h1 className="mb-6 font-display text-4xl font-extrabold leading-[.98] tracking-[-.038em] text-home-900 md:text-6xl">
              Precisa de ajuda? Fale com a Raiz Token.
            </h1>

            <p className="mx-auto max-w-3xl text-base leading-relaxed text-home-muted md:text-lg">
              Envie sua mensagem para dúvidas sobre projetos, conta, carteira, apoios, validação, prestação de contas ou funcionamento da plataforma.
            </p>
          </section>

          <section className="mb-16 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <aside className="space-y-4">
              {supportCards.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} className="rounded-[28px] border-home-line bg-white/90 shadow-home-glass transition-all duration-300 hover:-translate-y-2 hover:shadow-home-card">
                    <CardContent className="p-6">
                      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-home-line bg-white text-home-800">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h2 className="mb-2 font-display text-xl font-extrabold tracking-[-.025em] text-home-900">{item.title}</h2>
                      <p className="text-sm leading-relaxed text-home-muted">{item.description}</p>
                    </CardContent>
                  </Card>
                );
              })}

              <Card className="overflow-hidden rounded-[28px] border-home-line bg-gradient-to-br from-home-900 to-home-800 text-white shadow-home-card">
                <CardContent className="p-6">
                  <BadgeCheck className="mb-5 h-8 w-8 text-home-gold" />
                  <h2 className="mb-3 font-display text-2xl font-extrabold tracking-[-.025em]">Antes de enviar</h2>
                  <p className="text-sm leading-relaxed text-white/72">
                    Quanto mais claro for o assunto, título e contexto da mensagem, mais rápida e precisa tende a ser a resposta.
                  </p>
                </CardContent>
              </Card>
            </aside>

            <Card className="overflow-hidden rounded-[34px] border-home-line bg-white/92 shadow-home-card backdrop-blur-xl">
              <CardHeader className="border-b border-home-line/70 bg-white/72 px-6 py-7 md:px-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-home-900 text-home-gold shadow-home-glass">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-2xl font-extrabold tracking-[-.025em] text-home-900">Envie sua mensagem</CardTitle>
                    <p className="text-sm text-home-muted">Preencha os campos abaixo para abrir contato com a equipe</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 py-7 md:px-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-home-900">Nome completo</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Seu nome completo"
                        required
                        className="h-12 rounded-2xl border-home-line bg-white text-home-900 placeholder:text-home-muted/70 focus-visible:ring-home-800"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-home-900">Endereço de e-mail</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="seu@email.com"
                        required
                        className="h-12 rounded-2xl border-home-line bg-white text-home-900 placeholder:text-home-muted/70 focus-visible:ring-home-800"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-home-900">Assunto</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                        required
                      >
                        <SelectTrigger className="h-12 rounded-2xl border-home-line bg-white text-home-900 focus:ring-home-800">
                          <SelectValue placeholder="Selecione o assunto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apoio">Apoio</SelectItem>
                          <SelectItem value="projeto">Projeto</SelectItem>
                          <SelectItem value="perfil">Perfil</SelectItem>
                          <SelectItem value="saque">Saque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-home-900">Título da mensagem</Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Título da sua mensagem"
                        required
                        className="h-12 rounded-2xl border-home-line bg-white text-home-900 placeholder:text-home-muted/70 focus-visible:ring-home-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-home-900">Mensagem</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Descreva sua dúvida ou mensagem..."
                      required
                      rows={7}
                      className="rounded-2xl border-home-line bg-white text-home-900 placeholder:text-home-muted/70 focus-visible:ring-home-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attachment" className="text-home-900">Anexos (opcional)</Label>
                    <div className="relative rounded-2xl border border-dashed border-home-line bg-home-100/70 p-4">
                      <Input
                        id="attachment"
                        type="file"
                        onChange={handleFileChange}
                        className="border-0 bg-transparent p-0 text-home-muted file:mr-4 file:rounded-full file:border-0 file:bg-home-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-home-800"
                      />
                      <Paperclip className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-home-muted" />
                    </div>
                    {formData.attachment && (
                      <p className="mt-1 text-sm text-home-muted">
                        Arquivo: {formData.attachment.name}
                      </p>
                    )}
                  </div>

                  <Button type="submit" size="lg" disabled={loading} className="h-12 w-full rounded-full bg-home-800 font-semibold text-white shadow-lg shadow-home-900/10 hover:bg-home-900">
                    <Send className="mr-2 h-4 w-4" />
                    {loading ? 'Enviando...' : 'Enviar Mensagem'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>

          <section className="overflow-hidden rounded-[38px] bg-white/88 p-8 text-center shadow-home-glass md:p-10">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-home-900 text-home-gold">
              <FileQuestion className="h-7 w-7" />
            </div>
            <h2 className="mb-4 font-display text-3xl font-extrabold tracking-[-.038em] text-home-900 md:text-4xl">Também pode consultar nossas páginas de apoio.</h2>
            <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-home-muted">
              Algumas dúvidas podem ser resolvidas rapidamente nas páginas institucionais da plataforma.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link to="/faq">
                <Button variant="outline" size="lg" className="rounded-full border-home-line bg-white px-8 font-semibold text-home-900 hover:bg-home-100">
                  Perguntas Frequentes
                </Button>
              </Link>
              <Link to="/como-funciona">
                <Button variant="outline" size="lg" className="rounded-full border-home-line bg-white px-8 font-semibold text-home-900 hover:bg-home-100">
                  Como Funciona
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
      </div>
    </>
  );
};

export default Contact;
