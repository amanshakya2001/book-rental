import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import Script from 'next/script';
import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';

// No need to dynamically import Bootstrap JS as a component
// We'll load it using next/script in the document head

function App({ Component, pageProps }) {
  const router = useRouter();
  const [bootstrapLoaded, setBootstrapLoaded] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    let isMounted = true;

    const initBootstrap = () => {
      if (!isMounted) return;
      
      // Check if Bootstrap is loaded
      if (window.bootstrap) {
        setBootstrapLoaded(true);
        initializeTooltips();
      } else {
        // If not loaded yet, try again shortly
        setTimeout(initBootstrap, 100);
      }
    };

    const initializeTooltips = () => {
      if (!window.bootstrap?.Tooltip) return;
      
      const tooltipTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="tooltip"]')
      );
      
      tooltipTriggerList.forEach(tooltipTriggerEl => {
        try {
          // Check if tooltip is already initialized
          if (!window.bootstrap.Tooltip.getInstance(tooltipTriggerEl)) {
            new window.bootstrap.Tooltip(tooltipTriggerEl);
          }
        } catch (error) {
          console.error('Error initializing tooltip:', error);
        }
      });
    };

    // Initial check
    initBootstrap();

    // Handle route changes
    const handleRouteChange = () => {
      if (window.bootstrap) {
        initializeTooltips();
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    // Cleanup
    return () => {
      isMounted = false;
      router.events.off('routeChangeComplete', handleRouteChange);
      
      // Clean up tooltips
      if (window.bootstrap?.Tooltip) {
        const tooltipList = [].slice.call(
          document.querySelectorAll('[data-bs-toggle="tooltip"]')
        );
        
        tooltipList.forEach(tooltipEl => {
          try {
            const tooltip = window.bootstrap.Tooltip.getInstance(tooltipEl);
            if (tooltip) {
              tooltip.dispose();
            }
          } catch (error) {
            console.error('Error disposing tooltip:', error);
          }
        });
      }
    };
  }, [router.events]);

  return (
    <>
      <Head>
        {/* Load Bootstrap JS with next/script */}
        <Script
          src="/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
          onLoad={() => {
            setBootstrapLoaded(true);
            // Initialize tooltips after Bootstrap is loaded
            if (window.bootstrap?.Tooltip) {
              const tooltipTriggerList = [].slice.call(
                document.querySelectorAll('[data-bs-toggle="tooltip"]')
              );
              tooltipTriggerList.forEach(el => new window.bootstrap.Tooltip(el));
            }
          }}
        />
      </Head>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </>
  );
}

export default App;
