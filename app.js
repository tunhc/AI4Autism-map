const centers = window.AI4A_CENTERS || [];

const state = {
  query: "",
  city: "Tất cả",
  layer: "Tất cả",
  status: "Tất cả",
  selectedId: null,
};

const els = {
  totalCount: document.getElementById("totalCount"),
  readyCount: document.getElementById("readyCount"),
  verifyCount: document.getElementById("verifyCount"),
  resultCount: document.getElementById("resultCount"),
  searchInput: document.getElementById("searchInput"),
  cityFilter: document.getElementById("cityFilter"),
  layerFilter: document.getElementById("layerFilter"),
  statusFilter: document.getElementById("statusFilter"),
  resetButton: document.getElementById("resetButton"),
  list: document.getElementById("list"),
  detailPanel: document.getElementById("detailPanel"),
  detailContent: document.getElementById("detailContent"),
  closeDetail: document.getElementById("closeDetail"),
};

const map = L.map("map", {
  zoomControl: true,
  scrollWheelZoom: true,
  fadeAnimation: false,
  zoomAnimation: false,
  markerZoomAnimation: false,
  preferCanvas: true,
}).setView([15.9, 106.2], 6);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

const markerLayer = L.layerGroup().addTo(map);
const markers = new Map();

function uniqueOptions(key) {
  return ["Tất cả", ...new Set(centers.map((item) => item[key]).filter(Boolean).sort((a, b) => a.localeCompare(b, "vi")))];
}

function fillSelect(select, options) {
  select.innerHTML = options.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
}

function colorClass(item) {
  const layer = `${item.layer} ${item.color}`.toLowerCase();
  if (layer.includes("cam") || layer.includes("can thiệp")) return "orange";
  if (layer.includes("xanh lá") || layer.includes("hòa nhập")) return "green";
  if (layer.includes("đỏ") || layer.includes("chuyên biệt")) return "red";
  if (layer.includes("tím")) return "purple";
  return "blue";
}

function markerIcon(item) {
  return L.divIcon({
    className: "",
    html: `<span class="marker-dot ${colorClass(item)}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function filteredCenters() {
  const query = state.query.trim().toLowerCase();
  return centers.filter((item) => {
    const haystack = [item.name, item.city, item.district, item.address, item.type, item.layer, item.model, item.phone]
      .join(" ")
      .toLowerCase();
    return (
      (!query || haystack.includes(query)) &&
      (state.city === "Tất cả" || item.city === state.city) &&
      (state.layer === "Tất cả" || item.layer === state.layer) &&
      (state.status === "Tất cả" || item.status === state.status)
    );
  });
}

function render() {
  const filtered = filteredCenters();
  els.resultCount.textContent = `${filtered.length} kết quả`;
  renderList(filtered);
  renderMarkers(filtered);
}

function renderMarkers(items) {
  markerLayer.clearLayers();
  markers.clear();

  const bounds = [];
  items.forEach((item) => {
    const marker = L.marker([item.lat, item.lng], { icon: markerIcon(item), title: item.name });
    marker.on("click", () => selectCenter(item.id, true));
    marker.bindTooltip(item.name, { direction: "top", offset: [0, -8] });
    marker.addTo(markerLayer);
    markers.set(item.id, marker);
    bounds.push([item.lat, item.lng]);
  });

  if (bounds.length > 1) {
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 });
  } else if (bounds.length === 1) {
    map.setView(bounds[0], 14);
  }
  requestAnimationFrame(() => map.invalidateSize(false));
}

function renderList(items) {
  els.list.innerHTML = items
    .map(
      (item) => `
        <button class="place-item ${state.selectedId === item.id ? "active" : ""}" type="button" data-id="${escapeHtml(item.id)}">
          <span class="place-title">
            <strong>${escapeHtml(item.name)}</strong>
            <span class="badge ${item.status === "Ready" ? "ready" : "verify"}">${escapeHtml(item.status)}</span>
          </span>
          <span class="place-meta">${escapeHtml(item.city)}${item.district ? ` · ${escapeHtml(item.district)}` : ""} · ${escapeHtml(item.layer)}</span>
          <span class="place-address">${escapeHtml(item.address)}</span>
        </button>
      `
    )
    .join("");

  els.list.querySelectorAll(".place-item").forEach((button) => {
    button.addEventListener("click", () => selectCenter(button.dataset.id, true));
  });
}

function selectCenter(id, moveMap) {
  const item = centers.find((center) => center.id === id);
  if (!item) return;
  state.selectedId = id;
  renderList(filteredCenters());
  renderDetail(item);

  const marker = markers.get(id);
  if (moveMap) {
    map.setView([item.lat, item.lng], Math.max(map.getZoom(), 14), { animate: true });
  }
  if (marker) marker.openTooltip();
}

function renderDetail(item) {
  const statusClass = item.status === "Ready" ? "ready" : "verify";
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.lat},${item.lng}`)}`;
  const sourceLink = linkOrText(item.source, "Nguồn dữ liệu");
  const websiteLink = linkOrText(item.website, "Website/Facebook");

  els.detailPanel.classList.remove("hidden");
  els.detailContent.innerHTML = `
    <h2>${escapeHtml(item.name)}</h2>
    <p><span class="badge ${statusClass}">${escapeHtml(item.status)}</span></p>
    <div class="info-grid">
      ${infoRow("Loại", item.type || item.layer)}
      ${infoRow("Khu vực", [item.city, item.district].filter(Boolean).join(" · "))}
      ${infoRow("Địa chỉ", item.address)}
      ${infoRow("Điện thoại", item.phone)}
      ${infoRow("Độ tuổi", item.ages)}
      ${infoRow("Mô hình", item.model)}
      ${infoRow("Xác minh", item.verifyStatus)}
      ${infoRow("Ghi chú", item.note)}
    </div>
    <div class="detail-actions">
      <a href="${mapsUrl}" target="_blank" rel="noreferrer">Mở Google Maps</a>
      ${websiteLink}
      ${sourceLink}
    </div>
  `;
}

function infoRow(label, value) {
  if (!value) return "";
  return `<div class="info-row"><span>${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`;
}

function linkOrText(url, label) {
  if (!url) return "";
  const safeUrl = escapeHtml(url);
  return `<a href="${safeUrl}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function init() {
  fillSelect(els.cityFilter, uniqueOptions("city"));
  fillSelect(els.layerFilter, uniqueOptions("layer"));
  fillSelect(els.statusFilter, uniqueOptions("status"));

  els.totalCount.textContent = centers.length;
  els.readyCount.textContent = centers.filter((item) => item.status === "Ready").length;
  els.verifyCount.textContent = centers.filter((item) => item.status === "Need verify").length;

  els.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    render();
  });
  els.cityFilter.addEventListener("change", (event) => {
    state.city = event.target.value;
    render();
  });
  els.layerFilter.addEventListener("change", (event) => {
    state.layer = event.target.value;
    render();
  });
  els.statusFilter.addEventListener("change", (event) => {
    state.status = event.target.value;
    render();
  });
  els.resetButton.addEventListener("click", () => {
    state.query = "";
    state.city = "Tất cả";
    state.layer = "Tất cả";
    state.status = "Tất cả";
    els.searchInput.value = "";
    els.cityFilter.value = "Tất cả";
    els.layerFilter.value = "Tất cả";
    els.statusFilter.value = "Tất cả";
    render();
  });
  els.closeDetail.addEventListener("click", () => els.detailPanel.classList.add("hidden"));

  render();
}

init();
