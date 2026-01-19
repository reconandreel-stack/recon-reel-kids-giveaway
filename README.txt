Recon & Reel — Kids Fishing Giveaway Landing Page (HTML/CSS) + Google Sheets RSVPs

WHAT'S INCLUDED
- index.html
- styles.css
- script.js (submits RSVPs to Google Sheets; hidden global cap)
- assets/ (logos)

EVENT DETAILS (already on the page)
- Mission Point Park
- 2600 Bayside Ln, San Diego
- February 7 • 10:00 AM – 1:00 PM

HOW RSVPs WORK
- RSVPs are saved to a Google Sheet (you can view them anytime).
- The backend enforces a GLOBAL hidden cap of 100 total (by “kids count” field).

STEP 1 — Create the Google Sheet
1) Go to Google Sheets → New sheet.
2) Name it anything (example: "R&R Kids Giveaway RSVPs").

STEP 2 — Add Apps Script backend (FREE)
1) In the sheet: Extensions → Apps Script
2) Delete any code in Code.gs
3) Paste this code:

/**
 * Recon & Reel Giveaway RSVP — Google Sheets Backend
 *
 * 1) Create a Google Sheet (name it anything).
 * 2) Extensions → Apps Script
 * 3) Paste this whole file into Code.gs (replace everything).
 * 4) Save.
 * 5) Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6) Copy the Web app URL and paste into script.js (CONFIG.webhookUrl).
 */

const SHEET_NAME = "RSVPs";
const LIMIT = 100;

function _getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["timestamp","parentName","phone","childName","age","qty","notes"]);
  }
  return sh;
}

function _countKids_(sh) {
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return 0;
  const qtyRange = sh.getRange(2, 6, lastRow - 1, 1).getValues(); // col F qty
  let sum = 0;
  for (const [v] of qtyRange) sum += Number(v || 0);
  return sum;
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "";
  const sh = _getSheet_();

  if (action === "count") {
    const count = _countKids_(sh);
    return ContentService
      .createTextOutput(JSON.stringify({ ok:true, count }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok:false, reason:"unknown_action" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sh = _getSheet_();

  let body = {};
  try { body = JSON.parse(e.postData.contents || "{}"); } catch (err) {}

  if (body.action !== "rsvp" || !body.payload) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok:false, reason:"bad_request" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Enforce global cap
  const current = _countKids_(sh);
  const qty = Number(body.payload.qty || 1);

  if (current >= LIMIT) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok:false, reason:"closed", count: current }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (current + qty > LIMIT) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok:false, reason:"over_cap", count: current }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  sh.appendRow([
    new Date(),
    String(body.payload.parentName || ""),
    String(body.payload.phone || ""),
    String(body.payload.childName || ""),
    String(body.payload.age || ""),
    qty,
    String(body.payload.notes || "")
  ]);

  const newCount = current + qty;

  return ContentService
    .createTextOutput(JSON.stringify({ ok:true, count: newCount }))
    .setMimeType(ContentService.MimeType.JSON);
}


STEP 3 — Deploy as Web App
1) Deploy → New deployment
2) Select type: Web app
3) Execute as: Me
4) Who has access: Anyone
5) Click Deploy
6) Copy the Web app URL

STEP 4 — Paste URL into the landing page
1) Open script.js
2) Find:
   webhookUrl: "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE"
3) Replace it with your URL and save.

HOSTING (FREE)
- Netlify Drop: https://app.netlify.com/drop
  Drag the entire folder (recon_reel_kids_giveaway_landing) to deploy.

NOTES
- The page does NOT display the cap publicly.
- When the cap is reached, the page shows: “RSVP is closed.”
