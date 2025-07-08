
import { Navigation } from '@/components/Navigation';

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
              <img 
                src="/smartverse.svg" 
                alt="Logo" 
                className="h-8 w-auto"
              />
            </div>
            <p className="text-gray-500 text-sm">
              © 2025. Building the future of web3 naming services.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
