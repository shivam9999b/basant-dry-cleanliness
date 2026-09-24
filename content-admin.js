/* =========================================================
   BASANTA DRY CLEANLINESS
   CONTENT ADMIN JS
   Homepage + Articles + Contact + Services
========================================================= */

"use strict";

/* =========================================================
   SUPABASE CONFIG
========================================================= */

const SUPABASE_URL = "https://ubsyhqkefhtskxjpjzbf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVic3locWtlZmh0c2t4anBqemJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4Mzk4NjQsImV4cCI6MjEwNTQxNTg2NH0.00-JsYNjdmb7OV51Tly1W8A9grQ9GR9E66E3Yyas-j8";

const supabaseClient = (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Supabase config missing: SUPABASE_URL और SUPABASE_ANON_KEY भरें।");
}


/* =========================================================
   HELPERS
========================================================= */

function $(id) {
  return document.getElementById(id);
}

function setMessage(id, message, success = true) {
  const el = $(id);

  if (!el) return;

  el.textContent = message;
  el.style.color = success ? "green" : "red";
}

function escapeHTML(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  console.log("Basanta Content Admin Loaded");

  if (!supabaseClient) {
    console.error("Supabase config missing. app/admin JS में URL और anon key डालें।");
    return;
  }

  await loadHomepage();
  await loadContact();
  await loadArticles();
  await loadServices();

  setupHomepage();
  setupArticles();
  setupContact();
  setupServices();

  loadFooterLinks();

});


/* =========================================================
   HOMEPAGE
========================================================= */

async function loadHomepage() {

  try {

    const { data, error } = await supabaseClient
      .from("homepage_content")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Homepage load error:", error);
      return;
    }

    if (!data) return;

    if ($("heroTitle"))
      $("heroTitle").value = data.title || "";

    if ($("heroSubtitle"))
      $("heroSubtitle").value = data.subtitle || "";

    if ($("heroDescription"))
      $("heroDescription").value = data.description || "";

    if ($("heroButton"))
      $("heroButton").value = data.button_text || "";

    if ($("heroButtonLink"))
      $("heroButtonLink").value = data.button_link || "";

    if ($("heroImage")) {
      $("heroImage").value = data.image_url || "";
      showImagePreview(
        "heroImagePreview",
        data.image_url
      );
    }

  } catch (error) {

    console.error("Homepage error:", error);

  }

}


function setupHomepage() {

  const form = $("heroForm");

  if (form) {

    form.addEventListener("submit", async (e) => {

      e.preventDefault();

      const payload = {

        title: $("heroTitle")?.value.trim() || "",

        subtitle:
          $("heroSubtitle")?.value.trim() || "",

        description:
          $("heroDescription")?.value.trim() || "",

        button_text:
          $("heroButton")?.value.trim() || "",

        button_link:
          $("heroButtonLink")?.value.trim() || "",

        image_url:
          $("heroImage")?.value.trim() || ""

      };


      const { data: existing } = await supabaseClient
        .from("homepage_content")
        .select("id")
        .limit(1)
        .maybeSingle();


      let result;


      if (existing?.id) {

        result = await supabaseClient
          .from("homepage_content")
          .update(payload)
          .eq("id", existing.id);

      } else {

        result = await supabaseClient
          .from("homepage_content")
          .insert(payload);

      }


      if (result.error) {

        console.error(result.error);

        setMessage(
          "heroMessage",
          "Homepage save error: " +
            result.error.message,
          false
        );

        return;

      }


      setMessage(
        "heroMessage",
        "Homepage saved successfully."
      );

    });

  }


  /* HERO IMAGE */

  const uploadBtn = $("heroUploadBtn");

  if (uploadBtn) {

    uploadBtn.addEventListener("click", async () => {

      const file = $("heroImageFile")?.files?.[0];

      if (!file) {

        setMessage(
          "imageUploadMessage",
          "पहले image select करें।",
          false
        );

        return;

      }


      const url = await uploadImage(
        file,
        "hero"
      );


      if (url) {

        if ($("heroImage"))
          $("heroImage").value = url;

        showImagePreview(
          "heroImagePreview",
          url
        );

        setMessage(
          "imageUploadMessage",
          "Image uploaded successfully."
        );

      }

    });

  }

}


/* =========================================================
   IMAGE UPLOAD
========================================================= */

async function uploadImage(file, folder) {

  try {

    const extension =
      file.name.split(".").pop().toLowerCase();

    const fileName =
      folder +
      "/" +
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .substring(2) +
      "." +
      extension;


    const { error } =
      await supabaseClient.storage
        .from("website-image")
        .upload(
          fileName,
          file,
          {
            cacheControl: "3600",
            upsert: false
          }
        );


    if (error) {

      console.error(
        "Storage upload error:",
        error
      );

      alert(
        "Image upload failed:\n" +
        error.message
      );

      return null;

    }


    const { data } =
      supabaseClient.storage
        .from("website-image")
        .getPublicUrl(fileName);


    return data.publicUrl;

  } catch (error) {

    console.error(error);

    return null;

  }

}


function showImagePreview(elementId, url) {

  const el = $(elementId);

  if (!el) return;


  if (!url) {

    el.innerHTML =
      "<span>No image selected</span>";

    return;

  }


  el.innerHTML = `
    <img
      src="${escapeHTML(url)}"
      alt="Preview"
      style="
        max-width:100%;
        max-height:220px;
        object-fit:cover;
        border-radius:10px;
      "
    >
  `;

}


/* =========================================================
   ARTICLES
========================================================= */

async function loadArticles() {

  const list = $("articlesList");

  if (!list) return;


  const { data, error } = await supabaseClient
    .from("articles")
    .select("*")
    .order("created_at", {
      ascending: false
    });


  if (error) {

    console.error(error);

    list.innerHTML =
      "<p>Articles load नहीं हो सके।</p>";

    return;

  }


  if (!data || data.length === 0) {

    list.innerHTML =
      "<p>No articles found.</p>";

    return;

  }


  list.innerHTML = data.map(article => `

    <div class="article-admin-card">

      <div>

        <h3>
          ${escapeHTML(article.title)}
        </h3>

        <p>
          ${escapeHTML(article.category || "")}
        </p>

        <small>
          ${article.published ? "Published" : "Draft"}
        </small>

      </div>

      <div>

        <button
          type="button"
          onclick="editArticle('${article.id}')"
        >
          Edit
        </button>

        <button
          type="button"
          onclick="deleteArticle('${article.id}')"
        >
          Delete
        </button>

      </div>

    </div>

  `).join("");

}


function setupArticles() {

  $("newArticleBtn")?.addEventListener(
    "click",
    newArticle
  );


  $("closeEditorBtn")?.addEventListener(
    "click",
    closeArticleEditor
  );


  $("cancelArticleBtn")?.addEventListener(
    "click",
    closeArticleEditor
  );


  $("articleForm")?.addEventListener(
    "submit",
    saveArticle
  );


  $("articleUploadBtn")?.addEventListener(
    "click",
    async () => {

      const file =
        $("articleImageFile")?.files?.[0];

      if (!file) {

        alert("पहले article image select करें।");

        return;

      }


      const url = await uploadImage(
        file,
        "articles"
      );


      if (url) {

        $("articleImage").value = url;

        showImagePreview(
          "articleImagePreview",
          url
        );

      }

    }
  );

}


function newArticle() {

  $("articleEditor").hidden = false;

  $("editorTitle").textContent =
    "New Article";


  $("articleId").value = "";

  $("articleTitle").value = "";

  $("articleSlug").value = "";

  $("articleCategory").value = "";

  $("articleDescription").value = "";

  $("articleImage").value = "";

  $("articleContent").value = "";

  $("articleAuthor").value = "Basanta";

  $("articlePublished").checked = true;


  showImagePreview(
    "articleImagePreview",
    ""
  );

}


async function editArticle(id) {

  const { data, error } =
    await supabaseClient
      .from("articles")
      .select("*")
      .eq("id", id)
      .single();


  if (error) {

    alert(error.message);

    return;

  }


  $("articleEditor").hidden = false;

  $("editorTitle").textContent =
    "Edit Article";


  $("articleId").value =
    data.id || "";

  $("articleTitle").value =
    data.title || "";

  $("articleSlug").value =
    data.slug || "";

  $("articleCategory").value =
    data.category || "";

  $("articleDescription").value =
    data.description || "";

  $("articleImage").value =
    data.image_url || "";

  $("articleContent").value =
    data.content || "";

  $("articleAuthor").value =
    data.author || "Basanta";

  $("articlePublished").checked =
    data.published !== false;


  showImagePreview(
    "articleImagePreview",
    data.image_url
  );


  window.scrollTo({
    top: $("articleEditor").offsetTop - 20,
    behavior: "smooth"
  });

}


async function saveArticle(e) {

  e.preventDefault();


  const id =
    $("articleId").value.trim();


  const payload = {

    title:
      $("articleTitle").value.trim(),

    slug:
      $("articleSlug").value.trim(),

    category:
      $("articleCategory").value.trim(),

    description:
      $("articleDescription").value.trim(),

    image_url:
      $("articleImage").value.trim(),

    content:
      $("articleContent").value.trim(),

    author:
      $("articleAuthor").value.trim() ||
      "Basanta",

    published:
      $("articlePublished").checked

  };


  let result;


  if (id) {

    result = await supabaseClient
      .from("articles")
      .update(payload)
      .eq("id", id);

  } else {

    result = await supabaseClient
      .from("articles")
      .insert(payload);

  }


  if (result.error) {

    console.error(result.error);

    setMessage(
      "articleMessage",
      result.error.message,
      false
    );

    return;

  }


  setMessage(
    "articleMessage",
    "Article saved successfully."
  );


  await loadArticles();


  setTimeout(
    closeArticleEditor,
    500
  );

}


async function deleteArticle(id) {

  if (!confirm("Article delete करें?")) return;


  const { error } =
    await supabaseClient
      .from("articles")
      .delete()
      .eq("id", id);


  if (error) {

    alert(
      "Delete failed: " +
      error.message
    );

    return;

  }


  await loadArticles();

}


function closeArticleEditor() {

  if ($("articleEditor"))
    $("articleEditor").hidden = true;

}


/* =========================================================
   CONTACT
========================================================= */

async function loadContact() {

  const { data, error } =
    await supabaseClient
      .from("contact_information")
      .select("*")
      .limit(1)
      .maybeSingle();


  if (error) {

    console.error(
      "Contact load error:",
      error
    );

    return;

  }


  if (!data) return;


  if ($("contactPhone"))
    $("contactPhone").value =
      data.phone || "";

  if ($("contactWhatsapp"))
    $("contactWhatsapp").value =
      data.whatsapp || "";

  if ($("contactEmail"))
    $("contactEmail").value =
      data.email || "";

  if ($("contactAddress"))
    $("contactAddress").value =
      data.address || "";

  if ($("contactInstagram"))
    $("contactInstagram").value =
      data.instagram || "";

  if ($("contactFacebook"))
    $("contactFacebook").value =
      data.facebook || "";

}


function setupContact() {

  $("contactForm")?.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();


      const payload = {

        phone:
          $("contactPhone")?.value.trim() || "",

        whatsapp:
          $("contactWhatsapp")?.value.trim() || "",

        email:
          $("contactEmail")?.value.trim() || "",

        address:
          $("contactAddress")?.value.trim() || "",

        instagram:
          $("contactInstagram")?.value.trim() || "",

        facebook:
          $("contactFacebook")?.value.trim() || ""

      };


      const { data: existing } =
        await supabaseClient
          .from("contact_information")
          .select("id")
          .limit(1)
          .maybeSingle();


      let result;


      if (existing?.id) {

        result =
          await supabaseClient
            .from("contact_information")
            .update(payload)
            .eq("id", existing.id);

      } else {

        result =
          await supabaseClient
            .from("contact_information")
            .insert(payload);

      }


      if (result.error) {

        console.error(result.error);

        setMessage(
          "contactMessage",
          result.error.message,
          false
        );

        return;

      }


      setMessage(
        "contactMessage",
        "Contact information saved successfully."
      );

    }
  );

}


/* =========================================================
   SERVICES MANAGEMENT
========================================================= */

async function loadServices() {

  const list = $("servicesList");

  if (!list) return;


  const { data, error } =
    await supabaseClient
      .from("services")
      .select("*")
      .order("sort_order", {
        ascending: true
      });


  if (error) {

    console.error(
      "Services load error:",
      error
    );

    list.innerHTML = `
      <p style="color:red">
        Services load error:
        ${escapeHTML(error.message)}
      </p>
    `;

    return;

  }


  if (!data || data.length === 0) {

    list.innerHTML = `
      <p>
        कोई service नहीं है।
      </p>
    `;

    return;

  }


  list.innerHTML = data.map(service => `

    <div
      class="service-admin-card"
      data-id="${service.id}"
    >

      <div class="service-admin-image">

        ${
          service.image_url
          ?
          `<img
            src="${escapeHTML(service.image_url)}"
            alt="${escapeHTML(service.name)}"
          >`
          :
          `<span>
            ${escapeHTML(service.icon || "🧺")}
          </span>`
        }

      </div>


      <div class="service-admin-info">

        <h3>
          ${escapeHTML(service.name)}
        </h3>

        <p>
          ${escapeHTML(service.description || "")}
        </p>

        <strong>
          ₹${escapeHTML(service.price ?? 0)}
        </strong>

        <small>
          ${
            service.active
            ? "● Active"
            : "● Inactive"
          }
        </small>

        <small>
          Order: ${escapeHTML(service.sort_order ?? 0)}
        </small>

      </div>


      <div class="service-admin-actions">

        <button
          type="button"
          onclick="editService('${service.id}')"
        >
          ✏️ Edit
        </button>


        <button
          type="button"
          onclick="toggleService('${service.id}', ${service.active})"
        >
          ${
            service.active
            ? "⏸ Disable"
            : "▶ Enable"
          }
        </button>


        <button
          type="button"
          onclick="deleteService('${service.id}')"
        >
          🗑️ Delete
        </button>

      </div>

    </div>

  `).join("");

}


/* =========================================================
   SERVICE FORM SETUP
========================================================= */

function setupServices() {

  $("newServiceBtn")?.addEventListener(
    "click",
    newService
  );


  $("serviceForm")?.addEventListener(
    "submit",
    saveService
  );


  $("cancelServiceBtn")?.addEventListener(
    "click",
    closeServiceEditor
  );

  $("closeServiceEditorBtn")?.addEventListener(
    "click",
    closeServiceEditor
  );


  $("serviceUploadBtn")?.addEventListener(
    "click",
    async () => {

      const file =
        $("serviceImageFile")?.files?.[0];

      if (!file) {

       alert(
          "पहले service image select करें।"
        );

        return;

      }


      const url =
        await uploadImage(
          file,
          "services"
        );


      if (url) {

        $("serviceImage").value = url;

        showImagePreview(
          "serviceImagePreview",
          url
        );

      }

    }
  );

}

/* =========================================================
   NEW SERVICE
========================================================= */

function newService() {

  if (!$("serviceEditor")) return;


  $("serviceEditor").hidden = false;


  if ($("serviceEditorTitle"))
    $("serviceEditorTitle").textContent =
      "New Service";


  $("serviceId").value = "";

  $("serviceName").value = "";

  $("serviceDescription").value = "";

  $("servicePrice").value = "";

  $("serviceIcon").value = "🧺";

  $("serviceImage").value = "";

  $("serviceActive").checked = true;

  $("serviceSortOrder").value = "0";


  showImagePreview(
    "serviceImagePreview",
    ""
  );


  $("serviceEditor").scrollIntoView({
    behavior: "smooth"
  });

}


/* =========================================================
   EDIT SERVICE
========================================================= */

async function editService(id) {

  const { data, error } =
    await supabaseClient
      .from("services")
      .select("*")
      .eq("id", id)
      .single();


  if (error) {

    alert(
      "Service load failed: " +
      error.message
    );

    return;

  }


  $("serviceEditor").hidden = false;


  if ($("serviceEditorTitle"))
    $("serviceEditorTitle").textContent =
      "Edit Service";


  $("serviceId").value =
    data.id || "";

  $("serviceName").value =
    data.name || "";

  $("serviceDescription").value =
    data.description || "";

  $("servicePrice").value =
    data.price ?? "";

  $("serviceIcon").value =
    data.icon || "🧺";

  $("serviceImage").value =
    data.image_url || "";

  $("serviceActive").checked =
    data.active !== false;

  $("serviceSortOrder").value =
    data.sort_order ?? 0;


  showImagePreview(
    "serviceImagePreview",
    data.image_url
  );


  $("serviceEditor").scrollIntoView({
    behavior: "smooth"
  });

}


/* =========================================================
   SAVE SERVICE
========================================================= */

async function saveService(e) {

  e.preventDefault();


  const id =
    $("serviceId")?.value.trim();


  const payload = {

    name:
      $("serviceName")?.value.trim() || "",

    description:
      $("serviceDescription")?.value.trim() || "",

    price:
      Number(
        $("servicePrice")?.value || 0
      ),

    icon:
      $("serviceIcon")?.value.trim() ||
      "🧺",

    image_url:
      $("serviceImage")?.value.trim() || "",

    active:
      $("serviceActive")?.checked ?? true,

    sort_order:
      Number(
        $("serviceSortOrder")?.value || 0
      )

  };


  if (!payload.name) {

    setMessage(
      "serviceMessage",
      "Service name required.",
      false
    );

    return;

  }


  let result;


  if (id) {

    result =
      await supabaseClient
        .from("services")
        .update(payload)
        .eq("id", id);

  } else {

    result =
      await supabaseClient
        .from("services")
        .insert(payload);

  }


  if (result.error) {

    console.error(
      "Service save error:",
      result.error
    );

    setMessage(
      "serviceMessage",
      "Service save error: " +
      result.error.message,
      false
    );

    return;

  }


  setMessage(
    "serviceMessage",
    "Service saved successfully."
  );


  await loadServices();


  setTimeout(
    closeServiceEditor,
    500
  );

}


/* =========================================================
   ENABLE / DISABLE SERVICE
========================================================= */

async function toggleService(
  id,
  currentStatus
) {

  const { error } =
    await supabaseClient
      .from("services")
      .update({
        active: !currentStatus
      })
      .eq("id", id);


  if (error) {

    alert(
      "Status update failed:\n" +
      error.message
    );

    return;

  }


  await loadServices();

}


/* =========================================================
   DELETE SERVICE
========================================================= */

async function deleteService(id) {

  const ok =
    confirm(
      "क्या आप इस service को delete करना चाहते हैं?"
    );


  if (!ok) return;


  const { error } =
    await supabaseClient
      .from("services")
      .delete()
      .eq("id", id);


  if (error) {

    alert(
      "Service delete failed:\n" +
      error.message
    );

    return;

  }


  await loadServices();

}


/* =========================================================
   CLOSE SERVICE EDITOR
========================================================= */

function closeServiceEditor() {

  if ($("serviceEditor"))
    $("serviceEditor").hidden = true;

}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.editArticle = editArticle;
window.deleteArticle = deleteArticle;

window.editService = editService;
window.deleteService = deleteService;
window.toggleService = toggleService;

window.newService = newService;
window.editFooterLink = editFooterLink;
window.deleteFooterLink = deleteFooterLink;

console.log(
  "Basanta Content Admin JS ready."
);
/* =====================================================
   FOOTER LINKS MANAGEMENT
===================================================== */

const footerLinksList =
  document.getElementById("footerLinksList");

const footerLinkEditor =
  document.getElementById("footerLinkEditor");

const footerLinkForm =
  document.getElementById("footerLinkForm");

const newFooterLinkBtn =
  document.getElementById("newFooterLinkBtn");

const closeFooterEditorBtn =
  document.getElementById("closeFooterLinkEditorBtn");

const cancelFooterLinkBtn =
  document.getElementById("cancelFooterLinkBtn");

const footerEditorTitle =
  document.getElementById("footerLinkEditorTitle");

const footerLinkId =
  document.getElementById("footerLinkId");

const footerLinkSection =
  document.getElementById("footerLinkSection");

const footerLinkTitle =
  document.getElementById("footerLinkName");

const footerLinkUrl =
  document.getElementById("footerLinkUrl");

const footerLinkSort =
  document.getElementById("footerLinkSortOrder");

const footerLinkActive =
  document.getElementById("footerLinkActive");

const footerLinkMessage =
  document.getElementById("footerLinkMessage");


async function loadFooterLinks() {

  if (!footerLinksList) return;

  footerLinksList.innerHTML =
    `<div class="loading">Footer links loading...</div>`;

  try {

    const { data, error } = await supabaseClient
      .from("footer_links")
      .select("*")
      .order("section", { ascending: true })
      .order("sort_order", { ascending: true });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {

      footerLinksList.innerHTML = `
        <div class="loading">
          अभी कोई footer link नहीं है।
        </div>
      `;

      return;
    }

    footerLinksList.innerHTML = data.map(link => `

      <div class="admin-item">

        <div>

          <strong>
            ${escapeFooterHtml(link.title)}
          </strong>

          <small>
            ${escapeFooterHtml(link.section)}
            •
            ${escapeFooterHtml(link.url)}
          </small>

        </div>

        <div class="admin-item-actions">

          <button
            type="button"
            class="edit-btn"
            onclick="editFooterLink('${link.id}')">
            Edit
          </button>

          <button
            type="button"
            class="delete-btn"
            onclick="deleteFooterLink('${link.id}')">
            Delete
          </button>

        </div>

      </div>

    `).join("");

  } catch (error) {

    console.error(
      "Footer Links Load Error:",
      error
    );

    footerLinksList.innerHTML = `
      <div class="loading">
        Footer links load नहीं हो सके।
        <br><br>
        <small>
          ${escapeFooterHtml(error.message)}
        </small>
      </div>
    `;
  }
}


function escapeFooterHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function openFooterEditor() {

  if (!footerLinkEditor) return;

  footerEditorTitle.textContent =
    "New Footer Link";

  footerLinkId.value = "";

  footerLinkSection.value =
    "Services";

  footerLinkTitle.value = "";

  footerLinkUrl.value = "";

  footerLinkSort.value = "0";

  footerLinkActive.checked = true;

  footerLinkMessage.textContent = "";

  footerLinkEditor.hidden = false;

  footerLinkEditor.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


function closeFooterEditor() {

  if (!footerLinkEditor) return;

  footerLinkEditor.hidden = true;

}


async function editFooterLink(id) {

  try {

    const { data, error } = await supabaseClient
      .from("footer_links")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    footerEditorTitle.textContent =
      "Edit Footer Link";

    footerLinkId.value =
      data.id;

    footerLinkSection.value =
      data.section || "Company";

    footerLinkTitle.value =
      data.title || "";

    footerLinkUrl.value =
      data.url || "";

    footerLinkSort.value =
      data.sort_order ?? 0;

    footerLinkActive.checked =
      data.active !== false;

    footerLinkMessage.textContent = "";

    footerLinkEditor.hidden = false;

    footerLinkEditor.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  } catch (error) {

    console.error(
      "Footer Link Edit Error:",
      error
    );

    alert(
      "Footer link load नहीं हुआ: " +
      error.message
    );

  }

}


async function deleteFooterLink(id) {

  const confirmDelete =
    confirm(
      "क्या आप यह footer link delete करना चाहते हैं?"
    );

  if (!confirmDelete) return;

  try {

    const { error } = await supabaseClient
      .from("footer_links")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    await loadFooterLinks();

  } catch (error) {

    console.error(
      "Footer Link Delete Error:",
      error
    );

    alert(
      "Delete नहीं हुआ: " +
      error.message
    );

  }

}


if (newFooterLinkBtn) {

  newFooterLinkBtn.addEventListener(
    "click",
    openFooterEditor
  );

}


if (closeFooterEditorBtn) {

  closeFooterEditorBtn.addEventListener(
    "click",
    closeFooterEditor
  );

}


if (cancelFooterLinkBtn) {

  cancelFooterLinkBtn.addEventListener(
    "click",
    closeFooterEditor
  );

}


if (footerLinkForm) {

  footerLinkForm.addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();

      footerLinkMessage.textContent =
        "Saving...";

      try {

        const id =
          footerLinkId.value.trim();

        const payload = {

          section:
            footerLinkSection.value.trim(),

          title:
            footerLinkTitle.value.trim(),

          url:
            footerLinkUrl.value.trim(),

          active:
            footerLinkActive.checked,

          sort_order:
            Number(
              footerLinkSort.value || 0
            ),

          updated_at:
            new Date().toISOString()

        };


        if (!payload.title) {
          throw new Error(
            "Link name डालें।"
          );
        }


        if (!payload.url) {
          throw new Error(
            "Link URL डालें।"
          );
        }


        let result;


        if (id) {

          result = await supabaseClient
            .from("footer_links")
            .update(payload)
            .eq("id", id);

        } else {

          result = await supabaseClient
            .from("footer_links")
            .insert(payload);

        }


        if (result.error) {
          throw result.error;
        }


        footerLinkMessage.textContent =
          "Footer link successfully saved.";

        await loadFooterLinks();

        setTimeout(
          closeFooterEditor,
          500
        );

      } catch (error) {

        console.error(
          "Footer Link Save Error:",
          error
        );

        footerLinkMessage.textContent =
          "Error: " +
          error.message;

      }

    }
  );

}


