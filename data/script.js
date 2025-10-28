// --- Ejecutar al cargar la página ---
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Selección de Elementos del DOM ---
    const localidadJuzgadoInput = document.getElementById('localidadJuzgado');
    const sugerenciasJuzgado = document.getElementById('sugerenciasJuzgado');
    const limpiarJuzgadoBtn = document.getElementById('limpiarJuzgado');
    
    const localidadDiligenciaInput = document.getElementById('localidadDiligencia');
    const sugerenciasDiligencia = document.getElementById('sugerenciasDiligencia');
    
    const calcularBtn = document.getElementById('calcular');
    const resultadoDiv = document.getElementById('resultado');
    const trazabilidadDiv = document.getElementById('trazabilidad');

    // --- 2. Variables de Estado ---
    // Almacenamos las coordenadas y nombres seleccionados
    let juzgadoCoords = { lat: null, lon: null, nombre: '' };
    let diligenciaCoords = { lat: null, lon: null, nombre: '' };

    // Valor por defecto: Congreso de la Nación
    // Obtenido de GEOREF (Dirección: Av. Rivadavia 1864, CABA)
    const defaultJuzgado = { 
        lat: -34.609867, 
        lon: -58.39254, 
        nombre: "Congreso de la Nación (Av. Rivadavia 1864, CABA)" 
    };

    // --- 3. Lógica de Autocompletado y API ---

    let debounceTimer; // Temporizador para no llamar a la API en cada tecla

    // Función genérica para buscar sugerencias en GEOREF
    const fetchSugerencias = (query, sugerenciasElement, coordStorage, inputElement) => {
        // Limpiamos sugerencias anteriores
        sugerenciasElement.innerHTML = '';
        
        // Si el query está vacío, no buscamos
        if (query.length < 3) return;

        // Cancelamos el timer anterior si existe
        clearTimeout(debounceTimer);

        // Creamos un nuevo timer
        debounceTimer = setTimeout(() => {
            // Usamos la API de localidades. Agregamos 'max=5' para limitar resultados
            // Agregamos { cache: 'no-store' } para cumplir el requisito de evitar caché
            fetch(`https://apis.datos.gob.ar/georef/api/localidades?nombre=${query}&max=5`, { cache: 'no-store' })
                .then(response => response.json())
                .then(data => {
                    sugerenciasElement.innerHTML = ''; // Limpiar de nuevo por si acaso
                    
                    data.localidades.forEach(loc => {
                        const div = document.createElement('div');
                        div.className = 'sugerencia-item';
                        const nombreCompleto = `${loc.nombre}, ${loc.provincia.nombre}`;
                        div.textContent = nombreCompleto;
                        
                        // Evento al hacer clic en una sugerencia
                        div.addEventListener('click', () => {
                            inputElement.value = nombreCompleto; // Poner texto en el input
                            // Guardar coordenadas y nombre en el estado
                            coordStorage.lat = loc.centroide.lat;
                            coordStorage.lon = loc.centroide.lon;
                            coordStorage.nombre = nombreCompleto;
                            sugerenciasElement.innerHTML = ''; // Limpiar sugerencias
                        });
                        
                        sugerenciasElement.appendChild(div);
                    });
                })
                .catch(error => {
                    console.error('Error al fetchear GEOREF:', error);
                    sugerenciasElement.innerHTML = '<div class="sugerencia-item">Error al buscar</div>';
                });
        }, 300); // Espera 300ms después de que el usuario deja de escribir
    };

    // Asignar eventos 'input' a los casilleros
    localidadJuzgadoInput.addEventListener('input', () => {
        fetchSugerencias(localidadJuzgadoInput.value, sugerenciasJuzgado, juzgadoCoords, localidadJuzgadoInput);
    });

    localidadDiligenciaInput.addEventListener('input', () => {
        fetchSugerencias(localidadDiligenciaInput.value, sugerenciasDiligencia, diligenciaCoords, localidadDiligenciaInput);
    });


    // --- 4. Lógica de Cálculo (Haversine y Reglas) ---

    /**
     * Calcula la distancia (en Km) entre dos puntos usando la fórmula de Haversine.
     */
    const calcularDistanciaHaversine = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radio de la Tierra en km
        
        const toRad = (value) => value * Math.PI / 180;
        
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        
        const radLat1 = toRad(lat1);
        const radLat2 = toRad(lat2);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(radLat1) * Math.cos(radLat2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c; // Distancia en km
    };

    /**
     * Calcula los días de ampliación según el Art. 158 CPCCN.
     */
    const calcularDiasAmpliacion = (distancia) => {
        if (distancia < 200) {
            return 0; // No corresponde
        }

        // 1 día por cada 200 km
        const diasBase = Math.floor(distancia / 200);
        
        // Fracción que no baje de 100 km
        const fraccion = distancia % 200;
        let diasFraccion = 0;
        
        if (fraccion >= 100) {
            diasFraccion = 1;
        }

        // Ejemplos:
        // 199km -> 0 (entra en el primer if)
        // 200km -> diasBase=1, fraccion=0, diasFraccion=0. Total = 1 día.
        // 299km -> diasBase=1, fraccion=99, diasFraccion=0. Total = 1 día.
        // 301km -> diasBase=1, fraccion=101, diasFraccion=1. Total = 2 días.
        // 400km -> diasBase=2, fraccion=0, diasFraccion=0. Total = 2 días.
        
        return diasBase + diasFraccion;
    };


    // --- 5. Eventos de Botones y Estado Inicial ---

    // Función para configurar el valor por defecto
    const setDefaultJuzgado = () => {
        juzgadoCoords = { ...defaultJuzgado };
        localidadJuzgadoInput.value = defaultJuzgado.nombre;
    };

    // Botón Limpiar
    limpiarJuzgadoBtn.addEventListener('click', () => {
        localidadJuzgadoInput.value = '';
        juzgadoCoords = { lat: null, lon: null, nombre: '' };
        sugerenciasJuzgado.innerHTML = '';
        localidadJuzgadoInput.focus(); // Poner el foco en el input
    });

    // Botón Calcular
    calcularBtn.addEventListener('click', () => {
        // Validación
        if (!juzgadoCoords.lat || !diligenciaCoords.lat) {
            resultadoDiv.innerHTML = `<h3>Error: Debe seleccionar ambas localidades de la lista.</h3>`;
            trazabilidadDiv.innerHTML = '';
            return;
        }

        // 1. Calcular Distancia
        const distancia = calcularDistanciaHaversine(
            juzgadoCoords.lat, juzgadoCoords.lon,
            diligenciaCoords.lat, diligenciaCoords.lon
        );

        // 2. Calcular Días
        const dias = calcularDiasAmpliacion(distancia);

        // 3. Generar Mensajes
        let mensajeResultado = '';
        let logicaComputo = '';

        if (dias === 0) {
            mensajeResultado = `<h3>No corresponde ampliación de plazos por distancia.</h3>`;
            logicaComputo = `La distancia (${distancia.toFixed(2)} km) es inferior a los 200 km requeridos.`;
        } else {
            const plural = dias > 1 ? 'días' : 'día';
            mensajeResultado = `<h3>Corresponde ampliación de plazos por ${dias} ${plural}.</h3>`;
            logicaComputo = `Se otorga 1 día por cada 200 km o fracción que no baje de 100 km.`;
        }

        // 4. Mostrar Resultados y Trazabilidad
        resultadoDiv.innerHTML = mensajeResultado;

        trazabilidadDiv.innerHTML = `
            <h4>Detalle de Trazabilidad:</h4>
            <p><strong>a) Localidad Tribunal:</strong> ${juzgadoCoords.nombre} 
               (Lat: ${juzgadoCoords.lat.toFixed(6)}, Lon: ${juzgadoCoords.lon.toFixed(6)})</p>
            <p><strong>b) Localidad Diligencia:</strong> ${diligenciaCoords.nombre} 
               (Lat: ${diligenciaCoords.lat.toFixed(6)}, Lon: ${diligenciaCoords.lon.toFixed(6)})</p>
            <p><strong>c) Distancia lineal (Haversine):</strong> ${distancia.toFixed(2)} km</p>
            <p><strong>d) Lógica de cómputo (Art. 158):</strong> ${logicaComputo}</p>
        `;
    });

    // --- 6. Carga Inicial ---
    setDefaultJuzgado(); // Establecer el valor por defecto al cargar

});
