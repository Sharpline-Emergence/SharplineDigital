/*
  Sharpline Digital — Customer Service Chat Widget
  Drop this file at /chat-widget.js on your site, then add:
    <script src="/chat-widget.js"></script>
  right before </body> on any page you want it to appear on
  (or add it into your existing footer.html include).

  Before this works, set WORKER_URL below to your deployed
  Cloudflare Worker URL (see setup steps).
*/

(function () {
  // Update these two after deploying the Supabase Edge Function.
  // Find both in Supabase dashboard: Settings > API.
  const SUPABASE_FUNCTION_URL = "https://pvpmjmalwjzqehqbvinp.supabase.co/functions/v1/sharpline-chat";
  const SUPABASE_ANON_KEY = "sb_publishable_y-M5GWJJZCnAdCIOcKCMZw_EkzbqHIg";

  const style = document.createElement("style");
  style.textContent = `
    #sl-chat-bubble {
      position: fixed; bottom: 20px; right: 20px; width: 58px; height: 58px;
      border-radius: 50%; background: #2ec4a9; color: #0a1628;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; box-shadow: 0 4px 16px rgba(10,22,40,0.25);
      z-index: 9999; font-size: 26px; border: none; transition: transform 0.15s ease;
    }
    #sl-chat-bubble:hover { transform: scale(1.06); }
    #sl-chat-panel {
      position: fixed; bottom: 90px; right: 20px; width: 340px; max-width: 90vw;
      height: 460px; max-height: 70vh; background: #fff; border-radius: 12px;
      box-shadow: 0 8px 32px rgba(10,22,40,0.25); display: none; flex-direction: column;
      overflow: hidden; z-index: 9999; font-family: 'DM Sans', sans-serif;
    }
    #sl-chat-panel.open { display: flex; }
    #sl-chat-header {
      background: #0a1628; color: #fff; padding: 14px 16px;
      font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 15px;
      display: flex; justify-content: space-between; align-items: center;
    }
    #sl-chat-header span.sub { display: block; font-weight: 400; font-size: 12px; color: #a8c0d6; margin-top: 2px; }
    #sl-chat-close { background: none; border: none; color: #a8c0d6; font-size: 18px; cursor: pointer; }
    #sl-chat-messages { flex: 1; overflow-y: auto; padding: 14px; background: #f7fafc; }
    .sl-msg { margin-bottom: 10px; font-size: 14px; line-height: 1.5; max-width: 85%; padding: 9px 12px; border-radius: 10px; }
    .sl-msg.user { background: #2ec4a9; color: #0a1628; margin-left: auto; border-bottom-right-radius: 2px; }
    .sl-msg.bot { background: #e1f7f3; color: #0a1628; margin-right: auto; border-bottom-left-radius: 2px; }
    .sl-msg.typing { opacity: 0.6; font-style: italic; }
    #sl-chat-form { display: flex; border-top: 1px solid #dde8f0; padding: 10px; gap: 8px; }
    #sl-chat-input {
      flex: 1; border: 1px solid #dde8f0; border-radius: 6px; padding: 9px 10px;
      font-family: 'DM Sans', sans-serif; font-size: 14px; resize: none;
    }
    #sl-chat-send {
      background: #0a1628; color: #fff; border: none; border-radius: 6px;
      padding: 0 14px; font-weight: 600; cursor: pointer; font-family: 'Outfit', sans-serif;
    }
  `;
  document.head.appendChild(style);

  const bubble = document.createElement("button");
  bubble.id = "sl-chat-bubble";
  bubble.innerHTML = "💬";
  bubble.setAttribute("aria-label", "Chat with Sharpline Digital");

  const panel = document.createElement("div");
  panel.id = "sl-chat-panel";
  panel.innerHTML = `
    <div id="sl-chat-header">
      <div>Sharpline Digital<span class="sub">Ask us anything</span></div>
      <button id="sl-chat-close" aria-label="Close chat">✕</button>
    </div>
    <div id="sl-chat-messages">
      <div class="sl-msg bot">Hi! I can answer questions about our web design packages, process, or how to get started. What would you like to know?</div>
    </div>
    <form id="sl-chat-form">
      <textarea id="sl-chat-input" rows="1" placeholder="Type a message..."></textarea>
      <button type="submit" id="sl-chat-send">Send</button>
    </form>
  `;

  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  const messagesEl = panel.querySelector("#sl-chat-messages");
  const formEl = panel.querySelector("#sl-chat-form");
  const inputEl = panel.querySelector("#sl-chat-input");
  const closeBtn = panel.querySelector("#sl-chat-close");

  let history = [];

  bubble.addEventListener("click", () => panel.classList.toggle("open"));
  closeBtn.addEventListener("click", () => panel.classList.remove("open"));

  function addMessage(text, role) {
    const div = document.createElement("div");
    div.className = "sl-msg " + role;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text) return;

    addMessage(text, "user");
    history.push({ role: "user", content: text });
    inputEl.value = "";

    const typingEl = addMessage("Typing...", "bot typing");

    try {
      const res = await fetch(SUPABASE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": "Bearer " + SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      typingEl.remove();

      if (data.error) {
        addMessage("Sorry, something went wrong. Please email hello@sharplinedigital.com.", "bot");
        return;
      }

      addMessage(data.reply, "bot");
      history.push({ role: "assistant", content: data.reply });
    } catch (err) {
      typingEl.remove();
      addMessage("Sorry, something went wrong. Please email hello@sharplinedigital.com.", "bot");
    }
  });

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formEl.requestSubmit();
    }
  });
})();
