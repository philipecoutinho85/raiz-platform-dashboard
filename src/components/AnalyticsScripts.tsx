import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AnalyticsScripts = () => {
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const { data } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'analytics')
          .single();

        if (!data) return;

        const analytics = data.value as any;

        // Google Analytics
        if (analytics.google_analytics_id) {
          const gaScript = document.createElement('script');
          gaScript.async = true;
          gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${analytics.google_analytics_id}`;
          document.head.appendChild(gaScript);

          const gaConfigScript = document.createElement('script');
          gaConfigScript.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${analytics.google_analytics_id}');
          `;
          document.head.appendChild(gaConfigScript);
        }

        // Google Tag Manager
        if (analytics.google_tag_manager_id) {
          const gtmScript = document.createElement('script');
          gtmScript.innerHTML = `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${analytics.google_tag_manager_id}');
          `;
          document.head.appendChild(gtmScript);

          // GTM noscript
          const gtmNoscript = document.createElement('noscript');
          gtmNoscript.innerHTML = `
            <iframe src="https://www.googletagmanager.com/ns.html?id=${analytics.google_tag_manager_id}"
            height="0" width="0" style="display:none;visibility:hidden"></iframe>
          `;
          document.body.insertBefore(gtmNoscript, document.body.firstChild);
        }

        // Meta Pixel
        if (analytics.meta_pixel_id) {
          const fbScript = document.createElement('script');
          fbScript.innerHTML = `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${analytics.meta_pixel_id}');
            fbq('track', 'PageView');
          `;
          document.head.appendChild(fbScript);

          const fbNoscript = document.createElement('noscript');
          fbNoscript.innerHTML = `
            <img height="1" width="1" style="display:none"
            src="https://www.facebook.com/tr?id=${analytics.meta_pixel_id}&ev=PageView&noscript=1"/>
          `;
          document.body.appendChild(fbNoscript);
        }
      } catch (error) {
        console.error('Error loading analytics:', error);
      }
    };

    loadAnalytics();
  }, []);

  return null;
};

export default AnalyticsScripts;
