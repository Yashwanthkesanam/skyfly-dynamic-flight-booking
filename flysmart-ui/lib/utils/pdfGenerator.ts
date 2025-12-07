// lib/utils/pdfGenerator.ts
import jsPDF from 'jspdf';

interface ReceiptData {
    booking: {
        id: number;
        pnr: string;
        status: string;
        passenger_name: string;
        passenger_contact: string;
        seats_booked: number;
        price_paid: number;
        created_at: string;
    };
    flight: {
        flight_number: string;
        airline: string;
        origin: string;
        destination: string;
        departure_iso: string;
        arrival_iso: string;
    };
    total_paid: number;
}

export const generatePDFReceipt = (receipt: ReceiptData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 25;

    // ========== HEADER ==========
    doc.setFillColor(11, 87, 164);
    doc.rect(0, 0, pageWidth, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('FlySmart', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Booking Receipt', pageWidth / 2, 30, { align: 'center' });

    y = 60;

    // ========== BOOKING INFORMATION ==========
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 87, 164);
    doc.text('Booking Information', 20, y);

    y += 8;

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);

    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    doc.setFont('helvetica', 'bold');
    doc.text('PNR:', 25, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(receipt.booking.pnr || 'PENDING'), 70, y);

    y += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('Booking Date:', 25, y);
    doc.setFont('helvetica', 'normal');
    const bookingDate = new Date(receipt.booking.created_at).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    doc.text(bookingDate, 70, y);

    y += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('Status:', 25, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(receipt.booking.status === 'confirmed' ? 0 : 200,
        receipt.booking.status === 'confirmed' ? 150 : 100,
        0);
    doc.text(String(receipt.booking.status || 'PENDING').toUpperCase(), 70, y);
    doc.setTextColor(0, 0, 0);

    y += 15;

    // ========== PASSENGER DETAILS ==========
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 87, 164);
    doc.text('Passenger Details', 20, y);

    y += 8;

    doc.setDrawColor(220, 220, 220);
    doc.line(20, y, pageWidth - 20, y);

    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    doc.setFont('helvetica', 'bold');
    doc.text('Name:', 25, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(receipt.booking.passenger_name || 'N/A'), 70, y);

    y += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('Contact:', 25, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(receipt.booking.passenger_contact || 'N/A'), 70, y);

    y += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('Seats:', 25, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(receipt.booking.seats_booked || '1'), 70, y);

    y += 15;

    // ========== FLIGHT DETAILS ==========
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 87, 164);
    doc.text('Flight Details', 20, y);

    y += 8;

    doc.setDrawColor(220, 220, 220);
    doc.line(20, y, pageWidth - 20, y);

    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    // Flight Number
    doc.setFont('helvetica', 'bold');
    doc.text('Flight:', 25, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(receipt.flight.flight_number || 'N/A'), 70, y);

    y += 7;

    // Airline
    doc.setFont('helvetica', 'bold');
    doc.text('Airline:', 25, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(receipt.flight.airline || 'N/A'), 70, y);

    y += 7;

    // Route
    doc.setFont('helvetica', 'bold');
    doc.text('Route:', 25, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`${String(receipt.flight.origin)} to ${String(receipt.flight.destination)}`, 70, y);
    doc.setFontSize(10);

    y += 9;

    // Departure
    doc.setFont('helvetica', 'bold');
    doc.text('Departure:', 25, y);
    doc.setFont('helvetica', 'normal');
    const depDate = new Date(receipt.flight.departure_iso).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    doc.text(depDate, 70, y);

    y += 7;

    // Arrival
    doc.setFont('helvetica', 'bold');
    doc.text('Arrival:', 25, y);
    doc.setFont('helvetica', 'normal');
    const arrDate = new Date(receipt.flight.arrival_iso).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    doc.text(arrDate, 70, y);

    y += 15;

    // ========== PAYMENT DETAILS ==========
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 87, 164);
    doc.text('Payment Details', 20, y);

    y += 8;

    doc.setDrawColor(220, 220, 220);
    doc.line(20, y, pageWidth - 20, y);

    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    // Base Fare
    const baseFare = receipt.total_paid * 0.70;
    doc.text('Base Fare:', 25, y);
    doc.text(`Rupees ${baseFare.toFixed(2)}`, pageWidth - 25, y, { align: 'right' });

    y += 7;

    // Taxes
    const taxes = receipt.total_paid * 0.30;
    doc.text('Taxes & Fees:', 25, y);
    doc.text(`Rupees ${taxes.toFixed(2)}`, pageWidth - 25, y, { align: 'right' });

    y += 10;

    // Total line
    doc.setDrawColor(220, 220, 220);
    doc.line(20, y, pageWidth - 20, y);

    y += 8;

    // Total
    doc.setFillColor(255, 247, 230);
    doc.rect(20, y - 5, pageWidth - 40, 10, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 122, 0);
    doc.text('Total Amount:', 25, y);
    doc.text(`Rupees ${receipt.total_paid.toFixed(2)}`, pageWidth - 25, y, { align: 'right' });

    y += 20;

    // ========== FOOTER ==========
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);

    y += 8;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text('This is a computer-generated receipt. No signature required.', pageWidth / 2, y, { align: 'center' });

    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text('For support: support@flysmart.com | +91-1800-FLYSMART', pageWidth / 2, y, { align: 'center' });

    y += 5;
    doc.setFontSize(7);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, y, { align: 'center' });

    // Save PDF
    doc.save(`FlySmart-Receipt-${receipt.booking.pnr || receipt.booking.id}.pdf`);
};
