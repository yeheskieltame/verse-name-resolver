import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import BusinessDashboard from '../components/BusinessDashboard';
import BusinessDashboardFallback from '../components/BusinessDashboardFallback';
import BusinessRegistration from '../components/BusinessRegistration';
import BusinessVault from '../components/BusinessVault';
import BusinessPayment from '../components/BusinessPayment';

const BusinessPage: React.FC = () => {
  const { isConnected } = useAccount();
  const [currentView, setCurrentView] = useState<'dashboard' | 'register' | 'vault' | 'payment'>('dashboard');
  const [selectedVault, setSelectedVault] = useState<{
    address: string;
    name: string;
    chainId: number;
  } | null>(null);

  // Debug: Log current view and connection status
  useEffect(() => {
    console.log('BusinessPage rendered with:', {
      currentView,
      isConnected,
      selectedVault
    });
  }, [currentView, isConnected, selectedVault]);

  const handleRegistrationSuccess = (vaultAddress: string) => {
    // Kembali ke dashboard setelah registrasi berhasil
    setCurrentView('dashboard');
  };

  const handleViewVault = (vaultAddress: string, businessName: string, chainId: number) => {
    setSelectedVault({ address: vaultAddress, name: businessName, chainId });
    setCurrentView('vault');
  };

  const handleCreatePayment = (vault: { address: string, name: string, chainId: number }) => {
    setSelectedVault(vault);
    setCurrentView('payment');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedVault(null);
  };

  const handleCreateNewBusiness = () => {
    setCurrentView('register');
  };

  // Pass handlers to dashboard
  const dashboardProps = {
    onCreateNewBusiness: handleCreateNewBusiness,
    onViewVault: handleViewVault,
  };

  switch (currentView) {
    case 'register':
      return (
        <BusinessRegistration
          onSuccess={handleRegistrationSuccess}
          onCancel={handleBackToDashboard}
        />
      );
    
    case 'vault':
      return selectedVault ? (
        <BusinessVault
          vaultAddress={selectedVault.address}
          businessName={selectedVault.name}
          chainId={selectedVault.chainId}
          onClose={handleBackToDashboard}
          onCreatePayment={handleCreatePayment}
        />
      ) : (
        <div>Error: No vault selected</div>
      );
      
    case 'payment':
      return selectedVault ? (
        <BusinessPayment
          vaultAddress={selectedVault.address}
          businessName={selectedVault.name}
          onClose={handleBackToDashboard}
        />
      ) : (
        <div>Error: No vault selected</div>
      );
    
    case 'dashboard':
    default:
      console.log('Rendering BusinessDashboard with props:', dashboardProps);
      return (
        <div>
          <div style={{ padding: '10px', background: '#f0f9ff', borderRadius: '4px', marginBottom: '10px' }}>
            Debug Panel: View = {currentView}, Connected = {isConnected ? 'Yes' : 'No'}
          </div>
          {/* Wrap the original dashboard in an error boundary */}
          <ErrorBoundary fallback={<BusinessDashboardFallback onCreateNewBusiness={handleCreateNewBusiness} />}>
            <BusinessDashboard {...dashboardProps} />
          </ErrorBoundary>
        </div>
      );
  }
};

// Simple Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    console.error('Error caught by ErrorBoundary:', error);
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Error details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
};

export default BusinessPage;
