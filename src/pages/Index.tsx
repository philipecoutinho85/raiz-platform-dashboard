import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import WhatWeOfferSection from '@/components/WhatWeOfferSection';
import ReputationSection from '@/components/ReputationSection';
import BadgesShowcaseSection from '@/components/BadgesShowcaseSection';
import CreatorToolsSection from '@/components/CreatorToolsSection';
import FeaturedProjects from '@/components/FeaturedProjects';
import SupporterProtectionSection from '@/components/SupporterProtectionSection';
import SeriousCreatorsSection from '@/components/SeriousCreatorsSection';
import EmotionalConnectionSection from '@/components/EmotionalConnectionSection';
import TechExclusivitySection from '@/components/TechExclusivitySection';
import CommunitySection from '@/components/CommunitySection';
import Footer from '@/components/Footer';
import { Helmet } from 'react-helmet';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Raiz Token: Crowdfunding Transparente | Financiamento Coletivo Confiável</title>
        <meta 
          name="description" 
          content="Plataforma de crowdfunding com validação humana, curadoria e transparência total. Financiamento coletivo estruturado para projetos de impacto social, ambiental e cultural no Brasil." 
        />
        <meta 
          name="keywords" 
          content="financiamento coletivo confiável, plataforma transparente de projetos, crowdfunding de impacto, curadoria de projetos, validação humana crowdfunding, RaizScore, badges de credibilidade" 
        />
        <link rel="canonical" href="https://raiztoken.com.br/" />
        <meta property="og:title" content="Raiz Token: Crowdfunding Transparente com Validação Humana" />
        <meta property="og:description" content="Tecnologia, curadoria e reputação pública para conectar criadores e apoiadores. Financiamento coletivo estruturado e profissional." />
        <meta property="og:url" content="https://raiztoken.com.br/" />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="min-h-screen">
        <HeroSection />
        <FeaturesSection />
        <WhatWeOfferSection />
        <ReputationSection />
        <BadgesShowcaseSection />
        <CreatorToolsSection />
        <FeaturedProjects />
        <SupporterProtectionSection />
        <SeriousCreatorsSection />
        <EmotionalConnectionSection />
        <TechExclusivitySection />
        <CommunitySection />
        <Footer />
      </div>
    </>
  );
};

export default Index;
