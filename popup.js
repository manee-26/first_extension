const greetings = [
  "Hello, World! 🌍",
  "Hey there! 👋",
  "Hi! How's it going? 😊",
  "Greetings, Explorer! 🚀",
  "Ahoy! Welcome aboard! ⚓",
  "Bonjour! 🥐",
  "こんにちは! 🌸",
  "Hola! ¿Cómo estás? 🎉",
];

let greetIndex = 0;

document.getElementById("greetBtn").addEventListener("click", () => {
  const messageEl = document.getElementById("message");

  // Cycle through greetings
  messageEl.textContent = greetings[greetIndex % greetings.length];
  greetIndex++;

  // Show with animation
  messageEl.classList.remove("visible");
  // Force reflow so transition triggers
  void messageEl.offsetWidth;
  messageEl.classList.add("visible");
});
