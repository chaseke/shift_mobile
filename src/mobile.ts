// ▼ 1. 型定義と状態管理 ▼
interface ShiftData {
    dateStr: string; // "YYYY-MM-DD" の形式で保存
    jrHigh: number;
    highSchool: number;
}

let shiftDataList: ShiftData[] = [];
let selectedDateStr: string = "";

// 自動保存用のカギ（LocalStorageのキー）
const STORAGE_KEY = "shiftApp_mobile_v1";

// ▼ 2. 自動保存 (LocalStorage) の仕組み ▼
function saveData(): void {
    // データを文字列に変換してブラウザの倉庫に保存
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shiftDataList));
}

function loadData(): void {
    // ブラウザの倉庫からデータを読み込む
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        shiftDataList = JSON.parse(stored);
    }
}

// 特定の日付のデータを取得する（無ければ新しく作る）
function getShift(dateStr: string): ShiftData {
    let shift = shiftDataList.find(s => s.dateStr === dateStr);
    if (!shift) {
        shift = { dateStr, jrHigh: 0, highSchool: 0 };
        shiftDataList.push(shift);
    }
    return shift;
}

// ▼ 3. 初期化とカレンダー描画 ▼
window.onload = function (): void {
    loadData(); // アプリを開いた瞬間に前回のデータを復元！
    setupDateSelectors();
    initCalendar();
};

function setupDateSelectors(): void {
    const now: Date = new Date();
    const yearSelect = document.getElementById('select-year') as HTMLSelectElement | null;
    const monthSelect = document.getElementById('select-month') as HTMLSelectElement | null;
    if (!yearSelect || !monthSelect) return;

    for (let y = now.getFullYear(); y <= now.getFullYear() + 1; y++) {
        yearSelect.options.add(new Option(y.toString(), y.toString()));
    }
    for (let m = 1; m <= 12; m++) {
        monthSelect.options.add(new Option(m.toString(), m.toString()));
    }
    yearSelect.value = now.getFullYear().toString();
    monthSelect.value = (now.getMonth() + 1).toString();

    yearSelect.addEventListener('change', initCalendar);
    monthSelect.addEventListener('change', initCalendar);
}

function initCalendar(): void {
    const yearSelect = document.getElementById('select-year') as HTMLSelectElement;
    const monthSelect = document.getElementById('select-month') as HTMLSelectElement;
    const year: number = parseInt(yearSelect.value);
    const month: number = parseInt(monthSelect.value);

    // 表示期間ラベルの更新
    const nextMonth = month === 12 ? 1 : month + 1;
    document.getElementById('date-range-label')!.innerText = `${month}月16日 〜 ${nextMonth}月15日`;

    const calendarDiv = document.getElementById('calendar') as HTMLDivElement;
    calendarDiv.innerHTML = '';

    // 期間の計算 (前月16日〜当月15日)
    const startDate = new Date(year, month - 1, 16);
    const endDate = new Date(year, month, 15);
    
    // カレンダーの最初の空白マス（曜日合わせ）
    const firstDayOfWeek = startDate.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        calendarDiv.appendChild(emptyCell);
    }

    // 1日ずつマスを生成
    let currentDate = new Date(startDate);
    let firstDateStr = "";

    while (currentDate <= endDate) {
        const y = currentDate.getFullYear();
        const m = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const d = currentDate.getDate().toString().padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        
        if (!firstDateStr) firstDateStr = dateStr; // 最初の日にちを記憶

        const shift = getShift(dateStr);
        const cell = document.createElement('div');
        cell.className = 'day-cell';
        if (dateStr === selectedDateStr) cell.classList.add('active-day');

        // タップされた時の処理を設定
        cell.onclick = () => selectDate(dateStr, currentDate.getDay());

        // アイコンと数字のHTMLを組み立てる
        let html = `<div class="date-label">${currentDate.getDate()}</div>`;
        if (shift.jrHigh > 0) {
            html += `<div class="koma-row"><span class="material-symbols-outlined icon-jrhigh">backpack</span> ${shift.jrHigh}</div>`;
        }
        if (shift.highSchool > 0) {
            html += `<div class="koma-row"><span class="material-symbols-outlined icon-hs">school</span> ${shift.highSchool}</div>`;
        }
        
        cell.innerHTML = html;
        calendarDiv.appendChild(cell);

        currentDate.setDate(currentDate.getDate() + 1);
    }

    // 選択されている日が無ければ、最初の日にちを選択状態にする
    if (!selectedDateStr) selectDate(firstDateStr, startDate.getDay());
}

// ▼ 4. 操作パネルの処理 ▼
const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

function selectDate(dateStr: string, dayOfWeek: number): void {
    selectedDateStr = dateStr;
    
    // タイトルの更新 (例: 5月16日 (木))
    const [y, m, d] = dateStr.split('-');
    document.getElementById('detail-date-title')!.innerText = `${parseInt(m)}月${parseInt(d)}日 (${weekdays[dayOfWeek]})`;
    
    updatePanelDisplay();
    initCalendar(); // カレンダーの選択枠を再描画
}

function updatePanelDisplay(): void {
    const shift = getShift(selectedDateStr);
    document.getElementById('detail-jrhigh-count')!.innerText = shift.jrHigh.toString();
    document.getElementById('detail-hs-count')!.innerText = shift.highSchool.toString();
}

function updateKoma(type: 'jrHigh' | 'highSchool', amount: number): void {
    const shift = getShift(selectedDateStr);
    if (type === 'jrHigh') {
        shift.jrHigh = Math.max(0, shift.jrHigh + amount); // 0未満にならないようにする
    } else {
        shift.highSchool = Math.max(0, shift.highSchool + amount);
    }
    
    saveData(); // 変更された瞬間に自動保存！
    updatePanelDisplay();
    initCalendar(); // カレンダーのアイコンも即座に更新
}

// タブ切り替え関数
function switchPage(target: 'shift' | 'regular' | 'wage', btnElement?: HTMLElement): void {
    const pages = ['shift', 'regular', 'wage'];
    pages.forEach(p => document.getElementById(`page-${p}`)?.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`page-${target}`)?.classList.add('active');
    if (btnElement) btnElement.classList.add('active');
}

// HTMLから呼び出せるように公開
(window as any).updateKoma = updateKoma;
(window as any).switchPage = switchPage;