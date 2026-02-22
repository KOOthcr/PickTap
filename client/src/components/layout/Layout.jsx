import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ children }) => {
    const location = useLocation();
    const showHeaderFooter = ['/', '/usage', '/feedback'].includes(location.pathname);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
            {showHeaderFooter && <Header />}
            <main className="flex-grow">
                {children}
            </main>
            {showHeaderFooter && <Footer />}
        </div>
    );
};

export default Layout;
