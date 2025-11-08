import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const GoogleAnalyticsLoader = () => {
  useEffect(() => {
    const loadGoogleAnalytics = async () => {
      try {
        const { data, error } = await supabase
          .from('google_analytics_settings')
          .select('gtag_script')
          .single();

        if (error || !data?.gtag_script) return;

        // Inserir o script no head
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = data.gtag_script;
        
        const scripts = tempDiv.querySelectorAll('script');
        scripts.forEach((script) => {
          const newScript = document.createElement('script');
          if (script.src) {
            newScript.src = script.src;
            newScript.async = true;
          } else {
            newScript.textContent = script.textContent;
          }
          document.head.appendChild(newScript);
        });
      } catch (error) {
        console.error('Erro ao carregar Google Analytics:', error);
      }
    };

    loadGoogleAnalytics();
  }, []);

  return null;
};

export default GoogleAnalyticsLoader;
