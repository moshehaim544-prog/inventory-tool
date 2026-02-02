const fields = ['currAC', 'currDC', 'forAC', 'probAC', 'forDC', 'probDC', 'buyAC', 'buyDC', 'targetPerc'];

// טעינת תרחיש מהזיכרון
function loadScenario() {
    const scenarioName = document.getElementById('scenarioPicker').value;
    fields.forEach(f => {
        const saved = localStorage.getItem(scenarioName + '_' + f);
        if (saved) document.getElementById(f).value = saved;
    });
    calculate();
}

function calculate() {
    const v = {};
    const scenarioName = document.getElementById('scenarioPicker').value;

    fields.forEach(f => {
        v[f] = parseFloat(document.getElementById(f).value) || 0;
        localStorage.setItem(scenarioName + '_' + f, v[f]); // שמירה לפי תרחיש
    });

    // חישוב פורקאסט משוקלל
    const wAC = (v.forAC * (v.probAC / 100)).toFixed(1);
    const wDC = (v.forDC * (v.probDC / 100)).toFixed(1);
    document.getElementById('weightedAC').innerText = wAC;
    document.getElementById('weightedDC').innerText = wDC;

    const total = v.currAC + v.currDC;
    if (total === 0) return;

    const finalAC = v.currAC + v.buyAC - v.buyDC;
    const percAC = ((finalAC / total) * 100).toFixed(1);

    // עדכון ויזואלי
    document.getElementById('resRatio').innerText = `${percAC}% AC / ${(100-percAC).toFixed(1)}% DC`;
    document.getElementById('progressBar').style.width = `${percAC}%`;
    document.getElementById('targetMarker').style.right = `${v.targetPerc}%`;

    // בדיקת כיסוי מול פורקאסט משוקלל
    const alert = document.getElementById('statusAlert');
    if (finalAC < wAC || (total - finalAC) < wDC) {
        alert.className = "alert bg-warn";
        alert.innerText = "🚨 חשיפה: המלאי לא מכסה את הפורקאסט המשוקלל!";
    } else {
        alert.className = "alert bg-ok";
        alert.innerText = "✅ מלאי תקין מול סיכונים";
    }
}

function optimizePurchase() {
    const cAC = parseFloat(document.getElementById('currAC').value) || 0;
    const cDC = parseFloat(document.getElementById('currDC').value) || 0;
    const target = parseFloat(document.getElementById('targetPerc').value) || 78;
    const wAC = parseFloat(document.getElementById('weightedAC').innerText) || 0;
    
    const total = cAC + cDC;
    const requiredACByTarget = Math.ceil((target / 100) * total);
    
    // האופטימיזציה לוקחת את הגבוה מבין השניים: היעד באחוזים או הפורקאסט המשוקלל
    const finalRequiredAC = Math.max(requiredACByTarget, Math.ceil(wAC));
    
    let diff = finalRequiredAC - cAC;
    if (diff > 0) {
        document.getElementById('buyAC').value = diff;
        document.getElementById('buyDC').value = 0;
    } else {
        document.getElementById('buyAC').value = 0;
        document.getElementById('buyDC').value = Math.abs(diff);
    }
    calculate();
}

function exportToPDF() {
    const element = document.getElementById('report');
    html2pdf().from(element).save('Supply_Chain_Risk_Report.pdf');
}

// הרצה ראשונית
loadScenario();
