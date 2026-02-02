const fields = ['forAC', 'probAC', 'forDC', 'probDC', 'currAC', 'currDC', 'buyAC', 'buyDC', 'target'];

function calculate() {
    let v = {};
    fields.forEach(f => v[f] = parseFloat(document.getElementById(f).value) || 0);

    // 1. חישוב פורקאסט משוקלל
    let wAC = (v.forAC * v.probAC / 100).toFixed(1);
    let wDC = (v.forDC * v.probDC / 100).toFixed(1);
    document.getElementById('weightAC').innerText = wAC;
    document.getElementById('weightDC').innerText = wDC;

    // 2. חישוב יחס מלאי
    let total = v.currAC + v.currDC;
    if (total === 0) return;

    let finalAC = v.currAC + v.buyAC - v.buyDC;
    let finalDC = v.currDC + v.buyDC - v.buyAC;
    let percAC = ((finalAC / total) * 100).toFixed(1);

    document.getElementById('finalRatio').innerText = `${percAC}% AC / ${(100-percAC).toFixed(1)}% DC`;
    document.getElementById('progBar').style.width = percAC + "%";

    // 3. סטטוס כיסוי
    let alert = document.getElementById('status');
    if (finalAC < wAC || finalDC < wDC) {
        alert.className = "alert bg-err";
        alert.innerText = "🚨 חוסר במלאי לכיסוי הפורקאסט המשוקלל";
    } else {
        alert.className = "alert bg-ok";
        alert.innerText = "✅ המלאי תקין ומכסה את הסיכונים";
    }

    // 4. חלפים
    document.getElementById('spareAC').innerText = v.buyDC * 2;
    document.getElementById('spareDC').innerText = v.buyAC * 2;
}

function optimize() {
    let cAC = parseFloat(document.getElementById('currAC').value) || 0;
    let cDC = parseFloat(document.getElementById('currDC').value) || 0;
    let target = parseFloat(document.getElementById('target').value) || 0;
    let total = cAC + cDC;

    let requiredAC = Math.round((target / 100) * total);
    let diff = requiredAC - cAC;

    if (diff > 0) {
        document.getElementById('buyAC').value = diff;
        document.getElementById('buyDC').value = 0;
    } else {
        document.getElementById('buyAC').value = 0;
        document.getElementById('buyDC').value = Math.abs(diff);
    }
    calculate();
}

function addRow() {
    let body = document.getElementById('bomBody');
    let tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" placeholder="תיאור מקט" style="border:none; width:100%"></td>
        <td><input type="number" value="0" style="border:none; width:100%"></td>
        <td class="no-print"><button onclick="this.parentElement.parentElement.remove()" style="border:none; background:none; cursor:pointer; color:red">❌</button></td>
    `;
    body.appendChild(tr);
}

// הפעלה ראשונית
window.onload = calculate;
