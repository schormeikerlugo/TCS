import type { APIRoute } from 'astro';
import { Resend } from 'resend';

// On-demand endpoint (the rest of the site stays static).
export const prerender = false;

// Internal inbox that receives the leads.
const TO_EMAIL = 'tcs@tcspermits.com';
// Sender of the internal notification.
const FROM_EMAIL = 'TCS Website <info@tcspermits.com>';
// Sender of the auto-reply that the client receives.
const REPLY_FROM_EMAIL = 'TCS <info@tcspermits.com>';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isPhone = (value: string) => (value.match(/\d/g) || []).length >= 10;
const isPostalCode = (value: string) =>
  /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/.test(value);

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured.');
    return json({ ok: false, error: 'Email service is not configured.' }, 500);
  }

  // Accept both form-encoded submissions and JSON.
  let data: Record<string, string> = {};
  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await request.json();
    } else {
      const form = await request.formData();
      form.forEach((value, key) => {
        data[key] = typeof value === 'string' ? value : '';
      });
    }
  } catch {
    return json({ ok: false, error: 'Invalid request payload.' }, 400);
  }

  const fullName = (data['full-name'] || '').trim();
  const email = (data['email'] || '').trim();
  const phone = (data['phone'] || '').trim();
  const address = (data['address'] || '').trim();
  const postalCode = (data['postal-code'] || '').trim();
  const city = (data['city'] || '').trim();
  const message = (data['message'] || '').trim();

  // Honeypot (optional anti-spam field; must stay empty).
  if ((data['company'] || '').trim() !== '') {
    return json({ ok: true });
  }

  const missing: string[] = [];
  if (!fullName) missing.push('full name');
  if (!email) missing.push('email');
  if (!phone) missing.push('phone');
  if (!address) missing.push('address');
  if (!postalCode) missing.push('postal code');
  if (!city) missing.push('city');
  if (!message) missing.push('project details');

  if (missing.length > 0) {
    return json(
      { ok: false, error: `Please complete: ${missing.join(', ')}.` },
      400
    );
  }

  if (!isEmail(email)) {
    return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
  }

  if (!isPhone(phone)) {
    return json(
      { ok: false, error: 'Please enter a valid phone number (at least 10 digits).' },
      400
    );
  }

  if (!isPostalCode(postalCode)) {
    return json(
      { ok: false, error: 'Please enter a valid Canadian postal code, e.g. T5J 0N3.' },
      400
    );
  }

  if (message.length < 10) {
    return json(
      { ok: false, error: 'Please describe your project (at least 10 characters).' },
      400
    );
  }

  // Guard against oversized payloads that slipped past the client.
  if (
    fullName.length > 80 ||
    email.length > 120 ||
    phone.length > 20 ||
    address.length > 120 ||
    postalCode.length > 7 ||
    city.length > 60 ||
    message.length > 2000
  ) {
    return json({ ok: false, error: 'One or more fields are too long.' }, 400);
  }

  // Normalize the postal code for a consistent record.
  const normalizedPostal = postalCode.toUpperCase();

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #0f1829; max-width: 600px;">
      <h2 style="margin: 0 0 16px; color: #2563eb;">New Quote Request</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #64748b; width: 160px;">Name</td><td style="padding: 8px 0;">${escapeHtml(fullName)}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Email</td><td style="padding: 8px 0;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Phone</td><td style="padding: 8px 0;"><a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Property Address</td><td style="padding: 8px 0;">${escapeHtml(address)}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">City</td><td style="padding: 8px 0;">${escapeHtml(city)}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Postal Code</td><td style="padding: 8px 0;">${escapeHtml(normalizedPostal)}</td></tr>
      </table>
      <h3 style="margin: 24px 0 8px; color: #0f1829;">Project Details</h3>
      <p style="white-space: pre-wrap; font-size: 14px; line-height: 1.6; margin: 0;">${escapeHtml(message)}</p>
    </div>
  `;

  const text = [
    `New Quote Request`,
    ``,
    `Name: ${fullName}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Property Address: ${address}`,
    `City: ${city}`,
    `Postal Code: ${normalizedPostal}`,
    ``,
    `Project Details:`,
    message,
  ].join('\n');

  const firstName = fullName.split(/\s+/)[0] || fullName;

  const autoReplyHtml = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #0f1829; max-width: 600px; line-height: 1.6;">
      <p style="margin: 0 0 16px;">Hi ${escapeHtml(firstName)},</p>
      <p style="margin: 0 0 16px;">
        Thank you for reaching out to <strong>TCS</strong>. We've received your
        request and a member of our team is already reviewing it.
      </p>
      <p style="margin: 0 0 16px;">
        We'll get back to you as soon as your project has been reviewed, with a clear
        scope and quote.
      </p>
      <p style="margin: 0 0 16px;">
        In the meantime, if anything is urgent, feel free to call us at
        <a href="tel:+17808851687" style="color: #2563eb;">(780) 885-1687</a>
        (Mon–Fri, 7:00 AM – 6:00 PM).
      </p>
      <p style="margin: 24px 0 0;">Talk soon,</p>
      <p style="margin: 4px 0 0;"><strong>The TCS Team</strong></p>
      <p style="margin: 2px 0 0; color: #64748b; font-size: 13px;">
        Permits · Planning · Approvals — End to end.
      </p>
    </div>
  `;

  const autoReplyText = [
    `Hi ${firstName},`,
    ``,
    `Thank you for reaching out to TCS. We've received your request and a member of our team is already reviewing it.`,
    ``,
    `We'll get back to you as soon as your project has been reviewed, with a clear scope and quote.`,
    ``,
    `In the meantime, if anything is urgent, feel free to call us at (780) 885-1687 (Mon–Fri, 7:00 AM – 6:00 PM).`,
    ``,
    `Talk soon,`,
    `The TCS Team`,
    `Permits · Planning · Approvals — End to end.`,
  ].join('\n');

  try {
    const resend = new Resend(apiKey);

    // 1) Internal notification with the lead's details.
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: email,
      subject: `New Quote Request — ${fullName}`,
      html,
      text,
    });

    if (error) {
      console.error('Resend error (internal notification):', error);
      return json({ ok: false, error: 'Could not send your request. Please try again.' }, 502);
    }

    // 2) Auto-reply / welcome email to the client. Non-blocking: the lead is
    //    already captured, so a failure here should not fail the request.
    const { error: replyError } = await resend.emails.send({
      from: REPLY_FROM_EMAIL,
      to: email,
      replyTo: TO_EMAIL,
      subject: "We've received your request — TCS",
      html: autoReplyHtml,
      text: autoReplyText,
    });

    if (replyError) {
      console.error('Resend error (client auto-reply):', replyError);
    }

    return json({ ok: true });
  } catch (err) {
    console.error('Unexpected error sending email:', err);
    return json({ ok: false, error: 'Could not send your request. Please try again.' }, 500);
  }
};
