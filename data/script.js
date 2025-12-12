document.addEventListener('DOMContentLoaded', () => {

    // ============================================
    // 1. GESTIÓN DE PESTAÑAS (TABS)
    // ============================================
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    const switchTab = (tabId) => {
        // 1. Desactivar todos
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // 2. Activar el clickeado
        const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        const targetContent = document.getElementById(tabId);
        
        if (targetBtn && targetContent) {
            targetBtn.classList.add('active');
            targetContent.classList.add('active');
        }
    };

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    // Asegurar que solo la primera pestaña esté activa al cargar
    switchTab('argentina'); 


    // ============================================
    // 2. CONFIGURACIÓN COMPARTIDA
    // ============================================
    const defaultCongreso = { 
        lat: -34.609867, 
        lon: -58.39254, 
        nombre: "Congreso de la Nación (CABA, Argentina)" 
    };

    let debounceTimer;

    const calcularDistancia = (lat1, lon1, lat2, lon2) => {
        const R = 6371; 
        const toRad = v => v * Math.PI / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(toRad(lat1)) * Math.cos(toRad(lat2));
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };

    const calcularDias = (distancia) => {
        if (distancia < 200) return 0;
        const diasBase = Math.floor(distancia / 200);
        const fraccion = distancia % 200;
        return diasBase + (fraccion >= 100 ? 1 : 0);
    };

    const mostrarResultado = (divRes, divTraz, d, dias, c1, c2, nombre1, nombre2) => {
        let msj = '', logica = '';
        if (dias === 0) {
            msj = `<h3>No corresponde ampliación.</h3>`;
            logica = `Distancia (${d.toFixed(2)} km) < 200 km.`;
        } else {
            const s = dias > 1 ? 's' : '';
            msj = `<h3>Corresponde ampliación por ${dias} día${s}.</h3>`;
            logica = `1 día/200km (${Math.floor(d/200)} días) + fracción ${d % 200 >= 100 ? '≥' : '<'} 100km (${d % 200 >= 100 ? '1 día' : '0 días'}).`;
        }

        divRes.innerHTML = msj;
        divTraz.innerHTML = `
            <h4>Detalle de Trazabilidad:</h4>
            <p><strong>Origen:</strong> ${nombre1} (${c1.lat.toFixed(4)}, ${c1.lon.toFixed(4)})</p>
            <p><strong>Destino:</strong> ${nombre2} (${c2.lat.toFixed(4)}, ${c2.lon.toFixed(4)})</p>
            <p><strong>Distancia:</strong> ${d.toFixed(2)} km</p>
            <p><strong>Lógica:</strong> ${logica}</p>
        `;
    };


    // ============================================
    // 3. CALCULADORA ARGENTINA (GEOREF)
    // ============================================
    let argJuzgado = { ...defaultCongreso };
    let argDiligencia = { lat: null, lon: null, nombre: '' };

    const inpArgJuz = document.getElementById('argJuzgado');
    const inpArgDil = document.getElementById('argDiligencia');
    const sugArgJuz = document.getElementById('sugArgJuzgado');
    const sugArgDil = document.getElementById('sugArgDiligencia');

    // Inicializar input
    inpArgJuz.value = defaultCongreso.nombre;

    // Fetch GEOREF
    const buscarGeoref = (query, contenedor, storage, input) => {
        contenedor.innerHTML = '';
        if (query.length < 3) return;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            fetch(`https://apis.datos.gob.ar/georef/api/localidades?nombre=${query}&max=5`, {cache: 'no-store'})
                .then(r => r.json())
                .then(d => {
                    contenedor.innerHTML = '';
                    d.localidades.forEach(loc => {
                        const item = document.createElement('div');
                        item.className = 'sugerencia-item';
                        const txt = `${loc.nombre}, ${loc.provincia.nombre}`;
                        item.textContent = txt;
                        item.onclick = () => {
                            input.value = txt;
                            storage.lat = loc.centroide.lat;
                            storage.lon = loc.centroide.lon;
                            storage.nombre = txt;
                            contenedor.innerHTML = '';
                        };
                        contenedor.appendChild(item);
                    });
                });
        }, 300);
    };

    inpArgJuz.addEventListener('input', () => {
        // Si el usuario escribe y no selecciona, borramos las coordenadas previamente seteadas
        argJuzgado = { lat: null, lon: null, nombre: '' };
        buscarGeoref(inpArgJuz.value, sugArgJuz, argJuzgado, inpArgJuz);
    });
    inpArgDil.addEventListener('input', () => {
        argDiligencia = { lat: null, lon: null, nombre: '' };
        buscarGeoref(inpArgDil.value, sugArgDil, argDiligencia, inpArgDil);
    });

    document.getElementById('btnLimpiarArg').addEventListener('click', () => {
        inpArgJuz.value = '';
        argJuzgado = { lat: null, lon: null, nombre: '' };
    });

    document.getElementById('btnCalcularArg').addEventListener('click', () => {
        const resDiv = document.getElementById('resArg');
        const trazDiv = document.getElementById('trazArg');
        resDiv.innerHTML = '';
        trazDiv.innerHTML = '';

        if(!argJuzgado.lat || !argDiligencia.lat) {
            resDiv.innerHTML = `<h3>⚠️ Error: Debe seleccionar ambas localidades de la lista.</h3>`;
            return;
        }

        const dist = calcularDistancia(argJuzgado.lat, argJuzgado.lon, argDiligencia.lat, argDiligencia.lon);
        mostrarResultado(
            resDiv,
            trazDiv,
            dist, calcularDias(dist), argJuzgado, argDiligencia, argJuzgado.nombre, argDiligencia.nombre
        );
    });


    // ============================================
    // 4. CALCULADORA INTERNACIONAL (OPEN-METEO)
    // ============================================
    let intlJuzgado = { ...defaultCongreso }; // Se usa el valor por defecto solo para inicializar
    let intlDiligencia = { lat: null, lon: null, nombre: '' };

    const inpIntlJuz = document.getElementById('intlJuzgado');
    const inpIntlDil = document.getElementById('intlDiligencia');
    const sugIntlJuz = document.getElementById('sugIntlJuzgado');
    const sugIntlDil = document.getElementById('sugIntlDiligencia');

    // Inicializar input (se mantiene el Congreso como referencia inicial)
    inpIntlJuz.value = defaultCongreso.nombre; 

    // Fetch Open-Meteo
    const buscarMundo = (query, contenedor, storage, input) => {
        contenedor.innerHTML = '';
        if (query.length < 3) return;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=es&format=json`)
                .then(r => r.json())
                .then(d => {
                    contenedor.innerHTML = '';
                    if(!d.results) {
                        const item = document.createElement('div');
                        item.className = 'sugerencia-item';
                        item.textContent = 'No se encontraron resultados';
                        contenedor.appendChild(item);
                        return;
                    }
                    
                    d.results.forEach(loc => {
                        const item = document.createElement('div');
                        item.className = 'sugerencia-item';
                        const partes = [loc.name, loc.admin1, loc.country].filter(Boolean);
                        const txt = partes.join(', ');
                        
                        item.textContent = `🌍 ${txt}`;
                        item.onclick = () => {
                            input.value = txt;
                            storage.lat = loc.latitude;
                            storage.lon = loc.longitude;
                            storage.nombre = txt;
                            contenedor.innerHTML = '';
                        };
                        contenedor.appendChild(item);
                    });
                });
        }, 300);
    };

    inpIntlJuz.addEventListener('input', () => {
        intlJuzgado = { lat: null, lon: null, nombre: '' };
        buscarMundo(inpIntlJuz.value, sugIntlJuz, intlJuzgado, inpIntlJuz);
    });
    inpIntlDil.addEventListener('input', () => {
        intlDiligencia = { lat: null, lon: null, nombre: '' };
        buscarMundo(inpIntlDil.value, sugIntlDil, intlDiligencia, inpIntlDil);
    });

    document.getElementById('btnLimpiarIntl').addEventListener('click', () => {
        inpIntlJuz.value = '';
        intlJuzgado = { lat: null, lon: null, nombre: '' };
    });

    document.getElementById('btnCalcularIntl').addEventListener('click', () => {
        const resDiv = document.getElementById('resIntl');
        const trazDiv = document.getElementById('trazIntl');
        resDiv.innerHTML = '';
        trazDiv.innerHTML = '';

        if(!intlJuzgado.lat || !intlDiligencia.lat) {
            resDiv.innerHTML = `<h3>⚠️ Error: Debe seleccionar ambas ciudades de la lista.</h3>`;
            return;
        }

        const dist = calcularDistancia(intlJuzgado.lat, intlJuzgado.lon, intlDiligencia.lat, intlDiligencia.lon);
        mostrarResultado(
            resDiv,
            trazDiv,
            dist, calcularDias(dist), intlJuzgado, intlDiligencia, intlJuzgado.nombre, intlDiligencia.nombre
        );
    });

    // Cerrar sugerencias al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.form-group')) {
            document.querySelectorAll('.sugerencias').forEach(s => s.innerHTML = '');
        }
    });

});
