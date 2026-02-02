const inputs = ['currAC', 'currDC', 'buyAC', 'buyDC', 'targetPerc'];
inputs.forEach(id => document.getElementById(id).addEventListener('input', calculate));

function calculate() {
    const cAC = parseInt(document.getElementById('currAC').value) || 0;
    const cDC = parseInt(document.getElementById('currDC').value) || 0;
    const bAC = parseInt(document.getElementById('buyAC').value) || 0;
    const bDC = parseInt(document.getElementById('buyDC').value) || 0;
    const target = parseInt(document.getElementById('targetPerc').value) || 78;

    const total = cAC + cDC;
    const finalAC = cAC + bAC - bDC;
    const finalDC = cDC + bDC - bAC;
    const percAC = ((finalAC / total) * 100).toFixed(1);

    document.getElementById('resTotal').innerText = total;
    document.getElementById('resRatio').innerText = `${percAC}% AC / ${(100-percAC).toFixed(1)}% DC`;
    document.getElementById('progressBar').style.width = `${percAC}%`;
    document.getElementById('spareAC').innerText = bDC * 2;
    document.getElementById('spareDC').innerText = bAC * 2;

    const insight = document.getElementById('insight');
    if (Math.abs(percAC - target) <= 1) {
        insight.className = "insight-box bg-success";
        insight.innerText = "✅ היעד הושג!";
    } else {
        insight.className = "insight-box bg-warning";
        insight.innerText = percAC < target ? "יש להגדיל כמות קיטי AC" : "המלאי מוטה ל-AC מעבר ליעד";
    }
}

function exportToPDF() {
    const element = document.getElementById('content-to-export');
    const opt = {
        margin: 10,
        filename: 'Inventory_Report.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}
calculate();