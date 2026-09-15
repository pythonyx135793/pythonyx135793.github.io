const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 5_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequestPost(context) {
  const requestOrigin = context.request.headers.get('Origin');
  if (requestOrigin && requestOrigin !== new URL(context.request.url).origin) {
    return json({ ok: false, error: 'Invalid request origin.' }, 403);
  }

  let form;
  try {
    form = await context.request.formData();
  } catch {
    return json({ ok: false, error: 'Please submit the form again.' }, 400);
  }

  // Quietly accept the honeypot so ordinary bots do not learn the delivery path.
  if (String(form.get('website') || '').trim()) return json({ ok: true });

  const name = String(form.get('name') || '').trim().replace(/[\r\n]+/g, ' ');
  const email = String(form.get('email') || '').trim();
  const message = String(form.get('message') || '').trim();
  if (name.length > MAX_NAME || email.length > MAX_EMAIL || message.length > MAX_MESSAGE) {
    return json({ ok: false, error: 'Please shorten the message and try again.' }, 400);
  }
  if (!message) return json({ ok: false, error: 'Please enter a message.' }, 400);
  if (email && !EMAIL_PATTERN.test(email)) return json({ ok: false, error: 'Please check the reply email address.' }, 400);

  const binding = context.env?.READYVIO_EMAIL;
  const destination = context.env?.READYVIO_CONTACT_TO;
  if (!binding || !destination) {
    return json({ ok: false, error: 'Contact delivery is being connected. Please try again later.' }, 503);
  }

  const subject = `Readyvio contact${name ? ` — ${name}` : ''}`;
  const text = [
    'A visitor sent a message through the Readyvio contact form.',
    '',
    `Name: ${name || '(not provided)'}`,
    `Reply email: ${email || '(not provided)'}`,
    '',
    message,
  ].join('\n');

  try {
    await binding.send({
      to: destination,
      from: 'contact@readyvio.com',
      subject,
      text,
    });
  } catch {
    return json({ ok: false, error: 'The message could not be delivered. Please try again later.' }, 502);
  }

  return json({ ok: true });
}
