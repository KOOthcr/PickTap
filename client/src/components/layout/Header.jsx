import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
    return (
        <header className="w-full bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="flex items-center gap-2">
                            <span className="text-2xl">☝️</span>
                            <span className="font-extrabold text-xl text-gray-900">한표꾹</span>
                        </Link>
                    </div>
                    <nav className="flex space-x-8">
                        <Link to="/usage" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                            사용법
                        </Link>
                        <Link to="/feedback" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                            문의/피드백
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;
