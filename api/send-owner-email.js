import { Resend } from "resend";

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, note: "endpoint is live" });
  }

  const auth = req.headers.authorization || "";

  if (auth !== `Bearer ${process.env.API_SECRET}`) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const rawBody = req.body || {};
  const data = rawBody.args ? rawBody.args : rawBody;

  const caller_name = data.caller_name || "Not provided";
  const caller_phone = data.caller_phone || "";
  const message = data.message || "";
  const intent = data.intent || "general";
  const urgency = data.urgency || "medium";

  console.log("RAW BODY:", JSON.stringify(rawBody, null, 2));
  console.log("PARSED DATA:", JSON.stringify(data, null, 2));

  if (!caller_phone || !message) {
    return res.status(400).json({
      ok: false,
      error: "missing_fields",
      missing: {
        caller_phone: !caller_phone,
        message: !message
      }
    });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: "Francesca <send@francescaassistant.com>",
      to: "cvaryan22701@gmail.com",
      subject: `📞 New Call – ${intent}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
          <h2>New Call Summary - Studio 53</h2>

          <p><strong>Name:</strong> ${caller_name}</p>
          <p><strong>Phone:</strong> ${caller_phone}</p>
          <p><strong>Intent:</strong> ${intent}</p>
          <p><strong>Urgency:</strong> ${urgency}</p>

          <hr />

          <p><strong>Message:</strong></p>
          <p>${message}</p>
        </div>
      `
    });

    return res.status(200).json({ ok: true, result });
  } catch (err) {
    console.error("RESEND ERROR:", err);

    return res.status(500).json({
      ok: false,
      error: "email_failed",
      details: err?.message || "unknown_error"
    });
  }
}
