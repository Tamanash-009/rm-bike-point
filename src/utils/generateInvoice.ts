import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatPrice } from '../lib/utils';

export function generateInvoice(order: any, customerDetails: { name: string, email: string, phone?: string }) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(255, 92, 0); // Brand Orange
  doc.text('R.M BIKE POINT', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Premium Motorcycle Service & Parts', 14, 26);
  doc.text('Jhosser Road, Dighar More, Kolkata', 14, 32);
  doc.text('Phone: +91 62893 28280', 14, 38);
  
  // Invoice Details
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('INVOICE', 140, 20);
  
  doc.setFontSize(10);
  doc.text(`Invoice No: #${order.id.slice(0, 8).toUpperCase()}`, 140, 26);
  const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
  doc.text(`Date: ${orderDate.toLocaleDateString()}`, 140, 32);
  doc.text(`Status: ${order.status.toUpperCase()}`, 140, 38);
  
  // Customer Details
  doc.setFontSize(12);
  doc.text('Billed To:', 14, 55);
  doc.setFontSize(10);
  doc.text(customerDetails.name || 'Customer', 14, 61);
  doc.text(customerDetails.email || '', 14, 67);
  if (customerDetails.phone) {
    doc.text(`Phone: ${customerDetails.phone}`, 14, 73);
  }
  
  // Items Table
  const tableColumn = ["Item Description", "Quantity", "Unit Price", "Total"];
  const tableRows = order.items.map((item: any) => [
    item.name,
    item.quantity.toString(),
    formatPrice(item.price),
    formatPrice(item.price * item.quantity)
  ]);
  
  autoTable(doc, {
    startY: 85,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [255, 92, 0], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    }
  });
  
  // Total Amount
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount:', 130, finalY);
  doc.text(formatPrice(order.totalAmount), 185, finalY, { align: 'right' });
  
  // Footer
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150);
  doc.text('Thank you for choosing R.M Bike Point!', 105, 280, { align: 'center' });
  
  // Save PDF
  doc.save(`RM_BikePoint_Invoice_${order.id.slice(0, 8)}.pdf`);
}
