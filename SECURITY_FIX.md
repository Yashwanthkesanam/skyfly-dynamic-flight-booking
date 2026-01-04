# 🔒 SMTP Credentials Security Fix

## ⚠️ CRITICAL: Immediate Actions Required

### 1. Revoke Exposed Credentials (DO THIS FIRST!)

The following Gmail App Password was exposed in your GitHub repository:
- **Email**: `yashwanthece452@gmail.com`
- **Exposed Password**: `acsbjycyijgvyfie`

**You MUST revoke this password immediately:**

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Navigate to "2-Step Verification"
3. Scroll to "App passwords"
4. Find and **DELETE** the exposed app password
5. Generate a **NEW** app password for FlySmart

### 2. Set Up Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cd backend
copy .env.example .env
```

Edit the `.env` file and add your **NEW** credentials:

```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=yashwanthece452@gmail.com
SMTP_PASSWORD=your-new-app-password-here
SENDER_EMAIL=yashwanthece452@gmail.com
```

### 3. Clean Git History

The exposed credentials are still in your Git history. Run these commands:

```bash
# Install git-filter-repo if not already installed
pip install git-filter-repo

# Remove the sensitive data from history
git filter-repo --path backend/app/services/email_service.py --invert-paths --force

# Or use BFG Repo-Cleaner (alternative method)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
# java -jar bfg.jar --replace-text passwords.txt
```

**WARNING**: This rewrites Git history. Coordinate with any collaborators.

### 4. Force Push to GitHub

After cleaning history:

```bash
git push origin --force --all
git push origin --force --tags
```

### 5. Verify Security

- ✅ Hardcoded credentials removed from code
- ✅ `.env` added to `.gitignore`
- ✅ `.env.example` created as template
- ⚠️ Old credentials still in Git history (needs cleanup)
- ⚠️ Exposed password needs to be revoked

## What Was Fixed

1. **Removed hardcoded credentials** from `backend/app/services/email_service.py`
2. **Created `.gitignore`** to prevent `.env` files from being committed
3. **Created `.env.example`** as a template for configuration

## Testing After Fix

1. Create your `.env` file with new credentials
2. Test the email functionality:
   ```bash
   cd backend
   python -m pytest tests/  # if you have tests
   # Or manually test by making a booking
   ```

## Best Practices Going Forward

- ✅ **Never** commit `.env` files
- ✅ **Always** use environment variables for secrets
- ✅ **Use** `.env.example` for documentation
- ✅ **Rotate** credentials if exposed
- ✅ **Enable** GitHub secret scanning alerts

## Additional Resources

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Git Filter Repo](https://github.com/newren/git-filter-repo)
