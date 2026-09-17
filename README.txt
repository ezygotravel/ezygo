EZYGO TRAVEL - SUPABASE + NETLIFY SETUP

1) SUPABASE
- Open your Supabase project.
- SQL Editor -> New query.
- Paste the full content of: supabase/setup.sql
- Run it once.
- This creates visa sections, visa cards, packages, galleries, feedback and the site-media Storage bucket.
- Existing textual visa/package/gallery content is seeded. Images are intentionally not hot-linked. Upload them from Admin so the final site uses Supabase Storage only.

2) GITHUB
- Create one repository for this project.
- Upload the CONTENTS of this folder to the repository root.
- Do not upload old version files.

3) NETLIFY
- Import the GitHub repository into Netlify.
- No build command is required.
- Publish directory: .
- In Netlify -> Site configuration -> Environment variables, add:
  SUPABASE_URL = https://eqtitceuapjuwockosnm.supabase.co
  SUPABASE_SERVICE_ROLE_KEY = <copy this from Supabase project settings; NEVER put it in website files or share it publicly>
  ADMIN_LOGIN_ID = Goezy
- Redeploy once after adding the environment variables.

4) ADMIN
- Open: https://YOUR-DOMAIN/admin.html
- Enter Admin Login ID: Goezy
- The ID is checked by the Netlify server function, not exposed in customer JavaScript.
- Upload card/package/gallery images here. Images are resized in the browser and stored in Supabase Storage.
- Use the up/down buttons to change card/package/gallery/visa-section order.
- Customer feedback submitted on the public site appears in the Feedback tab.

5) DOMAIN
- In Netlify -> Domain management, add the domain you bought and follow the DNS instructions shown by Netlify.

FILES USED BY THE LIVE SITE
index.html
admin.html
config.js
app.js
admin.js
netlify.toml
netlify/functions/admin.mjs
supabase/setup.sql
README.txt
