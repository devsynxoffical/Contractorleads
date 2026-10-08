import nodemailer from "nodemailer";

const TARGET_EMAIL = "gaurvish0607@gmail.com";
const GODADDY_SHARED_PASS = "RAJOURIbranch@1997";
const HOST = "smtpout.secureserver.net";

const domains = [
  "frankmillerconnect.com",
  "frankmillernetwork.com",
  "frankmillerreach.com",
  "frankmillercontact.com",
  "meetfrankmiller.com",
  "connectwithbdefrank.com",
  "frankmillerhub.com",
  "frankmillerworks.com",
  "frankmillernetworks.com",
  "frankmillerconnects.com",
];

const prefixes = [
  { prefix: "frank", name: "Frank Miller" },
  { prefix: "f.miller", name: "F. Miller" },
  { prefix: "fmiller", name: "Frank Miller" },
  { prefix: "frank.miller", name: "Frank Miller" },
];

const mailboxes = [];
for (const domain of domains) {
  for (const p of prefixes) {
    mailboxes.push({
      name: p.name,
      email: `${p.prefix}@${domain}`,
      pass: GODADDY_SHARED_PASS,
      domain,
    });
  }
}

console.log(`Total GoDaddy mailboxes to send from: ${mailboxes.length}`);
console.log(`Recipient: ${TARGET_EMAIL}\n`);

async function createTransport(mb, port = 465) {
  return nodemailer.createTransport({
    host: HOST,
    port: port,
    secure: port === 465,
    auth: {
      user: mb.email,
      pass: mb.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
}

async function sendFromMailbox(mb, index) {
  const number = index + 1;
  console.log(`[${number}/${mailboxes.length}] Sending from: ${mb.email} (${mb.domain})...`);

  let transporter = await createTransport(mb, 465);
  let attempts = 0;
  let sent = false;
  let lastError = null;

  while (attempts < 2 && !sent) {
    attempts++;
    try {
      const info = await transporter.sendMail({
        from: `"${mb.name}" <${mb.email}>`,
        to: TARGET_EMAIL,
        subject: `[Test ${number}/40] Connection confirmation from ${mb.email}`,
        text: `Hello Gaurav,\n\nThis is a verification email sent directly from your GoDaddy mailbox ${mb.email} (${mb.domain}) to confirm active SMTP delivery.\n\nMailbox #${number} of 40\nServer: ${HOST}:465\nTimestamp: ${new Date().toISOString()}\n\nBest regards,\n${mb.name}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
              <span style="background: #10b981; color: white; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold;">Verified GoDaddy Mailbox</span>
              <span style="color: #64748b; font-size: 12px;">#${number} of 40</span>
            </div>
            <h2 style="color: #0f172a; margin-top: 0; font-size: 18px;">GoDaddy SMTP Mailbox Active</h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
              This test email confirms that <strong>${mb.email}</strong> is properly configured and successfully transmitting outbound messages via GoDaddy SMTP (<code>${HOST}</code>).
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin: 16px 0; font-size: 13px; color: #475569;">
              <div><strong>Sender:</strong> ${mb.name} &lt;${mb.email}&gt;</div>
              <div><strong>Domain:</strong> ${mb.domain}</div>
              <div><strong>Recipient:</strong> ${TARGET_EMAIL}</div>
              <div><strong>Timestamp:</strong> ${new Date().toUTCString()}</div>
            </div>
            <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">
              Contractor Leads Campaign Engine — GoDaddy Mailbox Verification
            </p>
          </div>
        `,
      });

      console.log(`  ✓ SUCCESS: Message ID: ${info.messageId}`);
      sent = true;
      return { success: true, email: mb.email, messageId: info.messageId };
    } catch (err) {
      lastError = err;
      console.warn(`  ⚠ Attempt ${attempts} on port 465 failed: ${err.message}`);
      if (attempts === 1) {
        console.log(`  🔄 Retrying on port 587 (STARTTLS)...`);
        transporter = await createTransport(mb, 587);
      }
    }
  }

  console.error(`  ✗ FAILED to send from ${mb.email}: ${lastError?.message}`);
  return { success: false, email: mb.email, error: lastError?.message };
}

async function main() {
  const results = [];
  for (let i = 0; i < mailboxes.length; i++) {
    const res = await sendFromMailbox(mailboxes[i], i);
    results.push(res);
    // Pause briefly (750ms) between sends to avoid rate limiting
    if (i < mailboxes.length - 1) {
      await new Promise((r) => setTimeout(r, 750));
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  console.log("\n==========================================");
  console.log(`SEND SUMMARY:`);
  console.log(`Total: ${mailboxes.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log("==========================================\n");

  if (failCount > 0) {
    console.log("Failed mailboxes:");
    results.filter((r) => !r.success).forEach((r) => console.log(` - ${r.email}: ${r.error}`));
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
