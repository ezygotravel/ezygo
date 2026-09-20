EzyGo v16 (20 Sep 2026)
- Added today's 4 saved packages
- Package rates remain hidden; customer sees Ask for price
- Removed smooth scroll behavior
- Faster thumbnail-first image loading + v16 cache refresh

EZYGO - CURRENT DEPLOYMENT NOTES

1. Upload the CONTENTS of this folder to the GitHub repository root.
2. Let Cloudflare Pages redeploy the project.
3. Existing Visa and Package records are read from Supabase.
4. Create, edit, reorder and delete Packages from /admin.html only.
5. Package pricing is intentionally not shown as a stored rate on the customer site; customers see "Ask for price".
6. Upload Package cover/detail images from Admin. They are optimized before upload and stored in Supabase Storage.
7. Gallery has been removed from both customer and Admin interfaces.
8. Cache version in this build: ezygo-v15 / ezygo-media-v15.

For a brand-new Supabase project, run supabase/setup.sql once, then manage Packages from Admin.
