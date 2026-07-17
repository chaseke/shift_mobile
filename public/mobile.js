"use strict";
// ▼ 2. 状態管理と保存ロジック ▼
let shiftDataList = [];
let regularSettings = Array(7).fill(null).map(() => ({ jrHigh: 0, highSchool: 0 }));
let wageSettings = { admin: 1100, jrHigh: 1300, highSchool: 1460, tutor: 1200, transport: 0 };
let selectedDateStr = "";
const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
const KEY_SHIFT = "shiftApp_mobile_shifts";
const KEY_REGULAR = "shiftApp_mobile_regular";
const KEY_WAGE = "shiftApp_mobile_wage";
function loadData() {
    const s = localStorage.getItem(KEY_SHIFT);
    if (s)
        shiftDataList = JSON.parse(s);
    const r = localStorage.getItem(KEY_REGULAR);
    if (r)
        regularSettings = JSON.parse(r);
    const w = localStorage.getItem(KEY_WAGE);
    if (w)
        wageSettings = JSON.parse(w);
}
function saveShifts() { localStorage.setItem(KEY_SHIFT, JSON.stringify(shiftDataList)); }
function saveRegularSettings() {
    localStorage.setItem(KEY_REGULAR, JSON.stringify(regularSettings));
    // alert("レギュラー設定を保存しました。");
}
function saveWageSettings() {
    wageSettings.admin = parseInt(document.getElementById('wage-admin').value) || 0;
    wageSettings.jrHigh = parseInt(document.getElementById('wage-jrhigh').value) || 0;
    wageSettings.highSchool = parseInt(document.getElementById('wage-high').value) || 0;
    wageSettings.tutor = parseInt(document.getElementById('wage-tutor').value) || 0;
    wageSettings.transport = parseInt(document.getElementById('wage-transport').value) || 0;
    localStorage.setItem(KEY_WAGE, JSON.stringify(wageSettings));
    // alert("時給設定を保存しました。");
}
function getShift(dateStr) {
    let shift = shiftDataList.find(s => s.dateStr === dateStr);
    if (!shift) {
        shift = { dateStr, jrHigh: 0, highSchool: 0, tutor: 0, adjust: 0 };
        shiftDataList.push(shift);
    }
    return shift;
}
// ▼ 3. 初期化 ▼
window.onload = () => {
    loadData();
    setupDateSelectors();
    initCalendar();
    renderRegularSettings();
    // 時給設定のフォームに初期値をセット
    document.getElementById('wage-admin').value = wageSettings.admin.toString();
    document.getElementById('wage-jrhigh').value = wageSettings.jrHigh.toString();
    document.getElementById('wage-high').value = wageSettings.highSchool.toString();
    document.getElementById('wage-tutor').value = wageSettings.tutor.toString();
    document.getElementById('wage-transport').value = wageSettings.transport.toString();
};
function setupDateSelectors() {
    const now = new Date();
    const yearSelect = document.getElementById('select-year');
    const monthSelect = document.getElementById('select-month');
    for (let y = now.getFullYear() - 1; y <= now.getFullYear() + 1; y++)
        yearSelect.options.add(new Option(y.toString(), y.toString()));
    for (let m = 1; m <= 12; m++)
        monthSelect.options.add(new Option(m.toString(), m.toString()));
    yearSelect.value = now.getFullYear().toString();
    monthSelect.value = (now.getMonth() + 1).toString();
    yearSelect.addEventListener('change', initCalendar);
    monthSelect.addEventListener('change', initCalendar);
}
// ▼ 4. カレンダー・UI描画 ▼
function initCalendar() {
    const yearSelect = document.getElementById('select-year');
    const monthSelect = document.getElementById('select-month');
    const year = parseInt(yearSelect.value);
    const month = parseInt(monthSelect.value);
    // ヘッダーの文字を「7月度」のように更新
    document.getElementById('main-month-title').innerText = `${month}月度`;
    const nextMonth = month === 12 ? 1 : month + 1;
    document.getElementById('sub-month-title').innerText = `${month}.16 - ${nextMonth}.15`;
    const calendarDiv = document.getElementById('calendar');
    if (!calendarDiv)
        return; // 安全のためのチェック
    calendarDiv.innerHTML = '';
    const startDate = new Date(year, month - 1, 16);
    const endDate = new Date(year, month, 15);
    for (let i = 0; i < startDate.getDay(); i++)
        calendarDiv.appendChild(document.createElement('div'));
    let currentDate = new Date(startDate);
    let firstDateStr = "";
    while (currentDate <= endDate) {
        const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
        if (!firstDateStr)
            firstDateStr = dateStr;
        const shift = getShift(dateStr);
        const cell = document.createElement('div');
        cell.className = `day-cell ${dateStr === selectedDateStr ? 'active-day' : ''}`;
        cell.onclick = () => selectDate(dateStr, new Date(dateStr).getDay());
        let html = `<div class="date-label">${currentDate.getDate()}</div>`;
        if (shift.jrHigh > 0)
            html += `<div class="koma-row"><span class="material-symbols-outlined icon-jrhigh">backpack</span> ${shift.jrHigh}</div>`;
        if (shift.highSchool > 0)
            html += `<div class="koma-row"><span class="material-symbols-outlined icon-hs">school</span> ${shift.highSchool}</div>`;
        if (shift.tutor > 0)
            html += `<div class="koma-row"><span class="material-symbols-outlined icon-tutor">local_library</span> ${shift.tutor}</div>`;
        cell.innerHTML = html;
        calendarDiv.appendChild(cell);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    if (!selectedDateStr)
        selectDate(firstDateStr, startDate.getDay());
    calculateAll();
}
function selectDate(dateStr, dayOfWeek) {
    selectedDateStr = dateStr;
    const [y, m, d] = dateStr.split('-');
    document.getElementById('detail-date-title').innerText = `${parseInt(m)}月${parseInt(d)}日 (${weekdays[dayOfWeek]})`;
    updatePanelDisplay();
    initCalendar();
}
function updatePanelDisplay() {
    const shift = getShift(selectedDateStr);
    document.getElementById('detail-jrhigh-count').innerText = shift.jrHigh.toString();
    document.getElementById('detail-hs-count').innerText = shift.highSchool.toString();
}
function updateKoma(type, amount) {
    const shift = getShift(selectedDateStr);
    if (type === 'jrHigh')
        shift.jrHigh = Math.max(0, shift.jrHigh + amount);
    else
        shift.highSchool = Math.max(0, shift.highSchool + amount);
    saveShifts();
    updatePanelDisplay();
    initCalendar();
}
// ▼ 5. モーダル（チューター・時間調整） ▼
function openDetailModal() {
    const shift = getShift(selectedDateStr);
    document.getElementById('modal-tutor-count').innerText = shift.tutor.toString();
    document.getElementById('modal-adjust-count').innerText = `${shift.adjust}分`;
    document.getElementById('detail-modal').style.display = 'flex';
}
function closeDetailModal() {
    document.getElementById('detail-modal').style.display = 'none';
    initCalendar(); // カレンダーのチューター表示を更新
}
function updateModalTutor(amount) {
    const shift = getShift(selectedDateStr);
    shift.tutor = Math.max(0, shift.tutor + amount);
    document.getElementById('modal-tutor-count').innerText = shift.tutor.toString();
    saveShifts();
}
function updateModalAdjust(amount) {
    const shift = getShift(selectedDateStr);
    shift.adjust += amount;
    document.getElementById('modal-adjust-count').innerText = `${shift.adjust}分`;
    saveShifts();
}
// ▼ 6. レギュラー設定と一括反映 ▼
function renderRegularSettings() {
    const container = document.getElementById('regular-container');
    container.innerHTML = '';
    const displayOrder = [1, 2, 3, 4, 5, 6, 0]; // 月〜日
    displayOrder.forEach(day => {
        const html = `
            <div class="ios-list-item" style="flex-direction: column; align-items: flex-start;">
                <div style="font-weight: bold; margin-bottom: 8px;">${weekdays[day]}曜日</div>
                <div style="display: flex; gap: 16px; width: 100%;">
                    <div style="display: flex; align-items: center; color: #8e8e93; font-size: 14px;">
                        小中: 
                        <button class="btn-circle" style="width: 24px; height: 24px; font-size: 14px; margin: 0 8px;" onclick="changeReg(${day}, 'jrHigh', -1)">-</button>
                        <span id="reg-jr-${day}" style="color:#000; font-weight:bold; width: 15px; text-align:center;">${regularSettings[day].jrHigh}</span>
                        <button class="btn-circle" style="width: 24px; height: 24px; font-size: 14px; margin: 0 8px;" onclick="changeReg(${day}, 'jrHigh', 1)">+</button>
                    </div>
                    <div style="display: flex; align-items: center; color: #8e8e93; font-size: 14px;">
                        高校: 
                        <button class="btn-circle" style="width: 24px; height: 24px; font-size: 14px; margin: 0 8px;" onclick="changeReg(${day}, 'hs', -1)">-</button>
                        <span id="reg-hs-${day}" style="color:#000; font-weight:bold; width: 15px; text-align:center;">${regularSettings[day].highSchool}</span>
                        <button class="btn-circle" style="width: 24px; height: 24px; font-size: 14px; margin: 0 8px;" onclick="changeReg(${day}, 'hs', 1)">+</button>
                    </div>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', html);
    });
}
function changeReg(day, type, amount) {
    if (type === 'jrHigh')
        regularSettings[day].jrHigh = Math.max(0, regularSettings[day].jrHigh + amount);
    else
        regularSettings[day].highSchool = Math.max(0, regularSettings[day].highSchool + amount);
    renderRegularSettings();
    saveRegularSettings();
}
function applyRegularShifts() {
    const year = parseInt(document.getElementById('select-year').value);
    const month = parseInt(document.getElementById('select-month').value);
    const startDate = new Date(year, month - 1, 16);
    const endDate = new Date(year, month, 15);
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
        const shift = getShift(dateStr);
        const dayOfWeek = currentDate.getDay();
        shift.jrHigh = regularSettings[dayOfWeek].jrHigh;
        shift.highSchool = regularSettings[dayOfWeek].highSchool;
        currentDate.setDate(currentDate.getDate() + 1);
    }
    saveShifts();
    // 追加: 反映後にカレンダーを再描画し、シフト画面（タブの1番目）に自動遷移する
    initCalendar();
    const shiftTabBtn = document.querySelectorAll('.tab-btn')[0];
    switchPage('shift', shiftTabBtn);
    alert("レギュラー授業を反映しました！");
}
// ▼ 7. 給与明細の計算・表示 ▼
function calculateAndShowIncome() {
    const year = parseInt(document.getElementById('select-year').value);
    const month = parseInt(document.getElementById('select-month').value);
    const startDate = new Date(year, month - 1, 16);
    const endDate = new Date(year, month, 15);
    let totalAdminMins = 0, totalJrHighMins = 0, totalHsMins = 0, totalTutorMins = 0;
    let workDays = 0;
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
        const data = getShift(dateStr);
        let k = data.jrHigh + data.highSchool;
        let t = data.tutor;
        if (k > 0 || t > 0 || data.adjust !== 0) {
            workDays++;
            let adminMins = 35 + data.adjust;
            if (k > 0)
                adminMins += (10 * (k - 1));
            if (t > 0)
                adminMins += (5 * (t - 1));
            totalAdminMins += adminMins;
            totalJrHighMins += 80 * data.jrHigh;
            totalHsMins += 80 * data.highSchool;
            totalTutorMins += 50 * data.tutor;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    const incomeAdmin = Math.floor((totalAdminMins / 60) * wageSettings.admin || 0);
    const incomeJrHigh = Math.floor((totalJrHighMins / 60) * wageSettings.jrHigh || 0);
    const incomeHs = Math.floor((totalHsMins / 60) * wageSettings.highSchool || 0);
    const incomeTutor = Math.floor((totalTutorMins / 60) * wageSettings.tutor || 0);
    const incomeTransport = workDays * (wageSettings.transport || 0);
    const totalIncome = incomeAdmin + incomeJrHigh + incomeHs + incomeTutor + incomeTransport;
    const container = document.getElementById('income-details-container');
    container.innerHTML = `
        <div class="ios-list-item"><label>事務給 (${Math.floor(totalAdminMins / 60)}h${totalAdminMins % 60}m)</label><span>${incomeAdmin.toLocaleString()} 円</span></div>
        <div class="ios-list-item"><label>小中学生 (${Math.floor(totalJrHighMins / 60)}h${totalJrHighMins % 60}m)</label><span>${incomeJrHigh.toLocaleString()} 円</span></div>
        <div class="ios-list-item"><label>高校生 (${Math.floor(totalHsMins / 60)}h${totalHsMins % 60}m)</label><span>${incomeHs.toLocaleString()} 円</span></div>
        <div class="ios-list-item"><label>チューター (${Math.floor(totalTutorMins / 60)}h${totalTutorMins % 60}m)</label><span>${incomeTutor.toLocaleString()} 円</span></div>
        <div class="ios-list-item"><label>交通費 (${workDays}日分)</label><span>${incomeTransport.toLocaleString()} 円</span></div>
    `;
    document.getElementById('income-total').innerText = `${totalIncome.toLocaleString()} 円`;
    switchPage('income', null);
}
// ページ遷移関数
function switchPage(target, tabIndex, isHistoryBack = false) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`page-${target}`)?.classList.add('active');
    // tabIndex が数字ならインデックス指定、要素なら直接指定する
    if (typeof tabIndex === 'number') {
        const btns = document.querySelectorAll('.tab-btn');
        if (btns[tabIndex])
            btns[tabIndex].classList.add('active');
        const indicator = document.getElementById('tab-indicator-wrap');
        if (indicator)
            indicator.style.transform = `translateX(${tabIndex * 100}%)`;
    }
    else if (tabIndex instanceof HTMLElement) {
        tabIndex.classList.add('active');
    }
    // if (tabIndex !== null) {
    //     const btns = document.querySelectorAll('.tab-btn');
    //     if (btns[tabIndex]) btns[tabIndex].classList.add('active');
    //     // ガラスカーソルをスライドさせる
    //     const indicator = document.getElementById('tab-indicator-wrap');
    //     if (indicator) {
    //         indicator.style.transform = `translateX(${tabIndex * 100}%)`;
    //     }
    // }
    if (!isHistoryBack) {
        history.pushState({ pageId: target, tabIndex: tabIndex }, "", "#" + target);
    }
}
// ▼ 追加: 1ヶ月の合計時間を計算する関数 ▼
function calculateAll() {
    const year = parseInt(document.getElementById('select-year').value);
    const month = parseInt(document.getElementById('select-month').value);
    const startDate = new Date(year, month - 1, 16);
    const endDate = new Date(year, month, 15);
    let grandTotalMinutes = 0;
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
        const data = getShift(dateStr);
        let k = data.jrHigh + data.highSchool; // 授業コマ数の合計
        let t = data.tutor; // チューターコマ数の合計
        let a = data.adjust; // 手動調整時間
        // シフトが1つでも入っている日のみ計算する
        if (k > 0 || t > 0 || a !== 0) {
            let dailyTotal = 35; // 基本の事務時間
            // 授業の計算: (80分 × コマ数) ＋ (2コマ目以降の追加事務 10分)
            if (k > 0)
                dailyTotal += (80 * k) + (10 * (k - 1));
            // チューターの計算: (50分 × コマ数) ＋ (2コマ目以降の追加事務 5分)
            if (t > 0)
                dailyTotal += (50 * t) + (5 * (t - 1));
            dailyTotal += a; // 手動調整の加減算
            grandTotalMinutes += dailyTotal;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    // 画面への反映
    const hours = Math.floor(grandTotalMinutes / 60);
    const mins = grandTotalMinutes % 60;
    document.getElementById('grand-total-hours').innerText = hours.toString();
    document.getElementById('grand-total-mins').innerText = mins.toString();
    // 80時間（4800分）を超えたら警告を表示
    const warningMsg = document.getElementById('warning-msg');
    if (warningMsg) {
        // display: block ではなく、クラスの付け外しでアニメーションさせる
        if (grandTotalMinutes > 4800) {
            warningMsg.classList.add('show');
        }
        else {
            warningMsg.classList.remove('show');
        }
    }
}
function openDateModal() {
    document.getElementById('date-modal').style.display = 'flex';
}
function closeDateModal() {
    document.getElementById('date-modal').style.display = 'none';
    initCalendar(); // 閉じた時にカレンダーを再描画
}
async function downloadHistory() {
    const exportData = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key)
            exportData[key] = localStorage.getItem(key);
    }
    if (Object.keys(exportData).length === 0) {
        alert("保存されているデータがありません。");
        return;
    }
    const jsonString = JSON.stringify(exportData, null, 2);
    // 日付付きのファイル名を作成
    const date = new Date();
    const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const fileName = `shift_history_${dateString}.json`;
    // 文字列を「ファイル」に変換
    const file = new File([jsonString], fileName, { type: 'application/json' });
    // ▼ スマホの共有メニュー（シェアシート）を呼び出す魔法 ▼
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: 'シフト履歴のバックアップ',
            });
            // 共有完了（ファイルに保存など）した時の処理
        }
        catch (error) {
            console.log('共有がキャンセルされました', error);
        }
    }
    else {
        // パソコンなど、シェアシートがない環境向けの古い処理（フォールバック）
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert("ダウンロードが完了しました。「ファイル」アプリをご確認ください。");
    }
}
function resetDailyShift() {
    // 誤操作を防ぐための確認ダイアログ
    const isConfirmed = confirm("この日のシフト情報をすべてクリアしますか？");
    if (isConfirmed) {
        // ※ currentSelectedDate は、現在選択中の日付を保持している変数を指定してください
        // （もし変数名が異なる場合は、ご自身のコードに合わせて変更してください）
        const dateStr = selectedDateStr;
        // データを取得してすべて0にリセット
        const data = getShift(dateStr);
        data.jrHigh = 0;
        data.highSchool = 0;
        data.tutor = 0;
        data.adjust = 0;
        // 保存と画面の更新（既存の関数を呼び出す）
        saveShifts();
        // パネルの数値を0にリセット表示
        updatePanelDisplay();
        // カレンダーと合計時間の再描画（既存の関数名に合わせてください）
        initCalendar();
    }
}
const mainContent = document.querySelector('.main-content');
const tabBar = document.querySelector('.tab-bar');
let lastScrollTop = 0;
if (mainContent && tabBar) {
    // ▼ 追加: タブバー（丸いアイコン）をタップした時の処理
    tabBar.addEventListener('click', () => {
        // もし縮んでいる状態（scrolled）なら、強制展開（force-expand）の合図を出す
        if (tabBar.classList.contains('scrolled')) {
            tabBar.classList.add('force-expand');
        }
    });
    // ▼ 既存: スクロールした時の処理
    mainContent.addEventListener('scroll', () => {
        const currentScroll = mainContent.scrollTop;
        if (currentScroll > lastScrollTop) {
            tabBar.classList.remove('force-expand');
        }
        // カレンダーなどをスクロールしたら、展開モードを解除して再び縮める
        // tabBar.classList.remove('force-expand');
        if (currentScroll > 20) {
            tabBar.classList.add('scrolled');
        }
        else {
            tabBar.classList.remove('scrolled');
            tabBar.classList.remove('force-expand');
        }
        lastScrollTop = currentScroll;
    });
}
if (!history.state) {
    history.replaceState({ target: 'shift', tabIndex: 0 }, "", "#shift");
}
window.addEventListener("popstate", (event) => {
    if (event.state && event.state.string) {
        switchPage(event.state.string, event.state.tabIndex, true);
    }
    else {
        switchPage("shift", 0, true);
    }
});
// HTMLへの公開
window.updateKoma = updateKoma;
window.switchPage = switchPage;
window.openDetailModal = openDetailModal;
window.closeDetailModal = closeDetailModal;
window.updateModalTutor = updateModalTutor;
window.updateModalAdjust = updateModalAdjust;
window.changeReg = changeReg;
window.saveRegularSettings = saveRegularSettings;
window.applyRegularShifts = applyRegularShifts;
window.saveWageSettings = saveWageSettings;
window.calculateAndShowIncome = calculateAndShowIncome;
window.openDateModal = openDateModal;
window.closeDateModal = closeDateModal;
