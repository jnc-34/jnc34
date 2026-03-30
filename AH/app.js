/**
 * APP CORE - LEY 27.423
 */

const state = {
    honorarios: 'definitivos',
    proceso: 'ordinario',
    terminacion: 'sentencia_admitida',
    base: 0,
    grupo: 1,
    exhortoTipo: null,
    valorUMA: 78500 // Ajustar según valor vigente
};

function next(n) {
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('active'));
    document.getElementById('p' + n).classList.add('active');
    
    // Actualizar barra de progreso
    document.querySelectorAll('.step-dot').forEach((dot, i) => {
        dot.classList.toggle('active', (i + 1) <= n);
    });
    window.scrollTo(0,0);
}

function configurarModo(m) {
    state.honorarios = document.getElementById('tipoRegulacion').value;
    next(4);
    actualizarP4();
}

function actualizarP4() {
    const proc = document.getElementById('tipoProceso').value;
    const sub = document.getElementById('subOpcionesP4');
    sub.innerHTML = '';

    if (proc === 'sucesion') {
        sub.innerHTML = `
            <select id="subSucesion" class="input-ui">
                <option value="varios">Varios Letrados (Escala plena)</option>
                <option value="unico">Intervino un único letrado: la base se reduce en un 50 % (Art. 35)</option>
            </select>
            <p style="font-size:0.85rem; color:#555; margin-top:5px;">ARTÍCULO 35.- En el proceso sucesorio si 1 solo abogado patrocina o representa a todos los herederos o interesados, sus honorarios se regularán en la mitad del mínimo y del máximo de la escala establecida en el artículo 21.</p>
        `;
    } else if (proc === 'exhorto') {
        sub.innerHTML = `
            <select id="tipoExhorto" class="input-ui">
                <option value="a">Exhorto para notificar (inc. a). Mínimo 3 UMA</option>
                <option value="b">Exhorto para inscripciones y actos registrales (inc. b). Mínimo 10 / Máximo 20 UMA</option>
                <option value="c">Exhorto sobre diligencias de prueba (Inc. c). Mínimo 7 / Máximo 30 UMA</option>
            </select>
        `;
    }
}

function validarP4() {
    state.proceso = document.getElementById('tipoProceso').value;
    
    if (state.proceso === 'exhorto') {
        state.exhortoTipo = document.getElementById('tipoExhorto').value;
        mostrarExhortoDirecto();
        return;
    }

    const conTerminacion = ['ordinario', 'sumarisimo', 'desalojo', 'ejecutivo', 'ejec_sentencia'];
    if (conTerminacion.includes(state.proceso)) {
        next(5);
        actualizarP5();
    } else {
        configurarInputsBase();
        next(6);
    }
}

function actualizarP5() {
    const modo = document.getElementById('modoTerminacion').value;
    const zona = document.getElementById('zonaCaducidad');
    const fund = document.getElementById('fundamentoP5');
    zona.innerHTML = '';

    if (modo === 'caducidad') {
        fund.innerHTML = "La caducidad de la instancia no está específicamente prevista en la ley. Elegí según tu criterio:";
        zona.innerHTML = `
            <select id="critCaducidad" class="input-ui">
                <option value="art22">Como demanda desestimada (art. 22 → -30%)</option>
                <option value="art25">Como modo anormal (art. 25, 50 % o 100%)</option>
            </select>
        `;
    } else if (['allanamiento', 'transaccion', 'desistimiento'].includes(modo)) {
        fund.innerHTML = "ARTÍCULO 25 - En caso de allanamiento, desistimiento y transacción, antes de decretarse la apertura a prueba, los honorarios serán del 50% de la escala del artículo 21. En los demás casos, se aplica el 100%.";
        zona.innerHTML = '<label><input type="checkbox" id="chkPrueba" checked> ¿Se decretó apertura a prueba?</label>';
    } else {
        fund.innerHTML = "Se aplica escala plena según el resultado del proceso.";
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
    let html = '<label>Monto de la base:</label>';

    // Aquí incluimos el Interdicto según tu pedido
    html += `
        <select id="tipoBaseSel" class="input-ui" onchange="cambiarLeyendaBase()">
            <option value="monto">Monto de la demanda / liquidación (Art. 22)</option>
            <option value="interdicto">Interdicto, acciones posesorias o división de bienes comunes: reducción en un 20 %</option>
        </select>
        <div id="montoInputArea" style="margin-top:10px;">
            <input type="number" id="baseVal" class="input-ui" placeholder="Ingresar valor en pesos">
        </div>
    `;

    if (state.proceso === 'desalojo') {
        fund.innerHTML = "ARTÍCULO 40: En los procesos de desalojo se fijarán los honorarios tomando como base el total de los alquileres del contrato. Si es para vivienda, se reduce un 20%.";
        html += '<label style="display:block; margin-top:10px;"><input type="checkbox" id="chkVivienda"> El inmueble es para vivienda/habitación (Reducción 20%)</label>';
    } else {
        fund.innerHTML = "ARTÍCULO 22/24/52.- Los intereses deben integrar la base regulatoria bajo pena de nulidad.";
    }
    
    container.innerHTML = html;
}

function cambiarLeyendaBase() {
    const val = document.getElementById('tipoBaseSel').value;
    const fund = document.getElementById('fundamentoP6');
    if (val === 'interdicto') {
        fund.innerHTML = "<b>ARTÍCULO 38.</b>- Tratándose de acciones posesorias, interdictos o de división de bienes comunes, se aplicará la escala del artículo 21 con una reducción del 20%.";
    } else {
        fund.innerHTML = "ARTÍCULO 22/24/52.- Los intereses deben integrar la base regulatoria bajo pena de nulidad.";
    }
}

function calcularFinal() {
    state.base = parseFloat(document.getElementById('baseVal').value || 0);
    const tipoBase = document.getElementById('tipoBaseSel').value;

    // Lógica de GRUPOS (Motor calc.txt)
    if (tipoBase === 'interdicto' || (state.proceso === 'desalojo' && document.getElementById('chkVivienda')?.checked)) {
        state.grupo = 6; // Reducción 20%
    } else if (state.terminacion === 'sentencia_desestimada' || document.getElementById('critCaducidad')?.value === 'art22') {
        state.grupo = 4; // Reducción 30%
    } else if (state.proceso === 'sucesion' && document.getElementById('subSucesion')?.value === 'unico') {
        state.grupo = 2; // Reducción 50%
    } else if (document.getElementById('chkPrueba') && !document.getElementById('chkPrueba').checked) {
        state.grupo = 2; // Reducción 50%
    } else {
        state.grupo = 1;
    }

    mostrarResultados();
}

function mostrarResultados() {
    next(7);
    const res = document.getElementById('resultado');
    const b = state.base;
    const u = state.valorUMA;
    
    let factor = 1;
    let desc = "Escala plena";
    if (state.grupo === 2) { factor = 0.5; desc = "Reducción 50% (Art. 25/35)"; }
    if (state.grupo === 4) { factor = 0.7; desc = "Reducción 30% (Art. 22)"; }
    if (state.grupo === 6) { factor = 0.8; desc = "Reducción 20% (Art. 38/40)"; }

    const baseFinal = b * factor;
    const baseUMA = baseFinal / u;

    document.getElementById('resumenLogico').innerHTML = `
        <strong>Resumen:</strong><br>
        Proceso: ${state.proceso.toUpperCase()}<br>
        Base declarada: $${b.toLocaleString()}<br>
        Situación: ${desc}<br>
        Base computable: $${baseFinal.toLocaleString()} (${baseUMA.toFixed(2)} UMA)
    `;

    let html = `<h3>Escala Art. 21 (11% a 25%)</h3>
    <table>
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

    document.getElementById('resumenLogico').innerHTML = `<strong>Exhorto Ley 27.423 - Art. 50</strong>`;
    document.getElementById('resultado').innerHTML = `
        <table>
            <tr><th>Inciso / Tarea</th><th>UMA</th><th>Valor Pesos ($)</th></tr>
            <tr><td>Mínimo</td><td>${min}</td><td>$${(min * u).toLocaleString()}</td></tr>
            <tr><td>Máximo</td><td>${max}</td><td>$${(max * u).toLocaleString()}</td></tr>
        </table>`;
}

function retrocederP5() { next(4); }
function retrocederP6() {
    const conTerminacion = ['ordinario', 'sumarisimo', 'desalojo', 'ejecutivo', 'ejec_sentencia'];
    conTerminacion.includes(state.proceso) ? next(5) : next(4);
}
