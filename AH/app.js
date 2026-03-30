/**
 * APP CORE - ASISTENTE DE HONORARIOS LEY 27.423
 * Diseñado para: Juzgado Civil CABA
 */

const state = {
    modo: 'asistente',
    paso: 1,
    honorarios: 'definitivos',
    proceso: 'ordinario',
    terminacion: 'sentencia_admitida',
    criterioCaducidad: null,
    basePrincipal: 0,
    baseReconvencion: 0,
    conPrueba: true,
    conExcepciones: false,
    sucesionLetrado: 'varios',
    grupoInterno: 'G1',
    explicaciones: []
};

/**
 * NAVEGACIÓN Y UI
 */
function next(n) {
    state.paso = n;
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('active'));
    const proximaPantalla = document.getElementById('p' + n);
    if (proximaPantalla) proximaPantalla.classList.add('active');
    
    // Actualizar barra de progreso
    document.querySelectorAll('.step-dot').forEach((dot, i) => {
        dot.classList.toggle('active', (i + 1) <= n);
    });
    
    window.scrollTo(0, 0);
}

function configurarModo(m) {
    state.modo = m;
    next(4);
}

/**
 * LÓGICA DE PASO 4: PROCESO Y FUNDAMENTOS
 */
function actualizarFundamento() {
    const proc = document.getElementById('tipoProceso').value;
    const reg = document.getElementById('tipoRegulacion').value;
    const box = document.getElementById('fundamentoProceso');
    const sub = document.getElementById('subOpciones');
    sub.innerHTML = '';
    
    let texto = "";
    
    if (reg === 'provisorios') {
        texto = "<b>Art. 12:</b> Se regulan ante cese de representación o antes de finalizar el proceso. Se considera el mínimo de la escala sobre actuaciones cumplidas.";
    } else {
        switch(proc) {
            case 'ordinario': 
                texto = "<b>Art. 21:</b> Proceso base para la escala plena (11% a 25%). Admite reconvención (Art. 28)."; 
                break;
            case 'ejecutivo': 
                texto = "<b>Art. 34:</b> En procesos ejecutivos, si no hay excepciones, los honorarios se reducen un 10% de la escala.";
                sub.innerHTML = '<label><input type="checkbox" id="chkExcepciones"> Hubo oposición de excepciones</label>';
                break;
            case 'sucesion':
                texto = "<b>Art. 35:</b> Se regula sobre el patrimonio que se transmite. Si hay un solo letrado para todos, se reduce al 50% del mínimo y máximo.";
                sub.innerHTML = `
                    <label>Patrocinio en Sucesión:</label>
                    <select id="optSucesion" class="input-ui">
                        <option value="varios">Varios Letrados (Escala plena)</option>
                        <option value="unico">Letrado Único (Art. 35: Reducción 50%)</option>
                    </select>
                `;
                break;
            case 'cautelar': 
                texto = "<b>Art. 37:</b> La base es el 25% de la escala del Art. 21. Si hay controversia u oposición, sube al 50%."; 
                sub.innerHTML = '<label><input type="checkbox" id="chkOposicion"> Hubo controversia u oposición</label>';
                break;
            case 'desalojo':
                texto = "<b>Art. 40:</b> Se toma como base el total de los alquileres. Si es para vivienda, se reduce un 20%.";
                sub.innerHTML = '<label><input type="checkbox" id="chkVivienda"> El inmueble es para vivienda/habitación</label>';
                break;
            case 'ejec_sentencia':
                texto = "<b>Art. 41:</b> Ejecución de sentencia. Si no hay excepciones, se reduce un 10% (igual que procesos ejecutivos).";
                sub.innerHTML = '<label><input type="checkbox" id="chkExcepcionesSent"> Hubo oposición de excepciones</label>';
                break;
        }
    }
    box.innerHTML = texto;
}

function validarP4() {
    state.honorarios = document.getElementById('tipoRegulacion').value;
    state.proceso = document.getElementById('tipoProceso').value;
    
    // Guardar estados de subopciones si existen
    if(document.getElementById('chkExcepciones')) state.conExcepciones = document.getElementById('chkExcepciones').checked;
    if(document.getElementById('chkExcepcionesSent')) state.conExcepciones = document.getElementById('chkExcepcionesSent').checked;
    if(document.getElementById('chkOposicion')) state.conOposicion = document.getElementById('chkOposicion').checked;
    if(document.getElementById('chkVivienda')) state.esVivienda = document.getElementById('chkVivienda').checked;
    if(document.getElementById('optSucesion')) state.sucesionLetrado = document.getElementById('optSucesion').value;
    
    next(5);
}

/**
 * LÓGICA DE PASO 5: TERMINACIÓN
 */
function actualizarFundamentoTerminacion() {
    const modo = document.getElementById('modoTerminacion').value;
    const box = document.getElementById('fundamentoTerminacion');
    const zona = document.getElementById('zonaCriticaTerminacion');
    zona.innerHTML = '';

    if (modo === 'caducidad') {
        box.innerHTML = "<b>Criterio:</b> La caducidad no está prevista expresamente. Seleccione cómo desea encuadrarla:";
        zona.innerHTML = `
            <select id="criterioCaducidad" class="input-ui">
                <option value="art22">Como Rechazo de Demanda (Art. 22: -30%)</option>
                <option value="art25">Como Modo Anormal (Art. 25: 50% o 100%)</option>
            </select>
        `;
    } else if (['allanamiento', 'transaccion', 'desistimiento'].includes(modo)) {
        box.innerHTML = "<b>Art. 25:</b> Si ocurre ANTES de la apertura a prueba, el honorario es el 50% de la escala.";
        zona.innerHTML = '<label><input type="checkbox" id="chkPrueba" checked> ¿Ya se había decretado la apertura a prueba?</label>';
    } else {
        box.innerHTML = "<b>Impacto:</b> Determina si aplicamos escala plena o si existen variaciones por rechazo (Art. 22).";
    }
}

function validarP5() {
    state.terminacion = document.getElementById('modoTerminacion').value;
    if(document.getElementById('criterioCaducidad')) state.criterioCaducidad = document.getElementById('criterioCaducidad').value;
    if(document.getElementById('chkPrueba')) state.conPrueba = document.getElementById('chkPrueba').checked;
    
    generarInputsBase();
    next(6);
}

/**
 * LÓGICA DE PASO 6: BASE Y CÁLCULO
 */
function generarInputsBase() {
    const container = document.getElementById('inputsBaseContainer');
    const box = document.getElementById('fundamentoBase');
    
    let explicacionBase = "<b>Art. 22/24/52:</b> Los intereses deben integrar la base regulatoria bajo pena de nulidad.";
    let html = `<label>Monto de la Base (Capital + Intereses):</label>
                <input type="number" id="montoBase" class="input-ui" placeholder="Monto en pesos">`;
    
    if(state.proceso === 'ordinario') {
        html += `<label style="margin-top:15px; display:block;">Monto Reconvención (Art. 28):</label>
                 <input type="number" id="montoRecon" class="input-ui" value="0">`;
    }
    
    if(state.proceso === 'sucesion') explicacionBase = "<b>Art. 35/23:</b> Valuación fiscal + 50% o valor real estimado.";
    if(state.proceso === 'desalojo') explicacionBase = "<b>Art. 40:</b> Base s/ total de alquileres del contrato.";

    box.innerHTML = explicacionBase;
    container.innerHTML = html;
}

/**
 * MOTOR DE CÁLCULO FINAL
 */
function calcularFinal() {
    state.basePrincipal = parseFloat(document.getElementById('montoBase').value || 0);
    state.baseReconvencion = parseFloat(document.getElementById('montoRecon')?.value || 0);

    // DETERMINACIÓN DEL GRUPO INVISIBLE
    let grupo = 'grupo1'; // Escala plena
    let impacto = "Escala plena (Art. 21)";

    // Lógica de Reducciones / Grupos
    if(state.terminacion === 'sentencia_rechazada' || state.criterioCaducidad === 'art22') {
        grupo = 'grupo4'; 
        impacto = "Reducción del 30% por rechazo de demanda (Art. 22)";
    } 
    else if (['allanamiento', 'transaccion', 'desistimiento'].includes(state.terminacion) || state.criterioCaducidad === 'art25') {
        if (!state.conPrueba) {
            grupo = 'grupo2'; 
            impacto = "Reducción del 50% por finalización prematura (Art. 25)";
        }
    } 
    else if ((state.proceso === 'ejecutivo' || state.proceso === 'ejec_sentencia') && !state.conExcepciones) {
        grupo = 'grupo5'; 
        impacto = "Reducción del 10% por falta de excepciones (Art. 34/41)";
    } 
    else if (state.proceso === 'cautelar') {
        grupo = state.conOposicion ? 'grupo2' : 'grupo3'; // 50% vs 25%
        impacto = state.conOposicion ? "Base al 50% por oposición (Art. 37)" : "Base al 25% (Art. 37)";
    }
    else if (state.proceso === 'desalojo' && state.esVivienda) {
        grupo = 'grupo6'; // Ajuste manual de base 80%
        impacto = "Reducción del 20% por vivienda (Art. 40)";
    }
    else if (state.proceso === 'sucesion' && state.sucesionLetrado === 'unico') {
        grupo = 'grupo2'; // 50%
        impacto = "Reducción del 50% por Letrado Único (Art. 35)";
    }

    mostrarResultados(grupo, impacto);
    next(7);
}

function mostrarResultados(grupo, impacto) {
    const res = document.getElementById('resumenLogico');
    res.innerHTML = `
        <div style="border-left: 4px solid #27ae60; padding-left: 15px;">
            <p><strong>🧾 Resumen del Proceso:</strong></p>
            <div class="resumen-item"><span>Vía:</span> <span>${state.proceso.toUpperCase()}</span></div>
            <div class="resumen-item"><span>Terminación:</span> <span>${state.terminacion.replace('_', ' ')}</span></div>
            <div class="resumen-item"><span>Base declarada:</span> <span>$${state.basePrincipal.toLocaleString('es-AR')}</span></div>
            <div class="resumen-item"><span>Impacto Aplicado:</span> <span class="badge" style="background:#d4edda; color:#155724;">${impacto}</span></div>
        </div>
    `;

    // Seteamos los valores en los campos ocultos de la calculadora original (calc.txt)
    document.getElementById('baseRegulatoria').value = state.basePrincipal;
    document.getElementById('grupoProceso').value = grupo;

    // Disparamos la función calcular() que ya tienes en el HTML (la de calc.txt)
    if (typeof calcular === "function") {
        calcular();
    }

    // Si hubo reconvención, avisamos que debe hacerse un cálculo por separado
    if (state.baseReconvencion > 0) {
        res.innerHTML += `
            <div style="margin-top:15px; padding:10px; background:#fff3cd; border-radius:5px; font-size:0.85rem;">
                <strong>Nota Reconvención:</strong> Conforme Art. 28, deberá realizar un cálculo separado por la base de $${state.baseReconvencion.toLocaleString('es-AR')}.
            </div>
        `;
    }
}
