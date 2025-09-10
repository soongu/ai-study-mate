import React, { useCallback, useMemo, useState } from 'react';
import Toast from './Toast.jsx';
import ToastContext from './toastContext.js';

const ToastProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [position, setPosition] = useState('bottom-center');
  const [duration, setDuration] = useState(2000);

  const show = useCallback((msg, opts = {}) => {
    setMessage(msg);
    if (opts.type) setType(opts.type);
    if (opts.position) setPosition(opts.position);
    if (opts.duration) setDuration(opts.duration);
    setOpen(true);
  }, []);

  const hide = useCallback(() => setOpen(false), []);

  const value = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast
        open={open}
        message={message}
        type={type}
        position={position}
        duration={duration}
        onClose={hide}
      />
    </ToastContext.Provider>
  );
};

export default ToastProvider;
