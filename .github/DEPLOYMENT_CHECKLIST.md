# Deployment Checklist

## GitHub Secrets Required

Make sure these EXACT names are used in GitHub Settings > Secrets > Actions:

### Frontend (Hostinger FTP)
- `FTP_SERVER` = 147.93.17.58
- `FTP_USERNAME` = Your Hostinger FTP username
- `FTP_PASSWORD` = Your Hostinger FTP password

### Frontend Build Environment
- `VITE_API_URL` = http://YOUR_AZURE_VM_IP:3000/api
- `SUPABASE_URL` = Your Supabase project URL
- `SUPABASE_ANON_KEY` = Your Supabase anon key

### Backend (Azure VM)
- `AZURE_HOST` = Your Azure VM public IP
- `AZURE_USERNAME` = azureuser (or your SSH username)
- `AZURE_KEY` = Your private SSH key content

## How to Re-run a Failed Deployment

1. Go to: https://github.com/malikabdullah1786/ecomerencewebsite/actions
2. Click on the failed workflow
3. Click "Re-run all jobs" button (top right)

## Common Issues

**"Input required and not supplied: server"**
- The secret name doesn't match exactly
- Check: It should be `FTP_SERVER` not `FTP_HOST` or `SERVER`
- Secret names are CASE-SENSITIVE

**Build passes but FTP fails**
- Check your FTP credentials
- Make sure `server-dir` in workflow matches your Hostinger folder structure
