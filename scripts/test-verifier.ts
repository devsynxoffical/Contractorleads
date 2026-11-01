import { verifyEmailAddress, verifyEmailBatch } from "@/lib/email-verifier";

async function main() {
  const testEmail = process.argv[2] || "info@google.com";
  console.log(`\n======================================================`);
  console.log(`🔍 Testing Single Email Verification: "${testEmail}"`);
  console.log(`======================================================\n`);

  const res = await verifyEmailAddress(testEmail);
  console.log("Status Category :", res.emailStatus.toUpperCase());
  console.log("Sub-Status      :", res.emailSubStatus);
  console.log("Bounce Risk     :", res.emailBounceRisk?.toUpperCase());
  console.log("Score           :", `${res.score}/100 (${res.emailScore})`);
  console.log("Is Role Account :", res.isRoleAccount);
  console.log("Verified Source :", res.emailVerifySource);
  console.log("Verdict         :", res.verdict);
  console.log("\nChecks Detail:");
  console.log(JSON.stringify(res.checks, null, 2));

  console.log("\nCold Email Strategy Guidance:");
  console.log(JSON.stringify(res.strategy, null, 2));

  console.log(`\n======================================================`);
  console.log(`🧪 Testing Batch Verification Across All 4 Categories`);
  console.log(`======================================================\n`);

  const sampleBatch = [
    "alex.smith@contractorleads.us", // personal/safe candidate
    "sales@roofingpro.com",          // role (sales)
    "info@company.com",              // role (info)
    "noreply@automatedsystem.com",   // automated invalid
    "test@mailinator.com",           // disposable
    "random-invalid@@bad..domain",   // syntax invalid
    "user@doesnotexist987654321.xyz" // non-existent domain
  ];

  console.log(`Verifying batch of ${sampleBatch.length} test emails...`);
  const batchRes = await verifyEmailBatch(sampleBatch);
  console.log(`Total: ${batchRes.total} | Deliverability Rate: ${batchRes.deliverabilityRate}%`);
  console.log(`Safe: ${batchRes.safe} | Catchall: ${batchRes.catchall} | Role: ${batchRes.role} | Invalid: ${batchRes.invalid}\n`);

  batchRes.results.forEach((r, idx) => {
    console.log(`[${idx + 1}] ${r.email.padEnd(32)} -> [${r.emailStatus.toUpperCase().padEnd(8)}] (${r.emailBounceRisk || "n/a"}) - ${r.verdict}`);
  });
}

main().catch(console.error);

