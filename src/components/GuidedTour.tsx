import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

// Define the steps for our guided tour
const defaultSteps: Step[] = [
  {
    target: 'body', // Start with a modal-like introduction
    content: 'Selamat datang di SmartVerse Business! Mari kita mulai perjalanan untuk memahami fitur-fitur utama aplikasi.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.tour-dashboard-header',
    content: 'Ini adalah Dashboard Bisnis Anda. Di sini Anda dapat melihat ringkasan bisnis, saldo, dan aktivitas terbaru.',
    placement: 'bottom',
  },
  {
    target: '.tour-vaults',
    content: 'Tab ini menampilkan brankas bisnis Anda. Setiap bisnis memiliki brankas digital sendiri untuk mengelola aset digital.',
    placement: 'bottom',
  },
  {
    target: '.tour-transactions',
    content: 'Di sini Anda dapat melihat semua riwayat transaksi bisnis Anda, termasuk deposit dan penarikan dana.',
    placement: 'bottom',
  },
  {
    target: '.tour-reports',
    content: 'Laporan keuangan menampilkan analisis pendapatan dan pengeluaran bisnis Anda dalam berbagai kategori.',
    placement: 'bottom',
  },
  {
    target: '.tour-create-business',
    content: 'Klik di sini untuk membuat bisnis baru jika Anda belum memilikinya.',
    placement: 'bottom-start',
  },
  {
    target: '.tour-business-card',
    content: 'Kartu bisnis menampilkan informasi penting seperti saldo dan jumlah transaksi. Klik "Lihat Detail" untuk melihat dan mengelola bisnis Anda.',
    placement: 'bottom',
  },
  {
    target: '.tour-qr-payment',
    content: 'Buat QR code pembayaran untuk menerima pembayaran dari pelanggan dengan mudah.',
    placement: 'left',
  },
  {
    target: 'body',
    content: 'Selamat! Anda telah menyelesaikan tur pengenalan SmartVerse Business. Sekarang Anda siap untuk mengelola bisnis UMKM dengan teknologi blockchain.',
    placement: 'center',
  },
];

// Define the props for our GuidedTour component
interface GuidedTourProps {
  children: React.ReactNode;
  isFirstTimeUser?: boolean;
}

const localStorageKey = 'smartverse_tour_completed';

const GuidedTour: React.FC<GuidedTourProps> = ({ children, isFirstTimeUser = false }) => {
  const [run, setRun] = useState(false);
  const [steps] = useState(defaultSteps);

  // Check if this is the first time the user is visiting
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem(localStorageKey) === 'true';
    
    // If this is a first-time user or the tour hasn't been completed, start the tour
    if (isFirstTimeUser || !hasCompletedTour) {
      // Add a slight delay to ensure the DOM is ready
      const timer = setTimeout(() => {
        setRun(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isFirstTimeUser]);

  // Handle tour callback events
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    
    // If the tour is finished or skipped, mark it as completed
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      localStorage.setItem(localStorageKey, 'true');
    }
  };

  // Custom styles to match our application theme
  const joyrideStyles = {
    options: {
      primaryColor: '#3b82f6', // blue-500
      backgroundColor: '#ffffff',
      textColor: '#1f2937', // gray-800
      arrowColor: '#ffffff',
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
      {children}
    </>
  );
};

export default GuidedTour;
