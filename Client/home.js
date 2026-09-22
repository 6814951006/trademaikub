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
  (["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : window.location.origin)
).replace(/\/$/, "");
const listings = [
  {
    id: 1,
    name: "Sony WH-1000XM5",
    category: "electronics",
    price: 8900,
    owner: "nattapong",
    image:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    name: "Mechanical Keyboard",
    category: "electronics",
    price: 3200,
    owner: "minttrade",
    image:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    name: "Vintage Camera",
    category: "collectibles",
    price: 12400,
    owner: "filmclub",
    image:
      "https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 4,
    name: "Limited Art Print",
    category: "collectibles",
    price: 4500,
    owner: "studio24",
    image:
      "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 5,
    name: "Leather Weekender",
    category: "lifestyle",
    price: 6800,
    owner: "wayfarer",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 6,
    name: "Ceramic Table Set",
    category: "lifestyle",
    price: 2800,
    owner: "homefound",
    image:
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80",
  },
];
const cart = [];
const tradeOffers = [];
let selectedListing;
const listingGrid = document.querySelector("#listing-grid");
const tradeDialog = document.querySelector("#trade-dialog");
const productDialog = document.querySelector("#product-dialog");
const money = (value) => `฿${Number(value).toLocaleString("en-US")}`;

document.querySelector("#user-name").textContent = user.username;
if (user.role !== "admin") {
  document.querySelector("#api-test-link")?.remove();
}

const loadSellerProducts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sellers/products`);
    if (!response.ok) return;
    const products = await response.json();
    products.forEach((product) => {
      listings.unshift({
        id: `seller-${product._id}`,
        name: product.name,
        category: product.category,
        price: product.price,
        owner: product.sellerId.userId.username,
        image:
          product.image ||
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
        description: product.description,
        stock: product.stock,
        productId: product._id,
      });
    });
    renderListings();
  } catch {}
};

const renderListings = () => {
  const query = document
    .querySelector("#listing-search")
    .value.toLowerCase()
    .trim();
  const category = document.querySelector("#listing-filter").value;
  const visible = listings.filter(
    (item) =>
      item.name.toLowerCase().includes(query) &&
      (category === "all" || item.category === category),
  );
  listingGrid.innerHTML = visible
    .map((item) => {
      const quantityInCart = getCartQuantity(item.id);
      const isAtStockLimit =
        item.stock !== undefined && quantityInCart >= item.stock;
      return `<article class="listing-card"><button class="listing-preview" data-detail-id="${item.id}" type="button"><div class="listing-image"><img src="${item.image}" alt="${item.name}" loading="lazy" /><span>${item.category}</span></div><div class="listing-content"><div><h3>${item.name}</h3><p>Listed by <strong>${item.owner}</strong></p></div><strong class="listing-price">${money(item.price)}</strong></div></button><div class="listing-meta"><span>${item.stock === undefined ? "Available" : `${item.stock} in stock`}</span><button class="buy-button" data-buy-id="${item.id}" type="button" ${isAtStockLimit ? "disabled" : ""}>${isAtStockLimit ? "Stock limit reached" : "Add to cart"}</button><button class="trade-button" data-trade-id="${item.id}" type="button">Trade instead</button></div></article>`;
    })
    .join("");
  document.querySelector("#empty-state").hidden = visible.length > 0;
  listingGrid
    .querySelectorAll("[data-detail-id]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        openDetails(button.dataset.detailId),
      ),
    );
  listingGrid
    .querySelectorAll("[data-buy-id]")
    .forEach((button) =>
      button.addEventListener("click", () => addToCart(button.dataset.buyId)),
    );
  listingGrid
    .querySelectorAll("[data-trade-id]")
    .forEach((button) =>
      button.addEventListener("click", () => openDeal(button.dataset.tradeId)),
    );
};

const renderCart = () => {
  document.querySelector("#cart-items").innerHTML = cart.length
    ? cart
        .map(
          (item) =>
            `<div class="cart-item"><div><strong>${item.name}</strong><span>${money(item.price)} each</span></div><div class="cart-quantity"><button type="button" data-decrease-id="${item.id}" aria-label="Decrease ${item.name} quantity">−</button><strong>${item.quantity}</strong><button type="button" data-increase-id="${item.id}" aria-label="Increase ${item.name} quantity" ${item.stock !== undefined && item.quantity >= item.stock ? "disabled" : ""}>+</button><button type="button" data-remove-id="${item.id}" aria-label="Remove ${item.name}">×</button></div></div>`,
        )
        .join("")
    : `<p class="empty-cart">Your cart is empty.</p>`;
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelector("#cart-count").textContent = totalQuantity;
  document.querySelector("#activity-cart-count").textContent = totalQuantity;
  document.querySelector("#cart-total").textContent = money(
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );
  document
    .querySelectorAll("[data-increase-id]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        addToCart(button.dataset.increaseId),
      ),
    );
  document
    .querySelectorAll("[data-decrease-id]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        decreaseCartQuantity(button.dataset.decreaseId),
      ),
    );
  document.querySelectorAll("[data-remove-id]").forEach((button) =>
    button.addEventListener("click", () => {
      const index = cart.findIndex(
        (item) => String(item.id) === String(button.dataset.removeId),
      );
      if (index !== -1) cart.splice(index, 1);
      renderCart();
    }),
  );
};
const getCartQuantity = (id) =>
  cart.find((item) => String(item.id) === String(id))?.quantity || 0;

const addToCart = (id) => {
  const item = listings.find((listing) => String(listing.id) === String(id));
  if (!item) return;
  const existingItem = cart.find((cartItem) => cartItem.id === item.id);
  if (existingItem) {
    if (item.stock !== undefined && existingItem.quantity >= item.stock) return;
    existingItem.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  renderListings();
  renderCart();
  document.querySelector("#cart-drawer").classList.add("open");
  document.querySelector("#cart-drawer").setAttribute("aria-hidden", "false");
};
const decreaseCartQuantity = (id) => {
  const item = cart.find((cartItem) => String(cartItem.id) === String(id));
  if (!item) return;
  item.quantity -= 1;
  if (item.quantity <= 0) {
    cart.splice(cart.indexOf(item), 1);
  }
  renderListings();
  renderCart();
};
const ensureDealUi = () => {
  if (document.querySelector("#deal-dialog")) return;
  document.body.insertAdjacentHTML(
    "beforeend",
    `<dialog class="trade-dialog" id="deal-dialog"><form method="dialog" id="deal-form"><div class="dialog-header"><div><p class="eyebrow">Complete a deal</p><h2 id="deal-title">-</h2></div><button class="drawer-close" value="cancel">×</button></div><label for="deal-quantity">Quantity</label><input id="deal-quantity" type="number" min="1" value="1" required /><small id="deal-stock-help"></small><label for="deal-method">How do you want to get it?</label><select id="deal-method"><option value="money">Pay with money</option><option value="trade">Offer an item to trade</option></select><div id="money-fields"><label for="deal-amount">Amount (THB)</label><input id="deal-amount" type="number" min="0" step="0.01" /></div><div id="trade-fields" hidden><label for="deal-item">What do you offer?</label><input id="deal-item" placeholder="e.g. iPad Air or camera" /></div><label for="deal-note">Note to seller</label><textarea id="deal-note" rows="3"></textarea><button class="primary-action" id="deal-chat" type="button">Chat with seller</button><button class="primary-action" value="submit">Send request</button><p class="dialog-status" id="deal-status"></p></form></dialog><dialog class="trade-dialog" id="chat-dialog"><form method="dialog" id="chat-form"><div class="dialog-header"><div><p class="eyebrow">Buyer / seller chat</p><h2 id="chat-title">-</h2></div><button class="drawer-close" value="cancel">×</button></div><div class="chat-messages" id="chat-messages"></div><textarea id="chat-message" rows="3" maxlength="1000" placeholder="Write a message"></textarea><button class="primary-action" value="submit">Send message</button><p class="dialog-status" id="chat-status"></p></form></dialog>`,
  );
};
const openDeal = (id) => {
  selectedListing = listings.find(
    (listing) => String(listing.id) === String(id),
  );
  if (!selectedListing?.productId) {
    alert("This sample listing is not connected to a seller yet.");
    return;
  }
  ensureDealUi();
  document.querySelector("#deal-title").textContent = selectedListing.name;
  const stockLimit =
    selectedListing.stock === undefined ? 1 : selectedListing.stock;
  document.querySelector("#deal-quantity").max = stockLimit;
  document.querySelector("#deal-quantity").value = 1;
  document.querySelector("#deal-stock-help").textContent =
    selectedListing.stock === undefined
      ? "Quantity limit is not available for this sample listing."
      : `${selectedListing.stock} available`;
  document.querySelector("#deal-amount").value = selectedListing.price;
  document.querySelector("#deal-method").value = "money";
  document.querySelector("#trade-fields").hidden = true;
  document.querySelector("#money-fields").hidden = false;
  document.querySelector("#deal-status").textContent = "";
  document.querySelector("#deal-dialog").showModal();
};
const openDetails = (id) => {
  const item = listings.find((listing) => String(listing.id) === String(id));
  document.querySelector("#product-detail").innerHTML =
    `<img src="${item.image}" alt="${item.name}" /><div class="product-detail-copy"><p class="eyebrow">${item.category}</p><h2>${item.name}</h2><p class="product-detail-price">${money(item.price)}</p><p>Listed by <strong>${item.owner}</strong></p><p class="product-description">${item.description || "Review the details, then choose money or a trade offer."}</p><div class="product-detail-actions"><button class="buy-button" data-detail-buy type="button">Add to cart</button><button class="trade-button" data-detail-trade type="button">Buy or trade</button></div></div>`;
  document.querySelector("[data-detail-buy]").addEventListener("click", () => {
    productDialog.close();
    addToCart(item.id);
  });
  document
    .querySelector("[data-detail-trade]")
    .addEventListener("click", () => {
      productDialog.close();
      openDeal(item.id);
    });
  productDialog.showModal();
};
const openChat = async () => {
  const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productId: selectedListing.productId }),
  });
  const conversation = await response.json();
  if (!response.ok) {
    document.querySelector("#deal-status").textContent =
      conversation.message || "Unable to open chat.";
    return;
  }
  const messages = await fetch(
    `${API_BASE_URL}/api/chat/conversations/${conversation._id}/messages`,
    { headers: { Authorization: `Bearer ${token}` } },
  ).then((result) => result.json());
  document.querySelector("#chat-title").textContent =
    `Chat about ${selectedListing.name}`;
  document.querySelector("#chat-messages").innerHTML = messages.length
    ? messages
        .map(
          (message) =>
            `<p><strong>${message.senderId.username}</strong> ${message.body}</p>`,
        )
        .join("")
    : "<p>No messages yet.</p>";
  document.querySelector("#chat-dialog").showModal();
};

document
  .querySelector("#listing-search")
  .addEventListener("input", renderListings);
document
  .querySelector("#listing-filter")
  .addEventListener("change", renderListings);
document.querySelector("#cart-button").addEventListener("click", () => {
  document.querySelector("#cart-drawer").classList.add("open");
  document.querySelector("#cart-drawer").setAttribute("aria-hidden", "false");
});
document.querySelector("#cart-close").addEventListener("click", () => {
  document.querySelector("#cart-drawer").classList.remove("open");
  document.querySelector("#cart-drawer").setAttribute("aria-hidden", "true");
});
document
  .querySelector("#product-dialog-close")
  .addEventListener("click", () => productDialog.close());
document.querySelector("#checkout-button").addEventListener("click", () => {
  if (cart.length) openDeal(cart[0].id);
});
document.addEventListener("click", (event) => {
  if (event.target.id === "deal-chat") openChat();
});
document.addEventListener("submit", async (event) => {
  if (event.target.id === "deal-form") {
    if (event.submitter?.value === "cancel") return;
    event.preventDefault();
    const method = document.querySelector("#deal-method").value;
    const response = await fetch(`${API_BASE_URL}/api/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productId: selectedListing.productId,
        method,
        quantity: Number(document.querySelector("#deal-quantity").value),
        offeredAmount: document.querySelector("#deal-amount").value,
        offeredItem: document.querySelector("#deal-item").value,
        note: document.querySelector("#deal-note").value,
      }),
    });
    const data = await response.json().catch(() => ({}));
    document.querySelector("#deal-status").textContent = response.ok
      ? "Request sent to the seller."
      : data.message || "Unable to send request.";
    if (response.ok) document.querySelector("#deal-dialog").close();
  }
  if (event.target.id === "chat-form") {
    if (event.submitter?.value === "cancel") return;
    event.preventDefault();
    const message = document.querySelector("#chat-message").value.trim();
    if (!message) return;
    const conversation = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId: selectedListing.productId }),
    }).then((result) => result.json());
    const response = await fetch(
      `${API_BASE_URL}/api/chat/conversations/${conversation._id}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body: message }),
      },
    );
    document.querySelector("#chat-status").textContent = response.ok
      ? "Message sent."
      : "Unable to send message.";
    if (response.ok) document.querySelector("#chat-message").value = "";
  }
});
document.addEventListener("change", (event) => {
  if (event.target.id === "deal-quantity" && selectedListing) {
    document.querySelector("#deal-amount").value =
      selectedListing.price * Number(event.target.value || 1);
  }
  if (event.target.id === "deal-method") {
    document.querySelector("#money-fields").hidden =
      event.target.value !== "money";
    document.querySelector("#trade-fields").hidden =
      event.target.value !== "trade";
  }
});
document.querySelector("#trade-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const offer = document.querySelector("#trade-offer").value.trim();
  if (!offer) return;
  tradeOffers.push({ listing: selectedListing.name, offer });
  document.querySelector("#trade-form").reset();
  tradeDialog.close();
  document.querySelector("#activity-offers-count").textContent =
    tradeOffers.length;
});
document.querySelector("#contact-form").addEventListener("submit", (event) => {
  event.preventDefault();
  event.target.reset();
  document.querySelector("#contact-status").textContent =
    "Your message has been sent to support.";
});
document.querySelector("#logout-button").addEventListener("click", () => {
  localStorage.clear();
  sessionStorage.clear();
  window.location.replace("./index.html");
});

renderListings();
renderCart();
loadSellerProducts();
