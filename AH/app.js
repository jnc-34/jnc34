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

// navegación
function next(n) {
  document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("activa"));
  document.getElementById("p" + n).classList.add("activa");
}

// tipo honorario
function guardarTipoHonorario() {
  state.tipoHonorario = document.getElementById("tipoHonorario").value;
  next(4);
}

// proceso
function guardarProceso() {
  state.tipoProceso = document.getElementById("tipoProceso").value;

  // reconvención SOLO ordinario
  if (state.tipoProceso === "ordinario") {
    document.getElementById("reconvencionBox").style.display = "block";
  }

  next(5);
}

// variables
function guardarVariables() {
  state.hayPrueba = document.getElementById("hayPrueba").checked;
  state.reconvencion = document.getElementById("reconvencion").checked;
  next(6);
}

// terminación
function guardarTerminacion() {
  state.terminacion = document.getElementById("terminacion").value;
  next(7);
}

// base
function guardarBase() {
  state.base = parseFloat(document.getElementById("baseMonto").value || 0);
  state.baseTipo = document.getElementById("tipoBase").value;

  aplicarReglasBase();
  determinarGrupo();
  mostrarResumen();

  next(8);
}

// reglas base
function aplicarReglasBase() {
  state.reducciones = [];
  let w = "";

  switch(state.baseTipo) {

    case "establecimiento":
      w = "Puede corresponder +10% valor llave";
      break;

    case "uso":
      w = "10% anual del valor x años (tope 100%)";
      break;

    case "escrituracion":
      w = "Base art. 23 salvo monto mayor del boleto";
      break;

    case "posesorias":
      state.base *= 0.8;
      state.reducciones.push("Reducción 20%");
      break;

    case "colectiva":
      state.base *= 0.75;
      state.reducciones.push("Reducción 25%");
      break;
  }

  document.getElementById("warnings").innerHTML = "<small>"+w+"</small>";
}

// lógica grupos COMPLETA
function determinarGrupo() {

  // caducidad
  if (state.terminacion === "caducidad") {
    state.grupo = 4;
    return;
  }

  // sin prueba
  if (!state.hayPrueba) {
    state.grupo = 2;
    return;
  }

  // ejecutivo sin excepciones
  if (state.tipoProceso === "ejecutivo" && !state.hayPrueba) {
    state.grupo = 5;
    return;
  }

  // default
  state.grupo = 1;
}

// resumen
function mostrarResumen() {
  document.getElementById("resumen").innerText = `
Base inicial: ${state.base}

Reducciones:
${state.reducciones.join("\n")}

Grupo: ${state.grupo}
`;
}

// cálculo final
function calcularFinal() {

  let baseFinal = state.base;

  switch(state.grupo) {
    case 1: baseFinal *= 1; break;
    case 2: baseFinal *= 0.5; break;
    case 3: baseFinal *= 0.75; break; // ✔ FIX
    case 4: baseFinal *= 0.7; break;
    case 5: baseFinal *= 0.9; break;
    case 6: baseFinal *= 0.45; break;
  }

  // 🔌 INTEGRACIÓN REAL
  if (typeof calcular === "function") {
    document.getElementById("baseRegulatoria").value = baseFinal;
    document.getElementById("grupoProceso").value = state.grupo;
    calcular();
  }

  let texto = `Base final: ${baseFinal}\nGrupo: ${state.grupo}`;

  // provisorios
  if (state.tipoHonorario === "provisorios") {
    texto += "\n⚠️ Honorarios provisorios: se muestra mínimo (art. 12)";
  }

  // gestor
  texto += "\nℹ️ Posible adicional 4% por gestor (art. 42)";

  document.getElementById("resultado").innerText = texto;

  next(9);
}
