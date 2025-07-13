import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Import environment debug utility for development
import './debug/envDebug'

// Import business QR test samples for development
// import './debug/qrTestSamples'

createRoot(document.getElementById("root")!).render(<App />);
