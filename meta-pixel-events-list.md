# Meta Pixel Event List

- PageView: fire on every page load and route change.
- ViewContent: fire on high-intent pages (`/pricing`, `/features`, `/blog`, `/blog/[slug]`, `/leads`, `/leads/hot`, `/leads/[id]`, `/digest`).
- CompleteRegistration: fire after successful signup and verify success.
- Lead: fire when enterprise booking is submitted, marketing subscribe succeeds, lead is saved, outreach email is sent, bulk email is sent, or SMS is sent.
- StartTrial: fire when checkout starts from billing flow.
- AddPaymentInfo: fire on billing page when user enters payment path.
- Purchase: fire on successful Stripe payment confirmation.
- Subscribe: fire on active recurring subscription renewal/update.

