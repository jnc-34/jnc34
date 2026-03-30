/**
 * Lógica de Negocio y Motor de Cálculo Ley 27.423
 */

const state = {
    proceso: '',
    tipoReg: '',
    valorUMA: 89875
};

function next(n) {
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('active'));
    document.getElementById('p' + n).classList.add('active');
    document.querySelectorAll('.step-dot').forEach((dot, i) => {
        dot.classList.toggle('active', (i + 1) <= n);
    });
    window.scrollTo(0,0);
}

function actualizarP4() {
    const proc = document.getElementById('tipoProceso').value;
    const sub = document.getElementById('subOpcionesP4');
    sub.innerHTML = '';

    if (proc === 'sucesion') {
        sub.innerHTML = `
            <select id="subSucesion" class="input-ui">
                <option value="varios">Varios Letrados</option>
                <option value="unico">Letrado Único (Art. 35 - Reducción 50%)</option>
            </select>`;
    } else if (proc === 'exhorto') {
        sub.innerHTML = `
            <select id="tipoExhorto" class="input-ui">
                <option value="a">Exhorto para notificar (inc. a). Mínimo 3 UMA</option>
                <option value="b">Exhorto para inscripciones y actos registrales (inc. b). Mínimo 10 / Máximo 20 UMA</option>
                <option value="c">Exhorto sobre diligencias de prueba (Inc. c). Mínimo 7 / Máximo 30 UMA</option>
            </select>`;
    }
}

function validarP4() {
    state.proceso = document.getElementById('tipoProceso').value;
    if (state.proceso === 'exhorto') return mostrarExhorto();
    
    const conTerminacion = ['ordinario', 'sumarisimo', 'desalojo', 'ejecutivo'];
    conTerminacion.includes(state.proceso) ? next(5) : next(6);
}

function actualizarP5() {
    const modo = document.getElementById('modoTerminacion').value;
    const zona = document.getElementById('zonaCaducidad');
    const fund = document.getElementById('fundamentoP5');
    zona.innerHTML = '';

    if (modo === 'caducidad') {
        fund.innerHTML = "Elegí el criterio de caducidad:";
        zona.innerHTML = `
            <select id="critCaducidad" class="input-ui">
                <option value="art22">Como demanda desestimada (art. 22 → -30%)</option>
                <option value="art25">Como modo anormal (art. 25, 50% o 100%)</option>
            </select>`;
    } else if (['allanamiento', 'transaccion', 'desistimiento'].includes(modo)) {
        fund.innerHTML = "Art. 25: 50% si es antes de apertura a prueba, 100% después.";
        zona.innerHTML = '<label><input type="checkbox" id="chkPrueba" checked> ¿Se decretó apertura a prueba?</label>';
    } else {
        fund.innerHTML = "Escala plena según resultado.";
    }
}

function validarP5() { next(6); }

function cambiarLeyendaBase() {
    const val = document.getElementById('tipoBaseSel').value;
    const fund = document.getElementById('fundamentoP6');
    fund.innerHTML = (val === 'interdicto') 
        ? "Art. 38: Reducción del 20% sobre la escala del Art. 21."
        : "Art. 22/24/52: Capital + Intereses.";
}

function retrocederP6() {
    const conTerminacion = ['ordinario', 'sumarisimo', 'desalojo', 'ejecutivo'];
    conTerminacion.includes(state.proceso) ? next(5) : next(4);
}

/**
 * MOTOR DE CÁLCULO DINÁMICO (Art. 21)
 */
function calcularFinal() {
    const baseInput = parseFloat(document.getElementById('baseVal').value || 0);
    const uma = parseFloat(document.getElementById('valorUMA').value || 89875);
    const tipoBase = document.getElementById('tipoBaseSel').value;
    
    let factor = 1;
    let situacion = "Escala plena";

    // Lógica de Reducciones
    if (tipoBase === 'interdicto') { factor = 0.8; situacion = "Interdicto (-20%)"; }
    else if (document.getElementById('modoTerminacion')?.value === 'sentencia_desestimada' || document.getElementById('critCaducidad')?.value === 'art22') {
        factor = 0.7; situacion = "Rechazo de demanda (-30%)";
    } else if (document.getElementById('subSucesion')?.value === 'unico' || (document.getElementById('chkPrueba') && !document.getElementById('chkPrueba').checked)) {
        factor = 0.5; situacion = "Reducción Art. 25/35 (-50%)";
    }

    const baseCalculo = baseInput * factor;
    const baseUMA = baseCalculo / uma;

    // Determinar Escala Art. 21
    let escalaText, minPerc, maxPerc;
    if (baseUMA <= 15) { minPerc = 22; maxPerc = 33; escalaText = "1ra Escala (hasta 15 UMA)"; }
    else if (baseUMA <= 45) { minPerc = 20; maxPerc = 26; escalaText = "2da Escala (16 a 45 UMA)"; }
    else if (baseUMA <= 90) { minPerc = 18; maxPerc = 24; escalaText = "3ra Escala (46 a 90 UMA)"; }
    else if (baseUMA <= 150) { minPerc = 17; maxPerc = 22; escalaText = "4ta Escala (91 a 150 UMA)"; }
    else if (baseUMA <= 450) { minPerc = 15; maxPerc = 20; escalaText = "5ta Escala (151 a 450 UMA)"; }
    else if (baseUMA <= 750) { minPerc = 13; maxPerc = 17; escalaText = "6ta Escala (451 a 750 UMA)"; }
    else { minPerc = 12; maxPerc = 15; escalaText = "7ma Escala (más de 750 UMA)"; }

    const honMin = baseUMA * (minPerc / 100);
    const honMax = baseUMA * (maxPerc / 100);

    let html = `<h3>Datos del Juicio Ingresados</h3>
    <table>
        <tr><th>Concepto</th><th>Valor</th></tr>
        <tr class="highlight"><td>Base Declarada</td><td>$${baseInput.toLocaleString()}</td></tr>
        <tr><td>Situación</td><td>${situacion}</td></tr>
        <tr class="highlight"><td>Base en UMA</td><td>${baseUMA.toFixed(2)}</td></tr>
        <tr><td>Escala Aplicada</td><td>${escalaText}: ${minPerc}% a ${maxPerc}%</td></tr>
    </table>`;

    // Patrocinante
    html += `<h4>Abogado PATROCINANTE</h4>
    <table>
        <tr><th>Etapas</th><th>Mínimo (UMA)</th><th>Máximo (UMA)</th></tr>
        <tr class="highlight"><td>Juicio Completo</td><td>${honMin.toFixed(2)}</td><td>${honMax.toFixed(2)}</td></tr>
        <tr><td>Una Etapa (1/3)</td><td>${(honMin/3).toFixed(2)}</td><td>${(honMax/3).toFixed(2)}</td></tr>
        <tr><td>Dos Etapas (2/3)</td><td>${(honMin*2/3).toFixed(2)}</td><td>${(honMax*2/3).toFixed(2)}</td></tr>
    </table>`;

    // Apoderado
    html += `<h4>Abogado APODERADO (+40%)</h4>
    <table>
        <tr><th>Etapas</th><th>Mínimo (UMA)</th><th>Máximo (UMA)</th></tr>
        <tr class="highlight"><td>Juicio Completo</td><td>${(honMin*1.4).toFixed(2)}</td><td>${(honMax*1.4).toFixed(2)}</td></tr>
        <tr><td>Una Etapa</td><td>${(honMin*1.4/3).toFixed(2)}</td><td>${(honMax*1.4/3).toFixed(2)}</td></tr>
    </table>`;

    // Auxiliares
    html += `<h4>Auxiliares (art. 21, 4° párrafo: 50% escala)</h4>
    <table>
        <tr><th>Mínimo (UMA)</th><th>Máximo (UMA)</th></tr>
        <tr><td>${(honMin*0.5).toFixed(2)}</td><td>${(honMax*0.5).toFixed(2)}</td></tr>
    </table>
    <p style="font-size:0.8rem;"><i>Nota: Ver si aplica art. 61 (6 UMA mínimo para peritos).</i></p>`;

    document.getElementById('resultado').innerHTML = html;
    next(7);
}

function mostrarExhorto() {
    const tipo = document.getElementById('tipoExhorto').value;
    const uma = parseFloat(document.getElementById('valorUMA').value);
    let min, max;
    if (tipo === 'a') { min = 3; max = 3; }
    else if (tipo === 'b') { min = 10; max = 20; }
    else { min = 7; max = 30; }

    document.getElementById('resultado').innerHTML = `<h3>Resultado Exhorto (Art. 50)</h3>
    <table>
        <tr><th>Inciso</th><th>UMA</th><th>Valor $</th></tr>
        <tr><td>Mínimo</td><td>${min}</td><td>$${(min*uma).toLocaleString()}</td></tr>
        <tr><td>Máximo</td><td>${max}</td><td>$${(max*uma).toLocaleString()}</td></tr>
    </table>`;
    next(7);
}
