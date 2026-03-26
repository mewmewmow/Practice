const twilio = require('twilio');

class SMSService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.fromPhone = process.env.TWILIO_PHONE_NUMBER;
  }

  async sendBookingConfirmation(phone, bookingData) {
    const { service_name, booking_date, start_time, business_name } = bookingData;
    
    const message = `Hi! Your booking at ${business_name} is confirmed.\nService: ${service_name}\nDate: ${booking_date} at ${start_time}\nReply to confirm or visit smartbook.com to manage.`;

    return this.client.messages.create({
      body: message,
      from: this.fromPhone,
      to: phone
    });
  }

  async sendReminder(phone, bookingData) {
    const { service_name, start_time, business_name } = bookingData;
    
    const message = `Reminder: Your ${service_name} at ${business_name} is tomorrow at ${start_time}. Reply to reschedule if needed.`;

    return this.client.messages.create({
      body: message,
      from: this.fromPhone,
      to: phone
    });
  }

  async sendReschedulingLink(phone, bookingData) {
    const { service_name, reschedule_link } = bookingData;
    
    const message = `Need to reschedule your ${service_name}? Click here: ${reschedule_link}`;

    return this.client.messages.create({
      body: message,
      from: this.fromPhone,
      to: phone
    });
  }

  async sendCancellation(phone, bookingData) {
    const { service_name, business_name } = bookingData;
    
    const message = `Your ${service_name} booking at ${business_name} has been cancelled. Contact them if you think this is a mistake.`;

    return this.client.messages.create({
      body: message,
      from: this.fromPhone,
      to: phone
    });
  }
}

module.exports = new SMSService();
