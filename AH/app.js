const state = {
  tipoHonorario: null,
  tipoProceso: null,
  hayPrueba: false,
  reconvencion: false,
  terminacion: null,
  base: 0,
  baseTipo: null,
  reducciones: [],
  grupo: null
};

// Navegación entre pantallas
function next(n) {
  document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("activa"));
  document.getElementById("p" + n).classList.add("activa");
}

function guardarTipoHonorario() {
  state.tipoHonorario = document.getElementById("tipoHonorario").value;
  next(4);
}

function guardarProceso() {
  state.tipoProceso = document.getElementById("tipoProceso").value;
  // Reconvención solo visible en ordinarios [cite: 24]
  document.getElementById("reconvencionBox").style.display = (state.tipoProceso === "ordinario") ? "block" : "none";
  next(5);
}

function guardarVariables() {
  state.hayPrueba = document.getElementById("hayPrueba").checked;
  state.reconvencion = document.getElementById("reconvencion").checked;
  next(6);
}

function guardarTerminacion() {
  state.terminacion = document.getElementById("terminacion").value;
  next(7);
}

function guardarBase() {
  state.base = parseFloat(document.getElementById("baseMonto").value || 0);
  state.baseTipo = document.getElementById("tipoBase").value;

  aplicarReglasBase();
  determinarGrupo();
  calcularFinal(); // Salto automático al resultado
}

// Lógica de reducciones de base según objeto del juicio
function aplicarReglasBase() {
  state.reducciones = [];
  switch(state.baseTipo) {
    case "posesorias":
      state.base *= 0.8; // Art. 23: 80% del valor [cite: 29]
      state.reducciones.push("Reducción 20% (Acc. Posesorias)");
      break;
    case "colectiva":
      state.base *= 0.75; // Reducción por incidencia colectiva
      state.reducciones.push("Reducción 25% (Inc. Colectiva)");
      break;
  }
}

// Determina el Grupo (mapeado a calc.txt)
function determinarGrupo() {
  // Caducidad o Demanda Rechazada [cite: 37]
  if (state.terminacion === "caducidad") {
    state.grupo = "grupo4";
    return;
  }

  // Ejecutivo sin excepciones [cite: 37]
  if (state.tipoProceso === "ejecutivo" && !state.hayPrueba) {
    state.grupo = "grupo5";
    return;
  }

  // Medios anormales antes de prueba [cite: 33]
  if (!state.hayPrueba && (state.terminacion !== "sentencia")) {
    state.grupo = "grupo2";
    return;
  }

  // Por defecto: Grupo 1 (Escala Plena) [cite: 31]
  state.grupo = "grupo1";
}

// Inyecta los datos en el motor de cálculo
function calcularFinal() {
  const inputBase = document.getElementById("baseRegulatoria");
  const selectGrupo = document.getElementById("grupoProceso");
  const resAsistente = document.getElementById("resultado-asistente");

  if (inputBase && selectGrupo) {
    // Seteamos la base formateada para el motor
    inputBase.value = state.base.toLocaleString('es-AR', { minimumFractionDigits: 2 });
    selectGrupo.value = state.grupo;

    // Resumen visual rápido
    resAsistente.innerText = `Asistente: Base de $${state.base.toLocaleString('es-AR')} y asignación a ${state.grupo.toUpperCase()}`;

    // Disparamos el cálculo de la calculadora
    if (typeof calcular === "function") {
      calcular();
    }
  }
  next(9);
}
