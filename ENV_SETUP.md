# Environment Variables Setup

This document lists all environment variables required for the LTTD application.

## Required Environment Variables

### SMTP Configuration (for sending emails)

```bash
# SMTP server hostname
SMTP_SERVER=smtp.hsbc.com

# SMTP server port (usually 25 or 587)
SMTP_PORT=25

# Optional: SMTP authentication (if required)
SMTP_USER=your-username
SMTP_PASSWORD=your-password
```

### Teambook API Configuration (for fetching user emails)

```bash
# Teambook API Bearer token
TEAMBOOK_TOKEN=your-teambook-bearer-token-here
```

## How to Set Environment Variables

### On Linux/Mac (Development)
```bash
export SMTP_SERVER=smtp.hsbc.com
export SMTP_PORT=25
export TEAMBOOK_TOKEN=your-token-here
```

### On Windows (Development)
```cmd
set SMTP_SERVER=smtp.hsbc.com
set SMTP_PORT=25
set TEAMBOOK_TOKEN=your-token-here
```

### On Production Server (IKP)
Add these to your deployment configuration or `.env` file:
```
SMTP_SERVER=smtp.hsbc.com
SMTP_PORT=25
TEAMBOOK_TOKEN=your-token-here
```

## Testing

After setting the environment variables, restart your Flask application and test:

1. **Test Teambook Email Fetch:**
   - Fetch LTTD records
   - Click "Send Email" button
   - Check if emails are fetched from Teambook API

2. **Test Email Sending:**
   - Enter From email
   - Verify To emails are pre-filled
   - Add optional CC emails
   - Click "Send Email"
   - Verify email is received

## Security Notes

- **Never commit tokens to Git**
- Store `TEAMBOOK_TOKEN` securely in your deployment environment
- Use environment-specific tokens (dev, cert, prod)
- Rotate tokens periodically as per HSBC security policy
