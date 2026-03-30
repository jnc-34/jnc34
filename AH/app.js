/** * MOTOR DE CÁLCULO (Basado en calc.txt) e INTERFAZ
 */

const state = {
    honorarios: 'definitivos',
    proceso: 'ordinario',
    terminacion: 'sentencia_admitida',
    base: 0,
    grupo: 1, // 1 a 6
    exhortoTipo: null,
    valorUMA: 78500 // Actualiza este valor según corresponda
};

function next(n) {
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('active'));
    document.getElementById('p' + n).classList.add('active');
    window.scrollTo(0,0);
}

function configurarModo(m) {
    state.honorarios = document.getElementById('tipoRegulacion').value;
    next(4);
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
    if (state.proceso === 'exhorto') {
        state.exhortoTipo = document.getElementById('tipoExhorto').value;
        return mostrarExhortoDirecto();
    }
    const conTerminacion = ['ordinario', 'sumarisimo', 'desalojo', 'ejecutivo', 'ejec_sentencia'];
    conTerminacion.includes(state.proceso) ? next(5) : (configurarInputsBase(), next(6));
}

function actualizarP5() {
    const modo = document.getElementById('modoTerminacion').value;
    const zona = document.getElementById('zonaCaducidad');
    zona.innerHTML = '';
    if (modo === 'caducidad') {
        zona.innerHTML = `
            <select id="critCaducidad" class="input-ui">
                <option value="art22">Como Rechazo de Demanda (Art. 22: -30%)</option>
                <option value="art25">Como Modo Anormal (Art. 25: 50% o 100%)</option>
            </select>`;
    } else if (['allanamiento', 'transaccion', 'desistimiento'].includes(modo)) {
        zona.innerHTML = '<label><input type="checkbox" id="chkPrueba"> ¿Hubo apertura a prueba?</label>';
    }
}

function validarP5() {
    state.terminacion = document.getElementById('modoTerminacion').value;
    configurarInputsBase();
    next(6);
}

function configurarInputsBase() {
    const container = document.getElementById('inputsBase');
    const fund = document.getElementById('fundamentoP6');
    let html = '<label>Monto de la Base:</label>';
    
    if (state.proceso === 'desalojo') {
        fund.innerHTML = "Art. 40: Base s/ total alquileres. Si es vivienda, reducción 20%.";
        html += '<input type="number" id="baseVal" class="input-ui" placeholder="Monto Total Contrato"><br><label><input type="checkbox" id="chkVivienda"> ¿Es Vivienda?</label>';
    } else {
        fund.innerHTML = "Art. 22/24/52: Capital + Intereses.";
        html += '<input type="number" id="baseVal" class="input-ui" placeholder="Ingrese monto">';
    }
    container.innerHTML = html;
}

/**
 * MOTOR FINAL (Aquí está la lógica de calc.txt integrada)
 */
function calcularFinal() {
    state.base = parseFloat(document.getElementById('baseVal').value || 0);
    
    // Asignación de GRUPO según el Asistente
    if (state.proceso === 'interdicto') state.grupo = 6; // 45% s/ el 80% (o similar segun tu formula)
    else if (state.terminacion === 'sentencia_desestimada' || document.getElementById('critCaducidad')?.value === 'art22') state.grupo = 4; // 70%
    else if (state.proceso === 'sucesion' && document.getElementById('subSucesion')?.value === 'unico') state.grupo = 2; // 50%
    else if (document.getElementById('chkPrueba') && !document.getElementById('chkPrueba').checked) state.grupo = 2; // 50%
    else state.grupo = 1;

    mostrarResultados();
}

function mostrarResultados() {
    next(7);
    const res = document.getElementById('resultado');
    const u = state.valorUMA;
    const b = state.base;
    
    // Factor de corrección según grupo
    let factor = 1;
    if (state.grupo === 2) factor = 0.5;
    if (state.grupo === 4) factor = 0.7;
    if (state.grupo === 5) factor = 0.9;
    if (state.grupo === 6) factor = 0.45;

    const baseFinal = b * factor;
    const baseUMA = baseFinal / u;

    let html = `<h3>Cálculo Art. 21 (Escala General)</h3>`;
    html += `<table>
        <tr><th>Concepto</th><th>Mínimo (11%)</th><th>Máximo (25%)</th></tr>
        <tr><td>Pesos ($)</td><td>$${(baseFinal * 0.11).toLocaleString()}</td><td>$${(baseFinal * 0.25).toLocaleString()}</td></tr>
        <tr><td>UMA</td><td>${(baseUMA * 0.11).toFixed(2)}</td><td>${(baseUMA * 0.25).toFixed(2)}</td></tr>
    </table>`;

    if (state.proceso === 'incidente') {
        html += `<h3>Incidente / BLSG (2% a 10%)</h3>
        <table>
            <tr><th>Concepto</th><th>Mínimo (2%)</th><th>Máximo (10%)</th></tr>
            <tr><td>UMA</td><td>${(baseUMA * 0.02).toFixed(2)}</td><td>${(baseUMA * 0.10).toFixed(2)}</td></tr>
        </table>`;
    }

    res.innerHTML = html;
}

function mostrarExhortoDirecto() {
    next(7);
    const u = state.valorUMA;
    let min, max;
    if (state.exhortoTipo === 'a') { min = 3; max = 3; }
    if (state.exhortoTipo === 'b') { min = 10; max = 20; }
    if (state.exhortoTipo === 'c') { min = 7; max = 30; }

    document.getElementById('resultado').innerHTML = `
        <h3>Exhorto Ley 27.423 - Art. 50</h3>
        <table>
            <tr><th>Rango</th><th>UMA</th><th>Pesos ($)</th></tr>
            <tr><td>Mínimo</td><td>${min}</td><td>$${(min * u).toLocaleString()}</td></tr>
            <tr><td>Máximo</td><td>${max}</td><td>$${(max * u).toLocaleString()}</td></tr>
        </table>`;
}
