import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import FeaturedProjects from '@/components/FeaturedProjects';
import Footer from '@/components/Footer';
import { Helmet } from 'react-helmet';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Raiz Token: Crowdfunding e Investimento para Projetos ESG | Financiamento Coletivo</title>
        <meta 
          name="description" 
          content="Plataforma de crowdfunding para apoio a projetos ESG. Conecte investidores a iniciativas sustentáveis através de financiamento coletivo. Capitalize projetos transformadores com impacto social e ambiental." 
        />
        <meta 
          name="keywords" 
          content="apoio a projetos, capitalizar investidores, ESG, crowdfunding, financiamento coletivo, investimento para projetos, sustentabilidade, impacto social, projetos ambientais" 
        />
        <link rel="canonical" href="https://raiztoken.com.br/" />
        <meta property="og:title" content="Raiz Token: Crowdfunding ESG | Apoio a Projetos Sustentáveis" />
        <meta property="og:description" content="Financiamento coletivo para projetos ESG. Conectamos investidores a iniciativas transformadoras com impacto social e ambiental." />
        <meta property="og:url" content="https://raiztoken.com.br/" />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="min-h-screen">
        <HeroSection />
        <FeaturesSection />
        <FeaturedProjects />
        <Footer />
      </div>
    </>
  );
};

export default Index;
