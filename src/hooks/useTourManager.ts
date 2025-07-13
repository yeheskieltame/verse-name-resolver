import { useState, useEffect } from 'react';

interface TourSettings {
  hasSeenGeneralTour: boolean;
  hasSeenBusinessTour: boolean;
  hasSeenFullTour: boolean;
  lastTourDate: string | null;
  isBusinessUser: boolean;
}

const TOUR_STORAGE_KEY = 'smartverse_tour_settings';

export const useTourManager = () => {
  const [tourSettings, setTourSettings] = useState<TourSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(TOUR_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return {
            hasSeenGeneralTour: false,
            hasSeenBusinessTour: false,
            hasSeenFullTour: false,
            lastTourDate: null,
            isBusinessUser: false
          };
        }
      }
    }
    return {
      hasSeenGeneralTour: false,
      hasSeenBusinessTour: false,
      hasSeenFullTour: false,
      lastTourDate: null,
      isBusinessUser: false
    };
  });

  const [showTour, setShowTour] = useState(false);
  const [tourType, setTourType] = useState<'full' | 'business' | 'general'>('general');

  // Save settings to localStorage
  const saveSettings = (newSettings: Partial<TourSettings>) => {
    const updated = { ...tourSettings, ...newSettings };
    setTourSettings(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(updated));
    }
  };

  // Check if user should see tour on mount
  useEffect(() => {
    const shouldShowTour = () => {
      // For new users
      if (!tourSettings.hasSeenGeneralTour) {
        return { show: true, type: 'general' as const };
      }

      // For business users who haven't seen business tour
      if (tourSettings.isBusinessUser && !tourSettings.hasSeenBusinessTour) {
        return { show: true, type: 'business' as const };
      }

      // Show business tour again if there are new features (check date)
      const lastTour = tourSettings.lastTourDate;
      const newFeaturesDate = '2025-01-01'; // Update this when new features are added
      
      if (tourSettings.isBusinessUser && lastTour && lastTour < newFeaturesDate) {
        return { show: true, type: 'business' as const };
      }

      return { show: false, type: 'general' as const };
    };

    const tourCheck = shouldShowTour();
    if (tourCheck.show) {
      // Delay to ensure UI is ready
      setTimeout(() => {
        setTourType(tourCheck.type);
        setShowTour(true);
      }, 1000);
    }
  }, [tourSettings]);

  const startTour = (type: 'full' | 'business' | 'general') => {
    setTourType(type);
    setShowTour(true);
  };

  const completeTour = (type: 'full' | 'business' | 'general') => {
    const today = new Date().toISOString().split('T')[0];
    const updates: Partial<TourSettings> = {
      lastTourDate: today
    };

    switch (type) {
      case 'general':
        updates.hasSeenGeneralTour = true;
        break;
      case 'business':
        updates.hasSeenBusinessTour = true;
        break;
      case 'full':
        updates.hasSeenGeneralTour = true;
        updates.hasSeenBusinessTour = true;
        updates.hasSeenFullTour = true;
        break;
    }

    saveSettings(updates);
    setShowTour(false);
  };

  const setBusinessUser = (isBusinessUser: boolean) => {
    saveSettings({ isBusinessUser });
  };

  const resetTours = () => {
    saveSettings({
      hasSeenGeneralTour: false,
      hasSeenBusinessTour: false,
      hasSeenFullTour: false,
      lastTourDate: null
    });
  };

  const shouldShowBusinessTourForNewFeatures = () => {
    const lastTour = tourSettings.lastTourDate;
    const newFeaturesDate = '2025-01-01'; // Update this when new features are added
    
    return tourSettings.isBusinessUser && 
           tourSettings.hasSeenBusinessTour && 
           lastTour && 
           lastTour < newFeaturesDate;
  };

  return {
    showTour,
    tourType,
    tourSettings,
    startTour,
    completeTour,
    setBusinessUser,
    resetTours,
    shouldShowBusinessTourForNewFeatures,
    closeTour: () => setShowTour(false)
  };
};

export default useTourManager;
