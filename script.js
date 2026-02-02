const fields = ['currAC', 'currDC', 'forAC', 'forDC', 'buyAC', 'buyDC', 'targetPerc'];

window.onload = () => {
    fields.forEach(f => {
        const saved = localStorage.getItem(f);
        if (saved) document.getElementById(f).value = saved;
        document.getElementById(f).addEventListener('input', calculate);
    });
    calculate();
};

function calculate() {
    const v = {};
    fields.forEach(f => {
        v[f] = parseInt(document.getElementById(f).value) || 0;
        localStorage.setItem(f, v[f]);
    });

    const total = v.currAC + v.currDC;
    if (total === 0) return;

    const finalAC = v.currAC + v.buyAC - v.buyDC;
    const finalDC = v.currDC + v.buyDC - v.buyAC;
    const percAC = ((finalAC / total) * 100).toFixed(1);

    // עדכון גרפי
    document.getElementById('resRatio').innerText = `${percAC}% AC / ${(100-percAC).toFixed(1)}% DC`;
    document.getElementById('progressBar').style.width = `${percAC}%`;
    document.getElementById('targetMarker').style.right = `${v.targetPerc}%`;

    // בדיקת כיסוי פורקאסט
    const coverAC = finalAC - v.forAC;
    const coverDC = finalDC - v.forDC;
    const alert = document.getElementById('statusAlert');

    if (coverAC < 0 || coverDC < 0) {
        alert.className = "alert bg-warn";
        alert.innerText = `🚨 חסר מלאי! (חסרים ${Math.abs(Math.min(coverAC, coverDC))} שרתים לפורקאסט)`;
    } else {
        alert.className = "alert bg-ok";
        alert.innerText = "✅ המלאי מכסה את הפורקאסט";
    }

    // חלפים
    document.getElementById('spareAC').innerText = v.buyDC * 2;
    document.getElementById('spareDC').innerText = v.buyAC * 2;
}

// פונקציית האופטימיזציה החדשה
function optimizePurchase() {
    const cAC = parseInt(document.getElementById('currAC').value) || 0;
    const cDC = parseInt(document.getElementById('currDC').value) || 0;
    const target = parseInt(document.getElementById('targetPerc').value) || 78;
    const forAC = parseInt(document.getElementById('forAC').value) || 0;

    const total = cAC + cDC;
    
    // חישוב כמה AC אנחנו צריכים שיהיה בסוף כדי להגיע ליעד
    const requiredTotalAC = Math.ceil((target / 100) * total);
    
    // כמה חסר לנו כרגע?
    let diff = requiredTotalAC - cAC;

    if (diff > 0) {
        // צריך להמיר DC ל-AC
        document.getElementById('buyAC').value = diff;
        document.getElementById('buyDC').value = 0;
    } else if (diff < 0) {
        // יש יותר מדי AC, אולי צריך להמיר ל-DC?
        document.getElementById('buyAC').value = 0;
        document.getElementById('buyDC').value = Math.abs(diff);
    }

    calculate(); // עדכון התצוגה
}

function addRow(sku = '', qty = '') {
    const tbody = document.getElementById('bomBody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" value="${sku}" placeholder="תיאור פריט"></td>
        <td><input type="number" value="${qty}" style="width:60px"></td>
        <td class="no-print"><button onclick="this.parentElement.parentElement.remove()" style="border:none; background:none; cursor:pointer;">❌</button></td>
    `;
    tbody.appendChild(tr);
}

function exportToPDF() {
    const element = document.getElementById('report');
    document.body.classList.add('no-print-pdf');
    html2pdf().from(element).set({
        margin: 5,
        filename: 'Inventory_Decision_Report.pdf',
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).save().then(() => {
        document.body.classList.remove('no-print-pdf');
    });
}
