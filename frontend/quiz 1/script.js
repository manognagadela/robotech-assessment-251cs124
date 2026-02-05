const options = document.querySelectorAll("input[type=radio]");
const clearBtn = document.getElementById("clear");
const markBtn = document.getElementById("mark");
const qBtn = document.querySelector(".q-btn");
const submitBtn = document.getElementById("submit");
const timeText = document.getElementById("time");

let time = 15;

/* Answer selected */
options.forEach(opt => {
  opt.addEventListener("change", () => {
    qBtn.className = "q-btn answered";
  });
});

/* Clear answer */
clearBtn.onclick = () => {
  options.forEach(o => o.checked = false);
  qBtn.className = "q-btn unanswered";
};

/* Mark for review */
markBtn.onclick = () => {
  qBtn.className = "q-btn marked";
};

/* Fake timer */
setInterval(() => {
  time--;
  timeText.innerText = time;

  if (time <= 10) {
    submitBtn.disabled = false;
  }
}, 60000);