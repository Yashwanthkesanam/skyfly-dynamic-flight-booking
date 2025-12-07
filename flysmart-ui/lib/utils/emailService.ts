// lib/utils/emailService.ts
import { showSuccess, showInfo } from './toast';

interface BookingEmailData {
    pnr: string;
    passengerName: string;
    passengerEmail: string;
    flightNumber: string;
    origin: string;
    destination: string;
    departureTime: string;
    amount: number;
}

export const emailService = {
    sendBookingConfirmation: async (data: BookingEmailData) => {
        // Simulate email sending - replace with actual email API
        console.log('Sending booking confirmation email:', data);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        showSuccess(`Confirmation email sent to ${data.passengerEmail}`);
        return true;
    },

    sendCancellationNotification: async (pnr: string, email: string) => {
        console.log('Sending cancellation email:', { pnr, email });
        await new Promise(resolve => setTimeout(resolve, 1000));
        showInfo(`Cancellation confirmation sent to ${email}`);
        return true;
    },

    sendReceiptEmail: async (pnr: string, email: string) => {
        console.log('Sending receipt email:', { pnr, email });
        await new Promise(resolve => setTimeout(resolve, 1000));
        showSuccess(`Receipt sent to ${email}`);
        return true;
    }
};
