// The "other person": once the server has my message, they type for a bit,
// then reply in their own style.
import { newMessage, useChat, type Persona } from "./store";

export function replyTo(contactId: string, text: string) {
  const { conversations, setTyping, add } = useChat.getState();
  const persona = conversations[contactId]?.contact.persona;
  if (!persona) return;
  const typingFor = 900 + Math.min(text.length * 45, 2400);
  setTimeout(() => setTyping(contactId, 1), 500);
  setTimeout(() => {
    setTyping(contactId, -1);
    add(contactId, newMessage(contactId, respond(persona, text)));
  }, 500 + typingFor);
}

const emoji: Record<string, string> = {
  love: "❤️", like: "👍", happy: "😊", sad: "😢", lol: "😂", haha: "😂", cool: "😎", fire: "🔥",
  hi: "👋", hello: "👋", hey: "👋", bye: "👋", yes: "✅", no: "❌", ok: "👌", okay: "👌", thanks: "🙏",
  coffee: "☕️", pizza: "🍕", beer: "🍺", cake: "🎂", party: "🎉", cat: "🐱", dog: "🐶", sun: "☀️",
  rain: "🌧️", music: "🎵", book: "📚", game: "🎮", run: "🏃", money: "💸", idea: "💡", time: "⏰",
};

function respond(persona: Persona, text: string): string {
  switch (persona) {
    case "emoji": {
      let matched = false;
      const reply = text.replace(/[a-z]+/gi, (word) => {
        const e = emoji[word.toLowerCase()];
        if (e) matched = true;
        return e ?? word;
      });
      return matched ? reply : `${text} ✨`;
    }
    case "shout":
      return `${text.toUpperCase()}!!`;
    case "mirror":
      // By code point, so emoji survive the trip.
      return [...text].reverse().join("");
    case "pirate":
      return `Arr, ${text.charAt(0).toLowerCase()}${text.slice(1)} 🏴‍☠️`;
  }
}
