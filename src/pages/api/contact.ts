import type { APIRoute } from 'astro';
import { Resend } from 'resend';

// On-demand endpoint (the rest of the site stays static).
export const prerender = false;

const TO_EMAIL = 'order@tcspermits.com';
const FROM_EMAIL = 'TCS Website <order@tcspermits.com>';

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

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #0f1829; max-width: 600px;">
      <h2 style="margin: 0 0 16px; color: #2563eb;">New Quote Request</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #64748b; width: 160px;">Name</td><td style="padding: 8px 0;">${escapeHtml(fullName)}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Email</td><td style="padding: 8px 0;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Phone</td><td style="padding: 8px 0;"><a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Property Address</td><td style="padding: 8px 0;">${escapeHtml(address)}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">City</td><td style="padding: 8px 0;">${escapeHtml(city)}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Postal Code</td><td style="padding: 8px 0;">${escapeHtml(postalCode)}</td></tr>
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
    `Postal Code: ${postalCode}`,
    ``,
    `Project Details:`,
    message,
  ].join('\n');

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: email,
      subject: `New Quote Request — ${fullName}`,
      html,
      text,
    });

    if (error) {
      console.error('Resend error:', error);
      return json({ ok: false, error: 'Could not send your request. Please try again.' }, 502);
    }

    return json({ ok: true });
  } catch (err) {
    console.error('Unexpected error sending email:', err);
    return json({ ok: false, error: 'Could not send your request. Please try again.' }, 500);
  }
};
