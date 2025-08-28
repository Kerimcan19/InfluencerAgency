import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';
import { LangProvider } from './contexts/LangContext';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <LangProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </LangProvider>
);
