
import React, { useEffect } from 'react';
import { AppNotification } from '../types';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastProps {
  notifications: AppNotification[];
  remove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ notifications, remove }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3 pointer-events-none max-w-sm w-full px-4 sm:px-0">
      {notifications.map(n => (
        <Toast key={n.id} notification={n} onRemove={() => remove(n.id)} />
      ))}
    </div>
  );
};

const Toast: React.FC<{ notification: AppNotification; onRemove: () => void }> = ({ notification, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 4000);
    return () => clearTimeout(timer);
  }, [notification, onRemove]);

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-orange-50 border-orange-200 text-orange-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <AlertCircle className="h-5 w-5 text-red-600" />,
    warning: <AlertTriangle className="h-5 w-5 text-orange-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />,
  };

  return (
    <div className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-2xl animate-in slide-in-from-right-full fade-in duration-500 w-full sm:w-[350px] ${styles[notification.type]}`}>
      <div className="flex-shrink-0 mt-0.5">
        {icons[notification.type]}
      </div>
      <div className="flex-1">
        <p className="text-sm font-black tracking-tight">{notification.message}</p>
      </div>
      <button onClick={onRemove} className="text-current opacity-60 hover:opacity-100 transition-opacity p-1">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
