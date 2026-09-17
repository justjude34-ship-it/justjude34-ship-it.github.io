const KEY = "pebble-v1";
const DEFAULTS = {
  seenCover: false,
  pin: "0000",
  childName: "",
  sound: false,
  motion: false,
  feelings: [],
  day: [
    { id: "wake", label: "Wake up", done: false },
    { id: "eat", label: "Eat", done: false },
    { id: "shoes", label: "Shoes", done: false },
    { id: "go", label: "Go", done: false }
  ]
};
const NEEDS = [
  { id: "help", label: "Help", icon: "help" },
  { id: "break", label: "Break", icon: "break" },
  { id: "yes", label: "Yes", icon: "yes" },
  { id: "no", label: "No", icon: "no" },
  { id: "hungry", label: "Hungry", icon: "hungry" },
  { id: "toilet", label: "Toilet", icon: "toilet" }
];
const FEEL = {
  happy: "That makes sense.",
  sad: "That makes sense.",
  angry: "That makes sense.",
  scared: "That makes sense.",
  calm: "We can wait."
};
const ICONS = {
  help: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#E8D7B8"/><path d="M16 11v8M12 16h8" stroke="#6B5340" stroke-width="2.4" stroke-linecap="round"/></svg>',
  break: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#D7E4D6"/><path d="M11 16h10" stroke="#4F6A4E" stroke-width="2.4" stroke-linecap="round"/></svg>',
  yes: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#D8E8C8"/><path d="M10 16l4 4 8-9" fill="none" stroke="#4A6A3E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  no: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#EAD3C8"/><path d="M12 12l8 8M20 12l-8 8" stroke="#7A4E3E" stroke-width="2.4" stroke-linecap="round"/></svg>',
  hungry: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#F0E0B8"/><ellipse cx="16" cy="17" rx="7" ry="5" fill="#C9896A"/></svg>',
  toilet: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#D6E3EE"/><path d="M12 12h8v6a4 4 0 01-8 0z" fill="#8AA7C2"/></svg>'
};
const $ = (id) => document.getElementById(id);
const state = load();
function load() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
  catch { return { ...DEFAULTS }; }
}
function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
function say(text) {
  if (!state.sound || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.86;
  window.speechSynthesis.speak(u);
}
function show(id) {
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("on", v.id === id));
  document.body.classList.toggle("motion-on", !!state.motion);
  const breath = $("breath");
  if (breath) breath.classList.toggle("live", id === "calm");
}
function homeLine() {
  const name = (state.childName || "").trim();
  $("home-line").textContent = name ? "Hi " + name + ". I'm here." : "Hi. I'm here.";
}
function renderDay() {
  const box = $("day-list");
  box.innerHTML = "";
  state.day.forEach((step, i) => {
    const b = document.createElement("button");
    const mark = step.done ? "Done" : (i === 0 || state.day[i - 1].done ? "Now" : "Next");
    b.className = "row" + (step.done ? " done" : "");
    b.innerHTML = '<span class="pip"></span><span class="row-text"><small>' + mark + '</small><b>' + step.label + '</b></span>';
    b.onclick = () => { step.done = !step.done; save(); renderDay(); say(step.done ? "You did it." : step.label); };
    box.appendChild(b);
  });
}
function renderNeed() {
  const box = $("need-list");
  box.innerHTML = "";
  NEEDS.forEach((n) => {
    const b = document.createElement("button");
    b.className = "row";
    b.innerHTML = '<span class="ico">' + ICONS[n.icon] + '</span><b>' + n.label + '</b>';
    b.onclick = () => say(n.label);
    box.appendChild(b);
  });
}
document.querySelectorAll("[data-go]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const go = btn.getAttribute("data-go");
    if (go === "day") renderDay();
    if (go === "need") renderNeed();
    if (go === "feelings") say("You can tell me.");
    if (go === "calm") say("Slow breath.");
    if (go === "home") homeLine();
    show(go);
  });
});
document.querySelectorAll("[data-feel]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const feel = btn.getAttribute("data-feel");
    state.feelings.push({ feel, at: Date.now() });
    if (state.feelings.length > 40) state.feelings = state.feelings.slice(-40);
    save();
    $("felt-line").textContent = FEEL[feel] || "That makes sense.";
    say(FEEL[feel] || "That makes sense.");
    show("felt");
  });
});
$("enter-btn").onclick = () => { state.seenCover = true; save(); homeLine(); show("home"); say("Hi. I'm here."); };
$("lock-btn").onclick = () => {
  $("pin-input").value = "";
  $("pin-note").textContent = state.pin === "0000" ? "First time: type 0000." : "";
  $("pin-gate").classList.remove("hidden");
  $("parent-home").classList.add("hidden");
  show("parent");
};
$("pin-btn").onclick = () => {
  if (($("pin-input").value || "") === state.pin) {
    $("pin-gate").classList.add("hidden");
    $("parent-home").classList.remove("hidden");
    $("child-name").value = state.childName;
    $("sound-btn").textContent = state.sound ? "Sound: on" : "Sound: off";
    $("motion-btn").textContent = state.motion ? "Motion: on" : "Motion: off";
  } else $("pin-note").textContent = "Try again.";
};
$("sound-btn").onclick = () => { state.sound = !state.sound; $("sound-btn").textContent = state.sound ? "Sound: on" : "Sound: off"; };
$("motion-btn").onclick = () => {
  state.motion = !state.motion;
  $("motion-btn").textContent = state.motion ? "Motion: on" : "Motion: off";
  document.body.classList.toggle("motion-on", state.motion);
};
$("save-parent").onclick = () => {
  state.childName = ($("child-name").value || "").trim();
  save();
  $("parent-note").textContent = "Saved on this phone.";
  homeLine();
};
$("break-btn").onclick = () => { say("We can wait."); $("calm-line").textContent = "We can wait."; };
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
homeLine();
show(state.seenCover ? "home" : "cover");
