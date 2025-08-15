import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';
import { I18nProvider } from './contexts/I18nContext';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <I18nProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
  </I18nProvider>
);
