console.log("Production Capacity Admin loaded");

const { createClient } = supabase;

const supabaseClient = createClient(
  "https://wgpmexqsjacapfyddtfi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndncG1leHFzamFjYXBmeWRkdGZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NDgyMDksImV4cCI6MjA2MzMyNDIwOX0.rjW0qEaJVdAU-UNWgLbYjSjGMg-n-YaEgHP9prxKLcQ"
);

const statusOptions = [
  ["green", "On Track"],
  ["amber", "Watch"],
  ["red", "Critical"],
  ["purple", "Over Capacity"]
];

const rowsBox = document.getElementById("rows");
const msg = document.getElementById("msg");

function rowCard(r) {
  const statuses = statusOptions
    .map(
      ([value, label]) =>
        `<option value="${value}" ${r.status === value ? "selected" : ""}>${label}</option>`
    )
    .join("");

  return `
    <div class="card" data-id="${r.id}">
      <div class="row">
        <div>
          <label>Week Offset (-1..3)
            <input type="number" min="-1" max="3"
                   value="${r.week_offset}" data-field="week_offset">
          </label>
        </div>
        <div>
          <label>Label
            <input type="text"
                   value="${r.week_label}" data-field="week_label">
          </label>
        </div>
        <div>
          <label>Load %
            <input type="number" min="0" max="999"
                   value="${r.load_percent}" data-field="load_percent">
          </label>
        </div>
        <div>
          <label>Status
            <select data-field="status">${statuses}</select>
          </label>
        </div>
      </div>
    </div>
  `;
}

async function loadRows() {
  msg.textContent = "Loading…";

  const { data, error } = await supabaseClient
    .schema("exportal-pc")
    .from("production_capacity")
    .select("id, week_offset, week_label, load_percent, status")
    .order("week_offset", { ascending: true });

  if (error) {
    console.error(error);
    msg.textContent = "Error: " + error.message;
    return;
  }

  rowsBox.innerHTML = (data || []).map(rowCard).join("");
  msg.textContent = `Loaded ${data.length} row(s).`;
}

async function saveAll() {
  msg.textContent = "Saving…";

  const cards = rowsBox.querySelectorAll(".card[data-id]");

  for (const card of cards) {
    const id = card.dataset.id;
    const values = {};

    card.querySelectorAll("[data-field]").forEach(el => {
      let v = el.value;
      if (["week_offset", "load_percent"].includes(el.dataset.field)) {
        v = Number(v);
      }
      values[el.dataset.field] = v;
    });

    values.updated_at = new Date().toISOString();

    const { error } = await supabaseClient
      .schema("exportal-pc")
      .from("production_capacity")
      .update(values)
      .eq("id", id);

    if (error) {
      console.error(error);
      msg.textContent = "Error: " + error.message;
      return;
    }
  }

  msg.textContent = "Saved ✅";
}

document.getElementById("refresh").addEventListener("click", loadRows);
document.getElementById("saveAll").addEventListener("click", saveAll);

// Initial load
loadRows();

/*
  Realtime intentionally omitted:
  WebSockets are unreliable inside SharePoint / iframes
*/
``