const API_BASE_URL = (
  window.LOGIN_API_BASE_URL ||
  (["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : window.location.origin)
).replace(/\/$/, "");
const form = document.querySelector("#login-form");
const identifierInput = document.querySelector("#identifier");
const passwordInput = document.querySelector("#password");
const submitButton = document.querySelector("#submit-button");
const buttonLabel = document.querySelector("#button-label");
const statusMessage = document.querySelector("#form-status");
const togglePassword = document.querySelector("#toggle-password");
const registerFields = document.querySelector("#register-fields");
const emailInput = document.querySelector("#email");
const formEyebrow = document.querySelector("#form-eyebrow");
const formTitle = document.querySelector("#form-title");
const formDescription = document.querySelector("#form-description");
const identifierLabel = document.querySelector("#identifier-label");
const switchPrompt = document.querySelector("#switch-prompt");
const switchMode = document.querySelector("#switch-mode");
let isRegisterMode = false;

const setError = (id, message) => {
  document.querySelector(`#${id}-error`).textContent = message;
};

togglePassword.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  togglePassword.textContent = isPassword ? "Hide" : "Show";
  togglePassword.setAttribute("aria-pressed", String(isPassword));
});

switchMode.addEventListener("click", () => {
  isRegisterMode = !isRegisterMode;
  registerFields.hidden = !isRegisterMode;
  emailInput.required = isRegisterMode;
  formEyebrow.textContent = isRegisterMode ? "New here?" : "Welcome back";
  formTitle.textContent = isRegisterMode
    ? "Create your account"
    : "Sign in to your account";
  formDescription.textContent = isRegisterMode
    ? "Create an account to start using Trade Mai Kub."
    : "Enter your details to continue to Trade Mai Kub.";
  identifierLabel.textContent = isRegisterMode
    ? "Username"
    : "Email or username";
  identifierInput.placeholder = isRegisterMode
    ? "your_username"
    : "you@example.com";
  buttonLabel.textContent = isRegisterMode ? "Create account" : "Sign in";
  switchPrompt.textContent = isRegisterMode
    ? "Already have an account?"
    : "Don't have an account?";
  switchMode.textContent = isRegisterMode ? "Sign in" : "Create account";
  form.reset();
  setError("identifier", "");
  setError("password", "");
  setError("email", "");
  statusMessage.textContent = "";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setError("identifier", "");
  setError("password", "");
  setError("email", "");
  statusMessage.textContent = "";
  statusMessage.className = "status";
  const identifier = identifierInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  let valid = true;
  if (isRegisterMode) {
    if (!identifier) {
      setError("identifier", "Enter a username.");
      valid = false;
    }
    if (!email) {
      setError("email", "Enter your email.");
      valid = false;
    }
    if (password.length < 8) {
      setError("password", "Use at least 8 characters.");
      valid = false;
    }
  } else {
    if (!identifier) {
      setError("identifier", "Enter your email or username.");
      valid = false;
    }
    if (!password) {
      setError("password", "Enter your password.");
      valid = false;
    }
  }
  if (!valid) return;

  submitButton.disabled = true;
  submitButton.classList.add("loading");
  buttonLabel.textContent = isRegisterMode ? "Creating account" : "Signing in";
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/auth/${isRegisterMode ? "register" : "login"}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegisterMode
            ? { username: identifier, email, password }
            : { identifier, password },
        ),
      },
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(data.message || "Unable to sign in. Please try again.");
    const storage = document.querySelector("#remember").checked
      ? localStorage
      : sessionStorage;
    storage.setItem("tradeMaiKubToken", data.token);
    storage.setItem("tradeMaiKubUser", JSON.stringify(data.user));
    window.location.href = "./home.html";
  } catch (error) {
    statusMessage.className = "status error";
    statusMessage.textContent =
      error.name === "TypeError"
        ? "Unable to reach the server. Check that the backend is running."
        : error.message;
  } finally {
    submitButton.disabled = false;
    submitButton.classList.remove("loading");
    buttonLabel.textContent = isRegisterMode ? "Create account" : "Sign in";
  }
});
