# Resend live verification

**LIVE DELIVERY VERIFIED**

The user confirmed: “Email received and verification completed” after being asked to use the normal local signup/verification form and enter the code only there. This is inbox-level confirmation, rather than an assumption based solely on an HTTP 2xx response. The agent did not read the inbox, request the code in chat, capture the entered code, or observe its plaintext. Local storage also contains a verified non-demo account and tracked normal-user sessions. No recipient address is recorded in this report or hardcoded in source/seed/configuration.

Provider acceptance and inbox delivery are separate facts. The new adapter requires a successful status and bounded message identifier to report `accepted`. An individual live message ID/API acceptance trace was not independently captured for the user's manual run. Successful inbox receipt/verification is user-confirmed; adapter response classification is independently tested with bounded upstream fixtures. No extra email was sent to guess a recipient or bypass the signup flow.

## Configuration verified without secret disclosure

Local backend settings resolve `ENVIRONMENT=development`, `EMAIL_PROVIDER=resend`, an existing nonempty email API key, `EMAIL_FROM=onboarding@resend.dev`, and the configured display name. The real key was retained unchanged in ignored backend/.env. The temporary test recipient is entered by the user in the normal form; registration stores it as ordinary account data, not as a global send target.

## Official adapter

POST https://api.resend.com/emails uses Bearer authorization, configured sender/display name, requested recipient, subject and text. Responses are bounded to 16 KiB; no upstream body/error text is emitted. Results distinguish accepted, rejected, configuration_error, provider_error and network_error. Stable safe codes identify missing configuration, invalid/restricted/suspended credentials, unverified sender, test-recipient restriction, invalid sender/request, rate limit, upstream failure, invalid response and network timeout.

The structured OTP logs contain generated/persisted/send/verify stages, provider, recipient domain, status and a safe message ID. Canonical UUID identifiers are retained; other opaque identifiers are fingerprinted. No local address part, code, password, API key, JWT secret, request body or resume text is logged.

References: [send email](https://resend.com/docs/api-reference/emails/send-email), [errors](https://resend.com/docs/api-reference/errors), [resend.dev test restriction](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain). The test sender is restricted to the Resend account inbox; general signup delivery needs a verified sender domain. No provider quota, price, paid plan or free-tier entitlement is assumed.

## Optional explicit CLI check

From backend: `python -m src.scripts.check_email_provider --recipient <owned-inbox>` validates configuration without sending. Add `--send` only for an explicitly requested non-OTP diagnostic email. This development-only command grants no authentication, stores no recipient preference and has no public HTTP endpoint. It was not used to bypass the user's normal signup test.

Live verification scope: inbox receipt and successful confirmation are user-confirmed. The agent did not independently observe every subsequent live onboarding/signout/signin step. Those lifecycle paths are covered by the isolated normal-account regression and actual local-demo checks. Invalid/restricted-key classifications were tested through injected upstream responses, not by issuing extra live sends with fabricated credentials. OAuth, general-recipient sending without a verified domain, inbox automation and production email monitoring are not claimed.
