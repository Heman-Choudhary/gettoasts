import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastIcon = ({ type }: { type: ToastType }) => {
  const iconProps = { className: "h-5 w-5 flex-shrink-0" };
  
  switch (type) {
    case 'success':
      return <CheckCircle {...iconProps} className="h-5 w-5 flex-shrink-0 text-green-600" />;
    case 'error':
      return <AlertCircle {...iconProps} className="h-5 w-5 flex-shrink-0 text-red-600" />;
    case 'warning':
      return <AlertTriangle {...iconProps} className="h-5 w-5 flex-shrink-0 text-amber-600" />;
    case 'info':
      return <Info {...iconProps} className="h-5 w-5 flex-shrink-0 text-blue-600" />;
    default:
      return <Info {...iconProps} className="h-5 w-5 flex-shrink-0 text-gray-600" />;
  }
};

const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!toast.persistent && toast.duration !== 0) {
      const timer = setTimeout(() => {
        handleRemove();
      }, toast.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, toast.persistent]);

  const handleRemove = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300); // Match the exit animation duration
  }, [toast.id, onRemove]);

  const getToastStyles = () => {
    const baseStyles = "relative flex items-start p-4 rounded-xl shadow-lg border backdrop-blur-sm transition-all duration-300 ease-in-out transform";
    
    const typeStyles = {
      success: "bg-white/95 border-green-200 text-green-900",
      error: "bg-white/95 border-red-200 text-red-900", 
      warning: "bg-white/95 border-amber-200 text-amber-900",
      info: "bg-white/95 border-blue-200 text-blue-900"
    };

    const animationStyles = isLeaving 
      ? "opacity-0 scale-95 translate-y-[-10px]"
      : isVisible 
        ? "opacity-100 scale-100 translate-y-0"
        : "opacity-0 scale-95 translate-y-[-10px]";

    return `${baseStyles} ${typeStyles[toast.type]} ${animationStyles}`;
  };

  return (
    <div 
      className={getToastStyles()}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-start space-x-3 flex-1 min-w-0">
        <ToastIcon type={toast.type} />
        <div className="flex-1 min-w-0">
          {toast.title && (
            <h4 className="text-sm font-semibold mb-1 leading-tight">
              {toast.title}
            </h4>
          )}
          <p className="text-sm leading-relaxed break-words">
            {toast.message}
          </p>
        </div>
      </div>
      
      <button
        onClick={handleRemove}
        className="ml-3 flex-shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
        aria-label="Close notification"
      >
        <X className="h-4 w-4 text-gray-500 hover:text-gray-700" />
      </button>
    </div>
  );
};

const ToastContainer = ({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) => {
  if (toasts.length === 0) return null;

  return createPortal(
    <div 
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      <div className="flex flex-col items-center space-y-3 max-w-sm sm:max-w-md md:max-w-lg w-full px-4">
        {toasts.map((toast) => (
          <div key={toast.id} className="w-full pointer-events-auto">
            <ToastItem toast={toast} onRemove={onRemove} />
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toastData: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = {
      id,
      duration: 5000,
      ...toastData,
    };
    
    setToasts(prev => [toast, ...prev]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message: string, title?: string) => {
    addToast({ type: 'success', message, title });
  }, [addToast]);

  const error = useCallback((message: string, title?: string) => {
    addToast({ type: 'error', message, title });
  }, [addToast]);

  const warning = useCallback((message: string, title?: string) => {
    addToast({ type: 'warning', message, title });
  }, [addToast]);

  const info = useCallback((message: string, title?: string) => {
    addToast({ type: 'info', message, title });
  }, [addToast]);

  const contextValue: ToastContextType = {
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

// Legacy compatibility function for existing toast() calls
export const toast = (message: string, type: ToastType = 'info') => {
  // This will be replaced by the context-based system
  console.warn('Legacy toast function called. Please use useToast hook instead.');
};