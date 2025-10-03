import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import Footer from '@/components/Footer';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Mensagem enviada com sucesso! Responderemos em breve.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-raiz-primary via-raiz-primary/95 to-raiz-secondary">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mx-auto mb-6 p-4 bg-raiz-accent/20 rounded-full w-fit">
            <Mail className="w-12 h-12 text-raiz-accent" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-raiz-light mb-6">
            Fale 
            <span className="text-raiz-gold"> Conosco</span>
          </h1>
          <p className="text-xl text-raiz-light/80 max-w-3xl mx-auto mb-8">
            Estamos aqui para ajudar! Entre em contato conosco através do formulário abaixo 
            ou utilize nossos canais diretos de comunicação.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
              <CardHeader>
                <CardTitle className="text-raiz-gold flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  E-mail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-raiz-light/80">contato@raiztoken.com.br</p>
                <p className="text-sm text-raiz-light/60 mt-2">Respondemos em até 24h</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
              <CardHeader>
                <CardTitle className="text-raiz-gold flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Telefone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-raiz-light/80">(21) 96883-9616</p>
                <p className="text-sm text-raiz-light/60 mt-2">Segunda a Sexta, 9h às 18h</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
              <CardHeader>
                <CardTitle className="text-raiz-gold flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-raiz-light/80">Niterói, RJ - Brasil</p>
                <p className="text-sm text-raiz-light/60 mt-2">Atendimento online</p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white/10 backdrop-blur-lg border-raiz-accent/20">
              <CardHeader>
                <CardTitle className="text-2xl text-raiz-gold">Envie sua Mensagem</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-raiz-light font-medium mb-2">
                      Nome Completo
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Seu nome"
                      required
                      className="bg-white/5 border-raiz-accent/20 text-raiz-light placeholder:text-raiz-light/40"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-raiz-light font-medium mb-2">
                      E-mail
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="seu@email.com"
                      required
                      className="bg-white/5 border-raiz-accent/20 text-raiz-light placeholder:text-raiz-light/40"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-raiz-light font-medium mb-2">
                      Assunto
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Como podemos ajudar?"
                      required
                      className="bg-white/5 border-raiz-accent/20 text-raiz-light placeholder:text-raiz-light/40"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-raiz-light font-medium mb-2">
                      Mensagem
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Descreva sua dúvida ou mensagem..."
                      required
                      rows={6}
                      className="bg-white/5 border-raiz-accent/20 text-raiz-light placeholder:text-raiz-light/40"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full bg-raiz-gold hover:bg-raiz-gold/90 text-black font-semibold"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Mensagem
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Links */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-raiz-light mb-6">
            Links Úteis
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/faq">
              <Button variant="outline" size="lg" className="text-black bg-raiz-light border-raiz-light hover:bg-raiz-light/90 px-8">
                Perguntas Frequentes
              </Button>
            </Link>
            <Link to="/como-funciona">
              <Button variant="outline" size="lg" className="text-black bg-raiz-light border-raiz-light hover:bg-raiz-light/90 px-8">
                Como Funciona
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
