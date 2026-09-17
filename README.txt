EZYGO TRAVEL - SUPABASE + CLOUDFLARE PAGES SETUP

1) SUPABASE
- Open your Supabase project.
- SQL Editor -> New query.
- Paste the full content of: supabase/setup.sql
- Run it once.
- This creates visa sections, visa cards, packages, galleries, feedback and the site-media Storage bucket.
- Existing textual visa/package/gallery content is seeded. Images are intentionally not hot-linked. Upload them from Admin so the live site uses Supabase Storage.

2) GITHUB
- Create one GitHub repository for this project.
- Upload the CONTENTS of this folder to the repository root.
- Do not upload old/version-copy files.

3) CLOUDFLARE PAGES
- Cloudflare Dashboard -> Workers & Pages -> Create application -> Pages -> Connect to Git.
- Connect GitHub and select this repository.
- Production branch: main
- Framework preset: None
- Build command: exit 0
- Build output directory: .
- Deploy the project.

4) CLOUDFLARE VARIABLES / SECRETS
- Open the Pages project -> Settings -> Variables and Secrets.
- Add these for Production:
  SUPABASE_URL = https://eqtitceuapjuwockosnm.supabase.co
  SUPABASE_SERVICE_ROLE_KEY = <copy directly from Supabase project settings; keep this secret>
  ADMIN_LOGIN_ID = Goezy
- Save and redeploy once after adding them.

5) ADMIN
- Open: https://YOUR-DOMAIN/admin.html
- Enter Admin Login ID: Goezy
- The ID is checked by the Cloudflare Pages Function at /api/admin, not exposed in customer JavaScript.
- Upload card/package/gallery images from Admin. They are stored in Supabase Storage.
- Use the up/down controls to change card/package/gallery/visa-section order.
- Customer feedback submitted on the public site appears in the Feedback tab.

6) DOMAIN
- Cloudflare Pages project -> Custom domains -> Set up a domain.
- For an apex domain such as example.com, add the domain to the same Cloudflare account and point the registrar nameservers to the Cloudflare nameservers shown in the dashboard.
- For a subdomain, follow the CNAME instructions shown by Cloudflare Pages.

LIVE PROJECT FILES
index.html
admin.html
config.js
app.js
admin.js
_headers
functions/api/admin.js
supabase/setup.sql
README.txt
