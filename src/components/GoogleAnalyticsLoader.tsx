import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const GoogleAnalyticsLoader = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Evitar carregamento duplicado
    if (loaded || document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
      return;
    }

    const loadGoogleAnalytics = async () => {
      try {
        const { data, error } = await supabase
          .from('google_analytics_settings')
          .select('gtag_script')
          .maybeSingle();

        if (error) {
          console.error('Error fetching GA settings:', error);
          return;
        }

        if (!data?.gtag_script) {
          console.log('No Google Analytics script configured');
          return;
        }

        // Extrair ID do Google Analytics do script
        const gtagIdMatch = data.gtag_script.match(/gtag\/js\?id=(G-[A-Z0-9]+)/);
        const configIdMatch = data.gtag_script.match(/gtag\('config',\s*'(G-[A-Z0-9]+)'/);
        
        if (!gtagIdMatch || !configIdMatch) {
          console.error('Invalid Google Analytics script format');
          return;
        }

        const gtagId = gtagIdMatch[1];
        const configId = configIdMatch[1];

        // Criar e adicionar o script externo gtag.js
        const gtagScript = document.createElement('script');
        gtagScript.async = true;
        gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${gtagId}`;
        document.head.appendChild(gtagScript);

        // Criar e adicionar o script de configuração inline
        const configScript = document.createElement('script');
        configScript.textContent = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${configId}');
        `;
        document.head.appendChild(configScript);

        setLoaded(true);
        console.log('Google Analytics loaded successfully');
      } catch (error) {
        console.error('Error loading Google Analytics:', error);
      }
    };

    loadGoogleAnalytics();
  }, [loaded]);

  return null;
};

export default GoogleAnalyticsLoader;
