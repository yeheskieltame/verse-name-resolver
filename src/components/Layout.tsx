
import { Navigation } from '@/components/Navigation';
import { Globe } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden">
      {/* Navigation */}
      <Navigation />
      
      {/* Main Content - Add padding top for fixed navigation */}
      <main className="relative z-10 pt-24">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-gray-900 font-semibold text-lg">SmartVerse</span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2025 SmartVerse. Building the future of web3 naming services.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
