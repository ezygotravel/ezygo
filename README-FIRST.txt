EZYGO - V16 DEPLOYMENT NOTES

1. Upload the CONTENTS of this folder to the GitHub repository root.
2. Let Cloudflare Pages redeploy the project.
3. Cache version is now ezygo-v16 / ezygo-media-v16. The new service worker removes older caches automatically.
4. Visa and Admin-created Package records continue to load from Supabase.
5. The five supplied package updates are also bundled as safe starter package data so they appear immediately after deployment even before a database import.
6. Supplier/agency names, phone numbers, email addresses, bank details, GST/PAN details and supplied package rates were intentionally excluded. Customer package pricing always shows “Ask for price”.
7. To make the five bundled packages normal Supabase/Admin records, run supabase/package-content-v16.sql once in Supabase SQL Editor. Existing records with the same IDs are updated safely.
8. Local travel/visa images were converted to optimized WebP and the customer/Admin apps automatically map older local .jpg references to the WebP files for faster loading.
9. Customer loading strategy: first visible covers are prioritized; detail/slider images wait until idle time or user intent/click. Images remain on their placeholder until the full image has loaded, avoiding half-rendered visual flashes.
10. New Admin uploads are resized and compressed to WebP before upload.
11. Gallery remains removed. Customer navigation remains Visa / Packages / Services.

For a brand-new Supabase project: run supabase/setup.sql, then supabase/package-content-v16.sql.
