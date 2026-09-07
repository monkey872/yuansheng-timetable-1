/**
 * 元生國小課表查詢系統
 * 依 littleyi22/timetable-demo 架構製作
 */
let scheduleData = [];
let homeroomData = {};
let classGroups = {};
let subjectTeachers = {};
let navHistory = [];

const PERIODS_ALL = [0,1,2,3,4,5,6,7,8];
const DAYS = ['一','二','三','四','五'];

const loginView = document.getElementById('loginView');
const queryView = document.getElementById('queryView');
const resultView = document.getElementById('resultView');
const loadingOverlay = document.getElementById('loadingOverlay');
const scheduleTitle = document.getElementById('scheduleTitle');
const scheduleTableContainer = document.getElementById('scheduleTableContainer');

function showView(id) {
    [loginView, queryView, resultView].forEach(v => {
        v.classList.remove('active', 'result-active');
        v.style.display = 'none';
    });
    const el = document.getElementById(id);
    if (!el) return;
    if (id === 'resultView') {
        el.classList.add('result-active');
        el.style.display = 'block';
    } else {
        el.classList.add('active');
        el.style.display = 'flex';
    }
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function showQueryView() {
    navHistory = [];
    resetGradeSelects();
    showView('queryView');
}

function logout() {
    scheduleData = [];
    homeroomData = {};
    navHistory = [];
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').textContent = '';
    showView('loginView');
}

function populateSemesterSelect() {
    const sel = document.getElementById('semesterSelect');
    Object.keys(CONFIG.SEMESTERS || {}).forEach((label, i, arr) => {
        const opt = document.createElement('option');
        opt.value = label;
        opt.textContent = label;
        if (i === arr.length - 1) opt.selected = true;
        sel.appendChild(opt);
    });
}

async function guestLogin() {
    const sem = document.getElementById('semesterSelect')?.value || '';
    await loadSchedule(sem);
}

document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const user = document.getElementById('loginUsername').value.trim();
    const pass = document.getElementById('loginPassword').value;
    if (user !== CONFIG.USERNAME || pass !== CONFIG.PASSWORD) {
        document.getElementById('loginError').textContent = '帳號或密碼錯誤，請再試一次';
        return;
    }
    await loadSchedule(document.getElementById('semesterSelect').value);
});

async function loadSchedule(semLabel) {
    loadingOverlay.classList.add('show');
    try {
        const csvUrl = CONFIG.SEMESTERS[semLabel];
        if (!csvUrl) throw new Error('找不到對應學期資料');
        const res = await fetch(csvUrl);
        if (!res.ok) throw new Error(`CSV HTTP ${res.status}`);
        scheduleData = parseCSV(await res.text());

        const jsonUrl = csvUrl.replace('timetable_', 'homerooms_').replace('.csv', '.json');
        const hm = await fetch(jsonUrl);
        homeroomData = hm.ok ? await hm.json() : {};

        if (!scheduleData.length) throw new Error('CSV 資料為空');

        buildCategories();
        populateQueryUI();
        document.getElementById('currentSemester').textContent = semLabel;
        document.getElementById('loginError').textContent = '';
        loadingOverlay.classList.remove('show');
        showView('queryView');
    } catch (err) {
        console.error(err);
        loadingOverlay.classList.remove('show');
        document.getElementById('loginError').textContent = `載入失敗：${err.message}`;
    }
}

function splitCSVLine(line) {
    const result = [];
    let cur = '', quoted = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') quoted = !quoted;
        else if (c === ',' && !quoted) { result.push(cur); cur = ''; }
        else cur += c;
    }
    result.push(cur);
    return result;
}

function parseCSV(text) {
    const lines = text.replace(/\r/g, '').split('\n').filter(x => x.trim());
    const headers = splitCSVLine(lines[0]);
    return lines.slice(1).map(line => {
        const vals = splitCSVLine(line);
        const obj = {};
        headers.forEach((h,i) => obj[h] = (vals[i] || '').trim());
        return obj;
    }).filter(r => r.teachername);
}

function buildCategories() {
    const allClasses = new Set();
    subjectTeachers = {};

    scheduleData.forEach(row => {
        for (let d = 1; d <= 5; d++) {
            for (const p of PERIODS_ALL) {
                const cls = row[`c${d}${p}`] || '';
                cls.split(/\s+/).filter(Boolean).forEach(x => allClasses.add(x));

                const subj = row[`s${d}${p}`] || '';
                if (!subj) continue;
                const base = normalizeSubject(subj);
                if (!subjectTeachers[base]) subjectTeachers[base] = new Set();
                subjectTeachers[base].add(row.teachername);
            }
        }
    });

    classGroups = {'一年級':[], '二年級':[], '三年級':[], '四年級':[], '五年級':[], '六年級':[]};
    [...allClasses].sort((a,b) => Number(a)-Number(b)).forEach(cls => {
        const g = `${Number(cls[0])}年級`;
        if (classGroups[g]) classGroups[g].push(cls);
    });

    Object.keys(subjectTeachers).forEach(k => {
        subjectTeachers[k] = [...subjectTeachers[k]].sort((a,b) => a.localeCompare(b,'zh-Hant'));
    });
}

function normalizeSubject(s) {
    return s.replace(/輔導$/, '').replace(/加強$/, '').trim() || s;
}

function populateQueryUI() {
    ['1','2','3','4','5','6'].forEach(n => {
        populateGradeSelect(`sel${n}`, classGroups[`${n}年級`] || []);
    });

    const sel = document.getElementById('subjectSelect');
    sel.innerHTML = '<option value="">— 選擇科目 —</option>';
    Object.keys(subjectTeachers).sort((a,b)=>a.localeCompare(b,'zh-Hant')).forEach(s => {
        const o = document.createElement('option');
        o.value = s; o.textContent = s; sel.appendChild(o);
    });
}

function populateGradeSelect(id, classes) {
    const sel = document.getElementById(id);
    sel.innerHTML = '<option value="">— 選擇班級 —</option>';
    classes.forEach(cls => {
        const o = document.createElement('option');
        o.value = cls; o.textContent = cls; sel.appendChild(o);
    });
}

function setupGradeSelects() {
    const ids = ['sel1','sel2','sel3','sel4','sel5','sel6'];
    ids.forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            if (document.getElementById(id).value) {
                ids.filter(x => x !== id).forEach(x => document.getElementById(x).value = '');
            }
            document.getElementById('classError').textContent = '';
        });
    });
}

function resetGradeSelects() {
    ['sel1','sel2','sel3','sel4','sel5','sel6'].forEach(id => {
        const e = document.getElementById(id);
        if (e) e.value = '';
    });
    document.getElementById('classError').textContent = '';
    document.getElementById('teacherError').textContent = '';
}

function switchTab(tab) {
    document.getElementById('tabClass').classList.toggle('active', tab === 'class');
    document.getElementById('tabTeacher').classList.toggle('active', tab === 'teacher');
    document.getElementById('panelClass').classList.toggle('hidden', tab !== 'class');
    document.getElementById('panelTeacher').classList.toggle('hidden', tab !== 'teacher');
}

function submitClassQuery() {
    const cls = ['sel1','sel2','sel3','sel4','sel5','sel6']
        .map(id => document.getElementById(id)?.value).find(Boolean);
    if (!cls) {
        document.getElementById('classError').textContent = '請先選擇一個班級';
        return;
    }
    navHistory = [];
    displayClassSchedule(cls);
}

function onSubjectChange() {
    const subj = document.getElementById('subjectSelect').value;
    const sel = document.getElementById('teacherSelect');
    sel.innerHTML = '<option value="">— 選擇教師 —</option>';
    (subjectTeachers[subj] || []).forEach(t => {
        const o = document.createElement('option');
        o.value = t; o.textContent = t; sel.appendChild(o);
    });
    document.getElementById('teacherError').textContent = '';
}

function submitTeacherQuery() {
    const t = document.getElementById('teacherSelect').value;
    if (!t) {
        document.getElementById('teacherError').textContent = '請先選擇科目與教師';
        return;
    }
    navHistory = [];
    displayTeacherSchedule(t);
}

function pushNav(type, value) {
    navHistory.push({type, value});
    updateBackBtn();
}

function goBack() {
    if (navHistory.length <= 1) { showQueryView(); return; }
    navHistory.pop();
    const prev = navHistory.pop();
    if (prev.type === 'class') displayClassSchedule(prev.value);
    else displayTeacherSchedule(prev.value);
}

function updateBackBtn() {
    document.getElementById('backBtn').style.visibility =
        navHistory.length > 1 ? 'visible' : 'hidden';
}

function displayClassSchedule(className) {
    pushNav('class', className);
    const cells = {};

    scheduleData.forEach(row => {
        for (let d=1; d<=5; d++) {
            for (const p of PERIODS_ALL) {
                const classes = (row[`c${d}${p}`] || '').split(/\s+/).filter(Boolean);
                if (!classes.includes(className) || !row[`s${d}${p}`]) continue;

                const key = `${d}-${p}`;
                if (!cells[key]) cells[key] = {subject: row[`s${d}${p}`], items: []};
                if (!cells[key].items.includes(row.teachername)) {
                    cells[key].items.push(row.teachername);
                }
            }
        }
    });

    const hm = homeroomData[className] || '';
    scheduleTitle.innerHTML =
        `${className} 班課表${hm ? ` <span class="homeroom">(導師：${escHtml(hm)})</span>` : ''}`;
    scheduleTableContainer.innerHTML = buildScheduleTable(cells, 'class');
    showView('resultView');
    updateBackBtn();
}

function displayTeacherSchedule(teacherName) {
    pushNav('teacher', teacherName);
    const cells = {};

    // 同一教師可能因單/雙週在同一時段服務不同班級，因此必須彙整所有 CSV rows。
    scheduleData.filter(row => row.teachername === teacherName).forEach(row => {
        for (let d=1; d<=5; d++) {
            for (const p of PERIODS_ALL) {
                const subj = row[`s${d}${p}`];
                if (!subj) continue;
                const key = `${d}-${p}`;
                const cls = (row[`c${d}${p}`] || '').split(/\s+/).filter(Boolean);
                if (!cells[key]) cells[key] = [];
                cls.forEach(c => {
                    if (!cells[key].some(x => x.className === c && x.subject === subj)) {
                        cells[key].push({className:c, subject:subj});
                    }
                });
            }
        }
    });

    scheduleTitle.textContent = `${teacherName} 老師課表`;
    scheduleTableContainer.innerHTML = buildScheduleTable(cells, 'teacher');
    showView('resultView');
    updateBackBtn();
}

function buildScheduleTable(cells, mode) {
    const periods = CONFIG.PERIOD_TIMES || [];
    const hasEarly = Object.keys(cells).some(k => k.endsWith('-0'));

    let html = '<table class="schedule-table"><thead><tr><th class="th-period">節次</th>';
    DAYS.forEach(d => html += `<th>${d}</th>`);
    html += '</tr></thead><tbody>';

    if (hasEarly) {
        const pt = periods[0] || {};
        html += `<tr><td class="td-period"><div class="period-num">早自習</div><div class="period-time">${pt.start}<br>${pt.end}</div></td>`;
        for (let d=1; d<=5; d++) html += renderCell(cells[`${d}-0`], mode);
        html += '</tr>';
    }

    for (let p=1; p<=8; p++) {
        const pt = periods[p] || {};
        html += `<tr><td class="td-period"><div class="period-num">第${p}節</div>`;
        if (pt.start && pt.start !== '——') html += `<div class="period-time">${pt.start}<br>${pt.end}</div>`;
        html += '</td>';
        for (let d=1; d<=5; d++) html += renderCell(cells[`${d}-${p}`], mode);
        html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
}

function renderCell(cell, mode) {
    if (!cell || (Array.isArray(cell) && !cell.length)) return '<td class="td-empty"></td>';

    if (mode === 'class') {
        return `<td class="td-cell">
            <div class="cell-subject">${escHtml(cell.subject)}</div>
            <div class="cell-items-container">${cell.items.map(t =>
                `<div class="cell-link" onclick="displayTeacherSchedule('${escAttr(t)}')">${escHtml(t)}</div>`
            ).join('')}</div>
        </td>`;
    }

    return `<td class="td-cell">
        ${cell.map(x => `<div class="teacher-item">
            <div class="cell-subject">${escHtml(x.subject)}</div>
            <div class="cell-link" onclick="displayClassSchedule('${escAttr(x.className)}')">${escHtml(x.className)}</div>
        </div>`).join('<div class="teacher-divider"></div>')}
    </td>`;
}

function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
function escAttr(s) { return String(s || '').replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }

function printSchedule() {
    const title = scheduleTitle.textContent;
    const table = scheduleTableContainer.innerHTML;
    const sem = document.getElementById('currentSemester')?.textContent || '';
    const win = window.open('', '_blank', 'width=1100,height=750');
    win.document.write(`<!doctype html><html lang="zh-TW"><head><meta charset="UTF-8"><title>${escHtml(title)}</title>
    <style>
    @page{size:A4 landscape;margin:1cm}body{font-family:'Noto Sans TC',sans-serif;font-size:10pt}
    h2{text-align:center;margin:0 0 4px}p{text-align:center;color:#555;margin:0 0 8px}
    table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:5px;text-align:center;vertical-align:middle}
    th{background:#eee}.td-period{width:4rem;background:#f5f5f5}.period-num{font-weight:600}.period-time{font-size:8pt;color:#555}
    .cell-subject{font-weight:600}.cell-link{font-size:8.5pt;color:#444}.teacher-divider{border-top:1px dashed #aaa;margin:4px 0}
    </style></head><body><h2>${escHtml(title)}</h2><p>${escHtml(sem)}</p>${table}
    <script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`);
    win.document.close();
}

document.addEventListener('DOMContentLoaded', () => {
    populateSemesterSelect();
    setupGradeSelects();
    document.getElementById('schoolName').textContent = CONFIG.SCHOOL_NAME;
    document.getElementById('schoolSubtitle').textContent = CONFIG.SCHOOL_SUBTITLE;
    document.title = CONFIG.SCHOOL_NAME + ' 課表查詢';
});
