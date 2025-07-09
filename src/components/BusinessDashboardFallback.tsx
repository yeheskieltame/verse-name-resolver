import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Building2 } from 'lucide-react';

// Simple fallback dashboard to prevent blank page issues
const BusinessDashboardFallback: React.FC<{ onCreateNewBusiness?: () => void }> = ({ onCreateNewBusiness }) => {
  const [errorDetails, setErrorDetails] = useState<string>('');
  
  useEffect(() => {
    // Collect some debug info
    const debugInfo = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    setErrorDetails(JSON.stringify(debugInfo, null, 2));
    
    console.log('Fallback dashboard rendered with debug info:', debugInfo);
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SmartVerse Business
          </h1>
          <p className="text-gray-600">
            Halaman sedang dalam proses perbaikan
          </p>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Informasi Dashboard</CardTitle>
            <CardDescription>Terjadi masalah saat memuat dashboard bisnis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200 mb-4">
              <p className="text-yellow-800 font-medium mb-2">⚠️ Pemeliharaan Sistem</p>
              <p className="text-yellow-700">
                Mohon maaf, dashboard bisnis sedang dalam pemeliharaan. 
                Anda masih dapat membuat bisnis baru atau memeriksa kembali nanti.
              </p>
            </div>
            
            <div className="flex justify-center mt-4">
              <Button onClick={onCreateNewBusiness} className="mr-4">
                <Building2 className="h-4 w-4 mr-2" />
                Buat Bisnis Baru
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                Refresh Halaman
              </Button>
            </div>
            
            <details className="mt-8">
              <summary className="text-sm text-gray-500 cursor-pointer">Debug information</summary>
              <pre className="p-4 bg-gray-100 rounded-md mt-2 text-xs overflow-auto">
                {errorDetails}
              </pre>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessDashboardFallback;
