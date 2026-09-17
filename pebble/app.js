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

function load() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...DEFAULTS };
  }
}
function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}
function say(text) {
  if (!state.sound || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.86;
  u.pitch = 1;
  window.speechSynthesis.speak(u);
}
function show(id) {
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("on", v.id === id));
  document.body.classList.toggle("motion-on", !!state.motion);
  if (id === "calm") $("breath").classList.add("live");
  else $("breath").classList.remove("live");
}
function homeLine() {
  const name = (state.childName || "").trim();
  $("home-line").textContent = name ? `Hi ${name}. I'm here.` : "Hi. I'm here.";
}
function renderDay() {
  const box = $("day-list");
  box.innerHTML = "";
  state.day.forEach((step, i) => {
    const b = document.createElement("button");
    b.className = "need";
    const mark = step.done ? "Done" : (i === 0 || state.day[i - 1].done ? "Now" : "Next");
    b.innerHTML = '<span class="dot" style="background:' + (step.done ? "#6B7F6A" : "#C4B8A8") + '"></span>' + mark + " \u00b7 " + step.label;
    b.onclick = () => {
      step.done = !step.done;
      save();
      renderDay();
      say(step.done ? "You did it." : step.label);
    };
    box.appendChild(b);
  });
}
function renderNeed() {
  const box = $("need-list");
  box.innerHTML = "";
  NEEDS.forEach((n) => {
    const b = document.createElement("button");
    b.className = "need";
    b.textContent = n.label;
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

$("enter-btn").onclick = () => {
  state.seenCover = true;
  save();
  homeLine();
  show("home");
  say("Hi. I'm here.");
};
$("lock-btn").onclick = () => {
  $("pin-input").value = "";
  $("pin-note").textContent = state.pin === "0000" ? "First time: type 0000, then you can change it later." : "";
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
  } else {
    $("pin-note").textContent = "Try again.";
  }
};
$("sound-btn").onclick = () => {
  state.sound = !state.sound;
  $("sound-btn").textContent = state.sound ? "Sound: on" : "Sound: off";
};
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
$("break-btn").onclick = () => {
  say("We can wait.");
  $("calm-line").textContent = "We can wait.";
};

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

homeLine();
show(state.seenCover ? "home" : "cover");
