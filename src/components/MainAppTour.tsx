import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useLocation } from 'react-router-dom';

// Define the steps for our main app tour
const homeSteps: Step[] = [
  {
    target: 'body', // Start with a modal-like introduction
    content: 'Selamat datang di SmartVerse! Mari kita mulai tur untuk memahami fitur-fitur utama platform ini.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.tour-navigation',
    content: 'Ini adalah menu navigasi. Anda dapat mengakses berbagai fitur SmartVerse dari sini.',
    placement: 'bottom',
  },
  {
    target: '.tour-wallet-connect',
    content: 'Hubungkan wallet Anda untuk mengakses semua fitur SmartVerse, termasuk registrasi nama dan pembayaran.',
    placement: 'bottom',
  },
  {
    target: '.tour-hero-section',
    content: 'Ini adalah halaman utama SmartVerse. Di sini Anda bisa melihat fitur-fitur utama platform.',
    placement: 'bottom',
  },
  {
    target: '.tour-dashboard-link',
    content: 'Klik di sini untuk mengakses Dashboard Anda dan mengelola nama .sw.',
    placement: 'bottom',
  },
  {
    target: '.tour-pay-link',
    content: 'Klik di sini untuk mengakses fitur Cross-Chain Pay dan mengirim token menggunakan nama atau QR code.',
    placement: 'bottom',
  },
  {
    target: '.tour-business-link',
    content: 'Klik di sini untuk mengakses SmartVerse Business dan mengelola bisnis UMKM Anda.',
    placement: 'bottom',
  },
];

const dashboardSteps: Step[] = [
  {
    target: '.tour-dashboard-intro',
    content: 'Ini adalah Dashboard Anda. Di sini Anda dapat mengelola nama .sw dan melihat aktivitas wallet Anda.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-name-registration',
    content: 'Daftarkan nama .sw Anda di sini untuk memudahkan pengiriman dan penerimaan token.',
    placement: 'bottom',
  },
  {
    target: '.tour-name-directory',
    content: 'Lihat semua nama .sw yang terdaftar dan dikelola oleh Anda di sini.',
    placement: 'top',
  },
];

const paySteps: Step[] = [
  {
    target: '.tour-pay-intro',
    content: 'Halaman ini memungkinkan Anda mengirim token dengan mudah menggunakan nama .sw atau alamat wallet.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-send-tokens',
    content: 'Masukkan nama penerima atau alamat wallet, pilih token, dan jumlah yang ingin dikirim.',
    placement: 'bottom',
  },
  {
    target: '.tour-scan-qr',
    content: 'Anda juga dapat memindai QR code untuk mengirim token dengan cepat dan aman.',
    placement: 'bottom',
  },
];

// Define the props for our MainAppTour component
interface MainAppTourProps {
  children: React.ReactNode;
}

const localStorageKey = 'smartverse_app_tour_completed';

const MainAppTour: React.FC<MainAppTourProps> = ({ children }) => {
  const location = useLocation();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  // Check if this is the first time the user is visiting
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem(localStorageKey) === 'true';
    
    if (!hasCompletedTour) {
      // Set the appropriate steps based on the current route
      if (location.pathname === '/') {
        setSteps(homeSteps);
      } else if (location.pathname.includes('/dashboard')) {
        setSteps(dashboardSteps);
      } else if (location.pathname.includes('/pay')) {
        setSteps(paySteps);
      } else {
        // For other routes, don't show a tour
        return;
      }
      
      // Add a slight delay to ensure the DOM is ready
      const timer = setTimeout(() => {
        setRun(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  // Handle tour callback events
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    
    // If the tour is finished or skipped, mark it as completed
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      localStorage.setItem(localStorageKey, 'true');
    }
  };

  // Function to reset the tour (for testing or manual restart)
  const resetTour = () => {
    localStorage.removeItem(localStorageKey);
    // Set the appropriate steps based on the current route
    if (location.pathname === '/') {
      setSteps(homeSteps);
    } else if (location.pathname.includes('/dashboard')) {
      setSteps(dashboardSteps);
    } else if (location.pathname.includes('/pay')) {
      setSteps(paySteps);
    }
    setRun(true);
  };

  // Custom styles to match our application theme
  const joyrideStyles = {
    options: {
      primaryColor: '#3b82f6', // blue-500
      backgroundColor: '#ffffff',
      textColor: '#1f2937', // gray-800
      arrowColor: '#ffffff',
      zIndex: 10000,
    },
    tooltipContainer: {
      textAlign: 'left' as const,
      padding: '12px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    },
    tooltipTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '8px',
    },
    buttonNext: {
      backgroundColor: '#3b82f6', // blue-500
      color: '#ffffff',
      padding: '8px 16px',
      borderRadius: '4px',
      fontSize: '14px',
    },
    buttonBack: {
      marginRight: '8px',
      color: '#6b7280', // gray-500
      fontSize: '14px',
    },
    buttonSkip: {
      color: '#6b7280', // gray-500
      fontSize: '14px',
    },
  };

  return (
    <>
      <Joyride
        callback={handleJoyrideCallback}
        continuous
        hideCloseButton
        run={run}
        scrollToFirstStep
        showProgress
        showSkipButton
        steps={steps}
        styles={joyrideStyles}
        locale={{
          back: 'Kembali',
          close: 'Tutup',
          last: 'Selesai',
          next: 'Lanjut',
          skip: 'Lewati'
        }}
      />
      
      {/* Development-only tour reset button */}
      {process.env.NODE_ENV === 'development' && (
        <button 
          onClick={resetTour}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '8px 12px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            zIndex: 9999,
            display: run ? 'none' : 'block'
          }}
        >
          Restart Tour
        </button>
      )}
      
      {children}
    </>
  );
};

export default MainAppTour;
