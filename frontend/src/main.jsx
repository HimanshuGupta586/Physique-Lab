import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { Provider } from 'react-redux';
import { store } from './store/store.js';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Global Axios Interceptor to log users out instantly on 401 Unauthorized
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error("401 FAILED ROUTE:", error.config.url);
            console.error("TOKEN USED:", error.config.headers.Authorization);
            
            toast.error("Session expired. Please log in again.");
            
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Provider store={store}>
            <App />
        </Provider>
    </React.StrictMode>,
);
