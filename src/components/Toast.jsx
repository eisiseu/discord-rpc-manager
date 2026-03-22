import React, { useEffect, useState } from 'react';
import { HiCheck, HiX, HiExclamation } from 'react-icons/hi';

let toastHandlers = [];

export function showToast(message, type = 'success') {
  toastHandlers.forEach((fn) => fn({ message, type, id: Date.now() }));
}

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 마운트 후 짧은 딜레이로 페이드인
    const showTimer = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });

    // 2초 후 페이드아웃 시작
    const hideTimer = setTimeout(() => setVisible(false), 2000);

    // 페이드아웃 끝나면 제거 (transition 300ms)
    const removeTimer = setTimeout(() => onRemove(toast.id), 2300);

    return () => {
      cancelAnimationFrame(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <div
      style={{
        transition: 'opacity 300ms ease, transform 300ms ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
      }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border pointer-events-auto ${
        toast.type === 'success'
          ? 'bg-dark-600 border-green-500/30 text-white'
          : 'bg-dark-600 border-yellow-500/30 text-white'
      }`}
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
        toast.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
      }`}>
        {toast.type === 'success' ? <HiCheck className="w-3.5 h-3.5" /> : <HiExclamation className="w-3.5 h-3.5" />}
      </div>
      <span className="text-sm font-medium">{toast.message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300); }}
        className="ml-1 text-gray-500 hover:text-gray-300 transition-colors"
      >
        <HiX className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (toast) => setToasts((prev) => [...prev, toast]);
    toastHandlers.push(handler);
    return () => { toastHandlers = toastHandlers.filter((fn) => fn !== handler); };
  }, []);

  const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={remove} />
      ))}
    </div>
  );
}
