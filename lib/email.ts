
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT!),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail(
  to: string,
  subject: string,
  html: string
) {
  return transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}

export async function sendInvoiceEmail(
  email: string,
  invoiceNumber: string,
  amount: number
) {
  const html = `
    <h2>Invoice ${invoiceNumber}</h2>
    <p>Amount: $${amount.toFixed(2)}</p>
    <p>Thank you for your business!</p>
  `;

  return sendEmail(email, `Invoice ${invoiceNumber}`, html);
}

export async function sendSubscriptionConfirmationEmail(
  email: string,
  tierName: string
) {
  const html = `
    <h2>Subscription Confirmed</h2>
    <p>You have successfully subscribed to the ${tierName} plan.</p>
    <p>Access your dashboard to get started.</p>
  `;

  return sendEmail(email, 'Subscription Confirmed', html);
}

export async function sendRefundApprovedEmail(
  email: string,
  amount: number
) {
  const html = `
    <h2>Refund Approved</h2>
    <p>Your refund request of $${amount.toFixed(2)} has been approved.</p>
    <p>The refund will be processed within 5-7 business days.</p>
  `;

  return sendEmail(email, 'Refund Approved', html);
}