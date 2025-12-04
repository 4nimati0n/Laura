import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { HumeProvider } from './components/HumeProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HumeProvider>
      <App />
    </HumeProvider>
  </StrictMode>,
)
