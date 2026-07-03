import { jsPDF } from "jspdf";
import { getPlan } from "@/lib/billing/plans";
import {
  formatPaymentAmount,
  paymentInvoiceLabel,
  type PaymentRecord,
} from "@/lib/billing/payments";

function formatInvoiceDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function buildPaymentInvoicePdf(payment: PaymentRecord): Buffer {
  const doc = new jsPDF();
  const plan = getPlan(payment.plan);
  const invoiceLabel = paymentInvoiceLabel(payment);
  const amountLabel = formatPaymentAmount(payment.amount, payment.currency);

  doc.setFillColor(10, 6, 24);
  doc.rect(0, 0, 210, 42, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("Advora AI", 20, 22);
  doc.setFontSize(11);
  doc.text("Invoice", 20, 32);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.text(`Invoice: ${invoiceLabel}`, 20, 58);
  doc.text(`Date: ${formatInvoiceDate(payment.createdAt)}`, 20, 66);
  doc.text(`Status: ${payment.status}`, 20, 74);

  doc.setDrawColor(220, 220, 220);
  doc.line(20, 82, 190, 82);

  doc.setFontSize(12);
  doc.text("Bill to", 20, 94);
  doc.setFontSize(10);
  doc.text(payment.email ?? "Customer", 20, 102);

  doc.setFontSize(12);
  doc.text("Payment details", 20, 118);
  doc.setFontSize(10);
  doc.text(`Plan: ${plan.name}`, 20, 126);
  if (payment.billingInterval) {
    doc.text(
      `Billing: ${payment.billingInterval === "yearly" ? "Yearly" : "Monthly"}`,
      20,
      134
    );
  }
  doc.text(`Amount: ${amountLabel}`, 20, payment.billingInterval ? 142 : 134);
  doc.text(`Payment ID: ${payment.razorpayPaymentId}`, 20, payment.billingInterval ? 150 : 142);
  doc.text(`Order ID: ${payment.razorpayOrderId}`, 20, payment.billingInterval ? 158 : 150);

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Thank you for subscribing to Advora AI.", 20, 270);
  doc.text("support@useadvora.com | https://useadvora.com", 20, 276);

  return Buffer.from(doc.output("arraybuffer"));
}
