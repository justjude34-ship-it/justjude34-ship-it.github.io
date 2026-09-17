const KEY = "pebble-v2";
const DEFAULTS = {
  seenCover: false,
  pin: "0000",
  childName: "",
  sound: false,
  motion: false,
  tap: 0,
  leaf: false,
  feelings: [],
  day: [
    { id: "wake", label: "Wake up", done: false },
    { id: "eat", label: "Eat", done: false },
    { id: "shoes", label: "Shoes", done: false },
    { id: "go", label: "Go", done: false }
  ]
};
const TAPS = ["Hi. I'm here.", "We can sit.", "I like this nest.", "That is enough."];
const NEEDS = [
  { id: "help", label: "Help" },
  { id: "break", label: "Break" },
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
  { id: "hungry", label: "Hungry" },
  { id: "toilet", label: "Toilet" }
];
const FEEL = {
  happy: "That makes sense.",
  sad: "That makes sense.",
  angry: "That makes sense.",
  scared: "That makes sense.",
  calm: "We can wait."
};
const $ = (id) => document.getElementById(id);
const state = load();
let hideSpot = 1;

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
  document.querySelectorAll(".buddy").forEach((el) => el.classList.toggle("leaf", !!state.leaf));
}
function setLine(text) {
  const el = $("home-line");
  if (el) el.textContent = text;
  say(text);
}
function homeLine() {
  const name = (state.childName || "").trim();
  setLine(name ? "Hi " + name + ". I'm here." : TAPS[state.tap % TAPS.length]);
}
function renderDay() {
  const box = $("day-list");
  box.innerHTML = "";
  state.day.forEach((step, i) => {
    const b = document.createElement("button");
    const mark = step.done ? "Done" : (i === 0 || state.day[i - 1].done ? "Now" : "Next");
    b.className = "row" + (step.done ? " done" : "");
    b.innerHTML = '<span class="pip"></span><span class="row-text"><small>' + mark + '</small><b>' + step.label + '</b></span>';
    b.onclick = () => { step.done = !step.done; save(); renderDay(); say(step.done ? "Pebble came too." : step.label); };
    box.appendChild(b);
  });
}
function renderNeed() {
  const box = $("need-list");
  box.innerHTML = "";
  NEEDS.forEach((n) => {
    const b = document.createElement("button");
    b.className = "row";
    b.innerHTML = "<b>" + n.label + "</b>";
    b.onclick = () => say(n.label);
    box.appendChild(b);
  });
}
function setupFind() {
  hideSpot = Math.floor(Math.random() * 3);
  $("find-line").textContent = "Which nest?";
  document.querySelectorAll(".nest-btn").forEach((btn, i) => {
    btn.classList.remove("found", "empty");
    btn.querySelector(".mini").classList.add("hidden");
  });
}

document.querySelectorAll("[data-go]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const go = btn.getAttribute("data-go");
    if (go === "day") renderDay();
    if (go === "need") renderNeed();
    if (go === "find") setupFind();
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

const tapBtns = document.querySelectorAll(".buddy-tap");
tapBtns.forEach((el) => {
  el.addEventListener("click", () => {
    state.tap = (state.tap + 1) % TAPS.length;
    save();
    setLine(TAPS[state.tap]);
  });
});
const leafBtn = $("leaf-btn");
if (leafBtn) leafBtn.onclick = () => {
  state.leaf = !state.leaf;
  save();
  document.querySelectorAll(".buddy").forEach((el) => el.classList.toggle("leaf", state.leaf));
  setLine(state.leaf ? "A leaf for Pebble." : "Back in the nest.");
};
document.querySelectorAll(".nest-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const i = Number(btn.getAttribute("data-nest"));
    const mini = btn.querySelector(".mini");
    if (i === hideSpot) {
      btn.classList.add("found");
      mini.classList.remove("hidden");
      $("find-line").textContent = "You found Pebble.";
      say("You found Pebble.");
    } else {
      btn.classList.add("empty");
      $("find-line").textContent = "Not this nest.";
      say("Not this nest.");
    }
  });
});
const againBtn = $("find-again");
if (againBtn) againBtn.onclick = () => { setupFind(); say("Which nest?"); };

$("enter-btn").onclick = () => { state.seenCover = true; save(); homeLine(); show("home"); };
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
};
$("break-btn").onclick = () => { say("We can wait."); $("calm-line").textContent = "We can wait."; };
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
homeLine();
show(state.seenCover ? "home" : "cover");
