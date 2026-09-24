/* =====================================================
   BASANTA DRY CLEANLINESS
   app.js (COMPLETE & FIXED)
===================================================== */


/* =====================================================
   SUPABASE CONFIG
===================================================== */

const SUPABASE_URL = "https://ubsyhqkefhtskxjpjzbf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVic3locWtlZmh0c2t4anBqemJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4Mzk4NjQsImV4cCI6MjEwNTQxNTg2NH0.00-JsYNjdmb7OV51Tly1W8A9grQ9GR9E66E3Yyas-j8";

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
  setupReviewForm();

  // Load Data
  loadServices();
  loadHomepageContent();
  loadContactInformation();
  loadArticles();
  loadFooterLinks();
  loadReviews();
});


/* =====================================================
   MOBILE MENU TOGGLE
===================================================== */

function setupMobileMenu() {
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileMenuBtn.classList.toggle("is-open");
      mobileMenu.classList.toggle("show");
      document.body.classList.toggle("mobile-menu-open");

      const isOpen = mobileMenu.classList.contains("show");
      mobileMenuBtn.setAttribute("aria-expanded", String(isOpen));
    });

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

    const phone = document.getElementById("contactPhone");
    const phoneLink = document.getElementById("contactPhoneLink");
    if (phone) phone.textContent = data.phone || "Not available";
    if (phoneLink && data.phone) phoneLink.href = "tel:" + String(data.phone).replace(/[^0-9+]/g, "");

    const whatsapp = document.getElementById("contactWhatsapp");
    const whatsappLink = document.getElementById("contactWhatsappLink");
    if (whatsapp) whatsapp.textContent = data.whatsapp || "Not available";
    if (whatsappLink && data.whatsapp) whatsappLink.href = "https://wa.me/" + String(data.whatsapp).replace(/[^0-9]/g, "");

    const email = document.getElementById("contactEmail");
    const emailLink = document.getElementById("contactEmailLink");
    if (email) email.textContent = data.email || "Not available";
    if (emailLink && data.email) emailLink.href = "mailto:" + data.email;

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
      const shortDescription =
        description.length > 150
          ? description.substring(0, 150) + "..."
          : description;

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

          <button
            type="button"
            class="article-read-btn"
            data-article-id="${escapeHTML(String(article.id))}"
          >
            Read More →
          </button>
        </div>
      `;

      articleGrid.appendChild(card);
    });

    document.querySelectorAll(".article-read-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const articleId = String(button.dataset.articleId);
        window.location.href = `article.html?id=${encodeURIComponent(articleId)}`;
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

    if (error || !data || !data.length) return;

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

  } catch (error) {
    console.error("Footer Links Exception:", error);
  }
}


/* =====================================================
   LOAD & SUBMIT REVIEWS
===================================================== */

async function loadReviews() {
  const reviewsGrid = document.getElementById("reviewsGrid");
  if (!reviewsGrid) return;

  if (!supabaseClient) {
    reviewsGrid.innerHTML = `<p class="empty-state">Abhi koi review uplabdh nahi hai.</p>`;
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("reviews")
      .select("*")
      .eq("approved", true)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      reviewsGrid.innerHTML = `<p class="empty-state">Abhi koi review uplabdh nahi hai.</p>`;
      return;
    }

    reviewsGrid.innerHTML = "";
    data.forEach((review) => {
      const card = document.createElement("div");
      card.className = "review-card";

      const ratingStars = "★".repeat(review.rating || 5) + "☆".repeat(5 - (review.rating || 5));

      card.innerHTML = `
        <div>
          <div class="review-stars">${ratingStars}</div>
          <p class="review-comment">"${escapeHTML(review.comment || "")}"</p>
        </div>
        <div>
          <div class="review-author">${escapeHTML(review.customer_name || "Customer")}</div>
          <span class="review-date">${formatArticleDate(review.created_at)}</span>
        </div>
      `;
      reviewsGrid.appendChild(card);
    });
  } catch (error) {
    console.error("Reviews Exception:", error);
  }
}

function setupReviewForm() {
  const reviewForm = document.getElementById("reviewForm");
  if (!reviewForm) return;

  reviewForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const nameInput = document.getElementById("reviewName");
    const commentInput = document.getElementById("reviewComment");
    const messageEl = document.getElementById("reviewMessage");

    const name = nameInput ? nameInput.value.trim() : "";
    const comment = commentInput ? commentInput.value.trim() : "";

const ratingInput = 
      reviewForm.querySelector('input[name="rating"]:checked') || 
      document.querySelector('input[name="rating"]:checked');

    if (!name) {
      if (messageEl) {
        messageEl.textContent = "Kripya apna naam dalein.";
        messageEl.style.color = "#c0392b";
      }
      return;
    }

    if (!ratingInput) {
      if (messageEl) {
        messageEl.textContent = "Kripya rating (stars) chunen.";
        messageEl.style.color = "#c0392b";
      }
      return;
    }

    if (!comment) {
      if (messageEl) {
        messageEl.textContent = "Kripya apna review ya comment likhein.";
        messageEl.style.color = "#c0392b";
      }
      return;
    }

    const rating = parseInt(ratingInput.value, 10);
    const submitBtn = reviewForm.querySelector('button[type="submit"]');

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";
    }

    if (!supabaseClient) {
      if (messageEl) {
        messageEl.textContent = "Review receive ho gaya hai. (Supabase not connected)";
        messageEl.style.color = "#176b52";
      }
      reviewForm.reset();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Review";
      }
      return;
    }

    try {
      const { error } = await supabaseClient.from("reviews").insert({
        customer_name: name,
        rating: rating,
        comment: comment,
        approved: false
      });

      if (error) {
        if (messageEl) {
          messageEl.textContent = "Review save nahi ho saka. Dobara koshish karein.";
          messageEl.style.color = "#c0392b";
        }
      } else {
        if (messageEl) {
          messageEl.textContent = "Shukriya! Aapka review admin approval ke baad show hoga.";
          messageEl.style.color = "#176b52";
        }
        reviewForm.reset();
      }
    } catch (err) {
      console.error("Review Submit Exception:", err);
      if (messageEl) {
        messageEl.textContent = "Technical problem hui.";
        messageEl.style.color = "#c0392b";
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Review";
      }
    }
  });
}


/* =====================================================
   SUBMIT BOOKING (FIXED WITH CLOTH DESCRIPTION)
===================================================== */

async function submitBooking(event) {
  event.preventDefault();

  const name = document.getElementById("customerName")?.value.trim();
  const phone = document.getElementById("customerPhone")?.value.trim();
  const address = document.getElementById("customerAddress")?.value.trim();
  const pickupDate = document.getElementById("pickupDate")?.value;
  const pickupTime = document.getElementById("pickupTime")?.value;

  // 🟢 FIXED: Cloth Description/Details Fetch Logic
  const clothDescription = 
    document.getElementById("clothDescription")?.value.trim() || 
    document.getElementById("clothDetails")?.value.trim() || 
    document.getElementById("cloth_description")?.value.trim() ||
    document.getElementById("serviceType")?.value || "";

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
    // 🟢 FIXED: cloth_description & cloth_details dono column me value pass karein
    const result = await supabaseClient
      .from("orders")
      .insert({
        customer_name: name,
        phone: phone,
        address: address,
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        cloth_description: clothDescription,
        cloth_details: clothDescription,
        status: "pending"
      })
      .select("id, order_number")
      .single();

    if (result.error || !result.data) {
      console.error("Supabase Save Error:", result.error);
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
