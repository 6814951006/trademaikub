const token =
  localStorage.getItem("tradeMaiKubToken") ||
  sessionStorage.getItem("tradeMaiKubToken");
const userValue =
  localStorage.getItem("tradeMaiKubUser") ||
  sessionStorage.getItem("tradeMaiKubUser");

if (!token || !userValue) {
  window.location.replace("./index.html");
}

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
    amount: 1,
    owner: "nattapong",
    image:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    name: "Mechanical Keyboard",
    category: "electronics",
    price: 3200,
    amount: 2,
    owner: "minttrade",
    image:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    name: "Vintage Camera",
    category: "collectibles",
    price: 12400,
    amount: 1,
    owner: "filmclub",
    image:
      "https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 4,
    name: "Limited Art Print",
    category: "collectibles",
    price: 4500,
    amount: 3,
    owner: "studio24",
    image:
      "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 5,
    name: "Leather Weekender",
    category: "lifestyle",
    price: 6800,
    amount: 1,
    owner: "wayfarer",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 6,
    name: "Ceramic Table Set",
    category: "lifestyle",
    price: 2800,
    amount: 4,
    owner: "homefound",
    image:
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80",
  },
];
let offers = [];
const listingGrid = document.querySelector("#listing-grid");
const dialog = document.querySelector("#trade-dialog");
let selectedListing;

const money = (value) => `฿${Number(value).toLocaleString("en-US")}`;

document.querySelector("#user-name").textContent = user.username;

const renderListings = () => {
  const query = document
    .querySelector("#listing-search")
    .value.toLowerCase()
    .trim();
  const filter = document.querySelector("#listing-filter").value;
  const visible = listings.filter(
    (listing) =>
      listing.name.toLowerCase().includes(query) &&
      (filter === "all" || listing.category === filter),
  );
  listingGrid.innerHTML = visible
    .map(
      (listing) =>
        `<article class="listing-card"><div class="listing-image"><img src="${listing.image}" alt="${listing.name}" loading="lazy" /><span>${listing.category}</span></div><div class="listing-content"><div><h3>${listing.name}</h3><p>Listed by <strong>${listing.owner}</strong></p></div><strong class="listing-price">${money(listing.price)}</strong></div><div class="listing-meta"><span>${listing.amount} available</span><button class="trade-button" data-listing-id="${listing.id}" type="button">Trade</button></div></article>`,
    )
    .join("");
  listingGrid
    .querySelectorAll("[data-listing-id]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        openTrade(Number(button.dataset.listingId)),
      ),
    );
};

const renderOffers = () => {
  const table = document.querySelector("#orders-table");
  const empty = document.querySelector("#empty-orders");
  table.querySelectorAll(".order-data").forEach((row) => row.remove());
  empty.hidden = offers.length > 0;
  document.querySelector("#open-offers").textContent = offers.length;
  offers.forEach((offer) => {
    const row = document.createElement("div");
    const price = offer.price?.$numberDecimal || offer.price;
    const amount = offer.amount?.$numberDecimal || offer.amount;
    row.className = "order-row order-data";
    row.innerHTML = `<span>${offer.symbol}</span><span class="side-${offer.side}">${offer.side.toUpperCase()}</span><span>${money(price)}</span><span>${amount}</span><span class="status-pill pending">${offer.status}</span>`;
    table.appendChild(row);
  });
};

const loadOffers = async () => {
  const response = await fetch(`${API_BASE_URL}/api/orders/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.ok) {
    offers = await response.json();
    renderOffers();
  }
};

const openTrade = (id) => {
  selectedListing = listings.find((listing) => listing.id === id);
  document.querySelector("#dialog-title").textContent = selectedListing.name;
  document.querySelector("#trade-price").value = selectedListing.price;
  document.querySelector("#trade-amount").value = 1;
  document.querySelector("#dialog-status").textContent = "";
  dialog.showModal();
};
document
  .querySelector("#listing-search")
  .addEventListener("input", renderListings);
document
  .querySelector("#listing-filter")
  .addEventListener("change", renderListings);
document
  .querySelector("#trade-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const side = document.querySelector("#trade-side").value;
    const type = document.querySelector("#trade-type").value;
    const price = Number(document.querySelector("#trade-price").value);
    const amount = Number(document.querySelector("#trade-amount").value);
    if (!price || !amount) {
      document.querySelector("#dialog-status").textContent =
        "Enter a valid price and amount.";
      return;
    }
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        symbol: selectedListing.name,
        side,
        type,
        price,
        amount,
      }),
    });
    if (!response.ok) {
      document.querySelector("#dialog-status").textContent =
        "Unable to place this offer.";
      return;
    }
    dialog.close();
    await loadOffers();
    document.querySelector("#my-orders").scrollIntoView({ behavior: "smooth" });
  });
document.querySelector("#contact-form").addEventListener("submit", (event) => {
  event.preventDefault();
  event.target.reset();
  document.querySelector("#contact-status").textContent =
    "Your message has been sent to trade support.";
});
document.querySelector("#logout-button").addEventListener("click", () => {
  localStorage.clear();
  sessionStorage.clear();
  window.location.replace("./index.html");
});

renderListings();
loadOffers();
