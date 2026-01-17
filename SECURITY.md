# Security Considerations

## Sandbox Security

BYOF executes generated HTML in a sandboxed iframe. While this provides isolation, it is **not a complete security boundary**.

### Sandbox Attributes

The iframe uses:

```html
<iframe sandbox="allow-scripts allow-forms"></iframe>
```

Notably, `allow-same-origin` is **NOT** included, which means:

- The iframe cannot access cookies or storage from the parent origin
- The iframe cannot make credentialed requests to the parent origin
- The iframe cannot access `localStorage` or `sessionStorage`

### Content Security Policy

A CSP meta tag is injected into the generated HTML:

```
default-src 'self';
script-src 'unsafe-inline';
style-src 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self' {allowlist};
frame-src 'none';
object-src 'none';
```

This restricts:

- Network requests to only the allowlisted origins
- No nested iframes
- No plugins

### Limitations

1. **Inline scripts are allowed** - necessary for the single-file HTML approach
2. **The sandbox is client-side only** - a malicious backend could bypass it
3. **Browser bugs could allow escape** - though rare, sandbox escapes have occurred

## Recommendations

### For Production Use

1. **Server-side HTML validation**: Sanitize or validate HTML before saving
2. **Authentication**: Require authentication for save/load endpoints
3. **Rate limiting**: Limit chat requests to prevent abuse
4. **Audit logging**: Log generated HTML for review
5. **Allowlist carefully**: Only include necessary API origins

### API Key Security

Never expose LLM API keys to the frontend. The chat endpoint should:

- Be server-side
- Use environment variables for API keys
- Validate and sanitize inputs

### CORS Configuration

Configure CORS carefully:

- Specify exact allowed origins (avoid `*` in production)
- Only allow necessary HTTP methods
- Consider credentials requirements

### Auth Header Injection

BYOF supports injecting auth headers into generated HTML via `window.__BYOF_AUTH__`. This allows generated apps to make authenticated API calls. The auth is:

- Re-injected before each HTML load (supports token refresh)
- Escaped to prevent XSS in the JSON serialization
- Only accessible within the sandboxed iframe

**Important**: Auth headers are visible to the generated HTML code. Only inject headers that are safe to expose to the generated application.

## Reporting Security Issues

If you discover a security vulnerability, please email the repository owner instead of creating a public issue.
