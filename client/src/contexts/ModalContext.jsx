import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
    const [modalState, setModalState] = useState({
        isOpen: false,
        type: 'alert', // 'alert' | 'confirm'
        title: '',
        message: '',
    });

    // Save the resolver function so we can resolve the promise when user clicks OK/Cancel
    const promiseResolver = useRef(null);

    const openModal = useCallback((type, title, message) => {
        setModalState({ isOpen: true, type, title, message });
        return new Promise((resolve) => {
            promiseResolver.current = resolve;
        });
    }, []);

    const alert = useCallback((message, title = '알림') => {
        return openModal('alert', title, message);
    }, [openModal]);

    const confirm = useCallback((message, title = '확인') => {
        return openModal('confirm', title, message);
    }, [openModal]);

    const handleConfirm = useCallback(() => {
        setModalState((prev) => ({ ...prev, isOpen: false }));
        if (promiseResolver.current) {
            promiseResolver.current(true);
            promiseResolver.current = null;
        }
    }, []);

    const handleCancel = useCallback(() => {
        setModalState((prev) => ({ ...prev, isOpen: false }));
        if (promiseResolver.current) {
            promiseResolver.current(false);
            promiseResolver.current = null;
        }
    }, []);

    return (
        <ModalContext.Provider value={{
            modalState,
            alert,
            confirm,
            handleConfirm,
            handleCancel
        }}>
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};
