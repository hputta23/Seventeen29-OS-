import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ModuleViewer from './components/ModuleViewer';
import Dashboard from './components/Dashboard';
import NeuralView from './components/NeuralView';
import WorkshopLayout from './views/Workshop/WorkshopLayout';
import CommandPalette from './components/CommandPalette';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Commercialization: Fetch White-Label Theme
    fetch('http://localhost:3000/api/config/theme')
      .then(res => res.json())
      .then(theme => {
        console.log("Applying Theme:", theme);
        const root = document.documentElement;
        if (theme.primaryColor) root.style.setProperty('--primary-color', theme.primaryColor);
        if (theme.glassOpacity) root.style.setProperty('--glass-opacity', theme.glassOpacity);
        if (theme.borderRadius) root.style.setProperty('--border-radius', theme.borderRadius);
        if (theme.fontFamily) root.style.setProperty('--font-family', theme.fontFamily);
      })
      .catch(console.error);
  }, []);

  return (
    <Router>
      <div
        className="flex h-screen w-full bg-[#0a0f1c] text-white font-sans overflow-hidden selection:bg-[var(--primary-color)]"
        style={{ fontFamily: 'var(--font-family, sans-serif)' }}
      >
        <CommandPalette />
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-hidden flex flex-col">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/modules/:moduleName" element={<ModuleViewer />} />
            <Route path="/neural" element={<NeuralView />} />
            <Route path="/workshop" element={<WorkshopLayout />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
