const token =
  localStorage.getItem("tradeMaiKubToken") ||
  sessionStorage.getItem("tradeMaiKubToken");
const userValue =
  localStorage.getItem("tradeMaiKubUser") ||
  sessionStorage.getItem("tradeMaiKubUser");
if (!token || !userValue) window.location.replace("./index.html");

const user = JSON.parse(userValue);
if (user.role !== "admin") {
  window.location.replace("./home.html");
}
const API_BASE_URL = (
  window.LOGIN_API_BASE_URL ||
  (["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : window.location.origin)
).replace(/\/$/, "");
const headers = { Authorization: `Bearer ${token}` };
const jsonHeaders = { ...headers, "Content-Type": "application/json" };
const state = { product: null, conversation: null, count: 0 };
const output = document.querySelector("#api-output");
document.querySelector("#user-name").textContent = user.username;

const show = (title, request, response, error = false) => {
  state.count += 1;
  document.querySelector("#test-count").textContent = state.count;
  document.querySelector("#api-status").textContent = error
    ? "Failed"
    : "Passed";
  output.innerHTML = `<div class="api-result ${error ? "api-failed" : "api-passed"}"><strong>${title}</strong><pre>${JSON.stringify({ request, response }, null, 2)}</pre></div>`;
};

const runProducts = async () => {
  const response = await fetch(`${API_BASE_URL}/api/sellers/products`);
  const data = await response.json();
  state.product = data[0];
  show("GET /api/sellers/products", "GET sellers/products", data);
};

const runDeal = async () => {
  if (!state.product) await runProducts();
  const body = {
    productId: state.product._id,
    method: "trade",
    offeredItem: "Test item from API test",
    note: "Frontend API test",
  };
  const response = await fetch(`${API_BASE_URL}/api/transactions`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });
  const data = await response.json();
  show("POST /api/transactions", body, data, !response.ok);
};

const runConversation = async () => {
  if (!state.product) await runProducts();
  const body = { productId: state.product._id };
  const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });
  const data = await response.json();
  state.conversation = data;
  show("POST /api/chat/conversations", body, data, !response.ok);
};

const runMessage = async () => {
  if (!state.conversation) await runConversation();
  const body = { body: "Hello from the frontend API test" };
  const response = await fetch(
    `${API_BASE_URL}/api/chat/conversations/${state.conversation._id}/messages`,
    { method: "POST", headers: jsonHeaders, body: JSON.stringify(body) },
  );
  const data = await response.json();
  show("POST /api/chat/conversations/:id/messages", body, data, !response.ok);
};

const tests = {
  products: runProducts,
  deal: runDeal,
  conversation: runConversation,
  message: runMessage,
};
document.querySelectorAll("[data-test]").forEach((button) =>
  button.addEventListener("click", async () => {
    try {
      await tests[button.dataset.test]();
    } catch (error) {
      show(
        button.textContent.trim(),
        "request",
        { message: error.message },
        true,
      );
    }
  }),
);
document.querySelector("#run-all").addEventListener("click", async () => {
  for (const test of [runProducts, runDeal, runConversation, runMessage]) {
    try {
      await test();
    } catch (error) {
      show("API test", "request", { message: error.message }, true);
      break;
    }
  }
});
document.querySelector("#logout-button").addEventListener("click", () => {
  localStorage.clear();
  sessionStorage.clear();
  window.location.replace("./index.html");
});
