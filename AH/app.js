/**
 * APP CORE - LEY 27.423
 */

const state = {
    paso: 1,
    honorarios: '',
    proceso: '',
    terminacion: '',
    base: 0,
    grupo: 'grupo1',
    explicaciones: []
};

function next(n) {
    state.paso = n;
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('active'));
    document.getElementById('p' + n).classList.add('active');
    
    // Actualizar barra de progreso visual
    document.querySelectorAll('.step-dot').forEach((dot, i) => {
        dot.classList.toggle('active', (i + 1) <= n);
    });
}

function configurarModo(m) {
    if (m === 'rapido') {
        alert("Modo rápido: Ingrese los datos directamente en los selectores.");
    }
    next(4);
}

function actualizarP4() {
    const reg = document.getElementById('tipoRegulacion').value;
    const proc = document.getElementById('tipoProceso').value;
    const fund = document.getElementById('fundamentoP4');
    const sub = document.getElementById('subOpcionesP4');
    sub.innerHTML = '';

    // Fundamento Tipo Honorarios
    if (reg === 'provisorios') {
        fund.innerHTML = "Los honorarios provisorios (art. 12) se regulan cuando el profesional se aparta antes de la finalización del proceso. En estos casos, se consideran únicamente las actuaciones cumplidas y corresponde aplicar el mínimo de la escala.";
    } else if (reg === 'definitivos') {
        fund.innerHTML = "Regulación de honorarios definitivos por finalización de etapa o proceso.";
    }

    // Fundamentos Procesos (Tus palabras exactas)
    if (proc === 'sucesion') {
        sub.innerHTML = `
            <select id="subSucesion" class="input-ui">
                <option value="unico">Intervino un único letrado</option>
                <option value="varios">Intervino más de un letrado</option>
            </select>
            <p style="font-size:0.8rem; color:#666; margin-top:5px;">ARTÍCULO 35.- En el proceso sucesorio si 1 solo abogado patrocina o representa a todos los herederos o interesados, sus honorarios se regularán en la mitad del mínimo y del máximo de la escala establecida en el artículo 21.</p>
        `;
    } else if (proc === 'posesorias') {
        sub.innerHTML = '<p style="font-size:0.8rem; color:#666;">ARTÍCULO 38.- El monto de los honorarios se reducirá en un veinte por ciento (20%) atendiendo al valor de los bienes conforme a lo dispuesto en el artículo 23.</p>';
    } else if (proc === 'ejecutivo' || proc === 'ejec_sentencia') {
        sub.innerHTML = '<label><input type="checkbox" id="chkExcepciones"> ¿Hubo excepciones?</label><br><small>Si no hay excepciones, los honorarios se reducen un 10% (Art. 34/41).</small>';
    }
}

function validarP4() {
    state.honorarios = document.getElementById('tipoRegulacion').value;
    state.proceso = document.getElementById('tipoProceso').value;
    if (!state.honorarios) return alert("Por favor seleccione el tipo de honorarios.");
    next(5);
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
                <option value="desestimada">Como demanda desestimada (art. 22 → -30%)</option>
                <option value="anormal">Como modo anormal (art. 25, 50 % o 100%)</option>
            </select>
        `;
    } else if (['allanamiento', 'transaccion', 'desistimiento'].includes(modo)) {
        fund.innerHTML = "ARTÍCULO 25 - En caso de allanamiento, desistimiento y transacción, antes de decretarse la apertura a prueba, los honorarios serán del 50% de la escala del artículo 21. En los demás casos, se aplica el 100%.";
        zona.innerHTML = '<label><input type="checkbox" id="chkPrueba"> ¿Se decretó apertura a prueba?</label>';
    } else {
        fund.innerHTML = "Se aplica escala según resultado del pleito.";
    }
}

function validarP5() {
    state.terminacion = document.getElementById('modoTerminacion').value;
    next(6);
    configurarInputsBase();
}

function configurarInputsBase() {
    const container = document.getElementById('inputsBase');
    const fund = document.getElementById('fundamentoP6');
    let html = '';

    if (state.proceso === 'ordinario' || state.proceso === 'sumarisimo') {
        fund.innerHTML = "ARTÍCULO 22/24/52.- Se tendrá en cuenta el monto de la sentencia o liquidación (capital + intereses).";
        html = '<input type="number" id="baseVal" class="input-ui" placeholder="Ingresar monto capital + intereses">';
    } else if (state.proceso === 'desalojo') {
        fund.innerHTML = "ARTÍCULO 40: En los procesos de desalojo se fijarán los honorarios tomando como base el total de los alquileres del contrato. Si es para vivienda, se reduce un 20%.";
        html = '<input type="number" id="baseVal" class="input-ui" placeholder="Monto total del contrato"><br><label><input type="checkbox" id="chkVivienda"> ¿Es vivienda?</label>';
    } else {
        fund.innerHTML = "Ingrese la base pecuniaria del proceso.";
        html = '<input type="number" id="baseVal" class="input-ui" placeholder="Monto base">';
    }
    container.innerHTML = html;
}

function calcularFinal() {
    const baseRaw = document.getElementById('baseVal').value;
    state.base = parseFloat(baseRaw || 0);

    // Lógica de Grupos (Tus grupos definidos)
    let resumen = `👉 <strong>Así vamos a calcular:</strong><br>`;
    resumen += `Honorarios: ${state.honorarios}<br>Proceso: ${state.proceso}<br>Terminación: ${state.terminacion}<br>`;

    // Determinación del Grupo Interno
    if (state.terminacion === 'sentencia_desestimada' || (document.getElementById('critCaducidad')?.value === 'desestimada')) {
        state.grupo = 'grupo4';
        resumen += `Reducción por rechazo de demanda (art. 22 ley 27.423): -30%<br>`;
    } else if (state.proceso === 'posesorias') {
        state.grupo = 'grupo6'; // Tu grupo para reducción del 20%
        resumen += `Reducción por acciones posesorias/división (art. 38): -20%<br>`;
    } else {
        state.grupo = 'grupo1';
    }

    document.getElementById('resumenLogico').innerHTML = resumen;
    
    // Aquí inyectamos la tabla final (puedes llamar a tu función calcular() de calc.txt)
    document.getElementById('tablaResultados').innerHTML = `<p>Base Regulatoria Final: $${state.base.toLocaleString('es-AR')}</p><p>Grupo Aplicado: ${state.grupo}</p>`;
    
    next(7);
}
