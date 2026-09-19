import { PrismaClient } from "@prisma/client";
import { createCipheriv, createHash, randomBytes } from "crypto";

const prisma = new PrismaClient();

function requireEncryptionSecret() {
  return (
    process.env.ENCRYPTION_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    "dev-only-encryption-secret-not-for-production"
  );
}

function keyBytes() {
  return createHash("sha256").update(requireEncryptionSecret()).digest();
}

function encryptSecret(plain) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyBytes(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export const HOSTINGER_DEFAULT_MAILBOXES = [
  // 1. roofingagency.us (5)
  {
    name: "Gaurav Kapoor",
    email: "gaurav@roofingagency.us",
    pass: "7p+zii>=prC",
    domain: "roofingagency.us",
  },
  {
    name: "Daniel Brooks",
    email: "daniel@roofingagency.us",
    pass: ";7tTw7=lUz",
    domain: "roofingagency.us",
  },
  {
    name: "Ethan Carter",
    email: "ethan@roofingagency.us",
    pass: "6sYsTSO?",
    domain: "roofingagency.us",
  },
  {
    name: "Frank Miller",
    email: "frank@roofingagency.us",
    pass: "fuZo^Ssh2;W",
    domain: "roofingagency.us",
  },
  {
    name: "Jake Wilson",
    email: "jake@roofingagency.us",
    pass: "P1>>>#CVfCu",
    domain: "roofingagency.us",
  },

  // 2. roofinggrowth.us (5)
  {
    name: "Gaurav Kapoor",
    email: "gaurav@roofinggrowth.us",
    pass: "p/mzZuB:7",
    domain: "roofinggrowth.us",
  },
  {
    name: "Ryan Cooper",
    email: "ryan@roofinggrowth.us",
    pass: "~@JyD0$5b8&R",
    domain: "roofinggrowth.us",
  },
  {
    name: "Daniel Brooks",
    email: "daniel@roofinggrowth.us",
    pass: "quG=+pFp4To;",
    domain: "roofinggrowth.us",
  },
  {
    name: "Ethan Carter",
    email: "ethan@roofinggrowth.us",
    pass: "Sw097y#yQxx+",
    domain: "roofinggrowth.us",
  },
  {
    name: "Frank Miller",
    email: "frank@roofinggrowth.us",
    pass: "3jhzodD:",
    domain: "roofinggrowth.us",
  },

  // 3. roofingmedia.us (5)
  {
    name: "Gaurav Kapoor",
    email: "gaurav@roofingmedia.us",
    pass: "4!d=?8FZq;",
    domain: "roofingmedia.us",
  },
  {
    name: "Jake Wilson",
    email: "jake@roofingmedia.us",
    pass: "f?M5Dim/",
    domain: "roofingmedia.us",
  },
  {
    name: "Ryan Cooper",
    email: "ryan@roofingmedia.us",
    pass: "Wmy6tl?bi7:2",
    domain: "roofingmedia.us",
  },
  {
    name: "Daniel Brooks",
    email: "daniel@roofingmedia.us",
    pass: "ryjt7~Be",
    domain: "roofingmedia.us",
  },
  {
    name: "Ethan Carter",
    email: "ethan@roofingmedia.us",
    pass: "5m>FFsvo",
    domain: "roofingmedia.us",
  },

  // 4. roofingpartners.us (5)
  {
    name: "Gaurav Kapoor",
    email: "gaurav@roofingpartners.us",
    pass: "m~16B>z^eQ2",
    domain: "roofingpartners.us",
  },
  {
    name: "Frank Miller",
    email: "frank@roofingpartners.us",
    pass: "5;T+N5KLt!",
    domain: "roofingpartners.us",
  },
  {
    name: "Jake Wilson",
    email: "jake@roofingpartners.us",
    pass: "Zd6ygm+w~",
    domain: "roofingpartners.us",
  },
  {
    name: "Ryan Cooper",
    email: "ryan@roofingpartners.us",
    pass: "w#W8;H8B$~",
    domain: "roofingpartners.us",
  },
  {
    name: "Daniel Brooks",
    email: "daniel@roofingpartners.us",
    pass: "D?x5>xeT>1l",
    domain: "roofingpartners.us",
  },

  // 5. roofingclients.us (5)
  {
    name: "Gaurav Kapoor",
    email: "gaurav@roofingclients.us",
    pass: "iRR$zYmhuP0@",
    domain: "roofingclients.us",
  },
  {
    name: "Ethan Carter",
    email: "ethan@roofingclients.us",
    pass: "S!HSd2;6:bT",
    domain: "roofingclients.us",
  },
  {
    name: "Frank Miller",
    email: "frank@roofingclients.us",
    pass: "0b>9*Xx1",
    domain: "roofingclients.us",
  },
  {
    name: "Jake Wilson",
    email: "jake@roofingclients.us",
    pass: "?3KAJ~~ef",
    domain: "roofingclients.us",
  },
  {
    name: "Ryan Cooper",
    email: "ryan@roofingclients.us",
    pass: "/Q>rvne5uA",
    domain: "roofingclients.us",
  },
];

export async function bootstrapHostingerMailboxes() {
  console.log("Seeding 25 Hostinger SMTP mailboxes...");
  let count = 0;
  for (const item of HOSTINGER_DEFAULT_MAILBOXES) {
    const passwordEnc = encryptSecret(item.pass);
    await prisma.systemSmtpAccount.upsert({
      where: { fromEmail: item.email.toLowerCase().trim() },
      update: {
        label: `${item.name} (${item.domain})`,
        domain: item.domain.toLowerCase().trim(),
        host: "smtp.hostinger.com",
        port: 465,
        secure: true,
        username: item.email.toLowerCase().trim(),
        passwordEnc,
        fromName: item.name,
      },
      create: {
        label: `${item.name} (${item.domain})`,
        domain: item.domain.toLowerCase().trim(),
        host: "smtp.hostinger.com",
        port: 465,
        secure: true,
        username: item.email.toLowerCase().trim(),
        passwordEnc,
        fromEmail: item.email.toLowerCase().trim(),
        fromName: item.name,
        enabled: true,
        isDefault: false,
        sendWeight: 1,
      },
    });
    count++;
  }
  console.log(`Successfully seeded ${count} Hostinger mailboxes across 5 domains.`);
}

if (process.argv[1]?.endsWith("seed-hostinger-smtp.mjs")) {
  bootstrapHostingerMailboxes()
    .catch((err) => {
      console.error("Error seeding Hostinger SMTP mailboxes:", err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
