# Email and optional phone verification

## Provider configuration

Backend-only `.env.example` documents consumed settings:
- `EMAIL_PROVIDER`: `resend` or `brevo`; `EMAIL_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`.
- `SMS_PROVIDER`: currently `brevo`; `SMS_API_KEY`, `SMS_SENDER_ID`.
- `OTP_EXPIRY_MINUTES=10`, `OTP_RESEND_COOLDOWN_SECONDS=60`, `OTP_MAX_ATTEMPTS=5`.

`EmailProvider` and `SmsProvider` protocols centralize delivery; no component knows provider credentials. Resend and Brevo adapters use documented HTTPS transactional endpoints with sanitized failures and a twelve-second network timeout. Missing credentials/unsupported selection produce `NOT_CONFIGURED`; attempted delivery failures produce `TEMPORARILY_UNAVAILABLE`. Provider configuration means an adapter can be invoked, not a guarantee of delivery. No credentials were added or changed by this task. Final configuration inspection finds locally configured Resend email settings and absent SMS settings; credential validity and successful live delivery are not verified. Test subprocesses explicitly override provider credentials with empty values and inject capture delivery only in test launchers.

Technical references inspected: [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email), [Brevo transactional email](https://developers.brevo.com/reference/send-transac-email), [Brevo transactional SMS](https://developers.brevo.com/docs/transactional-sms-endpoints). No SDK or copied third-party implementation is added.

## Lifecycle

Signup creates a pending unverified user, then a random six-digit code. Only a limited pending-flow HttpOnly cookie is issued; it grants no account access. OTP storage is a secret-key HMAC-SHA256 digest bound to user, purpose and target. Plaintext exists transiently only to pass to the selected delivery provider. It is never returned by production APIs or logged. Pending tokens are also stored hashed; flows expire after one hour.

Issuance reserves cooldown under `BEGIN IMMEDIATE`, replaces the previous digest, then calls the provider. Failure invalidates that digest. A retry cannot bypass configured cooldown. Confirmation checks expiry, attempt budget and constant-time digest comparison; wrong attempts persist. Code consumption and email ownership/account update occur in one transaction. Signup then issues the existing tracked eight-hour session and deletes pending flows. All old codes and consumed codes fail. GET status preserves failed-delivery state after reload.

Duplicate registration returns a generic pending response and does not authenticate or disclose an existing account. It does not send to a verified existing account. UX says to check the masked address, avoiding a false delivery guarantee. Existing pending users can resume verification after a valid password login.

Email change and optional phone change require current-password reauthentication, CSRF, bounded target validation and OTP to the new target. The stored contact changes only after code consumption; other sessions are revoked. Email change attempts a security notification to the old address. Notification failure does not roll back a successful account change; durable notification retries/audit delivery tracking are deferred.

Phone is never required for signup. Stored phone is private and returned only masked. Brevo SMS requires valid sender/provider permissions and jurisdiction-specific approval; actual India delivery was not tested. MSG91/Exotel can implement the same protocol later. WhatsApp is not implemented.

## Development and cost assumptions

Absent configuration is a supported honest public-only development state, not fake OTP delivery. Automated tests inject capture providers exclusively in test files. `tests/provider_server.py` is a loopback-only development test launcher, not imported by the production app and rejects production mode. Its test mailbox endpoint is absent from normal Uvicorn startup (tested 404). Tests exercise the actual backend OTP confirmation rather than granting a fake user.

No paid account or billing change was made. Test delivery is now isolated from local provider configuration. An initial missing-provider test unintentionally inherited local email settings; it did not produce a verified session or a successful-delivery assertion. No claim of successful external delivery is made. No free delivery allowance or production price is assumed; provider plans, verified sender setup, email deliverability and local SMS requirements must be checked when enabling delivery. OAuth credentials remain absent and OAuth flows are not implemented; Google/GitHub remain configuration-required, never falsely connected.
