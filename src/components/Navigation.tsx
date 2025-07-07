import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Globe, QrCode, Home, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Navigation = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Home', icon: Home, description: 'Landing Page' },
    { path: '/dashboard', label: 'Dashboard', icon: Globe, description: 'Register & Manage' },
    { path: '/pay', label: 'SmartVerse Pay', icon: QrCode, description: 'Transfer & QR' }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="sticky top-0 z-50 px-4 sm:px-6 lg:px-8 pt-4">
      <nav className="floating-nav backdrop-blur-md bg-black/20 border border-white/10 shadow-lg rounded-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg">SmartVerse</span>
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
                        ? 'bg-white/20 text-white shadow-lg'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
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
              <div className="hidden lg:block connect-button-wrapper">
                <ConnectButton />
              </div>
              
              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-white hover:bg-white/10"
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
            <div className="lg:hidden mt-4 space-y-4 border-t border-white/10 pt-4">
              {/* Mobile Wallet Section */}
              <div className="mobile-menu-section space-y-3">
                <div className="px-4">
                  <div className="text-white/60 text-xs font-medium uppercase tracking-wider mb-2">
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
                  <div className="text-white/60 text-xs font-medium uppercase tracking-wider mb-2">
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
                            ? 'bg-white/20 text-white shadow-lg'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{item.label}</span>
                          <span className="text-xs opacity-70">{item.description}</span>
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
