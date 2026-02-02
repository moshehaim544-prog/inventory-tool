const fields = ['currAC', 'currDC', 'forAC', 'forDC', 'buyAC', 'buyDC', 'targetPerc'];
fields.forEach(f => document.getElementById(f).addEventListener('input', calculate));

function calculate() {
    const vals = {};
    fields.forEach(f => vals[f] = parseInt(document.getElementById(f).value) || 0);

    const total = vals.currAC + vals.currDC;
    const finalAC = vals.currAC + vals.buyAC - vals.buyDC;
    const finalDC = vals.currDC + vals.buyDC - vals.buyAC;
    const percAC = ((finalAC / total) * 100).toFixed(1);

    document.getElementById('resRatio').innerText = `${percAC}% AC / ${(100-percAC).toFixed(1)}% DC`;

    const coverAC = finalAC - vals.forAC;
    const coverDC = finalDC - vals.forDC;
    
    document.getElementById('coverAC').innerText = coverAC >= 0 ? `עודף (${coverAC})` : `חסר (${Math.abs(coverAC)})!`;
    document.getElementById('coverDC').innerText = coverDC >= 0 ? `עודף (${coverDC})` : `חסר (${Math.abs(coverDC)})!`;

    const alert = document.getElementById('statusAlert');
    if (coverAC < 0 || coverDC < 0) {
        alert.className = "alert alert-warn";
        alert.innerText = "🚨 אזהרה: המלאי לא מכסה את הפורקאסט";
    } else {
        alert.className = "alert alert-ok";
        alert.innerText = "✅ תכנון מלאי תקין";
    }
}

function addRow(sku = '', desc = '', qty = '') {
    const tbody = document.getElementById('bomBody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" value="${sku}" placeholder="מק"ט"></td>
        <td><input type="text" value="${desc}" placeholder="תיאור"></td>
        <td><input type="number" value="${qty}" placeholder="0"></td>
        <td class="no-export"><button class="btn-delete" onclick="this.parentElement.parentElement.remove()">🗑</button></td>
    `;
    tbody.appendChild(tr);
}

function exportToPDF() {
    const element = document.getElementById('report');
    // הוספת קלאס זמני להסתרת כפתורים בייצוא
    element.classList.add('no-export-pdf');
    
    const opt = {
        margin: 10,
        filename: 'Purchase_Report.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        element.classList.remove('no-export-pdf');
    });
}

// הוספת שורות ראשוניות ריקות או לדוגמה
addRow('', 'ספקי כוח AC', '');
addRow('', 'ספקי כוח DC', '');

calculate();
