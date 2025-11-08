import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const GoogleAnalyticsLoader = () => {
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  useEffect(() => {
    // Evitar carregar múltiplas vezes
    if (scriptsLoaded) return;

    const loadGoogleAnalytics = async () => {
      try {
        const { data, error } = await supabase
          .from('google_analytics_settings')
          .select('gtag_script')
          .single();

        if (error || !data?.gtag_script) return;

        // Verificar se o script já foi carregado
        if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
          setScriptsLoaded(true);
          return;
        }

        // Inserir o script no head logo após o <head>
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = data.gtag_script.trim();
        
        const scripts = tempDiv.querySelectorAll('script');
        scripts.forEach((script, index) => {
          const newScript = document.createElement('script');
          
          if (script.src) {
            // Script externo (gtag.js)
            newScript.src = script.src;
            newScript.async = true;
          } else {
            // Script inline (configuração)
            newScript.textContent = script.textContent;
          }
          
          // Adicionar ao head
          document.head.appendChild(newScript);
        });

        setScriptsLoaded(true);
      } catch (error) {
        console.error('Erro ao carregar Google Analytics:', error);
      }
    };

    loadGoogleAnalytics();
  }, [scriptsLoaded]);

  return null;
};

export default GoogleAnalyticsLoader;
