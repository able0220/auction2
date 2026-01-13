// 전역 변수
let highestBid = 0;
let highestTeam = "-";
let currentRound = 1;
let timer = 5;
let interval;
let lastState = null; // 되돌리기용 상태 저장

const teams = {
  "1": { balance: 1000, totalSpent: 0, items: [], lastBid: 0 },
  "2": { balance: 1000, totalSpent: 0, items: [], lastBid: 0 },
  "3": { balance: 1000, totalSpent: 0, items: [], lastBid: 0 },
  "4": { balance: 1000, totalSpent: 0, items: [], lastBid: 0 },
  "5": { balance: 1000, totalSpent: 0, items: [], lastBid: 0 },
  "6": { balance: 1000, totalSpent: 0, items: [], lastBid: 0 },
};


// ✅ 경매 숫자: 고정 순서 (원하면 여기 배열만 바꾸면 됨)
const items = [7,1,3,14,15,10,11,12,9,2,8,4,13,5,6];

const unsoldItems = [];

// UI 반영
function updateDisplay() {
  document.getElementById("highestBid").innerText = highestBid;
  document.getElementById("highestTeam").innerText = highestTeam;

  Object.keys(teams).forEach(team => {
    // balance
    document.getElementById(`balance${team}`).innerText = teams[team].balance;

    // items + 합계
    const itemsCell = document.getElementById(`items${team}`);
    itemsCell.innerText = teams[team].items.length ? teams[team].items.join(", ") : "-";
    if (teams[team].items.length) {
      itemsCell.classList.remove("placeholder");
    } else {
      itemsCell.classList.add("placeholder");
    }
    document.getElementById(`sum${team}`).innerText =
      teams[team].items.reduce((sum, num) => sum + num, 0);
  });

  document.getElementById("unsoldItems").innerText =
    unsoldItems.length ? unsoldItems.join(", ") : "-";

  const currentItemElement = document.getElementById("currentItem");
  currentItemElement.innerText = currentRound <= items.length ? items[currentRound - 1] : "종료";
  currentItemElement.style.color = 'red';

  // 회차 표시
  document.getElementById("currentRound").innerText = `${Math.min(currentRound, items.length)}/${items.length}`;
}

function startTimer() {
  clearInterval(interval);
  timer = 5;
  document.getElementById("timer").innerText = timer;

  interval = setInterval(() => {
    timer--;
    document.getElementById("timer").innerText = timer;
    if (timer <= 0) {
      clearInterval(interval);
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(interval);
  timer = 5;
  document.getElementById("timer").innerText = timer;

  interval = setInterval(() => {
    timer--;
    document.getElementById("timer").innerText = timer;
    if (timer <= 0) {
      clearInterval(interval);
      document.getElementById("nextRoundButton").disabled = false;
    }
  }, 1000);
}

function saveLastState() {
  lastState = {
    highestBid,
    highestTeam,
    currentRound,
    unsoldItems: [...unsoldItems],
    teams: JSON.parse(JSON.stringify(teams))
  };
}

function undoLastBid() {
  if (!lastState) {
    alert("되돌릴 수 있는 이전 상태가 없습니다.");
    return;
  }
  highestBid = lastState.highestBid;
  highestTeam = lastState.highestTeam;
  currentRound = lastState.currentRound;
  // 배열 복원
  unsoldItems.length = 0;
  unsoldItems.push(...lastState.unsoldItems);
  // 팀 복원
  Object.keys(teams).forEach(team => {
    teams[team] = { ...lastState.teams[team] };
  });
  updateDisplay();
}

// 입찰
function customBid(team) {
  saveLastState();
  const input = parseInt(prompt(`${team} 팀이 입찰할 금액을 입력하세요:`), 10);
  const additionalCost = input - teams[team].lastBid;

  if (!isNaN(input) && input > highestBid) {
    if (teams[team].balance >= additionalCost) {
      teams[team].balance -= additionalCost;
      teams[team].lastBid = input;
      highestBid = input;
      highestTeam = team;
      updateDisplay();
      resetTimer();
    } else {
      alert(`${team} 팀의 잔액이 부족합니다.`);
    }
  } else {
    alert("유효한 금액을 입력하거나 현재 최고 금액보다 높은 금액을 입력하세요.");
  }
}

// 라운드 진행
function nextRound() {
  if (currentRound > items.length) return;

  saveLastState();
  const currentItem = items[currentRound - 1];

  if (highestTeam !== "-") {
    teams[highestTeam].items.push(currentItem);
    teams[highestTeam].totalSpent += highestBid;
  } else {
    unsoldItems.push(currentItem);
  }

  // 다음 라운드 준비
  Object.keys(teams).forEach(team => {
    if (team !== highestTeam) {
      teams[team].balance = 1000 - teams[team].totalSpent;
    }
    teams[team].lastBid = 0;
  });

  highestBid = 0;
  highestTeam = "-";

  // 종료 체크
  if (currentRound === items.length) {
    updateDisplay();
    alert("경매가 종료되었습니다!");
    document.getElementById("nextRoundButton").disabled = true;
    clearInterval(interval);
    document.getElementById("currentItem").innerText = "종료";
    return;
  }

  currentRound++;
  updateDisplay();
  resetTimer();
}

// 시작
function startAuction() {
  document.getElementById("startButton").disabled = true;
  document.getElementById("nextRoundButton").disabled = false;
  document.getElementById("randomOrder").innerText = items.join(", ");
  document.getElementById("currentItem").innerText = items[0];
  document.getElementById("currentItem").style.color = 'red';
  updateDisplay();
  resetTimer();
}

// ====== [정정 기능] 표 직접 수정 핸들러 ======
function clampNumber(n) {
  if (isNaN(n)) return null;
  return Math.max(0, Math.floor(n));
}

function parseItemsString(str) {
  // "1, 3,10" 같은 입력을 [1,3,10]으로
  if (!str || str.trim() === "-" || str.trim() === "") return [];
  const nums = str.split(",")
    .map(s => clampNumber(parseInt(s.trim(), 10)))
    .filter(n => n !== null);
  return nums;
}

function handleCellCommit(e) {
  if (e.type === "keydown" && e.key !== "Enter") return;
  e.preventDefault?.();

  const cell = e.currentTarget;
  const team = cell.getAttribute("data-team");
  const field = cell.getAttribute("data-field");
  const raw = cell.innerText.trim();

  if (!teams[team]) return;

  if (field === "balance") {
    const val = clampNumber(parseInt(raw, 10));
    if (val === null) {
      // 되돌림 (현재 state 값으로 복구)
      cell.innerText = teams[team].balance;
      return;
    }
    // balance를 직접 고치면 totalSpent도 일관성 맞춰 갱신 (1000 - balance)
    teams[team].balance = val;
    teams[team].totalSpent = Math.max(0, 1000 - val);
  } else if (field === "items") {
    const list = parseItemsString(raw);
    teams[team].items = list;
    // 시각 표시용 placeholder 처리
    if (list.length === 0) {
      cell.innerText = "-";
      cell.classList.add("placeholder");
    } else {
      cell.innerText = list.join(", ");
      cell.classList.remove("placeholder");
    }
  }

  updateDisplay();
}

// Enter로 확정, blur로도 반영
function attachEditableHandlers() {
  const editableCells = document.querySelectorAll('td[contenteditable="true"]');
  editableCells.forEach(td => {
    td.addEventListener("keydown", handleCellCommit);
    td.addEventListener("blur", handleCellCommit);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("randomOrder").innerText = items.join(", ");
  document.getElementById("currentItem").style.color = 'red';
  attachEditableHandlers();
  updateDisplay();
});
