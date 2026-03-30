const state = {
    proceso: '',
    tipoReg: '',
    grupo: 1,
    valorUMA: 89875
};

function next(n) {
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('active'));
    document.getElementById('p' + n).classList.add('active');
    document.querySelectorAll('.step-dot').forEach((dot, i) => dot.classList.toggle('active', (i + 1) <= n));
}

function actualizarP4() {
    const proc = document.getElementById('tipoProceso').value;
    const sub = document.getElementById('subOpcionesP4');
    sub.innerHTML = (proc === 'exhorto') ? `
        <select id="tipoExhorto" class="input-ui">
            <option value="a">Inc. a: Notificaciones (3 UMA)</option>
            <option value="b">Inc. b: Inscripciones (10-20 UMA)</option>
            <option value="c">Inc. c: Pruebas (7-30 UMA)</option>
        </select>` : '';
}

function validarP4() {
    state.proceso = document.getElementById('tipoProceso').value;
    if (state.proceso === 'exhorto') return mostrarExhorto();
    const conTerm = ['ordinario', 'sumarisimo', 'desalojo', 'ejecutivo'];
    conTerm.includes(state.proceso) ? next(5) : next(6);
}

function actualizarP5() {
    const modo = document.getElementById('modoTerminacion').value;
    document.getElementById('zonaCaducidad').innerHTML = (modo === 'caducidad') ? `
        <select id="critCaducidad" class="input-ui">
            <option value="art22">Como Rechazo (Art. 22: -30%)</option>
            <option value="art25">Como Modo Anormal (Art. 25)</option>
        </select>` : '';
}

function validarP5() { next(6); }

function calcularFinal() {
    const base = parseFloat(document.getElementById('baseVal').value || 0);
    const uma = parseFloat(document.getElementById('valorUMA').value || 89875);
    const tipoBase = document.getElementById('tipoBaseSel').value;
    
    // Determinar factor de reducción (Grupos)
    let factor = 1;
    let situacion = "Escala plena";

    if (tipoBase === 'interdicto') { factor = 0.8; situacion = "Interdicto (Art. 38: -20%)"; }
    else if (document.getElementById('modoTerminacion')?.value === 'sentencia_desestimada' || document.getElementById('critCaducidad')?.value === 'art22') {
        factor = 0.7; situacion = "Demanda Desestimada (Art. 22: -30%)";
    }

    const baseCalculo = base * factor;
    const baseUMA = baseCalculo / uma;

    // Escala del Art. 21
    let escalaText = "";
    let minPerc = 0, maxPerc = 0;

    if (baseUMA <= 15) { minPerc = 22; maxPerc = 33; escalaText = "Primera escala (hasta 15 UMA)"; }
    else if (baseUMA <= 45) { minPerc = 20; maxPerc = 26; escalaText = "Segunda escala (16 a 45 UMA)"; }
    else if (baseUMA <= 90) { minPerc = 18; maxPerc = 24; escalaText = "Tercera escala (46 a 90 UMA)"; }
    else if (baseUMA <= 150) { minPerc = 17; maxPerc = 22; escalaText = "Cuarta escala (91 a 150 UMA)"; }
    else if (baseUMA <= 450) { minPerc = 15; maxPerc = 20; escalaText = "Quinta escala (151 a 450 UMA)"; }
    else if (baseUMA <= 750) { minPerc = 13; maxPerc = 17; escalaText = "Sexta escala (451 a 750 UMA)"; }
    else { minPerc = 12; maxPerc = 15; escalaText = "Séptima escala (más de 750 UMA)"; }

    const honorarioMin = baseUMA * (minPerc / 100);
    const honorarioMax = baseUMA * (maxPerc / 100);

    let html = `<h3>Resultado de la Liquidación</h3>`;
    html += `<table>
        <tr><th>Dato</th><th>Valor</th></tr>
        <tr class="highlight-row"><td>Base de cálculo</td><td>$${base.toLocaleString()}</td></tr>
        <tr><td>Situación</td><td>${situacion}</td></tr>
        <tr><td>Valor UMA</td><td>$${uma.toLocaleString()}</td></tr>
        <tr class="highlight-row"><td>Base en UMA</td><td>${baseUMA.toFixed(2)}</td></tr>
        <tr><td>Escala Aplicada</td><td>${escalaText}: ${minPerc}% a ${maxPerc}%</td></tr>
    </table>`;

    // Tabla de Patrocinante
    html += `<h4>Abogado PATROCINANTE</h4>
    <table>
        <tr><th>Etapas</th><th>Mínimo (UMA)</th><th>Máximo (UMA)</th></tr>
        <tr class="highlight-row"><td>Juicio Completo</td><td>${honorarioMin.toFixed(2)}</td><td>${honorarioMax.toFixed(2)}</td></tr>
        <tr><td>Una Etapa (1/3)</td><td>${(honorarioMin/3).toFixed(2)}</td><td>${(honorarioMax/3).toFixed(2)}</td></tr>
        <tr><td>Dos Etapas (2/3)</td><td>${(honorarioMin*2/3).toFixed(2)}</td><td>${(honorarioMax*2/3).toFixed(2)}</td></tr>
    </table>`;

    // Tabla de Apoderado
    html += `<h4>Abogado APODERADO (+40%)</h4>
    <table>
        <tr><th>Etapas</th><th>Mínimo (UMA)</th><th>Máximo (UMA)</th></tr>
        <tr class="highlight-row"><td>Juicio Completo</td><td>${(honorarioMin*1.4).toFixed(2)}</td><td>${(honorarioMax*1.4).toFixed(2)}</td></tr>
        <tr><td>Una Etapa</td><td>${(honorarioMin*1.4/3).toFixed(2)}</td><td>${(honorarioMax*1.4/3).toFixed(2)}</td></tr>
    </table>`;

    // Auxiliares
    html += `<h4>Auxiliares (art. 21, 4° párrafo: 50% de la escala)</h4>
    <table>
        <tr><th>Mínimo (UMA)</th><th>Máximo (UMA)</th></tr>
        <tr><td>${(honorarioMin*0.5).toFixed(2)}</td><td>${(honorarioMax*0.5).toFixed(2)}</td></tr>
    </table>
    <p class="note">Nota: Ver si aplica art. 61 (Mínimo 6 UMA para peritos).</p>`;

    document.getElementById('resultado').innerHTML = html;
    next(7);
}

function mostrarExhorto() {
    const tipo = document.getElementById('tipoExhorto').value;
    const uma = parseFloat(document.getElementById('valorUMA')?.value || 89875);
    let min, max;
    if (tipo === 'a') { min = 3; max = 3; }
    else if (tipo === 'b') { min = 10; max = 20; }
    else { min = 7; max = 30; }

    document.getElementById('resultado').innerHTML = `<h3>Resultado Exhorto (Art. 50)</h3>
    <table>
        <tr><th>Concepto</th><th>UMA</th><th>Pesos ($)</th></tr>
        <tr><td>Mínimo</td><td>${min}</td><td>$${(min*uma).toLocaleString()}</td></tr>
        <tr><td>Máximo</td><td>${max}</td><td>$${(max*uma).toLocaleString()}</td></tr>
    </table>`;
    next(7);
}
