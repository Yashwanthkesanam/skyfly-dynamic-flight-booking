// lib/utils/toast.ts
import toast from 'react-hot-toast';

export const showSuccess = (message: string) => {
    toast.success(message, {
        duration: 4000,
        position: 'top-right',
        style: {
            background: '#10B981',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            fontWeight: '500'
        },
        icon: '✅'
    });
};

export const showError = (message: string) => {
    toast.error(message, {
        duration: 5000,
        position: 'top-right',
        style: {
            background: '#EF4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            fontWeight: '500'
        },
        icon: '❌'
    });
};

export const showInfo = (message: string) => {
    toast(message, {
        duration: 3000,
        position: 'top-right',
        style: {
            background: '#3B82F6',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            fontWeight: '500'
        },
        icon: 'ℹ️'
    });
};

export const showLoading = (message: string) => {
    return toast.loading(message, {
        position: 'top-right',
        style: {
            background: '#6B7280',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            fontWeight: '500'
        }
    });
};

export const dismissToast = (toastId: string) => {
    toast.dismiss(toastId);
};
