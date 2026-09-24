/* =====================================================
   BASANTA DRY CLEANLINESS
   app.js (COMPLETE & UPDATED)
===================================================== */


/* =====================================================
   SUPABASE CONFIG
===================================================== */

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

let supabaseClient = null;


/* =====================================================
   HELPER UTILITIES
===================================================== */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeCSSURL(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}

function formatPrice(price) {
  const number = Number(price);
  if (Number.isNaN(number)) return "0";
  return number.toLocaleString("en-IN");
}

function formatArticleDate(date) {
  if (!date) return "";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "";
  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}


/* =====================================================
   SUPABASE INITIALIZE
===================================================== */

function initSupabase() {
  try {
    if (typeof window.supabase === "undefined") {
      console.warn("Supabase library nahi mili.");
      return null;
    }

    if (
      !SUPABASE_URL ||
      !SUPABASE_ANON_KEY ||
      SUPABASE_URL === "YOUR_SUPABASE_URL" ||
      SUPABASE_ANON_KEY === "YOUR_SUPABASE_ANON_KEY"
    ) {
      console.warn("Supabase URL / ANON KEY abhi set nahi hai.");
      return null;
    }

    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (error) {
    console.error("Supabase initialization error:", error);
    return null;
  }
}


/* =====================================================
   DOM GLOBALS
===================================================== */

let serviceGrid;
let bookingModal;
let bookingForm;
let bookingMessage;


/* =====================================================
   INIT ON DOM LOAD
===================================================== */

document.addEventListener("DOMContentLoaded", function () {
  serviceGrid = document.getElementById("serviceGrid");
  bookingModal = document.getElementById("bookingModal");
  bookingForm = document.getElementById("bookingForm");
  bookingMessage = document.getElementById("bookingMessage");

  // Init Supabase Client
  supabaseClient = initSupabase();

  // Setup UI Events
  setupMobileMenu();
  setupButtons();
  setupModal();
  setMinimumDate();
  setupExtraButtons();

  // Load Data
  loadServices();
  loadHomepageContent();
  loadContactInformation();
  loadArticles();
  loadFooterLinks();
});


/* =====================================================
   MOBILE MENU TOGGLE (UPDATED FOR YOUR CSS)
===================================================== */

function setupMobileMenu() {
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      // Button animation aur Menu show toggle
      mobileMenuBtn.classList.toggle("is-open");
      mobileMenu.classList.toggle("show");
      document.body.classList.toggle("mobile-menu-open");

      const isOpen = mobileMenu.classList.contains("show");
      mobileMenuBtn.setAttribute("aria-expanded", String(isOpen));
    });

    // Jab kisi link par click ho toh menu close ho jaye
    const mobileLinks = mobileMenu.querySelectorAll("a, button");
    mobileLinks.forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenuBtn.classList.remove("is-open");
        mobileMenu.classList.remove("show");
        document.body.classList.remove("mobile-menu-open");
        mobileMenuBtn.setAttribute("aria-expanded", "false");
      });
    });
  } else {
    console.warn("Mobile menu elements (mobileMenuBtn ya mobileMenu) HTML me nahi mile!");
  }
}


/* =====================================================
   BUTTONS
===================================================== */

function setupButtons() {
  const buttonIds = [
    "bookTopBtn",
    "bookHeroBtn",
    "quickPickupBtn",
    "bookCtaBtn",
    "mobileBookBtn"
  ];

  buttonIds.forEach(function (id) {
    const button = document.getElementById(id);
    if (button) {
      button.addEventListener("click", openBookingModal);
    }
  });

  const allServicesBtn = document.getElementById("allServicesBtn");
  if (allServicesBtn) {
    allServicesBtn.addEventListener("click", function () {
      const section = document.getElementById("services");
      if (section) section.scrollIntoView({ behavior: "smooth" });
    });
  }
}


/* =====================================================
   EXTRA BUTTONS
===================================================== */

function setupExtraButtons() {
  const viewPricesBtn = document.getElementById("viewPricesBtn");
  if (viewPricesBtn) {
    viewPricesBtn.addEventListener("click", function () {
      const priceSection = document.getElementById("pricing");
      if (priceSection) priceSection.scrollIntoView({ behavior: "smooth" });
    });
  }

  const trackOrderBtns = document.querySelectorAll(".track-order-btn, #trackOrderBtn");
  trackOrderBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      if (btn.tagName !== "A") {
        e.preventDefault();
        window.location.href = "track.html";
      }
    });
  });
}


/* =====================================================
   MODAL SETUP & OPEN / CLOSE
===================================================== */

function setupModal() {
  const closeModalBtn = document.getElementById("closeModal");
  const overlay = document.querySelector(".modal-overlay");

  if (closeModalBtn) closeModalBtn.addEventListener("click", closeBookingModal);
  if (overlay) overlay.addEventListener("click", closeBookingModal);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && bookingModal && bookingModal.classList.contains("show")) {
      closeBookingModal();
    }
  });

  if (bookingForm) {
    bookingForm.addEventListener("submit", submitBooking);
  }
}

function openBookingModal() {
  if (!bookingModal) return;
  bookingModal.classList.add("show", "open");
  bookingModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  // Agar mobile menu open tha toh close kar do
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.classList.remove("is-open");
    mobileMenu.classList.remove("show");
  }

  const nameInput = document.getElementById("customerName");
  if (nameInput) setTimeout(() => nameInput.focus(), 100);
}

function closeBookingModal() {
  if (!bookingModal) return;
  bookingModal.classList.remove("show", "open");
  bookingModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  if (bookingMessage) bookingMessage.textContent = "";
}


/* =====================================================
   DATE MINIMUM
===================================================== */

function setMinimumDate() {
  const input = document.getElementById("pickupDate");
  if (!input) return;

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  input.min = `${year}-${month}-${day}`;
}


/* =====================================================
   LOAD SERVICES
===================================================== */

async function loadServices() {
  if (!serviceGrid) return;
  if (!supabaseClient) {
    serviceGrid.innerHTML = `<div class="service-loading">Abhi services uplabdh nahi hain. (Supabase Not Connected)</div>`;
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("services")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) {
      serviceGrid.innerHTML = `<div class="service-loading">Abhi koi service uplabdh nahi hai.</div>`;
      return;
    }

    serviceGrid.innerHTML = "";
    data.forEach((service) => {
      const card = document.createElement("article");
      card.className = "service-card";
      const serviceImage = service.image_url
        ? `<img class="service-image" src="${escapeHTML(service.image_url)}" alt="${escapeHTML(service.name || "Service")}" loading="lazy">`
        : `<div class="service-icon">${escapeHTML(service.icon || "🧺")}</div>`;

      card.innerHTML = `
        ${serviceImage}
        <h3>${escapeHTML(service.name || "Service")}</h3>
        <p>${escapeHTML(service.description || "")}</p>
        <span class="service-price">From ₹${formatPrice(service.price)}</span>
      `;
      serviceGrid.appendChild(card);
    });
  } catch (error) {
    console.error("Services Exception:", error);
  }
}


/* =====================================================
   LOAD HOMEPAGE CONTENT
===================================================== */

async function loadHomepageContent() {
  if (!supabaseClient) return;

  try {
    const { data, error } = await supabaseClient
      .from("homepage_content")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return;

    const title = document.getElementById("heroTitle");
    if (title) {
      const titleText = data.title || "Fresh Clothes.";
      const subtitleText = data.subtitle || "Fresh Confidence.";
      title.innerHTML = `${escapeHTML(titleText)} <span>${escapeHTML(subtitleText)}</span>`;
    }

    const badge = document.querySelector(".hero-content .badge");
    if (badge && data.badge) badge.textContent = data.badge;

    const description = document.getElementById("heroDescription");
    if (description && data.description) description.textContent = data.description;

    const heroButton = document.getElementById("bookHeroBtn");
    if (heroButton && data.button_text) {
      const btnText = document.getElementById("heroButtonText");
      if (btnText) btnText.textContent = data.button_text;
      else heroButton.textContent = data.button_text + " →";
    }

    if (heroButton && data.button_link) {
      heroButton.onclick = function () {
        const link = String(data.button_link).trim();
        if (!link || link === "#booking") {
          openBookingModal();
          return;
        }
        if (link.startsWith("#")) {
          const target = document.querySelector(link);
          if (target) target.scrollIntoView({ behavior: "smooth" });
        } else {
          window.location.href = link;
        }
      };
    }

    if (data.image_url) {
      const image = document.getElementById("heroImage");
      if (image) {
        image.style.backgroundImage = `url("${escapeCSSURL(data.image_url)}")`;
        image.style.backgroundSize = "cover";
        image.style.backgroundPosition = "center";
        image.style.backgroundRepeat = "no-repeat";
      }

      const heroImg = document.querySelector(".basanta-hero-img");
      if (heroImg) heroImg.src = data.image_url;
    }
  } catch (error) {
    console.error("Homepage Exception:", error);
  }
}


/* =====================================================
   LOAD CONTACT INFORMATION
===================================================== */

async function loadContactInformation() {
  if (!supabaseClient) {
    showContactError();
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("contact_information")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      showContactError();
      return;
    }

    // Phone
    const phone = document.getElementById("contactPhone");
    const phoneLink = document.getElementById("contactPhoneLink");
    if (phone) phone.textContent = data.phone || "Not available";
    if (phoneLink && data.phone) phoneLink.href = "tel:" + String(data.phone).replace(/[^0-9+]/g, "");

    // WhatsApp
    const whatsapp = document.getElementById("contactWhatsapp");
    const whatsappLink = document.getElementById("contactWhatsappLink");
    if (whatsapp) whatsapp.textContent = data.whatsapp || "Not available";
    if (whatsappLink && data.whatsapp) whatsappLink.href = "https://wa.me/" + String(data.whatsapp).replace(/[^0-9]/g, "");

    // Email
    const email = document.getElementById("contactEmail");
    const emailLink = document.getElementById("contactEmailLink");
    if (email) email.textContent = data.email || "Not available";
    if (emailLink && data.email) emailLink.href = "mailto:" + data.email;

    // Address & Socials
    const address = document.getElementById("contactAddress");
    if (address) address.textContent = data.address || "Address not available";

    const instagramLink = document.getElementById("contactInstagramLink");
    if (instagramLink) instagramLink.href = data.instagram || "#";

    const facebookLink = document.getElementById("contactFacebookLink");
    if (facebookLink) facebookLink.href = data.facebook || "#";

  } catch (error) {
    console.error("Contact Exception:", error);
    showContactError();
  }
}

function showContactError() {
  ["contactPhone", "contactWhatsapp", "contactEmail", "contactAddress"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = "Not available";
  });
}


/* =====================================================
   LOAD ARTICLES
===================================================== */

async function loadArticles() {
  const articleGrid = document.getElementById("articleGrid");
  if (!articleGrid) return;
  if (!supabaseClient) {
    articleGrid.innerHTML = `<p class="empty-state">Abhi koi published article uplabdh nahi hai.</p>`;
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("articles")
      .select("id, title, slug, description, content, image_url, category, author, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      articleGrid.innerHTML = `<p class="empty-state">Abhi koi published article uplabdh nahi hai.</p>`;
      return;
    }

    articleGrid.innerHTML = "";
    data.forEach((article) => {
      const card = document.createElement("article");
      card.className = "article-card";
      let imageHTML = `<div class="article-image-placeholder">📰</div>`;
      if (article.image_url) {
        imageHTML = `<img src="${escapeHTML(article.image_url)}" alt="${escapeHTML(article.title)}" loading="lazy">`;
      }
      const description = article.description || article.content || "";
      const shortDescription = description.length > 150 ? description.substring(0, 150) + "..." : description;

      card.innerHTML = `
        <div class="article-image">${imageHTML}</div>
        <div class="article-content">
          ${article.category ? `<span class="article-category">${escapeHTML(article.category)}</span>` : ""}
          <h3>${escapeHTML(article.title || "Untitled")}</h3>
          <p>${escapeHTML(shortDescription)}</p>
          <div class="article-meta">
            <span>${escapeHTML(article.author || "Basanta")}</span>
            <span>${formatArticleDate(article.created_at)}</span>
          </div>
          <button type="button" class="article-read-btn" data-article-id="${escapeHTML(String(article.id))}">Read More →</button>
        </div>
      `;
      articleGrid.appendChild(card);
    });

    document.querySelectorAll(".article-read-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const articleId = String(button.dataset.articleId);
        const article = data.find((item) => String(item.id) === articleId);
        if (article) window.location.href = `article.html?slug=${encodeURIComponent(article.slug || article.id)}`;
      });
    });
  } catch (error) {
    console.error("Articles Exception:", error);
  }
}


/* =====================================================
   LOAD FOOTER LINKS
===================================================== */

async function loadFooterLinks() {
  const footerColumns = document.querySelectorAll(".footer .footer-column");
  if (!footerColumns.length || !supabaseClient) return;

  try {
    const { data, error } = await supabaseClient
      .from("footer_links")
      .select("section, title, url, active, sort_order")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Footer Links Exception:", error);
      return;
    }

    if (!data || !data.length) return;

    const groups = {};
    data.forEach((link) => {
      const section = link.section || "Company";
      if (!groups[section]) groups[section] = [];
      groups[section].push(link);
    });

    footerColumns.forEach((column) => {
      const heading = column.querySelector("h4");
      if (!heading) return;

      const section = heading.textContent.trim();
      if (!groups[section]) return;

      column.innerHTML = `<h4>${escapeHTML(section)}</h4>`;

      groups[section].forEach((link) => {
        const a = document.createElement("a");
        a.href = link.url || "#";
        a.textContent = link.title || "Link";

        if (/^https?:\/\//i.test(link.url || "")) {
          a.target = "_blank";
          a.rel = "noopener noreferrer";
        }

        column.appendChild(a);
      });
    });

    console.log("Footer links loaded successfully.");
  } catch (error) {
    console.error("Footer Links Exception:", error);
  }
}


/* =====================================================
   SUBMIT BOOKING
===================================================== */

async function submitBooking(event) {
  event.preventDefault();

  const name = document.getElementById("customerName")?.value.trim();
  const phone = document.getElementById("customerPhone")?.value.trim();
  const address = document.getElementById("customerAddress")?.value.trim();
  const pickupDate = document.getElementById("pickupDate")?.value;
  const pickupTime = document.getElementById("pickupTime")?.value;

  if (!name) return showMessage("Kripya apna naam dalein.", true);
  if (!phone || !/^[6-9]\d{9}$/.test(phone)) return showMessage("Sahi 10 digit mobile number dalein.", true);
  if (!address) return showMessage("Pickup address dalein.", true);
  if (!pickupDate) return showMessage("Pickup date chunen.", true);
  if (!pickupTime) return showMessage("Pickup time chunen.", true);

  const button = bookingForm?.querySelector('button[type="submit"]');
  if (!button) return;

  const oldText = button.textContent;
  button.disabled = true;
  button.textContent = "Booking ho rahi hai...";

  if (!supabaseClient) {
    setTimeout(() => {
      showMessage(`Shukriya ${name}! Booking receive ho gayi hai.`, false);
      button.disabled = false;
      button.textContent = oldText;
      bookingForm.reset();
      setTimeout(closeBookingModal, 2500);
    }, 1000);
    return;
  }

  try {
    const result = await supabaseClient
      .from("orders")
      .insert({
        customer_name: name,
        phone: phone,
        address: address,
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        status: "pending"
      })
      .select("id, order_number")
      .single();

    if (result.error || !result.data) {
      showMessage("Booking save nahi hui. Supabase check karein.", true);
      button.disabled = false;
      button.textContent = oldText;
      return;
    }

    const orderId = result.data.order_number || result.data.id;
    window.location.href = `success.html?order=${encodeURIComponent(orderId)}`;
  } catch (error) {
    console.error("Booking Exception:", error);
    showMessage("Technical problem hui.", true);
    button.disabled = false;
    button.textContent = oldText;
  }
}

function showMessage(message, error = false) {
  if (!bookingMessage) return;
  bookingMessage.textContent = message;
  bookingMessage.style.color = error ? "#c0392b" : "#176b52";
}


/* =====================================================
   GLOBAL ERROR LOG
===================================================== */
window.addEventListener("error", function (event) {
  console.error("Website Error:", event.error || event.message);
});
