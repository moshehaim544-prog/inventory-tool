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
    const percAC = ((finalAC / total) * 100).toFixed(1);

    document.getElementById('resRatio').innerText = `${percAC}% AC / ${(100-percAC).toFixed(1)}% DC`;
    document.getElementById('progressBar').style.width = `${percAC}%`;
    document.getElementById('targetMarker').style.right = `${v.targetPerc}%`;

    const diffAC = finalAC - v.forAC;
    const diffDC = (total - finalAC) - v.forDC;
    const alert = document.getElementById('statusAlert');

    if (diffAC < 0 || diffDC < 0) {
        alert.className = "alert bg-warn";
        alert.innerText = "🚨 אזהרה: חוסר במלאי לכיסוי הפורקאסט!";
    } else {
        alert.className = "alert bg-ok";
        alert.innerText = "✅ המלאי תקין ומכסה את הפורקאסט";
    }

    document.getElementById('spareAC').innerText = v.buyDC * 2;
    document.getElementById('spareDC').innerText = v.buyAC * 2;
}

function optimizePurchase() {
    const cAC = parseInt(document.getElementById('currAC').value) || 0;
    const cDC = parseInt(document.getElementById('currDC').value) || 0;
    const target = parseInt(document.getElementById('targetPerc').value) || 78;
    const total = cAC + cDC;
    
    const requiredAC = Math.ceil((target / 100) * total);
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

function addRow(sku = '', qty = '') {
    const tbody = document.getElementById('bomBody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" value="${sku}" placeholder="פריט/מק"ט" style="border:none; width:100%"></td>
        <td><input type="number" value="${qty}" style="border:none; width:50px"></td>
        <td class="no-print"><button onclick="this.parentElement.parentElement.remove()" style="border:none; background:none; cursor:pointer;">❌</button></td>
    `;
    tbody.appendChild(tr);
}

function exportToPDF() {
    const element = document.getElementById('report');
    html2pdf().from(element).set({
        margin: 5, filename: 'Inventory_Report.pdf', html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4' }
    }).save();
}
