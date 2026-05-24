import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { TokensProvider } from "./contexts/TokensContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AnalyticsScripts from "./components/AnalyticsScripts";
import GoogleAnalyticsLoader from "./components/GoogleAnalyticsLoader";
import Header from "./components/Header";
import MobileBottomNav from "./components/MobileBottomNav";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import CreateProject from "./pages/CreateProject";
import MyProjects from "./pages/MyProjects";
import ProjectDetail from "./pages/ProjectDetail";
import UserProfile from "./pages/UserProfile";
import PublicProfile from "./pages/PublicProfile";
import AdminPanel from "./pages/AdminPanel";
import AdminBlog from "./pages/AdminBlog";
import AdminBlogEditor from "./pages/AdminBlogEditor";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import HowItWorks from "./pages/HowItWorks";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import PrivacySupporters from "./pages/PrivacySupporters";
import PrivacyCreators from "./pages/PrivacyCreators";
import Security from "./pages/Security";
import Contact from "./pages/Contact";
import Wallet from "./pages/Wallet";
import CheckoutPayment from "./pages/CheckoutPayment";
import CookiePolicy from "./pages/CookiePolicy";
import RateSupportPage from "./pages/RateSupportPage";
import ShortUrlRedirect from "./pages/ShortUrlRedirect";
import CookieConsent from "./components/CookieConsent";
import AIFaqChat from "./components/AIFaqChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, Save, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Footer from "./components/Footer";

const queryClient = new QueryClient();

const draftCategories = [
  { value: "tecnologia", label: "Tecnologia" },
  { value: "cultura", label: "Cultura" },
  { value: "educacao", label: "Educacao" },
  { value: "saude", label: "Saude" },
  { value: "ambiental", label: "Ambiental" },
  { value: "social", label: "Social" },
  { value: "empreendedorismo", label: "Empreendedorismo" },
  { value: "bem-estar-animal", label: "Bem-Estar Animal" },
  { value: "outros", label: "Outros" },
];

const CreateProjectDraftRoute = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isIdentityVerified, setIsIdentityVerified] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  useEffect(() => {
    const loadUserStatus = async () => {
      if (!user) return;

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_onboarding_complete, is_identity_verified")
        .eq("id", user.id)
        .maybeSingle();

      setIsAdmin(Boolean(roleData));
      setIsIdentityVerified(Boolean(profile?.stripe_onboarding_complete || profile?.is_identity_verified));
    };

    loadUserStatus();
  }, [user]);

  const validateDraft = () => {
    if (!title.trim()) return "Informe o titulo do projeto.";
    if (!category) return "Selecione uma categoria.";
    if (!description.trim()) return "Informe a descricao do projeto.";
    if (!goal || Number(goal) < 1000) return "A meta minima e de 1.000 tokens.";
    return null;
  };

  const saveProject = async (status: "draft" | "pending") => {
    const draftError = validateDraft();

    if (draftError) {
      toast({ title: "Ajuste necessario", description: draftError, variant: "destructive" });
      return;
    }

    if (status === "pending" && !isAdmin && !isIdentityVerified) {
      toast({
        title: "Verificacao necessaria",
        description: "Para enviar o projeto para analise, conclua a verificacao de identidade.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from("projects")
        .insert({
          user_id: user?.id,
          title: title.trim(),
          category,
          description: description.trim(),
          goal: Number(goal),
          youtube_url: youtubeUrl.trim() || "",
          status,
          project_type: "regular",
          platform_fee_percentage: 10,
        } as any);

      if (error) throw error;

      toast({
        title: status === "draft" ? "Rascunho salvo" : "Projeto enviado para analise",
        description:
          status === "draft"
            ? "Seu projeto foi salvo como rascunho. Voce podera revisar e enviar para analise depois."
            : "Seu projeto foi enviado para analise da equipe Raiz Token.",
      });

      navigate("/meus-projetos");
    } catch (error: any) {
      toast({
        title: "Erro ao salvar projeto",
        description: error?.message || "Nao foi possivel salvar o projeto agora.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-raiz-light py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-raiz-dark mb-2">Criar Novo Projeto</h1>
          <p className="text-raiz-secondary">Comece seu projeto como rascunho e envie para analise quando estiver pronto.</p>
        </div>

        <Alert className="mb-6 border-green-200 bg-green-50">
          <ShieldCheck className="h-5 w-5 text-green-700" />
          <AlertTitle className="text-green-900">Comece agora e publique com seguranca depois</AlertTitle>
          <AlertDescription className="text-green-800">
            <p className="mb-2">Voce pode preencher seu projeto e salvar como rascunho sem concluir a verificacao de identidade. O KYC sera exigido apenas antes do envio para analise.</p>
            <p className="text-sm font-medium">Rascunho: sem KYC obrigatorio. Envio para analise: KYC obrigatorio.</p>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Informacoes do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Titulo do Projeto *</Label>
                <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Digite o titulo do seu projeto" />
              </div>

              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {draftCategories.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descricao *</Label>
              <Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descreva seu projeto em detalhes..." className="min-h-[200px] resize-y" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Meta em Tokens *</Label>
              <Input id="goal" type="number" min="1000" step="1" value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="1000" />
              <p className="text-xs text-raiz-secondary">1 token = R$1,00 | Meta minima: 1.000 tokens</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="youtube_url">URL do Video YouTube - opcional</Label>
              <Input id="youtube_url" value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
              <p className="text-sm text-gray-500">Voce pode adicionar um video depois. O rascunho sera salvo mesmo sem video.</p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate("/meus-projetos")} disabled={loading}>Cancelar</Button>
              <Button type="button" variant="outline" onClick={() => saveProject("pending")} disabled={loading}>
                <Send className="w-4 h-4 mr-2" />
                Enviar para analise
              </Button>
              <Button type="button" onClick={() => saveProject("draft")} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Salvando..." : "Salvar rascunho"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <TokensProvider>
          <AnalyticsScripts />
          <GoogleAnalyticsLoader />
          <BrowserRouter>
            <CookieConsent />
            <div className="min-h-screen flex flex-col">
              <Header />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Register />} />
                <Route path="/esqueci-senha" element={<ForgotPassword />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/projetos" element={<Marketplace />} />
                <Route 
                  path="/criar-projeto" 
                  element={
                    <ProtectedRoute>
                      <CreateProjectDraftRoute />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/criar-projeto-legado" 
                  element={
                    <ProtectedRoute>
                      <CreateProject />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/meus-projetos" 
                  element={
                    <ProtectedRoute>
                      <MyProjects />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/projeto/:id" element={<ProjectDetail />} />
                <Route 
                  path="/perfil" 
                  element={
                    <ProtectedRoute>
                      <UserProfile />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/usuario/:userId" element={<PublicProfile />} />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <AdminPanel />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/blog" 
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <AdminBlog />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/blog/:id" 
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <AdminBlogEditor />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/carteira" 
                  element={
                    <ProtectedRoute>
                      <Wallet />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/checkout-pagamento" 
                  element={
                    <ProtectedRoute>
                      <CheckoutPayment />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/como-funciona" element={<HowItWorks />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/privacidade-apoiadores" element={<PrivacySupporters />} />
                <Route path="/privacidade-criadores" element={<PrivacyCreators />} />
                <Route path="/security" element={<Security />} />
                <Route path="/politica-de-cookies" element={<CookiePolicy />} />
                <Route path="/contato" element={<Contact />} />
                <Route path="/avaliar-suporte" element={<RateSupportPage />} />
                <Route path="/c/:shortId" element={<ShortUrlRedirect />} />
                <Route path="/campanha/:shortId" element={<ShortUrlRedirect />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <MobileBottomNav />
            <AIFaqChat />
          </BrowserRouter>
        </TokensProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
