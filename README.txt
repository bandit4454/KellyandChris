Kelly & Chris's Titanic Tastes - Netlify deploy
================================================
This site needs Netlify Functions + Netlify Blobs (for live sync), so deploy with the
Netlify CLI or a Git repo. Drag-and-drop in the Netlify dashboard only uploads static files.

Deploy with the Netlify CLI (needs Node.js 18+ installed):
  1. Unzip this folder and open Terminal in it.
  2. npm install
  3. npx netlify-cli login
  4. npx netlify-cli deploy --prod      (choose "Create & configure a new site" the first time)

Set your presenter PIN:
  Netlify > your site > Site configuration > Environment variables > add PRESENTER_PIN
  (If you don't set one, the PIN is: iceberg). Redeploy after changing it.

Using it:
  Guests:     https://YOUR-SITE.netlify.app/
  Presenter:  https://YOUR-SITE.netlify.app/#presenter   (enter PIN once)
  On the presenter page, "Show QR code" shows a full-screen QR for the guest link.
  After rehearsals, tap "Clear guest data" and "Reset everyone to Order Placed".
