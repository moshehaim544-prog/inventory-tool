const fields = ['forAC', 'probAC', 'forDC', 'probDC', 'currAC', 'currDC', 'buyAC', 'buyDC', 'target'];

function loadScenarioData() {
    const scenarioId = document.getElementById('scenario').value;
    fields.forEach(f => {
        const savedValue = localStorage.getItem(`scenario_${scenarioId}_${f}`);
        if (savedValue !== null) document.getElementById(f).value = savedValue;
        else {
            if (f.includes('prob')) document.getElementById(f).value = 100;
            else if (f === 'target') document.getElementById(f).value = 78;
            else document.getElementById(f).value = 0;
        }
    });
    calculate(false);
}

function calculate(shouldSave = true) {
    const scenarioId = document.getElementById('scenario').value;
    let v = {};
    fields.forEach(f => {
        v[f] = parseFloat(document.getElementById(f).value) || 0;
        if (shouldSave) localStorage.setItem(`scenario_${scenarioId}_${f}`, v[f]);
    });

    let wAC = Math.ceil(v.forAC * v.probAC / 100);
    let wDC = Math.ceil(v.forDC * v.probDC / 100);
    document.getElementById('weightAC').innerText = wAC;
    document.getElementById('weightDC').innerText = wDC;

    let total = v.currAC + v.currDC;
    if (total === 0) return;

    let finalAC = v.currAC + v.buyAC - v.buyDC;
    let finalDC = v.currDC + v.buyDC - v.buyAC;
    let percAC = ((finalAC / total) * 100).toFixed(1);

    document.getElementById('finalRatio').innerText = `${percAC}% AC / ${(100-percAC).toFixed(1)}% DC`;
    document.getElementById('progBar').style.width = percAC + "%";

    let alert = document.getElementById('status');
    if (finalAC < wAC) {
        alert.className = "alert bg-err";
        alert.innerText = `🚨 חוסר ב-AC: חסרות ${wAC - finalAC} יחידות!`;
    } else if (finalDC < wDC) {
        alert.className = "alert bg-err";
        alert.innerText = `🚨 חוסר ב-DC: חסרות ${wDC - finalDC} יחידות!`;
    } else {
        alert.className = "alert bg-ok";
        alert.innerText = "✅ המלאי תקין ומכסה את הפורקאסט";
    }

    document.getElementById('spareAC').innerText = Math.max(0, v.buyDC * 2);
    document.getElementById('spareDC').innerText = Math.max(0, v.buyAC * 2);
}

function optimize() {
    let v = {};
    fields.forEach(f => v[f] = parseFloat(document.getElementById(f).value) || 0);
    let wAC = Math.ceil(v.forAC * v.probAC / 100);
    let wDC = Math.ceil(v.forDC * v.probDC / 100);
    let total = v.currAC + v.currDC;

    let targetAC = Math.round((v.target / 100) * total);
    let maxAllowedAC = total - wDC;
    let finalTargetAC = Math.max(wAC, Math.min(targetAC, maxAllowedAC));

    let diff = finalTargetAC - v.currAC;
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
    tr.innerHTML = `<td><input type="text" placeholder="תיאור מקט" style="border:none; width:100%"></td>
                    <td><input type="number" value="0" style="border:none; width:100%"></td>
                    <td class="no-print"><button onclick="this.parentElement.parentElement.remove()" style="border:none; background:none; cursor:pointer; color:red">❌</button></td>`;
    body.appendChild(tr);
}

function exportToExcel() {
    let data = [];
    document.querySelectorAll('#bomBody tr').forEach(row => {
        const inputs = row.querySelectorAll('input');
        data.push({ "פריט": inputs[0].value, "כמות": inputs[1].value, "סוג": "ידני" });
    });
    const buyAC = document.getElementById('buyAC').value;
    const buyDC = document.getElementById('buyDC').value;
    if (buyAC > 0) data.push({ "פריט": "AC Conversion Kit", "כמות": buyAC, "סוג": "רכש מחושב" });
    if (buyDC > 0) data.push({ "פריט": "DC Conversion Kit", "כמות": buyDC, "סוג": "רכש מחושב" });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "רכש");
    XLSX.writeFile(wb, `Order_Scenario_${document.getElementById('scenario').value}.xlsx`);
}

window.onload = loadScenarioData;
