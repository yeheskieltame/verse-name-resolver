import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { QrCode, Home, Menu, X, Settings, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Navigation = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Home', icon: Home, description: 'Landing Page' },
    { path: '/dashboard', label: 'Dashboard', icon: Settings, description: 'Register & Manage' },
    { path: '/business', label: 'Business', icon: Building2, description: 'UMKM Digital Vault' },
    { path: '/pay', label: 'Cross-Chain Pay', icon: QrCode, description: 'Transfer & QR' }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pt-4">
      <nav className="floating-nav backdrop-blur-xl bg-white/80 border border-gray-200/50 shadow-xl rounded-2xl max-w-6xl mx-auto tour-navigation">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <img 
                src="/smartverse.svg" 
                alt="SmartVerse Logo" 
                className="h-10 w-auto sm:h-12"
              />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      isActive(item.path)
                        ? 'bg-purple-100 text-purple-700 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    } ${item.path === '/dashboard' ? 'tour-dashboard-link' : ''} ${item.path === '/pay' ? 'tour-pay-link' : ''} ${item.path === '/business' ? 'tour-business-link' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right Section - Connect Button + Mobile Menu */}
            <div className="flex items-center gap-3">
              {/* RainbowKit Connect Button - Desktop Only */}
              <div className="hidden lg:block connect-button-wrapper tour-wallet-connect">
                <ConnectButton />
              </div>
              
              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-gray-700 hover:bg-gray-100"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 space-y-4 border-t border-gray-200/50 pt-4">
              {/* Mobile Wallet Section */}
              <div className="mobile-menu-section space-y-3">
                <div className="px-4">
                  <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">
                    Wallet Connection
                  </div>
                  <div className="connect-button-wrapper">
                    <ConnectButton />
                  </div>
                </div>
              </div>
              
              {/* Mobile Navigation Section */}
              <div className="mobile-menu-section space-y-3">
                <div className="px-4">
                  <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">
                    Navigation
                  </div>
                </div>
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 mx-4 px-4 py-3 rounded-lg transition-all duration-300 ${
                          isActive(item.path)
                            ? 'bg-purple-100 text-purple-700 shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{item.label}</span>
                          <span className="text-xs text-gray-500">{item.description}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};
