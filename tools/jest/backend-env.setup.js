/**
 * Environment the backend modules expect when they are imported. `libs/auth` builds its Resend
 * client at load time and throws without an API key, which failed every spec that imports
 * `@/auth`. Nothing is sent: specs never call the email functions unmocked.
 */
process.env['RESEND_API_KEY'] ??= 're_test_key';
