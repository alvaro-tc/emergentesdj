import React from 'react';
import { createRoot } from 'react-dom/client';

// third party
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

// project imports
import { store, persister } from './store';
import App from './App';
import config from './config';
import { AuditLogProvider } from './context/AuditLogContext';

// style + assets
import 'react-perfect-scrollbar/dist/css/styles.css';
import './assets/scss/style.scss';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
    <Provider store={store}>
        <PersistGate loading={null} persistor={persister}>
            <BrowserRouter basename={config.basename} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AuditLogProvider>
                    <App />
                </AuditLogProvider>
            </BrowserRouter>
        </PersistGate>
    </Provider>
);
