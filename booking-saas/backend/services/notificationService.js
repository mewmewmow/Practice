const schedule = require('node-schedule');
const { Pool } = require('pg');
const emailService = require('./emailService');
const smsService = require('./smsService');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

class NotificationService {
  async initializeScheduledReminders() {
    // Run every hour to send reminders for bookings 24 hours from now
    schedule.scheduleJob('0 * * * *', async () => {
      await this.sendDueReminders();
    });

    console.log('✓ Scheduled reminder service initialized');
  }

  async sendDueReminders() {
    try {
      // Find bookings that are 24 hours away
      const result = await pool.query(`
        SELECT b.*, s.name as service_name, s.price,
               bus.name as business_name, bus.email as business_email
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        JOIN businesses bus ON b.business_id = bus.id
        WHERE b.status = 'confirmed'
          AND b.reminder_sent = false
          AND CAST(b.booking_date || ' ' || b.start_time AS TIMESTAMP) 
            BETWEEN NOW() + INTERVAL '23 hours' 
            AND NOW() + INTERVAL '24 hours';
      `);

      for (const booking of result.rows) {
        // Send email reminder
        if (booking.customer_email) {
          await emailService.sendReminderEmail(booking.customer_email, booking);
        }

        // Send SMS reminder (if customer has phone)
        if (booking.customer_phone) {
          await smsService.sendReminder(booking.customer_phone, booking);
        }

        // Mark reminder as sent
        await pool.query(
          'UPDATE bookings SET reminder_sent = true WHERE id = $1',
          [booking.id]
        );
      }

      console.log(`✓ Sent ${result.rows.length} reminders`);
    } catch (err) {
      console.error('Error sending reminders:', err);
    }
  }

  async sendReviewRequestsForPastBookings() {
    // Run daily to send review requests for bookings completed 3 days ago
    schedule.scheduleJob('0 9 * * *', async () => {
      try {
        const result = await pool.query(`
          SELECT b.*, s.name as service_name,
                 bus.name as business_name
          FROM bookings b
          JOIN services s ON b.service_id = s.id
          JOIN businesses bus ON b.business_id = bus.id
          WHERE b.status = 'confirmed'
            AND b.review_requested = false
            AND CAST(b.booking_date AS DATE) = CURRENT_DATE - INTERVAL '3 days';
        `);

        for (const booking of result.rows) {
          if (booking.customer_email) {
            await emailService.sendReviewRequest(booking.customer_email, booking);
          }

          await pool.query(
            'UPDATE bookings SET review_requested = true WHERE id = $1',
            [booking.id]
          );
        }

        console.log(`✓ Sent ${result.rows.length} review requests`);
      } catch (err) {
        console.error('Error sending review requests:', err);
      }
    });
  }

  async sendNewBookingNotificationToTeam(booking, business_email) {
    // Notify business owner of new booking
    const html = `
      <h2>New Booking Received!</h2>
      <p>You have a new booking:</p>
      <p><strong>Customer:</strong> ${booking.customer_name}</p>
      <p><strong>Service:</strong> ${booking.service_name}</p>
      <p><strong>Date:</strong> ${booking.booking_date}</p>
      <p><strong>Time:</strong> ${booking.start_time}</p>
      <p><strong>Phone:</strong> ${booking.customer_phone || 'N/A'}</p>
      <p><a href="${process.env.APP_URL}/dashboard">View in Dashboard</a></p>
    `;

    await emailService.transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || 'noreply@smartbook.com',
      to: business_email,
      subject: `New Booking: ${booking.service_name} on ${booking.booking_date}`,
      html
    });
  }
}

module.exports = new NotificationService();
