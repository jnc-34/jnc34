const state = {
  tipoHonorario: null,
  tipoProceso: null,
  hayPrueba: false,
  reconvencion: false,
  terminacion: null,
  base: 0,
  grupo: null
};

// navegación
function next(n) {
  document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("activa"));
  document.getElementById("p" + n).classList.add("activa");
}

// guardar datos
function guardarTipoHonorario() {
  state.tipoHonorario = document.getElementById("tipoHonorario").value;
  next(4);
}

function guardarProceso() {
  state.tipoProceso = document.getElementById("tipoProceso").value;

  // 🔴 reconvención SOLO ordinario
  if (state.tipoProceso === "ordinario") {
    document.getElementById("reconvencionBox").style.display = "block";
  }

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
  determinarGrupo();
  mostrarResumen();
  next(8);
}

// 🧠 lógica de grupo
function determinarGrupo() {

  if (!state.hayPrueba) {
    state.grupo = 2;
    return;
  }

  if (state.terminacion === "caducidad") {
    state.grupo = 4;
    return;
  }

  if (state.tipoProceso === "ejecutivo" && !state.hayPrueba) {
    state.grupo = 5;
    return;
  }

  state.grupo = 1;
}

// resumen
function mostrarResumen() {
  document.getElementById("resumen").innerText = `
Base: ${state.base}
Grupo: ${state.grupo}
`;
}

// 🚀 cálculo final
function calcularFinal() {

  let resultado = state.base;

  switch(state.grupo) {
    case 1: resultado *= 1; break;
    case 2: resultado *= 0.5; break;
    case 3: resultado *= 0.75; break; // ✔ FIX
    case 4: resultado *= 0.7; break;
    case 5: resultado *= 0.9; break;
    case 6: resultado *= 0.45; break;
  }

  let texto = `Resultado: ${resultado}`;

  // provisorios
  if (state.tipoHonorario === "provisorios") {
    texto += "\n⚠️ Se muestra solo el mínimo (art. 12)";
  }

  // gestor
  texto += "\nℹ️ Si actuó como gestor: +4% (art. 42)";

  document.getElementById("resultado").innerText = texto;

  next(9);
}
