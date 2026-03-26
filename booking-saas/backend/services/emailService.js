const nodemailer = require('nodemailer');

// Configure email service
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: process.env.SMTP_USER || 'apikey',
    pass: process.env.SENDGRID_API_KEY || ''
  }
});

class EmailService {
  async sendBookingConfirmation(customer_email, bookingData) {
    const { service_name, booking_date, start_time, end_time, price, business_name } = bookingData;
    
    const html = `
      <h2>Booking Confirmed!</h2>
      <p>Hi,</p>
      <p>Your booking at <strong>${business_name}</strong> has been confirmed.</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Service:</strong> ${service_name}</p>
        <p><strong>Date:</strong> ${booking_date}</p>
        <p><strong>Time:</strong> ${start_time} - ${end_time}</p>
        <p><strong>Price:</strong> $${price.toFixed(2)}</p>
      </div>
      <p>Please arrive 5-10 minutes early. If you need to reschedule or cancel, reply to this email.</p>
      <p>See you soon!</p>
    `;

    return transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || 'noreply@smartbook.com',
      to: customer_email,
      subject: `Booking Confirmed - ${service_name} at ${business_name}`,
      html
    });
  }

  async sendReminderEmail(customer_email, bookingData) {
    const { service_name, booking_date, start_time, business_name } = bookingData;
    
    const html = `
      <h2>Reminder: Your appointment is tomorrow</h2>
      <p>Hi,</p>
      <p>This is a friendly reminder about your booking tomorrow at <strong>${business_name}</strong>.</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Service:</strong> ${service_name}</p>
        <p><strong>Time:</strong> ${start_time}</p>
      </div>
      <p>If you need to reschedule, please let us know as soon as possible.</p>
    `;

    return transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || 'noreply@smartbook.com',
      to: customer_email,
      subject: `Reminder: ${service_name} tomorrow at ${start_time}`,
      html
    });
  }

  async sendCancellationEmail(customer_email, bookingData) {
    const { service_name, business_name } = bookingData;
    
    const html = `
      <h2>Booking Cancelled</h2>
      <p>Your booking for <strong>${service_name}</strong> at <strong>${business_name}</strong> has been cancelled.</p>
      <p>If this was unexpected, please contact the business directly.</p>
    `;

    return transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || 'noreply@smartbook.com',
      to: customer_email,
      subject: `Booking Cancelled - ${service_name}`,
      html
    });
  }

  async sendReviewRequest(customer_email, bookingData) {
    const { service_name, business_name, booking_id } = bookingData;
    const reviewLink = `${process.env.APP_URL}/review/${booking_id}`;
    
    const html = `
      <h2>How was your experience?</h2>
      <p>Thank you for choosing <strong>${business_name}</strong> for your <strong>${service_name}</strong>!</p>
      <p>We'd love to hear about your experience. Your feedback helps us serve you better.</p>
      <div style="margin: 30px 0;">
        <a href="${reviewLink}" style="background: #3498db; color: white; padding: 12px 30px; border-radius: 4px; text-decoration: none; display: inline-block;">
          Leave a Review
        </a>
      </div>
      <p>Thank you!</p>
    `;

    return transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || 'noreply@smartbook.com',
      to: customer_email,
      subject: `How was your ${service_name} with ${business_name}?`,
      html
    });
  }

  async sendInvoice(customer_email, invoiceData) {
    const { invoice_id, business_name, items, total, due_date } = invoiceData;
    
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
      <h2>Invoice #${invoice_id}</h2>
      <p>From: <strong>${business_name}</strong></p>
      <p>Due: <strong>${due_date}</strong></p>
      
      <table style="width: 100%; margin: 20px 0;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 8px; text-align: left;">Description</th>
            <th style="padding: 8px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr style="font-weight: bold; font-size: 16px;">
            <td style="padding: 12px;">TOTAL</td>
            <td style="padding: 12px; text-align: right;">$${total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    `;

    return transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || 'noreply@smartbook.com',
      to: customer_email,
      subject: `Invoice #${invoice_id} from ${business_name}`,
      html
    });
  }
}

const emailService = new EmailService();

// Export both service and transporter
module.exports = {
  ...emailService,
  transporter: transporter
};
