// Recon & Reel Kids Giveaway RSVP → Google Sheets (Global hidden cap)
const CONFIG = {
  limit: 100,
  webhookUrl: "https://script.google.com/macros/s/AKfycbwDVK8pRhF0-TnkaiS7Kdsw1nJ-xAcjBCMn6k_k6ehQm6MLjxRVsxc00qCXu3I767UL/exec"
};

const $ = (id) => document.getElementById(id);

function setStatus(type, html){
  const el = $("status");
  el.className = "status" + (type ? " " + type : "");
  el.innerHTML = html;
}

function sanitizeText(s, max=2000){
  return String(s || "").trim().slice(0, max);
}

function normalizePhone(phone){
  const raw = String(phone || "").trim();
  return raw.replace(/[^\d+()\-.\s]/g, "").slice(0, 32);
}

async function getCount(){
  const res = await fetch(CONFIG.webhookUrl + "?action=count", { method: "GET" });
  if (!res.ok) throw new Error("Count fetch failed");
  const data = await res.json();
  return Number(data.count || 0);
}

function setClosedUI(closed){
  const btn = $("submitBtn");
  btn.disabled = closed;

  const form = $("rsvpForm");
  [...form.elements].forEach(el => {
    if (el.id !== "submitBtn") el.disabled = closed;
  });

  if (closed){
    setStatus(
      "bad",
      "<strong>RSVP is closed.</strong> The list is no longer accepting signups. Follow <strong>@reconandreel</strong> for future events."
    );
  }
}

(async function init(){
  try {
    const count = await getCount();
    setClosedUI(count >= CONFIG.limit);
  } catch (e) {
    setStatus("bad", "<strong>Setup issue.</strong> RSVP backend is unreachable right now.");
  }
})();

$("rsvpForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const parentName = sanitizeText($("parentName").value, 120);
  const phone = normalizePhone($("phone").value);
  const childName = sanitizeText($("childName").value, 80);
  const age = $("age").value;
  const qty = Number($("qty").value || 1);
  const notes = sanitizeText($("notes").value, 500);

  if (!parentName || !phone || !childName || !age || !qty){
    setStatus("warn", "<strong>Missing info.</strong> Please fill out all required fields.");
    return;
  }

  $("submitBtn").disabled = true;
  setStatus("", "<strong>Sending…</strong> Locking in your RSVP.");

  try {
    const res = await fetch(CONFIG.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "rsvp",
        payload: {
          createdAt: new Date().toISOString(),
          parentName, phone, childName, age, qty, notes
        }
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.ok === false){
      if (data.reason === "closed" || data.reason === "over_cap"){
        setClosedUI(true);
        return;
      }
      throw new Error("Submit failed");
    }

    setStatus("ok", "<strong>RSVP received.</strong> You’re on the list. We’ll share finalized updates soon.");
    e.target.reset();
    $("qty").value = "1";

    const count = await getCount().catch(() => 0);
    setClosedUI(count >= CONFIG.limit);

  } catch (err) {
    $("submitBtn").disabled = false;
    setStatus("bad", "<strong>Error.</strong> Please try again in a moment.");
  }
});
