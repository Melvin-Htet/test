// =================================================================
// GLOBAL NAVIGATION & APP INITIALIZATION
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    const views = {
        landing: document.getElementById('app-landing'),
        checker: document.getElementById('app-offline-checker'),
        ini: document.getElementById('app-ini-generator'),
        vtl: document.getElementById('app-vtl-viewer'),
    };

    const navButtons = {
        goToChecker: document.getElementById('goToChecker'),
        goToIni: document.getElementById('goToIni'),
        goToVtl: document.getElementById('goToVtl'),
    };

    const backButtons = document.querySelectorAll('.back-to-home');

    /**
     * Hides all app views and shows the one with the specified ID.
     * @param {string} viewId - The ID of the view to show ('landing', 'checker', 'ini', 'vtl').
     */
    function showView(viewId) {
        Object.values(views).forEach(view => view.classList.add('hidden'));
        if (views[viewId]) {
            views[viewId].classList.remove('hidden');
        }
        window.scrollTo(0, 0); // Scroll to top on view change
    }

    navButtons.goToChecker.addEventListener('click', () => showView('checker'));
    navButtons.goToIni.addEventListener('click', () => showView('ini'));
    navButtons.goToVtl.addEventListener('click', () => showView('vtl'));

    backButtons.forEach(button => {
        button.addEventListener('click', () => showView('landing'));
    });

    // Initialize each application's script
    initOfflineChecker();
    initIniGenerator();
    initVtlViewer();
});


// =================================================================
// OFFLINE CHECKER SCRIPT
// =================================================================

/**
 * Initializes the Offline Checker application.
 * This function sets up all the event listeners and logic for the file comparison tool.
 */
function initOfflineChecker() {
    const fileToggles = { ddf: document.getElementById('ddf-toggle'), vtl: document.getElementById('vtl-toggle'), ini: document.getElementById('ini-toggle'), excel: document.getElementById('excel-toggle') };
    const fileInputs = { ddf1: document.getElementById('file1-ddf-input'), vtl1: document.getElementById('file1-vtl-input'), ini1: document.getElementById('file1-ini-input'), excel1: document.getElementById('file1-excel-input'), ddf2: document.getElementById('file2-ddf-input'), vtl2: document.getElementById('file2-vtl-input'), ini2: document.getElementById('file2-ini-input'), excel2: document.getElementById('file2-excel-input') };
    const nameLabels = { ddf1: document.getElementById('file1-ddf-name'), vtl1: document.getElementById('file1-vtl-name'), ini1: document.getElementById('file1-ini-name'), excel1: document.getElementById('file1-excel-name'), ddf2: document.getElementById('file2-ddf-name'), vtl2: document.getElementById('file2-vtl-name'), ini2: document.getElementById('file2-ini-name'), excel2: document.getElementById('file2-excel-name') };
    const inputWrappers = { ddf: [document.getElementById('ddf-inputs'), document.getElementById('ddf-inputs2')], vtl: [document.getElementById('vtl-inputs'), document.getElementById('vtl-inputs2')], ini: [document.getElementById('ini-inputs'), document.getElementById('ini-inputs2')], excel: [document.getElementById('excel-inputs'), document.getElementById('excel-inputs2')] };
    const resultSections = { ddf: document.getElementById('ddf-results-section'), vtl: document.getElementById('vtl-results-section'), ini: document.getElementById('ini-results-section'), excel: document.getElementById('excel-results-section') };
    const resultSummaries = { ddf: document.getElementById('ddf-summary'), vtl: document.getElementById('vtl-summary'), ini: document.getElementById('ini-summary'), excel: document.getElementById('excel-summary') };
    const resultOutputs = { ddf: document.getElementById('ddf-diff-output'), vtl: document.getElementById('vtl-diff-output'), ini: document.getElementById('ini-diff-output'), excel: document.getElementById('excel-diff-output') };
    const compareBtn = document.getElementById('compare-btn');
    const resultsContainer = document.getElementById('results-container');
    const loader = document.getElementById('loader');
    const copyBtn = document.getElementById('copy-btn');
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');

    /**
     * Validates the state of the form to enable or disable the "Compare" button.
     * The button is enabled only if at least one file type is selected and both corresponding file inputs have a file.
     */
    function validateFormState() {
        let atLeastOneTypeSelected = false;
        let allSelectedTypesAreReady = true;
        for (const type in fileToggles) {
            if (fileToggles[type].checked) {
                atLeastOneTypeSelected = true;
                const file1 = fileInputs[type + '1'].files.length > 0;
                const file2 = fileInputs[type + '2'].files.length > 0;
                if (!file1 || !file2) { allSelectedTypesAreReady = false; break; }
            }
        }
        compareBtn.disabled = !(atLeastOneTypeSelected && allSelectedTypesAreReady);
    }

    /**
     * Displays a message to the user.
     * @param {string} message - The message to display.
     * @param {boolean} [isError=true] - Whether the message is an error (red) or success (green).
     */
    function showMessage(message, isError = true) {
        messageText.textContent = message;
        messageBox.className = `fixed top-5 right-5 text-white py-2 px-5 rounded-lg shadow-md z-50 ${isError ? 'bg-red-600' : 'bg-green-600'}`;
        messageBox.classList.remove('hidden');
        setTimeout(() => { messageBox.classList.add('hidden'); }, 3000);
    }

    /**
     * Sets up a file input to display the selected file name and update the form state.
     * @param {string} key - The key for the file input in the `fileInputs` and `nameLabels` objects.
     * @param {string} defaultText - The default text to show when no file is selected.
     */
    function setupFileInput(key, defaultText) {
        const inputEl = fileInputs[key];
        const nameEl = nameLabels[key];
        const dropArea = inputEl.parentElement;
        inputEl.addEventListener('change', () => {
            if (inputEl.files[0]) { nameEl.textContent = inputEl.files[0].name; dropArea.classList.add('file-uploaded');
            } else { nameEl.textContent = defaultText; dropArea.classList.remove('file-uploaded'); }
            validateFormState();
        });
    }
    setupFileInput('ddf1', 'Click or drop DDF file'); setupFileInput('ddf2', 'Click or drop DDF file');
    setupFileInput('vtl1', 'Click or drop VTL file'); setupFileInput('vtl2', 'Click or drop VTL file');
    setupFileInput('ini1', 'Click or drop INI file'); setupFileInput('ini2', 'Click or drop INI file');
    setupFileInput('excel1', 'Click or drop Excel file'); setupFileInput('excel2', 'Click or drop Excel file');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => document.body.addEventListener(eventName, e => e.preventDefault()));

    /**
     * Sets up drag and drop functionality for a file input area.
     * @param {string} key - The key for the file input in the `fileInputs` object.
     */
    function setupDragDrop(key) {
        const dropArea = fileInputs[key].parentElement;
        dropArea.addEventListener('drop', (e) => { e.preventDefault(); dropArea.classList.remove('dragover'); if (e.dataTransfer.files.length > 0) { fileInputs[key].files = e.dataTransfer.files; fileInputs[key].dispatchEvent(new Event('change')); } });
        dropArea.addEventListener('dragover', (e) => { e.preventDefault(); dropArea.classList.add('dragover'); });
        dropArea.addEventListener('dragleave', (e) => { e.preventDefault(); dropArea.classList.remove('dragover'); });
    }
    Object.keys(fileInputs).forEach(key => setupDragDrop(key));

    /**
     * Attaches change event listeners to file type toggles.
     * Hides or shows the corresponding file inputs when a toggle is changed.
     */
    Object.entries(fileToggles).forEach(([type, toggle]) => {
        toggle.addEventListener('change', () => {
            const isChecked = toggle.checked;
            inputWrappers[type].forEach(wrapper => wrapper.classList.toggle('hidden', !isChecked));
            if (!isChecked) { fileInputs[type + '1'].value = null; fileInputs[type + '1'].dispatchEvent(new Event('change')); fileInputs[type + '2'].value = null; fileInputs[type + '2'].dispatchEvent(new Event('change')); }
            validateFormState();
        });
    });

    /**
     * Handles the click event for the compare button.
     * It reads the selected files, performs the comparison for each active file type, and displays the results.
     */
    compareBtn.addEventListener('click', async () => {
        if (compareBtn.disabled) return;
        resultsContainer.classList.remove('hidden');
        loader.classList.remove('hidden');
        Object.values(resultSections).forEach(section => section.classList.add('hidden'));
        compareBtn.disabled = true;
        try {
            if (fileToggles.ddf.checked) { const [ddf1, ddf2] = await Promise.all([fileInputs.ddf1.files[0].text(), fileInputs.ddf2.files[0].text()]); const parser = new DOMParser(); const ddfDoc1 = parser.parseFromString(ddf1, "application/xml"); const ddfDoc2 = parser.parseFromString(ddf2, "application/xml"); if (ddfDoc1.querySelector("parsererror") || ddfDoc2.querySelector("parsererror")) throw new Error("A DDF file is not valid XML."); const ddfDiffs = compareXmlNodes(ddfDoc1.documentElement, ddfDoc2.documentElement); displayXmlResult(ddfDiffs, 'DDF', resultSummaries.ddf, resultOutputs.ddf, resultSections.ddf); }
            if (fileToggles.vtl.checked) { const [vtl1, vtl2] = await Promise.all([fileInputs.vtl1.files[0].text(), fileInputs.vtl2.files[0].text()]); const parser = new DOMParser(); const vtlDoc1 = parser.parseFromString(vtl1, "application/xml"); const vtlDoc2 = parser.parseFromString(vtl2, "application/xml"); if (vtlDoc1.querySelector("parsererror") || vtlDoc2.querySelector("parsererror")) throw new Error("A VTL file is not valid XML."); const vtlDiffs = compareXmlNodes(vtlDoc1.documentElement, vtlDoc2.documentElement); displayXmlResult(vtlDiffs, 'VTL', resultSummaries.vtl, resultOutputs.vtl, resultSections.vtl); }
            if (fileToggles.ini.checked) { const [ini1, ini2] = await Promise.all([fileInputs.ini1.files[0].text(), fileInputs.ini2.files[0].text()]); const iniDiffs = compareIniObjects(parseIni(ini1), parseIni(ini2)); displayIniResult(iniDiffs, resultSummaries.ini, resultOutputs.ini, resultSections.ini); }
            if (fileToggles.excel.checked) { const [excelBuffer1, excelBuffer2] = await Promise.all([fileInputs.excel1.files[0].arrayBuffer(), fileInputs.excel2.files[0].arrayBuffer()]); const workbook1 = XLSX.read(excelBuffer1, {type: 'buffer'}); const workbook2 = XLSX.read(excelBuffer2, {type: 'buffer'}); const excelDiffs = compareExcelWorkbooks(workbook1, workbook2); displayExcelResult(excelDiffs, resultSummaries.excel, resultOutputs.excel, resultSections.excel); }
        } catch (e) { showMessage(e.message || "An error occurred during comparison."); resultsContainer.classList.add('hidden');
        } finally { loader.classList.add('hidden'); validateFormState(); }
    });

    /**
     * Recursively compares two XML nodes and their children for differences.
     * @param {Node} node1 - The first XML node.
     * @param {Node} node2 - The second XML node.
     * @param {string} [path=''] - The current path for tracking the location of differences.
     * @returns {Array<Object>} An array of difference objects.
     */
    function compareXmlNodes(node1, node2, path = '') {
        let diffs = []; const currentPath = path ? `${path} > ${node1.nodeName}` : node1.nodeName; const attrs1 = getAttributesMap(node1), attrs2 = getAttributesMap(node2); const allAttrKeys = new Set([...Object.keys(attrs1), ...Object.keys(attrs2)]);
        for (const key of allAttrKeys) { if (attrs1[key] !== attrs2[key]) { diffs.push({ type: 'Attribute', path: `${currentPath}[@${key}]`, value1: attrs1[key] || 'N/A', value2: attrs2[key] || 'N/A' }); } }
        const keyedChildren1 = mapChildrenByKey(Array.from(node1.children)); const keyedChildren2 = mapChildrenByKey(Array.from(node2.children)); const allChildKeys = new Set([...Object.keys(keyedChildren1), ...Object.keys(keyedChildren2)]);
        for (const key of allChildKeys) { const child1 = keyedChildren1[key], child2 = keyedChildren2[key]; if (child1 && !child2) diffs.push({ type: 'Node Removed', path: currentPath, value1: key, value2: 'N/A' }); else if (!child1 && child2) diffs.push({ type: 'Node Added', path: currentPath, value1: 'N/A', value2: key }); else if (child1 && child2) diffs.push(...compareXmlNodes(child1, child2, currentPath)); }
        if (node1.children.length === 0 && node2.children.length === 0) { const text1 = (node1.textContent || "").trim(), text2 = (node2.textContent || "").trim(); if (text1 !== text2) diffs.push({ type: 'Text Content', path: currentPath, value1: text1, value2: text2 }); }
        return diffs;
    }

    /**
     * Gets all attributes of a node as a key-value map.
     * @param {Node} node - The XML node.
     * @returns {Object} A map of attribute names to their values.
     */
    function getAttributesMap(node) { const attrs = {}; if (node.attributes) for (const attr of node.attributes) attrs[attr.name] = attr.value; return attrs; }

    /**
     * Maps child nodes by a unique key (name, id, or index) to facilitate comparison.
     * @param {Array<Node>} children - An array of child nodes.
     * @returns {Object} A map of keys to child nodes.
     */
    function mapChildrenByKey(children) {
        const map = {}; children.forEach((child, index) => { const name = child.getAttribute('name'), id = child.getAttribute('id'); let key = name ? `${child.tagName}[name=${name}]` : id ? `${child.tagName}[id=${id}]` : `${child.tagName}[${index}]`; let originalKey = key, count = 2; while (map[key]) key = `${originalKey} (${count++})`; map[key] = child; }); return map;
    }

    /**
     * Parses a string of INI file content into a JavaScript object.
     * @param {string} text - The INI file content.
     * @returns {Object} An object representing the INI data.
     */
    function parseIni(text) { const data = {}; let section = null; text.split(/[\r\n]+/).forEach(line => { line = line.trim(); if (line.startsWith('[') && line.endsWith(']')) { section = line.substring(1, line.length - 1); data[section] = {}; } else if (section && line.includes('=')) { const [key, ...valueParts] = line.split('='); data[section][key.trim()] = valueParts.join('=').trim(); } }); return data; }

    /**
     * Compares two INI data objects for differences.
     * @param {Object} obj1 - The first INI object.
     * @param {Object} obj2 - The second INI object.
     * @returns {Array<Object>} An array of difference objects.
     */
    function compareIniObjects(obj1, obj2) {
        const differences = []; const allSections = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
        for (const section of allSections) {
            if (obj1[section] && !obj2[section]) { differences.push({ type: 'Section Removed', section, key: '', value1: 'Entire Section', value2: 'N/A' }); } else if (!obj1[section] && obj2[section]) { differences.push({ type: 'Section Added', section, key: '', value1: 'N/A', value2: 'Entire Section' });
            } else { if(!obj1[section] || !obj2[section]) continue; const allKeys = new Set([...Object.keys(obj1[section]), ...Object.keys(obj2[section])]); for (const key of allKeys) { const val1 = obj1[section][key]; const val2 = obj2[section][key]; if (val1 !== val2) { differences.push({ type: 'Value Changed', section, key, value1: val1 || 'N/A', value2: val2 || 'N/A' }); } } }
        } return differences;
    }

    /**
     * Compares two Excel workbooks for differences.
     * @param {Object} wb1 - The first workbook object from xlsx.js.
     * @param {Object} wb2 - The second workbook object from xlsx.js.
     * @returns {Array<Object>} An array of difference objects.
     */
    function compareExcelWorkbooks(wb1, wb2) {
        const diffs = []; const sheets1 = wb1.SheetNames, sheets2 = wb2.SheetNames; const allSheets = new Set([...sheets1, ...sheets2]);
        allSheets.forEach(sheetName => {
            if (sheets1.includes(sheetName) && !sheets2.includes(sheetName)) { diffs.push({ type: 'Sheet Removed', sheet: sheetName, cell: 'N/A', value1: 'Exists', value2: 'N/A' }); } else if (!sheets1.includes(sheetName) && sheets2.includes(sheetName)) { diffs.push({ type: 'Sheet Added', sheet: sheetName, cell: 'N/A', value1: 'N/A', value2: 'Exists' });
            } else { const ws1 = XLSX.utils.sheet_to_json(wb1.Sheets[sheetName], { header: 1, defval: "" }); const ws2 = XLSX.utils.sheet_to_json(wb2.Sheets[sheetName], { header: 1, defval: "" }); const maxRows = Math.max(ws1.length, ws2.length); for (let r = 0; r < maxRows; r++) { const row1 = ws1[r] || []; const row2 = ws2[r] || []; const maxCols = Math.max(row1.length, row2.length); for (let c = 0; c < maxCols; c++) { const v1 = row1[c] || ""; const v2 = row2[c] || ""; if (v1 !== v2) { diffs.push({ type: 'Cell Changed', sheet: sheetName, cell: XLSX.utils.encode_cell({ r: r, c: c }), value1: v1, value2: v2 }); } } } }
        }); return diffs;
    }

    /**
     * Displays the results of an XML file comparison in a table.
     * @param {Array<Object>} diffs - Array of difference objects.
     * @param {string} type - The type of file being compared (e.g., 'DDF', 'VTL').
     * @param {HTMLElement} summaryEl - The element to display the summary message in.
     * @param {HTMLElement} outputEl - The element to display the diff table in.
     * @param {HTMLElement} sectionEl - The container section for the results.
     */
    function displayXmlResult(diffs, type, summaryEl, outputEl, sectionEl) { sectionEl.classList.remove('hidden'); if (diffs.length === 0) { summaryEl.innerHTML = `<p class="text-lg font-medium text-green-600">No differences found in ${type} files. The revisions are identical.</p>`; outputEl.innerHTML = ''; return; } summaryEl.innerHTML = `<p class="text-lg font-medium">Found <span class="text-red-600 font-bold">${diffs.length}</span> difference(s) in ${type} files.</p>`; let tableHTML = '<table class="diff-table"><thead><tr><th>Type</th><th>Path / Element</th><th>Current Revision Value</th><th>New Revision Value</th></tr></thead><tbody>'; diffs.forEach(d => { tableHTML += `<tr><td><span class="font-semibold text-slate-700">${escapeHtml(d.type)}</span></td><td><pre>${escapeHtml(d.path)}</pre></td><td class="diff-removed"><pre>${escapeHtml(d.value1)}</pre></td><td class="diff-added"><pre>${escapeHtml(d.value2)}</pre></td></tr>`; }); tableHTML += '</tbody></table>'; outputEl.innerHTML = tableHTML; }

    /**
     * Displays the results of an INI file comparison in a table.
     * @param {Array<Object>} diffs - Array of difference objects.
     * @param {HTMLElement} summaryEl - The element to display the summary message in.
     * @param {HTMLElement} outputEl - The element to display the diff table in.
     * @param {HTMLElement} sectionEl - The container section for the results.
     */
    function displayIniResult(diffs, summaryEl, outputEl, sectionEl) { sectionEl.classList.remove('hidden'); if (diffs.length === 0) { summaryEl.innerHTML = `<p class="text-lg font-medium text-green-600">No differences found in INI files. The revisions are identical.</p>`; outputEl.innerHTML = ''; return; } summaryEl.innerHTML = `<p class="text-lg font-medium">Found <span class="text-red-600 font-bold">${diffs.length}</span> difference(s) in INI files.</p>`; let tableHTML = '<table class="diff-table"><thead><tr><th>Type</th><th>Section</th><th>Key</th><th>Current Revision Value</th><th>New Revision Value</th></tr></thead><tbody>'; diffs.forEach(d => { tableHTML += `<tr><td><span class="font-semibold text-slate-700">${escapeHtml(d.type)}</span></td><td><pre>${escapeHtml(d.section)}</pre></td><td><pre>${escapeHtml(d.key)}</pre></td><td class="diff-removed"><pre>${escapeHtml(d.value1)}</pre></td><td class="diff-added"><pre>${escapeHtml(d.value2)}</pre></td></tr>`; }); tableHTML += '</tbody></table>'; outputEl.innerHTML = tableHTML; }

    /**
     * Displays the results of an Excel file comparison in a table.
     * @param {Array<Object>} diffs - Array of difference objects.
     * @param {HTMLElement} summaryEl - The element to display the summary message in.
     * @param {HTMLElement} outputEl - The element to display the diff table in.
     * @param {HTMLElement} sectionEl - The container section for the results.
     */
    function displayExcelResult(diffs, summaryEl, outputEl, sectionEl) { sectionEl.classList.remove('hidden'); if (diffs.length === 0) { summaryEl.innerHTML = `<p class="text-lg font-medium text-green-600">No differences found in Excel files. The workbooks are identical.</p>`; outputEl.innerHTML = ''; return; } summaryEl.innerHTML = `<p class="text-lg font-medium">Found <span class="text-red-600 font-bold">${diffs.length}</span> difference(s) in Excel files.</p>`; let tableHTML = '<table class="diff-table"><thead><tr><th>Type</th><th>Sheet</th><th>Cell</th><th>Current Revision Value</th><th>New Revision Value</th></tr></thead><tbody>'; diffs.forEach(d => { tableHTML += `<tr><td><span class="font-semibold text-slate-700">${escapeHtml(d.type)}</span></td><td><pre>${escapeHtml(d.sheet)}</pre></td><td><pre>${escapeHtml(d.cell)}</pre></td><td class="diff-removed"><pre>${escapeHtml(String(d.value1))}</pre></td><td class="diff-added"><pre>${escapeHtml(String(d.value2))}</pre></td></tr>`; }); tableHTML += '</tbody></table>'; outputEl.innerHTML = tableHTML; }

    /**
     * Escapes HTML special characters to prevent rendering issues.
     * @param {string} str - The string to escape.
     * @returns {string} The escaped string.
     */
    function escapeHtml(str) { return (str || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]); }

    /**
     * Formats an HTML table into a tab-separated string for copying.
     * @param {HTMLTableElement} table - The table to format.
     * @returns {string} A tab-separated representation of the table data.
     */
    function formatTableForCopy(table) { if (!table) return ""; let text = ""; table.querySelectorAll('tr').forEach(row => { const cells = Array.from(row.querySelectorAll('th, td')).map(cell => `"${cell.innerText.replace(/"/g, '""')}"`); text += cells.join('\t') + '\n'; }); return text; }

    /**
     * Handles the click event for the "Copy All Results" button.
     * It formats all visible results into a single string and copies it to the clipboard.
     */
    copyBtn.addEventListener('click', () => { let textToCopy = "ZEN- Acumen System Verification Offline Checker - Comparison Results\n\n"; ['ddf', 'vtl', 'ini', 'excel'].forEach(type => { if(fileToggles[type].checked) { const summaryEl = resultSummaries[type]; const outputEl = resultOutputs[type]; const table = outputEl.querySelector('table'); if (summaryEl.innerHTML) { textToCopy += `--- ${type.toUpperCase()} Comparison ---\n`; textToCopy += `${summaryEl.textContent.trim()}\n`; if (table) textToCopy += formatTableForCopy(table); textToCopy += "\n"; } } }); navigator.clipboard.writeText(textToCopy).then(() => { showMessage('Results copied to clipboard!', false); }, () => { showMessage('Failed to copy results.'); }); });

    validateFormState();
}

// =================================================================
// INI GENERATOR SCRIPT (COMBINED VERSION)
// =================================================================

/**
 * Initializes the INI Generator application.
 * This function sets up the logic for generating an INI file from VTL and CSV data.
 */
function initIniGenerator() {
    let vtlData = null;
    let recipeData = null;
    let currentINI = null;
    let generatedINI = null;
    let processingLog = [];

    const vtlFile = document.getElementById('vtlFile');
    const excelFile = document.getElementById('excelFile');
    const iniFile = document.getElementById('iniFile');
    const familySelect = document.getElementById('familySelect');
    const runBtn = document.getElementById('runBtn');
    const iniGenForm = document.getElementById('ini-gen-form');
    const iniGenResults = document.getElementById('ini-gen-results');
    const output = document.getElementById('output');
    const summaryContent = document.getElementById('summaryContent');
    const downloadINIButton = document.getElementById('downloadINIButton');
    const exportSummaryButton = document.getElementById('exportSummaryButton');
    const iniGenSpinner = document.getElementById('iniGenSpinner');

    /**
     * Updates the file name display on the custom file upload button.
     * @param {string} inputId - The ID of the file input element.
     * @param {string} labelId - The ID of the label element for the file input.
     */
    function updateFileName(inputId, labelId) {
        const input = document.getElementById(inputId);
        const label = document.getElementById(labelId);
        const textElement = label.querySelector('p');
        if (input.files.length > 0) {
            textElement.textContent = input.files[0].name;
            label.classList.add('file-uploaded');
        } else {
            textElement.textContent = 'Choose File';
            label.classList.remove('file-uploaded');
        }
        validateFormState();
    }

    /**
     * Validates the form state to enable/disable the "Generate INI" button.
     */
    function validateFormState() {
        const allFilesPresent = vtlData && recipeData && currentINI && familySelect.value;
        runBtn.disabled = !allFilesPresent;
    }

    /**
     * Displays an error message in an info panel.
     * @param {string} elementId - The ID of the info panel element.
     * @param {string} message - The error message to display.
     */
    function showError(elementId, message) {
        const info = document.getElementById(elementId);
        info.className = 'info-panel error';
        info.innerHTML = message;
        info.classList.remove('hidden');
    }

    /**
     * Displays a success message in an info panel.
     * @param {string} elementId - The ID of the info panel element.
     * @param {string} message - The success message to display.
     */
    function showSuccess(elementId, message) {
        const info = document.getElementById(elementId);
        info.className = 'info-panel success';
        info.innerHTML = message;
        info.classList.remove('hidden');
    }

    /**
     * Handles the VTL file input change event.
     * It reads the VTL file, parses it as XML, and extracts relevant data.
     * @param {Event} e - The file input change event.
     */
    vtlFile.addEventListener('change', function(e) {
        updateFileName('vtlFile', 'vtlFileLabel');
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(event.target.result, 'text/xml');

                    const productDataElem = xmlDoc.querySelector('ProductData');
                    const dataFileName = productDataElem ? productDataElem.getAttribute('name') : '';

                    const parts = [];
                    const partAliases = xmlDoc.querySelectorAll('PartAliasTable Part');
                    partAliases.forEach(part => {
                        parts.push({
                            name: part.getAttribute('name'),
                            alias: part.getAttribute('alias')
                        });
                    });

                    vtlData = {
                        dataFileName: dataFileName,
                        parts: parts
                    };

                    showSuccess('vtlInfo', `<strong>Acumen Template:</strong> ${vtlData.dataFileName}<br><strong>SKUs Found:</strong> ${vtlData.parts.length}`);
                } catch (error) {
                    showError('vtlInfo', 'Error parsing VTL file. Ensure it is a valid XML file.');
                    vtlData = null;
                } finally {
                    validateFormState();
                }
            };
            reader.readAsText(file);
        } else {
            vtlData = null;
            document.getElementById('vtlInfo').classList.add('hidden');
            validateFormState();
        }
    });

    /**
     * Handles the recipe CSV file input change event.
     * It reads the CSV file and parses it into a recipe mapping object.
     * @param {Event} e - The file input change event.
     */
    excelFile.addEventListener('change', function(e) {
        updateFileName('excelFile', 'excelFileLabel');
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const text = event.target.result;
                    const lines = text.split('\n');
                    const recipes = {};

                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (line) {
                            const parts = line.split(',');
                            if (parts.length >= 2) {
                                const productNumber = parts[0].trim();
                                const recipeId = parts[1].trim();
                                if (recipeId) {
                                    recipes[productNumber] = recipeId;
                                }
                            }
                        }
                    }

                    recipeData = recipes;
                    const count = Object.keys(recipeData).length;
                    showSuccess('excelInfo', `<strong>Recipe mappings loaded:</strong> ${count} entries`);
                } catch (error) {
                    showError('excelInfo', 'Error parsing recipe data file. Ensure it is a valid CSV format.');
                    recipeData = null;
                } finally {
                    validateFormState();
                }
            };
            reader.readAsText(file);
        } else {
            recipeData = null;
            document.getElementById('excelInfo').classList.add('hidden');
            validateFormState();
        }
    });

    /**
     * Handles the current INI file input change event.
     * It reads the content of the INI file.
     * @param {Event} e - The file input change event.
     */
    iniFile.addEventListener('change', function(e) {
        updateFileName('iniFile', 'iniFileLabel');
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                currentINI = event.target.result;
                const lines = currentINI.split('\n').length;
                showSuccess('iniInfo', `<strong>INI file loaded:</strong> ${lines} lines`);
                validateFormState();
            };
            reader.readAsText(file);
        } else {
            currentINI = null;
            document.getElementById('iniInfo').classList.add('hidden');
            validateFormState();
        }
    });

    familySelect.addEventListener('change', validateFormState);

    runBtn.addEventListener('click', generateINI);
    downloadINIButton.addEventListener('click', downloadINI);
    exportSummaryButton.addEventListener('click', exportSummary);

    document.querySelectorAll('input[name="summaryType"]').forEach(radio => {
        radio.addEventListener('change', updateSummaryDisplay);
    });

    /**
     * Generates the INI file content based on the loaded VTL, CSV, and existing INI files.
     */
    function generateINI() {
        processingLog = [];

        if (!vtlData || !recipeData || !currentINI || !familySelect.value) {
            return; // Validation handled by disabled state
        }

        iniGenResults.classList.remove('hidden');
        iniGenSpinner.classList.remove('hidden');
        runBtn.disabled = true;

        setTimeout(() => {
            try {
                processingLog.push(`Started INI generation process`);
                processingLog.push(`Template: ${vtlData.dataFileName}`);
                processingLog.push(`Family: ${familySelect.value}`);
                processingLog.push(`SKUs to process: ${vtlData.parts.length}`);

                const iniLines = currentINI.split('\n');
                let iniSections = {};
                let currentSection = '';

                for (let line of iniLines) {
                    line = line.trim();
                    if (line.startsWith('[') && line.endsWith(']')) {
                        currentSection = line;
                        iniSections[currentSection] = [];
                    } else if (line && currentSection) {
                        iniSections[currentSection].push(line);
                    }
                }

                const newRecipes = [];
                const updatedRecipes = [];
                const existingRecipeIds = new Set();

                if (iniSections['[RECIPE]']) {
                    iniSections['[RECIPE]'].forEach(line => {
                        const match = line.match(/^(\d+)=/);
                        if (match) {
                            existingRecipeIds.add(match[1]);
                        }
                    });
                }

                vtlData.parts.forEach(part => {
                    const recipeId = recipeData[part.name];
                    if (recipeId) {
                        const recipeSection = `[RECIPE${recipeId}]`;
                        const productLine = `Product=${part.name} | ${part.alias}`;
                        const familyLine = `Family=${familySelect.value}`;

                        let sectionContent = [productLine, familyLine];

                        if (['WATT_DARWIN', 'WATT', 'NESTAS_RAND_MID'].includes(familySelect.value)) {
                            sectionContent.push(`CaspianVTL=${vtlData.dataFileName}`);
                        }

                        const isExisting = existingRecipeIds.has(recipeId);

                        if (!isExisting) {
                            if (!iniSections['[RECIPE]']) {
                                iniSections['[RECIPE]'] = [];
                            }
                            iniSections['[RECIPE]'].push(`${recipeId}=RECIPE${recipeId}`);
                            newRecipes.push(recipeId);
                            processingLog.push(`Added new recipe ${recipeId} for ${part.name}`);
                             // Add the new section content
                            iniSections[recipeSection] = sectionContent;
                        } else {
                            updatedRecipes.push(recipeId);
                            processingLog.push(`Updated existing recipe ${recipeId} for ${part.name}`);

                            // AMEND/EDIT Logic: Update lines in place
                            let existingSection = iniSections[recipeSection];
                            if (existingSection) {
                                let productUpdated = false;
                                let familyUpdated = false;
                                let caspianFound = false;

                                let newSectionContent = existingSection.map(line => {
                                    if (line.startsWith('Product=')) {
                                        productUpdated = true;
                                        return productLine;
                                    }
                                    if (line.startsWith('Family=')) {
                                        familyUpdated = true;
                                        return familyLine;
                                    }
                                    if (line.startsWith('CaspianVTL=')) {
                                        caspianFound = true;
                                        // If new family needs it, update it. If not, remove it (return null).
                                        if (['WATT_DARWIN', 'WATT', 'NESTAS_RAND_MID'].includes(familySelect.value)) {
                                            return `CaspianVTL=${vtlData.dataFileName}`;
                                        } else {
                                            return null; // This will be filtered out later.
                                        }
                                    }
                                    return line;
                                });

                                // Add lines that might be missing
                                if (!productUpdated) {
                                    newSectionContent.push(productLine);
                                }
                                if (!familyUpdated) {
                                    newSectionContent.push(familyLine);
                                }
                                if (['WATT_DARWIN', 'WATT', 'NESTAS_RAND_MID'].includes(familySelect.value) && !caspianFound) {
                                    newSectionContent.push(`CaspianVTL=${vtlData.dataFileName}`);
                                }

                                // Filter out removed lines and update the section
                                iniSections[recipeSection] = newSectionContent.filter(line => line !== null);
                            } else {
                                // If the section exists in [RECIPE] but not as its own section, create it
                                iniSections[recipeSection] = sectionContent;
                            }
                        }
                    } else {
                        processingLog.push(`Warning: No recipe ID found for ${part.name}`);
                    }
                });

                if (!iniSections['[RECIPECOMMON]']) {
                    iniSections['[RECIPECOMMON]'] = [
                        'CutOff=00',
                        'FreshMonth=12',
                        'FreshWeek=29'
                    ];
                    processingLog.push(`Added RECIPECOMMON section`);
                }

                let outputContent = '';

                if (iniSections['[RECIPE]']) {
                    outputContent += '[RECIPE]\n';
                    const recipeEntries = iniSections['[RECIPE]'].slice().sort((a, b) => {
                        const idA = parseInt(a.match(/^(\d+)=/)?.[1] || '0');
                        const idB = parseInt(b.match(/^(\d+)=/)?.[1] || '0');
                        return idA - idB;
                    });
                    outputContent += recipeEntries.join('\n') + '\n\n';
                }

                outputContent += '[RECIPECOMMON]\n';
                outputContent += iniSections['[RECIPECOMMON]'].join('\n') + '\n\n';

                const recipeSections = Object.keys(iniSections).filter(key => key.startsWith('[RECIPE') && key !== '[RECIPE]' && key !== '[RECIPECOMMON]');
                recipeSections.sort((a, b) => {
                        const idA = parseInt(a.match(/\[RECIPE(\d+)\]/)?.[1] || '0');
                        const idB = parseInt(b.match(/\[RECIPE(\d+)\]/)?.[1] || '0');
                        return idA - idB;
                });

                recipeSections.forEach(section => {
                    outputContent += section + '\n';
                    outputContent += iniSections[section].join('\n') + '\n\n';
                });

                generatedINI = outputContent;

                processingLog.push(`Generation completed successfully`);
                processingLog.push(`New recipes added: ${newRecipes.length}`);
                processingLog.push(`Existing recipes updated: ${updatedRecipes.length}`);
                processingLog.push(`Total recipes processed: ${newRecipes.length + updatedRecipes.length}`);

                output.textContent = generatedINI;
                updateSummaryDisplay();

            } catch (error) {
                processingLog.push(`Error: ${error.message}`);
                output.textContent = `Error generating INI: ${error.message}`;
                updateSummaryDisplay();

            } finally {
                iniGenSpinner.classList.add('hidden');
                runBtn.disabled = false;
            }
        }, 100);
    }

    /**
     * Updates the summary display based on the selected summary type (brief or detailed).
     */
    function updateSummaryDisplay() {
        const summaryType = document.querySelector('input[name="summaryType"]:checked').value;

        if (summaryType === 'brief') {
            const summary = processingLog.filter(log =>
                log.includes('Started') ||
                log.includes('Template:') ||
                log.includes('Family:') ||
                log.includes('Generation completed') ||
                log.includes('New recipes added:') ||
                log.includes('Existing recipes updated:') ||
                log.includes('Total recipes processed:') ||
                log.includes('Error:')
            );
            summaryContent.textContent = summary.join('\n');
        } else {
            summaryContent.textContent = processingLog.join('\n');
        }
    }

    /**
     * Exports the processing summary to a text file.
     */
    function exportSummary() {
        if (processingLog.length === 0) {
            alert('No summary data to export. Please run the generation process first.');
            return;
        }

        const summaryType = document.querySelector('input[name="summaryType"]:checked').value;

        let content = `INI Generation Summary - ${summaryType.toUpperCase()}\n`;
        content += `Generated on: ${new Date().toLocaleString()}\n`;
        content += `${'='.repeat(50)}\n\n`;

        if (summaryType === 'brief') {
            const summary = processingLog.filter(log =>
                log.includes('Started') ||
                log.includes('Template:') ||
                log.includes('Family:') ||
                log.includes('Generation completed') ||
                log.includes('New recipes added:') ||
                log.includes('Existing recipes updated:') ||
                log.includes('Total recipes processed:') ||
                log.includes('Error:')
            );
            content += summary.join('\n');
        } else {
            content += processingLog.join('\n');
        }

        const acumenTemplate = vtlData && vtlData.dataFileName ? vtlData.dataFileName : 'NoTemplate';
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Summary ${acumenTemplate}-${getFormattedTimestamp()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Generates a formatted timestamp string.
     * @returns {string} The formatted timestamp (e.g., '030925-112804').
     */
    function getFormattedTimestamp() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
        const year = String(now.getFullYear()).slice(-2);
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${day}${month}${year}-${hours}${minutes}${seconds}`;
    }

    /**
     * Downloads the generated INI file.
     */
    function downloadINI() {
        if (generatedINI) {
            const acumenTemplate = vtlData && vtlData.dataFileName ? vtlData.dataFileName : 'NoTemplate';
            const blob = new Blob([generatedINI], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Generated ${acumenTemplate}-${getFormattedTimestamp()}.ini`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }
    }

    // Initial state validation
    validateFormState();
}

// =================================================================
// VTL VIEWER SCRIPT
// =================================================================
/**
 * Initializes the VTL Viewer application.
 * This function sets up the logic for parsing and displaying VTL file data.
 */
function initVtlViewer() {
    const vtlFileInput = document.getElementById('vtl_file_input');
    const skuSelect = document.getElementById('vtl_skuSelect');
    const outputDiv = document.getElementById('vtl_output');
    let productData = null;

    vtlFileInput.addEventListener('change', handleFileSelect);
    skuSelect.addEventListener('change', displaySkuData);

    /**
     * Handles the VTL file selection event.
     * @param {Event} event - The file input change event.
     */
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) { outputDiv.innerHTML = '<p class="text-center text-slate-500">Parsing VTL file...</p>'; const reader = new FileReader(); reader.onload = function(e) { parseVTL(e.target.result); }; reader.readAsText(file); }
    }

    /**
     * Parses the VTL XML string and populates the SKU select dropdown.
     * @param {string} xmlString - The XML content of the VTL file.
     */
    function parseVTL(xmlString) {
        const parser = new DOMParser(); const xmlDoc = parser.parseFromString(xmlString, "application/xml");
        if (xmlDoc.getElementsByTagName("parsererror").length > 0) { outputDiv.innerHTML = '<p class="text-red-600 font-bold text-center">Error parsing VTL file. Please ensure it is a valid XML file.</p>'; skuSelect.setAttribute('disabled', 'true'); skuSelect.innerHTML = '<option value="">Select an SKU</option>'; productData = null; return; }
        productData = xmlDoc.documentElement; populateSkuSelect();
    }

    /**
     * Populates the SKU select dropdown with SKUs found in the VTL file.
     */
    function populateSkuSelect() {
        skuSelect.innerHTML = '<option value="">Select an SKU</option>'; const partElements = productData.querySelectorAll('PartAliasTable Part'); const skus = new Set();
        partElements.forEach(part => skus.add(part.getAttribute('name')));
        productData.querySelectorAll('DefaultsList default').forEach(defaultElem => skus.add(defaultElem.getAttribute('name')));
        Array.from(skus).sort().forEach(sku => { const option = document.createElement('option'); option.value = sku; option.textContent = sku; skuSelect.appendChild(option); });
        skuSelect.removeAttribute('disabled'); outputDiv.innerHTML = '<p class="text-center text-slate-500">VTL file loaded. Please select an SKU to view its data.</p>';
    }

    /**
     * Displays the data for the currently selected SKU.
     */
    function displaySkuData() {
        const selectedSku = skuSelect.value; if (!selectedSku || !productData) { outputDiv.innerHTML = '<p class="text-center text-slate-500">Please select an SKU to view its data.</p>'; return; }
        let html = `<h2 class="text-2xl font-bold mb-4 text-center">Data for SKU: ${selectedSku}</h2>`;
        html += `<div class="vtl-data-section"><h3>I2C Addresses</h3><table>`; const i2cDefaults = productData.querySelectorAll('Attribute[name="I2CAddress"] default[name="' + selectedSku + '"]'); if (i2cDefaults.length > 0) { const i2cDefault = i2cDefaults[0]; html += `<tr><th>WriteI2CAddress</th><td>${i2cDefault.getAttribute('WriteI2CAddress')}</td></tr>`; html += `<tr><th>VerifyI2CAddress</th><td>${i2cDefault.getAttribute('VerifyI2CAddress')}</td></tr>`; } else { html += `<tr><td colspan="2" class="text-center text-slate-500">N/A</td></tr>`; } html += `</table></div>`;
        html += `<div class="vtl-data-section"><h3>Part Alias</h3><table>`; const partAlias = productData.querySelector('PartAliasTable Part[name="' + selectedSku + '"]'); if (partAlias) { html += `<tr><th>Alias</th><td>${partAlias.getAttribute('alias')}</td></tr>`; } else { html += `<tr><td colspan="2" class="text-center text-slate-500">N/A</td></tr>`; } html += `</table></div>`;
        html += `<div class="vtl-data-section"><h3>Perso Part Number</h3><table>`; const persoPartNumber = productData.querySelector('PersoPartNumberTable Part[name="' + selectedSku + '"]'); if (persoPartNumber) { html += `<tr><th>PersoPartNumber</th><td>${persoPartNumber.getAttribute('PersoPartNumber')}</td></tr>`; } else { html += `<tr><td colspan="2" class="text-center text-slate-500">N/A</td></tr>`; } html += `</table></div>`;
        productData.querySelectorAll('PartitionData').forEach(partition => {
            const partitionName = partition.getAttribute('name'); let partitionTableContent = '';
            partition.querySelectorAll('fielddata').forEach(fielddata => { const fieldName = fielddata.getAttribute('name'); let fieldValue = fielddata.getAttribute('value'); const skuDefault = fielddata.querySelector('default[name="' + selectedSku + '"]'); if (skuDefault) { fieldValue = skuDefault.getAttribute('value'); } partitionTableContent += `<tr><th>${fieldName}</th><td>${fieldValue}</td></tr>`; });
            if (partitionTableContent) { html += `<div class="vtl-data-section"><h3>Partition: ${partitionName}</h3><table>${partitionTableContent}</table></div>`; }
        });
        outputDiv.innerHTML = html;
    }
}
