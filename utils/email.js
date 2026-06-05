import { htmlToText } from 'html-to-text';
import nodemailer from 'nodemailer';
import pug from 'pug';
import path from 'path';
import { fileURLToPath } from 'url';

export const __dirname = path.dirname(fileURLToPath(import.meta.url));
class Email {
  constructor(user, url) {
    this.url = url;
    this.firstName = user.name.split(' ')[0];
    this.to = user.email;
    this.from = `Bahaa Alden <${process.env.EMAIL_FROM}>`;
  }

  newTransporter() {
    if (process.env.NODE_ENV === 'development') {
      return nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USERNAME_R,
          pass: process.env.EMAIL_PASSWORD_R,
        },
      });
    }

    return nodemailer.createTransport({
      host: `${process.env.EMAIL_HOST}`,
      port: `${process.env.EMAIL_PORT}`,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    //1) Render html based on pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    //2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text: htmlToText(html),
      html,
    };

    //3) Send the email
    await this.newTransporter().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the natours family');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your reset token valid for only 10 minute'
    );
  }

  async sendResetMessage() {
    await this.send('passwordChanged', 'Your password has been reset');
  }
}

export default Email;
