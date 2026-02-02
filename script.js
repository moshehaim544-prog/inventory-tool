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

    // 1. חישוב פורקאסט משוקלל (רצפת ייצור)
    let wAC = Math.ceil(v.forAC * v.probAC / 100);
    let wDC = Math.ceil(v.forDC * v.probDC / 100);
    document.getElementById('weightAC').innerText = wAC;
    document.getElementById('weightDC').innerText = wDC;

    let total = v.currAC + v.currDC;
    if (total === 0) return;

    // 2. חישוב מצב סופי
    let finalAC = v.currAC + v.buyAC - v.buyDC;
    let finalDC = v.currDC + v.buyDC - v.buyAC;
    let percAC = ((finalAC / total) * 100).toFixed(1);

    document.getElementById('finalRatio').innerText = `${percAC}% AC / ${(100-percAC).toFixed(1)}% DC`;
    document.getElementById('progBar').style.width = percAC + "%";

    // 3. בדיקת חשיפה (האם אנחנו מתחת לרצפה?)
    let alert = document.getElementById('status');
    if (finalAC < wAC) {
        alert.className = "alert bg-err";
        alert.innerText = `🚨 חוסר ב-AC: חסרות ${wAC - finalAC} יחידות לכיסוי הפורקאסט!`;
    } else if (finalDC < wDC) {
        alert.className = "alert bg-err";
        alert.innerText = `🚨 חוסר ב-DC: חסרות ${wDC - finalDC} יחידות לכיסוי הפורקאסט!`;
    } else {
        alert.className = "alert bg-ok";
        alert.innerText = "✅ המלאי מכסה את הפורקאסט ומקיים את היעד";
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
    if (total === 0) return;

    // חישוב כמה AC אנחנו רוצים לפי יעד האחוזים
    let targetAC = Math.round((v.target / 100) * total);

    // הגבלה: אסור שה-AC יהיה כל כך גבוה שלא יישאר מספיק ל-DC המשוקלל
    // מקסימום AC אפשרי = סה"כ מלאי פחות מינימום DC נדרש
    let maxAllowedAC = total - wDC;
    
    // מינימום AC נדרש = מה שהפורקאסט של AC מחייב
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

document.getElementById('scenario').onchange = loadScenarioData;
window.onload = loadScenarioData;
