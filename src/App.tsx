
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
import CreateProjectDraft from "./pages/CreateProjectDraft";
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

const queryClient = new QueryClient();

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
                      <CreateProjectDraft />
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
                <Route 
                  path="/projeto/:id" 
                  element={<ProjectDetail />} 
                />
                <Route 
                  path="/perfil" 
                  element={
                    <ProtectedRoute>
                      <UserProfile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/usuario/:userId" 
                  element={<PublicProfile />} 
                />
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
                {/* Blog public pages */}
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                {/* Public informational pages */}
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
                {/* Short URL routes for campaigns */}
                <Route path="/c/:shortId" element={<ShortUrlRedirect />} />
                <Route path="/campanha/:shortId" element={<ShortUrlRedirect />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
