import React, { useEffect, useState } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { AlertCircle, HelpCircle } from 'lucide-react';

const Modal = () => {
    const { modalState, handleConfirm, handleCancel } = useModal();
    const [isRendered, setIsRendered] = useState(false);

    useEffect(() => {
        if (modalState.isOpen) {
            // Prevent background scrolling
            document.body.style.overflow = 'hidden';
            setIsRendered(true);
        } else {
            document.body.style.overflow = 'unset';
            // Slight delay before unmounting to allow exit animation (if any)
            const timer = setTimeout(() => setIsRendered(false), 200);
            return () => clearTimeout(timer);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [modalState.isOpen]);

    if (!isRendered && !modalState.isOpen) return null;

    const isAlert = modalState.type === 'alert';

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-200 ${modalState.isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]"
                onClick={isAlert ? handleConfirm : handleCancel}
            ></div>

            {/* Modal Dialog */}
            <div
                className={`relative bg-white rounded-[2rem] shadow-2xl w-full max-w-[320px] overflow-hidden transform transition-all duration-200 ${modalState.isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
            >
                <div className="p-8 flex flex-col items-center text-center">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 animate-bounce-subtle shadow-inner ${isAlert ? 'bg-indigo-50 text-indigo-500 border border-indigo-100' : 'bg-emerald-50 text-emerald-500 border border-emerald-100'}`}>
                        {isAlert ? <AlertCircle className="w-8 h-8" /> : <HelpCircle className="w-8 h-8" />}
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-extrabold text-gray-900 mb-2 whitespace-pre-line tracking-tight leading-tight">
                        {modalState.title}
                    </h3>
                    <p className="text-gray-500 text-[15px] leading-relaxed whitespace-pre-line mb-8 font-medium">
                        {modalState.message}
                    </p>

                    {/* Actions */}
                    <div className="flex w-full gap-3">
                        {!isAlert && (
                            <button
                                onClick={handleCancel}
                                className="flex-1 py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors focus:ring-4 focus:ring-gray-100 outline-none text-[15px]"
                            >
                                취소
                            </button>
                        )}
                        <button
                            onClick={handleConfirm}
                            className={`flex-1 py-3.5 px-4 text-white font-bold rounded-2xl transition-all outline-none text-[15px] 
                            ${isAlert
                                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 focus:ring-4 focus:ring-indigo-100'
                                    : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 focus:ring-4 focus:ring-emerald-100'}`}
                        >
                            확인
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default Modal;
