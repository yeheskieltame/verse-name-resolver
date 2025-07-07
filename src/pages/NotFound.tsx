import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
      <div className="text-center space-y-8">
        {/* 404 Header */}
        <div className="space-y-4">
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold text-white opacity-90">
            404
          </h1>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            Oops! Page Not Found
          </h2>
          <p className="text-gray-300 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Navigation Card */}
        <div className="bg-gradient-to-r from-purple-600/20 via-pink-600/10 to-blue-600/20 backdrop-blur-sm border border-white/20 rounded-2xl p-6 sm:p-8 max-w-md mx-auto">
          <div className="space-y-4">
            <Home className="w-12 h-12 text-purple-400 mx-auto" />
            <p className="text-white font-medium">Let's get you back on track</p>
            <div className="space-y-3">
              <Link to="/" className="block">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 text-white font-semibold">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <Link to="/dashboard" className="block">
                <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Additional Help */}
        <div className="text-center space-y-2">
          <p className="text-gray-400 text-sm">
            Need help? The page might have moved to a new location.
          </p>
          <div className="flex justify-center space-x-4 text-sm">
            <Link to="/" className="text-purple-300 hover:text-purple-200 transition-colors">
              Home
            </Link>
            <span className="text-gray-500">•</span>
            <Link to="/dashboard" className="text-purple-300 hover:text-purple-200 transition-colors">
              Dashboard
            </Link>
            <span className="text-gray-500">•</span>
            <Link to="/pay" className="text-purple-300 hover:text-purple-200 transition-colors">
              SmartVerse Pay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
