import React, { useEffect } from 'react';

// type: 'success' | 'error' | 'info'
// position: 'top-center' | 'bottom-center' | 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
const positionClass = (pos) => {
  switch (pos) {
    case 'top-center':
      return 'top-6 left-1/2 -translate-x-1/2';
    case 'bottom-center':
      return 'bottom-6 left-1/2 -translate-x-1/2';
    case 'top-right':
      return 'top-6 right-6';
    case 'bottom-right':
      return 'bottom-6 right-6';
    case 'top-left':
      return 'top-6 left-6';
    case 'bottom-left':
      return 'bottom-6 left-6';
    default:
      return 'bottom-6 left-1/2 -translate-x-1/2';
  }
};

const styleClass = (type) => {
  switch (type) {
    case 'success':
      return 'bg-green-600';
    case 'error':
      return 'bg-red-600';
    case 'info':
    default:
      return 'bg-gray-900';
  }
};

const Toast = ({
  open,
  message,
  type = 'info',
  position = 'bottom-center',
  duration = 2000,
  onClose,
}) => {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div className={`fixed z-50 ${positionClass(position)} animate-fade-in`}>
      <div
        className={`text-white text-sm px-4 py-2 rounded-lg shadow-lg ${styleClass(
          type
        )}`}>
        {message}
      </div>
    </div>
  );
};

export default Toast;
