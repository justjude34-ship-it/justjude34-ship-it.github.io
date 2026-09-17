const KEY = "pebble-v3";
const DEFAULTS = {
  seenCover: false,
  pin: "0000",
  childName: "",
  sound: false,
  motion: false,
  tap: 0,
  leaves: 0,
  feelings: [],
  day: [
    { id: "wake", label: "Wake up", done: false },
    { id: "eat", label: "Eat", done: false },
    { id: "shoes", label: "Shoes", done: false },
    { id: "go", label: "Go", done: false }
  ]
};
const TAPS = [
  "Hi. I'm here.",
  "We can sit.",
  "I like this nest.",
  "You can tap again.",
  "That is enough."
];
const NEEDS = ["Help", "Break", "Yes", "No", "Hungry", "Toilet", "Wait", "Quiet"];
const FEEL = {
  happy: "I'm glad you said that.",
  sad: "Sad can sit here too.",
  angry: "Angry is allowed.",
  scared: "We can go slow.",
  calm: "We can wait."
};
const $ = (id) => document.getElementById(id);
const state = load();
let hideSpot = 1;

function load() {
  try {
    const raw = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
    if (!Array.isArray(raw.day) || !raw.day.length) raw.day = DEFAULTS.day.map((d) => ({ ...d }));
    raw.leaves = Math.max(0, Math.min(3, Number(raw.leaves) || 0));
    return raw;
  } catch {
    return { ...DEFAULTS, day: DEFAULTS.day.map((d) => ({ ...d })) };
  }
}
function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
function say(text) {
  if (!state.sound || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.86;
  window.speechSynthesis.speak(u);
}
function paintLeaves() {
  document.querySelectorAll(".buddy").forEach((el) => {
    el.classList.remove("leaves-1", "leaves-2", "leaves-3");
    if (state.leaves) el.classList.add("leaves-" + state.leaves);
  });
}
function show(id) {
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("on", v.id === id));
  document.body.classList.toggle("motion-on", !!state.motion);
  const breath = $("breath");
  if (breath) breath.classList.toggle("live", id === "calm");
  paintLeaves();
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
function nowIndex() {
  const i = state.day.findIndex((s) => !s.done);
  return i === -1 ? state.day.length - 1 : i;
}
function renderDay() {
  const box = $("day-list");
  if (!box) return;
  box.innerHTML = "";
  const here = nowIndex();
  state.day.forEach((step, i) => {
    const b = document.createElement("button");
    const mark = step.done ? "Done" : i === here ? "Pebble is here" : "Next";
    b.className = "row" + (step.done ? " done" : "") + (i === here && !step.done ? " now" : "");
    b.innerHTML = '<span class="pip"></span><span class="row-text"><small>' + mark + '</small><b>' + step.label + '</b></span>';
    b.onclick = () => {
      step.done = !step.done;
      save();
      renderDay();
      say(step.done ? "Pebble came too." : step.label);
    };
    box.appendChild(b);
  });
}
function renderNeed() {
  const box = $("need-list");
  if (!box) return;
  box.innerHTML = "";
  NEEDS.forEach((label) => {
    const b = document.createElement("button");
    b.className = "row";
    b.innerHTML = "<b>" + label + "</b>";
    b.onclick = () => {
      $("said-word").textContent = label;
      $("said-note").textContent = "Pebble can say this.";
      say(label);
      show("said");
    };
    box.appendChild(b);
  });
}
function renderDayEdit() {
  const box = $("day-edit");
  if (!box) return;
  box.innerHTML = "";
  state.day.forEach((step, i) => {
    const row = document.createElement("div");
    row.className = "edit-row";
    const input = document.createElement("input");
    input.className = "field";
    input.value = step.label;
    input.maxLength = 24;
    input.oninput = () => { step.label = input.value.slice(0, 24); save(); };
    const del = document.createElement("button");
    del.className = "ghost";
    del.textContent = "x";
    del.onclick = () => {
      if (state.day.length < 2) return;
      state.day.splice(i, 1);
      save();
      renderDayEdit();
    };
    row.appendChild(input);
    row.appendChild(del);
    box.appendChild(row);
  });
}
function setupFind() {
  hideSpot = Math.floor(Math.random() * 3);
  $("find-line").textContent = "Which nest?";
  document.querySelectorAll(".nest-btn").forEach((btn) => {
    btn.classList.remove("found", "empty");
    const mini = btn.querySelector(".mini");
    if (mini) mini.classList.add("hidden");
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
    const line = FEEL[feel] || "That makes sense.";
    $("felt-line").textContent = line;
    say(line);
    show("felt");
  });
});

document.querySelectorAll(".buddy-tap").forEach((el) => {
  el.addEventListener("click", () => {
    state.tap = (state.tap + 1) % TAPS.length;
    save();
    setLine(TAPS[state.tap]);
    el.classList.add("pulse");
    setTimeout(() => el.classList.remove("pulse"), 180);
  });
});

const leafBtn = $("leaf-btn");
if (leafBtn) leafBtn.onclick = () => {
  state.leaves = state.leaves >= 3 ? 0 : state.leaves + 1;
  save();
  paintLeaves();
  setLine(state.leaves ? "Leaf " + state.leaves + " of 3." : "The nest is clear.");
};

document.querySelectorAll(".nest-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const i = Number(btn.getAttribute("data-nest"));
    const mini = btn.querySelector(".mini");
    if (i === hideSpot) {
      btn.classList.add("found");
      if (mini) mini.classList.remove("hidden");
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
    renderDayEdit();
  } else $("pin-note").textContent = "Try again.";
};
$("sound-btn").onclick = () => {
  state.sound = !state.sound;
  save();
  $("sound-btn").textContent = state.sound ? "Sound: on" : "Sound: off";
};
$("motion-btn").onclick = () => {
  state.motion = !state.motion;
  save();
  $("motion-btn").textContent = state.motion ? "Motion: on" : "Motion: off";
  document.body.classList.toggle("motion-on", state.motion);
};
$("save-parent").onclick = () => {
  state.childName = ($("child-name").value || "").trim();
  save();
  $("parent-note").textContent = "Saved on this phone.";
};
const addStep = $("add-step");
if (addStep) addStep.onclick = () => {
  if (state.day.length >= 8) return;
  state.day.push({ id: "s" + Date.now(), label: "Next", done: false });
  save();
  renderDayEdit();
};
const resetDay = $("reset-day");
if (resetDay) resetDay.onclick = () => {
  state.day.forEach((s) => { s.done = false; });
  save();
  $("parent-note").textContent = "Today's stones are fresh.";
};
$("break-btn").onclick = () => { say("We can wait."); $("calm-line").textContent = "We can wait."; };

if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
homeLine();
paintLeaves();
show(state.seenCover ? "home" : "cover");
