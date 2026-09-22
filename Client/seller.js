const token =
  localStorage.getItem("tradeMaiKubToken") ||
  sessionStorage.getItem("tradeMaiKubToken");
const userValue =
  localStorage.getItem("tradeMaiKubUser") ||
  sessionStorage.getItem("tradeMaiKubUser");
if (!token || !userValue) window.location.replace("./index.html");

const user = JSON.parse(userValue);
const API_BASE_URL = (
  window.LOGIN_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:5000`
).replace(/\/$/, "");
const authHeaders = { Authorization: `Bearer ${token}` };
const jsonAuthHeaders = { ...authHeaders, "Content-Type": "application/json" };
const $ = (selector) => document.querySelector(selector);
$("#user-name").textContent = user.username;
document
  .querySelector('a[href="#store"]')
  ?.setAttribute("href", "#store-panel");
let selectedChat;
const ensureSellerChat = () => {
  if (document.querySelector("#seller-chat-panel")) return;
  document
    .querySelector("#product-form")
    .insertAdjacentHTML(
      "beforebegin",
      `<section id="seller-chat-panel" class="seller-chat-panel"><h3>Buyer messages</h3><div id="seller-chat-list"></div><div id="seller-chat-thread"><p>Select a buyer conversation.</p></div><form id="seller-chat-form"><textarea id="seller-chat-message" rows="2" maxlength="1000" placeholder="Reply to buyer"></textarea><button class="primary-action" type="submit">Send reply</button></form></section>`,
    );
};
const loadSellerChats = async () => {
  ensureSellerChat();
  const response = await fetch(`${API_BASE_URL}/api/chat/conversations/mine`, {
    headers: authHeaders,
  });
  if (!response.ok) return;
  const chats = await response.json();
  document.querySelector("#seller-chat-list").innerHTML = chats.length
    ? chats
        .map(
          (chat) =>
            `<button type="button" data-chat-id="${chat._id}">${chat.buyerId.username} / ${chat.productId.name}</button>`,
        )
        .join("")
    : "<p>No buyer messages yet.</p>";
  document
    .querySelectorAll("[data-chat-id]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        loadSellerChat(button.dataset.chatId),
      ),
    );
};
const loadSellerChat = async (id) => {
  selectedChat = id;
  const response = await fetch(
    `${API_BASE_URL}/api/chat/conversations/${id}/messages`,
    { headers: authHeaders },
  );
  const messages = await response.json();
  document.querySelector("#seller-chat-thread").innerHTML = messages.length
    ? messages
        .map(
          (message) =>
            `<p><strong>${message.senderId.username}</strong> ${message.body}</p>`,
        )
        .join("")
    : "<p>No messages yet.</p>";
};

const showRatings = (ratings) => {
  $("#overall-score").textContent = ratings.overall.toFixed(1);
  $("#overall-stars").textContent =
    "★".repeat(Math.round(ratings.overall)) +
    "☆".repeat(5 - Math.round(ratings.overall));
  $("#review-count").textContent =
    `${ratings.totalReviews} review${ratings.totalReviews === 1 ? "" : "s"}`;
  $("#rating-breakdown").innerHTML = [
    ["Product quality", ratings.productRating],
    ["Delivery time", ratings.shippingRating],
    ["Item condition", ratings.conditionRating],
    ["Chat response", ratings.communicationRating],
  ]
    .map(
      ([label, value]) =>
        `<div><span>${label}</span><strong>${value.toFixed(1)} / 5</strong><meter min="0" max="5" value="${value}"></meter></div>`,
    )
    .join("");
};

const loadStore = async (username) => {
  const response = await fetch(
    `${API_BASE_URL}/api/sellers/store/${encodeURIComponent(username)}`,
  );
  if (!response.ok) return;
  const data = await response.json();
  $("#application-panel").hidden = true;
  $("#store-panel").hidden = false;
  $("#store-name-display").textContent = data.seller.storeName;
  $("#store-description-display").textContent =
    data.seller.description || "Independent seller on Trade Mai Kub";
  await loadSellerChats();
  $("#seller-products").innerHTML = data.products.length
    ? data.products
        .map(
          (product) =>
            `<article><strong>${product.name}</strong><span>${product.category} | ฿${product.price.toLocaleString()} | ${product.stock} in stock</span><p>${product.description || ""}</p></article>`,
        )
        .join("")
    : "<p>No products listed yet.</p>";
  showRatings(data.ratings);
  $("#review-list").innerHTML = data.reviews.length
    ? data.reviews
        .map(
          (review) =>
            `<article><strong>${review.reviewerId.username}</strong><span>${"★".repeat(review.productRating)}${"☆".repeat(5 - review.productRating)}</span><p>${review.comment || "No comment"}</p></article>`,
        )
        .join("")
    : "<p>No reviews yet.</p>";
};

const loadMine = async () => {
  const response = await fetch(`${API_BASE_URL}/api/sellers/mine`, {
    headers: authHeaders,
  });
  if (!response.ok) {
    $("#page-status").textContent = "Unable to load seller status.";
    return;
  }
  const seller = await response.json();
  if (!seller) return;
  if (seller.status === "approved") {
    await loadStore(user.username);
    return;
  }
  $("#seller-status").textContent =
    seller.status === "rejected"
      ? `Application rejected: ${seller.rejectionReason}`
      : "Your application is waiting for admin verification.";
  [
    "store-name",
    "seller-phone",
    "identity-number",
    "identity-document",
    "store-description",
  ].forEach((id) => {
    const field = $(`#${id}`);
    field.value =
      seller[
        {
          "store-name": "storeName",
          "seller-phone": "phone",
          "identity-number": "identityNumber",
          "identity-document": "identityDocument",
          "store-description": "description",
        }[id]
      ] || "";
  });
};

$("#seller-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = {
    storeName: $("#store-name").value,
    phone: $("#seller-phone").value,
    identityNumber: $("#identity-number").value,
    identityDocument: $("#identity-document").value,
    description: $("#store-description").value,
  };
  const response = await fetch(`${API_BASE_URL}/api/sellers/apply`, {
    method: "POST",
    headers: jsonAuthHeaders,
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  $("#seller-status").textContent = response.ok
    ? data.message
    : data.message || "Unable to submit application.";
});
$("#toggle-ratings").addEventListener("click", () => {
  $("#rating-breakdown").hidden = !$("#rating-breakdown").hidden;
});
document.addEventListener("submit", async (event) => {
  if (event.target.id !== "seller-chat-form" || !selectedChat) return;
  event.preventDefault();
  const body = $("#seller-chat-message").value.trim();
  if (!body) return;
  const response = await fetch(
    `${API_BASE_URL}/api/chat/conversations/${selectedChat}/messages`,
    {
      method: "POST",
      headers: jsonAuthHeaders,
      body: JSON.stringify({ body }),
    },
  );
  if (response.ok) {
    $("#seller-chat-message").value = "";
    await loadSellerChat(selectedChat);
  }
});
$("#product-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = {
    name: $("#product-name").value,
    category: $("#product-category").value,
    price: $("#product-price").value,
    stock: $("#product-stock").value,
    image: $("#product-image").value,
    description: $("#product-description").value,
  };
  const response = await fetch(`${API_BASE_URL}/api/sellers/products`, {
    method: "POST",
    headers: jsonAuthHeaders,
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  $("#product-status").textContent = response.ok
    ? "Product added to your store."
    : data.message || "Unable to add product.";
  if (response.ok) {
    $("#product-form").reset();
    await loadStore(user.username);
  }
});
$("#review-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = {
    productRating: $("#product-rating").value,
    shippingRating: $("#shipping-rating").value,
    conditionRating: $("#condition-rating").value,
    communicationRating: $("#communication-rating").value,
    comment: $("#review-comment").value,
  };
  const response = await fetch(
    `${API_BASE_URL}/api/sellers/store/${encodeURIComponent(user.username)}/reviews`,
    { method: "POST", headers: jsonAuthHeaders, body: JSON.stringify(body) },
  );
  $("#review-status").textContent = response.ok
    ? "Review submitted."
    : (await response.json()).message || "Unable to submit review.";
});
$("#logout-button").addEventListener("click", () => {
  localStorage.clear();
  sessionStorage.clear();
  window.location.replace("./index.html");
});
loadMine();
