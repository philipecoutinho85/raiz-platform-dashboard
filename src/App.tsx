
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
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
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

const CreateProjectDraftMode = () => {
  useEffect(() => {
    const originalFrom = supabase.from.bind(supabase);
    const originalFromValue = supabase.from;

    supabase.from = ((tableName: string) => {
      const queryBuilder = originalFrom(tableName as never) as any;

      if (tableName !== "projects" || typeof queryBuilder.insert !== "function") {
        return queryBuilder;
      }

      const originalInsert = queryBuilder.insert.bind(queryBuilder);
      queryBuilder.insert = (values: any, options?: any) => {
        const convertRow = (row: any) => {
          if (!row || typeof row !== "object") return row;
          return {
            ...row,
            status: "draft",
            youtube_url: typeof row.youtube_url === "string" ? row.youtube_url : "",
          };
        };

        const convertedValues = Array.isArray(values)
          ? values.map(convertRow)
          : convertRow(values);

        return originalInsert(convertedValues, options);
      };

      return queryBuilder;
    }) as typeof supabase.from;

    const style = document.createElement("style");
    style.setAttribute("data-raiz-draft-mode", "true");
    style.textContent = `
      [data-raiz-draft-mode] .pointer-events-none { pointer-events: auto !important; }
      [data-raiz-draft-mode] .opacity-60 { opacity: 1 !important; }
    `;
    document.head.appendChild(style);

    const prepareDraftSubmit = () => {
      const youtubeInput = document.querySelector<HTMLInputElement>('#youtube_url');
      if (youtubeInput && youtubeInput.value.trim() === "") {
        youtubeInput.value = " ";
        youtubeInput.dispatchEvent(new Event("input", { bubbles: true }));
      }

      const submitButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('button[type="submit"]'));
      submitButtons.forEach((button) => {
        button.disabled = false;
        if (button.textContent?.includes("Criar Projeto")) {
          button.textContent = "Salvar rascunho";
        }
      });
    };

    const intervalId = window.setInterval(prepareDraftSubmit, 500);
    document.addEventListener("click", prepareDraftSubmit, true);
    prepareDraftSubmit();

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("click", prepareDraftSubmit, true);
      style.remove();
      supabase.from = originalFromValue;
    };
  }, []);

  return (
    <div data-raiz-draft-mode="true">
      <CreateProject />
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
                      <CreateProjectDraftMode />
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
