const fields = ['currAC', 'currDC', 'forAC', 'probAC', 'forDC', 'probDC', 'buyAC', 'buyDC', 'targetPerc'];
let forecastChart; // משתנה גלובלי לגרף

// פונקציה לטעינת נתונים מתרחיש שנבחר
function loadScenario() {
    const scenarioName = document.getElementById('scenarioPicker').value;
    fields.forEach(f => {
        const saved = localStorage.getItem(`${scenarioName}_${f}`);
        if (saved !== null) { // Include 0 as a valid saved value
            document.getElementById(f).value = saved;
        } else {
            // Load default values if no scenario saved (or for new scenarios)
            const defaultValue = document.getElementById(f).getAttribute('value');
            if (defaultValue !== null) document.getElementById(f).value = defaultValue;
        }
    });

    // Load BOM for the selected scenario
    const savedBOM = localStorage.getItem(`${scenarioName}_bom`);
    const bomBody = document.getElementById('bomBody');
    bomBody.innerHTML = ''; // Clear current BOM
    if (savedBOM) {
        const bomItems = JSON.parse(savedBOM);
        bomItems.forEach(item => addRow(item.sku, item.qty, false)); // Add without saving again
    } else {
        // Add default BOM items if no BOM saved for this scenario
        addDefaultBomItems();
    }
    calculate();
}

// פונקציה לשמירת התרחיש הנוכחי
function saveCurrentScenario() {
    const scenarioName = document.getElementById('scenarioPicker').value;
    fields.forEach(f => {
        localStorage.setItem(`${scenarioName}_${f}`, document.getElementById(f).value);
    });

    // Save BOM for the current scenario
    const bomItems = [];
    document.querySelectorAll('#bomBody tr').forEach(row => {
        const sku = row.children[0].querySelector('input').value;
        const qty = row.children[1].querySelector('input').value;
        bomItems.push({ sku, qty });
    });
    localStorage.setItem(`${scenarioName}_bom`, JSON.stringify(bomItems));
    alert(`תרחיש "${scenarioName}" נשמר בהצלחה!`);
}


// פונקציה לחישובים ועדכון התצוגה
function calculate() {
    const v = {};
    const scenarioName = document.getElementById('scenarioPicker').value;

    fields.forEach(f => {
        v[f] = parseFloat(document.getElementById(f).value) || 0;
        localStorage.setItem(`${scenarioName}_${f}`, v[f]); // שמירה אוטומטית לפי תרחיש
    });

    // חישוב פורקאסט משוקלל
    const weightedAC = (v.forAC * (v.probAC / 100)).toFixed(1);
    const weightedDC = (v.forDC * (v.probDC / 100)).toFixed(1);
    document.getElementById('weightedAC').innerText = weightedAC;
    document.getElementById('weightedDC').innerText = weightedDC;

    const totalCurrentUnits = v.currAC + v.currDC;
    if (totalCurrentUnits === 0) {
        document.getElementById('resRatio').innerText = '0% AC / 0% DC';
        document.getElementById('progressBar').style.width = '0%';
        document.getElementById('targetMarker').style.right = `${100 - v.targetPerc}%`;
        updateChart(v.forAC, weightedAC, v.forDC, weightedDC);
        return;
    }

    const finalAC = v.currAC + v.buyAC - v.buyDC;
    const finalDC = totalCurrentUnits - finalAC; // DC is total - final AC
    const percAC = ((finalAC / totalCurrentUnits) * 100).toFixed(1);

    // עדכון ויזואלי
    document.getElementById('resRatio').innerText = `${percAC}% AC / ${(100 - percAC).toFixed(1)}% DC`;
    document.getElementById('progressBar').style.width = `${percAC}%`;
    document.getElementById('targetMarker').style.right = `${100 - v.targetPerc}%`;

    // בדיקת כיסוי מול פורקאסט משוקלל
    const alertElement = document.getElementById('statusAlert');
    if (finalAC < weightedAC || finalDC < weightedDC) { // Check both AC and DC coverage
        alertElement.className = "alert bg-warn";
        alertElement.innerText = "🚨 אזהרה חמורה: מלאי לא מספיק לכיסוי הפורקאסט המשוקלל!";
    } else if (finalAC > v.forAC || finalDC > v.forDC) { // Check for potential over-stocking
        alertElement.className = "alert bg-ok";
        alertElement.innerText = "✅ המלאי מכסה את הפורקאסט המשוקלל. שקול אופטימיזציה נוספת!";
    }
    else {
        alertElement.className = "alert bg-ok";
        alertElement.innerText = "✅ המלאי מכסה את הפורקאסט המשוקלל בהצלחה.";
    }

    // חלפים
    document.getElementById('spareAC').innerText = (v.buyDC * 2).toString(); // Assuming 2 AC PS per DC kit conversion
    document.getElementById('spareDC').innerText = (v.buyAC * 2).toString(); // Assuming 2 DC PS per AC kit conversion

    updateChart(v.forAC, weightedAC, v.forDC, weightedDC);
}

// פונקציית האופטימיזציה
function optimizePurchase() {
    const v = {};
    fields.forEach(f => v[f] = parseFloat(document.getElementById(f).value) || 0);

    const totalCurrentUnits = v.currAC + v.currDC;
    if (totalCurrentUnits === 0) {
        alert("אין יחידות במלאי. אנא הזן מלאי נוכחי.");
        return;
    }

    const weightedAC = parseFloat(document.getElementById('weightedAC').innerText) || 0;
    const weightedDC = parseFloat(document.getElementById('weightedDC').innerText) || 0;

    // A: Calculate based on target percentage
    const requiredACbyTarget = Math.round((v.targetPerc / 100) * totalCurrentUnits);

    // B: Calculate based on weighted forecast coverage
    // Ensure we have enough AC to cover weightedAC forecast
    let neededACForForecast = weightedAC - v.currAC;
    if (v.buyDC > 0) neededACForForecast += v.buyDC; // if we convert DC to AC, need to "buy back" the AC used

    // Ensure we have enough DC to cover weightedDC forecast
    let neededDCForForecast = weightedDC - v.currDC;
    if (v.buyAC > 0) neededDCForForecast += v.buyAC; // if we convert AC to DC, need to "buy back" the DC used

    // Determine the ideal final AC units considering both target and forecast
    // We want the final AC to be at least 'weightedAC' and also meet 'requiredACbyTarget'
    const idealFinalAC = Math.max(requiredACbyTarget, weightedAC);
    
    // How many AC kits do we need to convert?
    let acKitsToBuy = 0;
    let dcKitsToBuy = 0;

    // If final AC is lower than ideal, we need to convert DC to AC
    if (v.currAC < idealFinalAC) {
        acKitsToBuy = idealFinalAC - v.currAC;
    } else if (v.currAC > idealFinalAC) {
        // If final AC is higher than ideal, we need to convert AC to DC
        dcKitsToBuy = v.currAC - idealFinalAC;
    }

    // Adjust for covering DC forecast as well
    const currentFinalDC = totalCurrentUnits - (v.currAC + acKitsToBuy - dcKitsToBuy);
    if (currentFinalDC < weightedDC) {
        // Need more DC, so increase DC kits to buy (reduce AC kits)
        dcKitsToBuy += (weightedDC - currentFinalDC);
        acKitsToBuy = Math.max(0, acKitsToBuy - (weightedDC - currentFinalDC)); // Can't go below 0
    }


    document.getElementById('buyAC').value = Math.max(0, Math.round(acKitsToBuy)); // Ensure non-negative
    document.getElementById('buyDC').value = Math.max(0, Math.round(dcKitsToBuy)); // Ensure non-negative
    
    calculate(); // עדכון התצוגה
}


// פונקציה להוספת שורת מק"ט לטבלה
function addRow(sku = '', qty = '', save = true) {
    const tbody = document.getElementById('bomBody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" value="${sku}" placeholder="תיאור פריט/מק"ט" oninput="calculate()"></td>
        <td><input type="number" value="${qty}" style="width:70px;" oninput="calculate()"></td>
        <td class="no-print"><button onclick="this.parentElement.parentElement.remove(); saveCurrentScenario();" class="btn-delete">❌</button></td>
    `;
    tbody.appendChild(tr);
    if (save) saveCurrentScenario(); // Save BOM after adding a row
}

// פונקציה להוספת פריטי BOM ברירת מחדל
function addDefaultBomItems() {
    addRow('E816094 - Power Supply AC 800W', '', false);
    addRow('C001074 - CBL PWR C13 to C14', '', false);
    addRow('E816096 - Power Supply DC 1300W', '', false);
    addRow('C001075 - CBL PWR DC -48V', '', false);
}


// פונקציה לייצוא ל-PDF
function exportToPDF() {
    const element = document.getElementById('report');
    html2pdf().from(element).set({
        margin: [10, 10, 10, 10], // top, left, bottom, right
        filename: `Inventory_Report_${document.getElementById('scenarioPicker').value}.pdf`,
        html2canvas: { scale: 2, logging: true, dpi: 192, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).save();
}

// אתחול בעת טעינת הדף
window.onload = () => {
    // Attach event listeners for all input fields for live calculation and saving
    fields.forEach(f => {
        const inputElement = document.getElementById(f);
        if (inputElement) {
            inputElement.addEventListener('input', calculate);
        }
    });

    loadScenario(); // Load selected scenario (will also trigger calculate)
};


// פונקציה ליצירה ועדכון הגרף
function updateChart(forAC, weightedAC, forDC, weightedDC) {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    const labels = ['AC', 'DC'];
    const originalForecasts = [forAC, forDC];
    const weightedForecasts = [weightedAC, weightedDC];

    if (forecastChart) {
        forecastChart.data.datasets[0].data = originalForecasts;
        forecastChart.data.datasets[1].data = weightedForecasts;
        forecastChart.update();
    } else {
        forecastChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'פורקאסט מקורי',
                    data: originalForecasts,
                    backgroundColor: 'rgba(59, 130, 246, 0.7)', // Primary blue
                    borderColor: 'rgba(59, 130,
