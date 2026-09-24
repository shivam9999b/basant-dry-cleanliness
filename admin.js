/* =====================================================
   BASANTA DRY CLEANLINESS
   admin.js — COMPLETE ADMIN PANEL
===================================================== */


/* =====================================================
   SUPABASE CONFIG
===================================================== */

// TODO: अपने Supabase Dashboard से प्रोजेक्ट URL और ANON KEY यहाँ डालें
const SUPABASE_URL = "https://ubsyhqkefhtskxjpjzbf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVic3locWtlZmh0c2t4anBqemJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4Mzk4NjQsImV4cCI6MjEwNTQxNTg2NH0.00-JsYNjdmb7OV51Tly1W8A9grQ9GR9E66E3Yyas-j8";

const supabaseClient =
  (SUPABASE_URL &&
   SUPABASE_ANON_KEY &&
   SUPABASE_URL !== "YOUR_SUPABASE_URL" &&
   SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY" &&
   window.supabase)
    ? window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
      )
    : null;

if (!supabaseClient) {
  console.error("Supabase config missing. SUPABASE_URL और SUPABASE_ANON_KEY भरें।");
}


/* =====================================================
   DOM ELEMENTS
===================================================== */

const ordersContainer = document.getElementById("ordersContainer");
const refreshBtn = document.getElementById("refreshBtn");
const statusFilter = document.getElementById("statusFilter");

const totalOrders = document.getElementById("totalOrders");
const pendingOrders = document.getElementById("pendingOrders");
const pickupOrders = document.getElementById("pickupOrders");
const deliveredOrders = document.getElementById("deliveredOrders");


/* =====================================================
   MODAL ELEMENTS
===================================================== */

const orderModal = document.getElementById("orderModal");
const closeModal = document.getElementById("closeModal");
const modalOrderId = document.getElementById("modalOrderId");
const modalDetails = document.getElementById("modalDetails");
const statusSelect = document.getElementById("statusSelect");
const updateStatusBtn = document.getElementById("updateStatusBtn");
const updateMessage = document.getElementById("updateMessage");


/* =====================================================
   DATA STATE
===================================================== */

let allOrders = [];
let selectedOrder = null;


/* =====================================================
   STATUS LIST
===================================================== */

const STATUS_LIST = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "picked_up", label: "Picked Up" },
  { value: "cleaning", label: "Cleaning" },
  { value: "ready", label: "Ready" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" }
];


/* =====================================================
   INIT
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  loadOrders();
  setupEvents();
});


/* =====================================================
   EVENTS
===================================================== */

function setupEvents() {
  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadOrders);
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", renderFilteredOrders);
  }

  if (closeModal) {
    closeModal.addEventListener("click", closeOrderModal);
  }

  if (orderModal) {
    const overlay = orderModal.querySelector(".modal-overlay");
    if (overlay) {
      overlay.addEventListener("click", closeOrderModal);
    }
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeOrderModal();
    }
  });

  if (updateStatusBtn) {
    updateStatusBtn.addEventListener("click", updateOrderStatus);
  }
}


/* =====================================================
   LOAD ORDERS
===================================================== */

async function loadOrders() {
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.textContent = "Loading...";
  }

  if (ordersContainer) {
    ordersContainer.innerHTML = `
      <div class="loading">
        Orders loading...
      </div>
    `;
  }

  try {
    if (!supabaseClient) {
      showOrdersError("Supabase Credentials मिसिंग हैं। admin.js में सेट करें।");
      return;
    }

    const { data, error } = await supabaseClient
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("LOAD ORDERS ERROR:", error);
      showOrdersError(error.message);
      return;
    }

    allOrders = data || [];
    updateStats(allOrders);
    renderFilteredOrders();
  } catch (error) {
    console.error("LOAD ORDERS EXCEPTION:", error);
    showOrdersError("Orders load नहीं हो सके।");
  } finally {
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.textContent = "↻ Refresh";
    }
  }
}


/* =====================================================
   FILTER
===================================================== */

function renderFilteredOrders() {
  let orders = [...allOrders];
  const filter = statusFilter ? statusFilter.value : "all";

  if (filter && filter !== "all") {
    if (filter === "pickup") {
      orders = orders.filter(
        (order) => order.status === "picked_up" || order.status === "confirmed"
      );
    } else {
      orders = orders.filter((order) => order.status === filter);
    }
  }

  renderOrders(orders);
}


/* =====================================================
   RENDER ORDERS
===================================================== */

function renderOrders(orders) {
  if (!ordersContainer) return;

  if (!orders.length) {
    ordersContainer.innerHTML = `
      <div class="loading">
        कोई order नहीं मिला।
      </div>
    `;
    return;
  }

  ordersContainer.innerHTML = "";

  orders.forEach((order) => {
    const card = document.createElement("div");
    card.className = "admin-order-card";

    card.innerHTML = `
      <div class="order-card-top">
        <div>
          <span class="order-label">
            ORDER ID
          </span>
          <h3>
            ${escapeHTML(order.order_number || order.id || "-")}
          </h3>
        </div>
        <span class="order-status ${getStatusClass(order.status)}">
          ${escapeHTML(getStatusLabel(order.status))}
        </span>
      </div>

      <div class="order-card-info">
        <div>
          <small>Customer</small>
          <strong>${escapeHTML(order.customer_name || order.name || "-")}</strong>
        </div>

        <div>
          <small>Phone</small>
          <strong>${escapeHTML(order.phone || order.customer_phone || "-")}</strong>
        </div>

        <div>
          <small>Pickup</small>
          <strong>${escapeHTML(order.pickup_date || "-")}</strong>
        </div>

        <div>
          <small>Time</small>
          <strong>${escapeHTML(order.pickup_time || "-")}</strong>
        </div>
      </div>

      <div class="order-card-bottom">
        <span>
          ${escapeHTML(order.service_name || order.service || "Dry Cleaning")}
        </span>

        <button class="manage-order-btn" data-id="${escapeHTML(order.id)}">
          Manage Order
        </button>
      </div>
    `;

    ordersContainer.appendChild(card);
  });

  attachManageButtons();
}


/* =====================================================
   MANAGE BUTTONS
===================================================== */

function attachManageButtons() {
  const buttons = document.querySelectorAll(".manage-order-btn");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      openOrderModal(button.dataset.id);
    });
  });
}


/* =====================================================
   OPEN MODAL
===================================================== */

function openOrderModal(orderId) {
  selectedOrder = allOrders.find(
    (order) => String(order.id) === String(orderId)
  );

  if (!selectedOrder) {
    alert("Order नहीं मिला।");
    return;
  }

  if (modalOrderId) {
    modalOrderId.textContent = selectedOrder.order_number || `Order #${selectedOrder.id}`;
  }

  if (statusSelect) {
    statusSelect.value = normalizeStatus(selectedOrder.status);
  }

  if (modalDetails) {
    modalDetails.innerHTML = `
      <div class="detail-row">
        <span>Customer</span>
        <strong>${escapeHTML(selectedOrder.customer_name || selectedOrder.name || "-")}</strong>
      </div>

      <div class="detail-row">
        <span>Phone</span>
        <strong>${escapeHTML(selectedOrder.phone || selectedOrder.customer_phone || "-")}</strong>
      </div>

      <div class="detail-row">
        <span>Address</span>
        <strong>${escapeHTML(selectedOrder.address || selectedOrder.customer_address || "-")}</strong>
      </div>

      <div class="detail-row">
        <span>Pickup Date</span>
        <strong>${escapeHTML(selectedOrder.pickup_date || "-")}</strong>
      </div>

      <div class="detail-row">
        <span>Pickup Time</span>
        <strong>${escapeHTML(selectedOrder.pickup_time || "-")}</strong>
      </div>

      <div class="detail-row">
        <span>Service</span>
        <strong>${escapeHTML(selectedOrder.service_name || selectedOrder.service || "Dry Cleaning")}</strong>
      </div>
    `;
  }

  // =====================================================
  // UPDATED: CLOTH DETAILS / DESCRIPTION HANDLING LOGIC
  // =====================================================
  const clothTextElem = document.getElementById("clothDescriptionText");
  if (clothTextElem) {
    // 1. Check all possible column names from Supabase
    let clothVal = 
      selectedOrder.cloth_description ||
      selectedOrder.cloth_details ||
      selectedOrder.description ||
      selectedOrder.clothes ||
      selectedOrder.items_description ||
      selectedOrder.items;

    // 2. If data is an Array or Object (JSON format from order form)
    if (typeof clothVal === "object" && clothVal !== null) {
      if (Array.isArray(clothVal)) {
        clothVal = clothVal
          .map(i => typeof i === 'object' ? `${i.name || i.item || 'Item'} (x${i.quantity || i.qty || 1})` : i)
          .join(", ");
      } else {
        clothVal = JSON.stringify(clothVal, null, 2);
      }
    }

    // 3. Render exact value or fallback
    if (clothVal && String(clothVal).trim() !== "") {
      clothTextElem.innerText = String(clothVal);
    } else {
      clothTextElem.innerText = "No cloth description provided";
    }
  }

  if (updateMessage) {
    updateMessage.textContent = "";
  }

  if (orderModal) {
    orderModal.classList.add("show");
  }
}


/* =====================================================
   CLOSE MODAL
===================================================== */

function closeOrderModal() {
  if (!orderModal) return;

  orderModal.classList.remove("show");
  selectedOrder = null;
}


/* =====================================================
   UPDATE STATUS
===================================================== */

async function updateOrderStatus() {
  if (!selectedOrder) return;

  const newStatus = normalizeStatus(statusSelect.value);
  if (!newStatus) return;

  const oldText = updateStatusBtn.textContent;

  updateStatusBtn.disabled = true;
  updateStatusBtn.textContent = "Updating...";

  if (updateMessage) {
    updateMessage.textContent = "Status save हो रहा है...";
    updateMessage.style.color = "#176b52";
  }

  try {
    const { data, error } = await supabaseClient
      .from("orders")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", selectedOrder.id)
      .select("*");

    if (error) {
      console.error("UPDATE STATUS ERROR:", error);
      if (updateMessage) {
        updateMessage.textContent = "Status update नहीं हुआ: " + error.message;
        updateMessage.style.color = "#c0392b";
      }
      return;
    }

    if (!data || data.length === 0) {
      if (updateMessage) {
        updateMessage.textContent = "Update नहीं हुआ। Supabase RLS policy check करें।";
        updateMessage.style.color = "#c0392b";
      }
      return;
    }

    if (updateMessage) {
      updateMessage.textContent = "✓ Status successfully updated";
      updateMessage.style.color = "#176b52";
    }

    selectedOrder.status = data[0].status;
    selectedOrder.updated_at = data[0].updated_at;

    await loadOrders();

    const updatedOrder = allOrders.find(
      (order) => String(order.id) === String(selectedOrder.id)
    );

    if (updatedOrder) {
      selectedOrder = updatedOrder;
      if (statusSelect) {
        statusSelect.value = normalizeStatus(updatedOrder.status);
      }
    }
  } catch (error) {
    console.error("UPDATE STATUS EXCEPTION:", error);
    if (updateMessage) {
      updateMessage.textContent = "Technical error हुआ।";
      updateMessage.style.color = "#c0392b";
    }
  } finally {
    updateStatusBtn.disabled = false;
    updateStatusBtn.textContent = oldText;
  }
}


/* =====================================================
   DASHBOARD STATS
===================================================== */

function updateStats(orders) {
  const total = orders.length;

  const pending = orders.filter(
    (order) => normalizeStatus(order.status) === "pending"
  ).length;

  const pickup = orders.filter((order) => {
    const status = normalizeStatus(order.status);
    return status === "confirmed" || status === "picked_up";
  }).length;

  const delivered = orders.filter(
    (order) => normalizeStatus(order.status) === "delivered"
  ).length;

  if (totalOrders) totalOrders.textContent = total;
  if (pendingOrders) pendingOrders.textContent = pending;
  if (pickupOrders) pickupOrders.textContent = pickup;
  if (deliveredOrders) deliveredOrders.textContent = delivered;
}


/* =====================================================
   STATUS NORMALIZE
===================================================== */

function normalizeStatus(status) {
  if (!status) return "pending";

  const value = String(status)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (value === "delivery" || value === "delivered") return "delivered";
  if (value === "pickup" || value === "picked") return "picked_up";
  if (value === "pressing" || value === "press") return "cleaning";

  return value;
}


/* =====================================================
   STATUS LABEL
===================================================== */

function getStatusLabel(status) {
  const value = normalizeStatus(status);

  const labels = {
    pending: "Pending",
    confirmed: "Confirmed",
    picked_up: "Picked Up",
    cleaning: "Cleaning",
    ready: "Ready",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled"
  };

  return labels[value] || "Pending";
}


/* =====================================================
   STATUS CLASS
===================================================== */

function getStatusClass(status) {
  return "status-" + normalizeStatus(status);
}


/* =====================================================
   ERROR DISPLAY
===================================================== */

function showOrdersError(message) {
  if (!ordersContainer) return;

  ordersContainer.innerHTML = `
    <div class="loading">
      ❌ ${escapeHTML(message || "Orders load नहीं हो सके।")}
    </div>
  `;
}


/* =====================================================
   HTML ESCAPE (XSS PROTECTION)
===================================================== */

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
