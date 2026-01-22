

// Variabili Globali
let tuttiIComuni = [];
let mappa;
let markerLayer = L.layerGroup();
let comuniProvincia = [];
let markerComuneSelezionato = null;

// Inizializzazione Pagina
document.addEventListener('DOMContentLoaded', function() {
    // Mappa OpenStreetMap (Leaflet)
    mappa = L.map('map').setView([42.5, 12.5], 6);
    
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mappa);

    // Marker
    const markerCustom = L.icon({
        iconUrl: 'src/img/icons/pin.png',
    
        iconSize:     [38, 95], // Grandezza Marker
        shadowSize:   [50, 64], // Obra Marker
        iconAnchor:   [22, 94], // Posizione Marker
        popupAnchor:  [-3, -76] // Posizione Pop-Up
    });
    markerLayer.addTo(mappa);
    
    // Caricamento Comuni Iniziale
    caricaComuni();
    
    // Event Listener - Regione, Provincia, Comune
    document.getElementById('selectRegione').addEventListener('change', aggiornaProvince);
    document.getElementById('selectProvincia').addEventListener('change', aggiornaComuni);
    document.getElementById('selectComune').addEventListener('change', selezionaComune);
});

//  COMUNI
/* Il metodo caricaComuni restituisce una lista di comuni italiani in formato JSON dalla repository GitHub.
   Viene poi invocato il metodo popolaRegioni.*/
async function caricaComuni() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/matteocontrini/comuni-json/master/comuni.json');
        tuttiIComuni = await response.json();
        
        // Popola le regioni
        popolaRegioni();
    } catch (error) {
        console.error('Errore nel caricamento dei comuni:', error);
        alert('Impossibile caricare l\'elenco dei comuni. Riprova più tardi.');
    }
}

// REGIONI
/* Il metodo popolaRegioni estrae dalla lista tuttiIComuni i nomi delle regioni italiane, ordinandole alfabeticamente, per poi
    aggiungerle al select delle regioni.*/
function popolaRegioni() {
    const selectRegione = document.getElementById('selectRegione');
    
    // Lista regioni riempita con i nome delle Regioni
    const regioni = [...new Set(tuttiIComuni.map(comune => comune.regione.nome))];
    
    // Ordina la lista 
    regioni.sort();
    
    // Aggiorna Select Regioni
    regioni.forEach(regione => {
        const option = document.createElement('option');
        option.value = regione;
        option.textContent = regione;
        selectRegione.appendChild(option);
    });
}

// PROVINCIA
/* Il metodo aggiornaProvince aggiorna le Province in base alla Regione selezionata
*/
function aggiornaProvince() {
    const regioneSelezionata = document.getElementById('selectRegione').value;
    const selectProvincia = document.getElementById('selectProvincia');
    const selectComune = document.getElementById('selectComune');
    
    // Reset Iniziale
    selectProvincia.innerHTML = '<option value="">Provincia</option>';
    selectComune.innerHTML = '<option value="">Comune</option>';
    comuniProvincia = [];
    
    markerLayer.clearLayers();
    markerComuneSelezionato = null;
    
    if (!regioneSelezionata) return;
    
    // Filtra comuni per regione
    const comuniRegione = tuttiIComuni.filter(
        comune => comune.regione.nome === regioneSelezionata
    );
    
    // Lista province riempita con i nomi delle Province
    const province = [...new Set(comuniRegione
        .filter(comune => comune.provincia && comune.provincia.nome)
        .map(comune => comune.provincia.nome)
    )];
    
    // Ordina la lista
    province.sort();
    
    // Aggiorna Select Provincia
    province.forEach(provincia => {
        const option = document.createElement('option');
        option.value = provincia;
        option.textContent = provincia;
        selectProvincia.appendChild(option);
    });
}

// COMUNI
/* Il metodo aggiornaComuni aggiorna i Comuni in base alla Provincia selezionata */
function aggiornaComuni() {
    const provinciaSelezionata = document.getElementById('selectProvincia').value;
    const selectComune = document.getElementById('selectComune');
    
    // Reset Iniziale
    selectComune.innerHTML = '<option value="">Comune</option>';
    comuniProvincia = [];

    markerLayer.clearLayers();
    markerComuneSelezionato = null;
    
    if (!provinciaSelezionata) return;
    
    // lista comune riempita con i nomi dei Comuni
    comuniProvincia = tuttiIComuni.filter(
        comune => comune.provincia && comune.provincia.nome === provinciaSelezionata
    );
    
    // Ordina Lista
    comuniProvincia.sort((a, b) => a.nome.localeCompare(b.nome));
    
    // Aggiorna Select Comuni
    comuniProvincia.forEach(comune => {
        const option = document.createElement('option');
        option.value = comune.nome;
        option.textContent = comune.nome;
        selectComune.appendChild(option);
    });
    
    // Imposta la Mappa alla Posizione del Comune Selezionato
    centraMappaSullaProvincia(provinciaSelezionata);
}

// POSIZIONE MAPPA
/* Il Metodo centraMappaSullaProvincia permette di centrare la Mappa sulla posizione della Provincia selezionata*/
async function centraMappaSullaProvincia(provincia) {

    if (comuniProvincia.length > 0) {
        const coordinate = await getCoordinateComune(comuniProvincia[0]);
        if (coordinate) {
            mappa.setView([coordinate.lat, coordinate.lng], 9);
        }
    }
}

// POSIZIONE MAPPA - 2
/* Il metodo selezionaComune permette di centrare la Mappa sulla posizione esatta del Comune selezionato */
async function selezionaComune() {
    const comuneSelezionato = document.getElementById('selectComune').value;
    
    if (!comuneSelezionato) {
        // Reset (se nessun Comune è stato selezionato)
        markerLayer.clearLayers();
        markerComuneSelezionato = null;
        return;
    }
    
    const comune = comuniProvincia.find(c => c.nome === comuneSelezionato);
    
    if (!comune) return;
    
    // Cordinate del Comune
    const coordinate = await getCoordinateComune(comune);
    
    if (coordinate) {
        // Meteo Attuale del Comune
        const meteoAttuale = await getMeteoAttuale(coordinate.lat, coordinate.lng);
        
        // Reset 
        markerLayer.clearLayers();
        
        // Marker dedicati al Comune selezionato
        markerComuneSelezionato = L.marker([coordinate.lat, coordinate.lng], {
            icon: L.icon({
                iconUrl: 'src/img/icons/pin.png',
                
                iconSize: [41, 41],
                iconAnchor: [19, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        });
        

        //no allora il select dei preferiti veve essere giusto un quadratino con una stella gialla alltinterno a destra dei selct attuali e questo nuovo select deve comparire solo nel caso in cui ci sia uno o piu preferiti (tipo quando ci sono dei preferiti il select si restrinono leggermente per far spazio al nuovo select restando a filo lagraghezza mappa) in pui aggiungi la stellina clickabile nella prima card del dettaglio dove ci sono le informazini attuali del meteo, utilizza localStorage
        // Crea contenuto popup con meteo - GRAFICA ORIGINALE
        const popupContent = creaContenutoPopup(comune, coordinate, meteoAttuale);
        
        // Caratteristiche del Pop-Up
        const popup = L.popup({
            maxWidth: 300,
            minWidth: 250,
            maxHeight: 350,
            autoPan: true,
            autoPanPadding: [50, 50],
            closeButton: true,
            className: 'popup-meteo-originale'
        }).setContent(popupContent);
        
        // Aggiunta Pop-Up alla Mappa
        markerComuneSelezionato.bindPopup(popup);
        markerComuneSelezionato.addTo(markerLayer);
    
        // Centra la posizione della Mappa dopo aver aggiunto il Pop-Up
        mappa.setView([coordinate.lat-7, coordinate.lng], 12);
        
        // Apertura Pop-Up
        markerComuneSelezionato.openPopup();
    }
}

// CONTENUTO POP-UP
/* Il metodo creaContenutoPopup crea il contenuto del Pop-Up*/
function creaContenutoPopup(comune, coordinate, meteo) {
    // Nome Provincia
    const nomeProvincia = comune.provincia ? comune.provincia.nome : 'N/A';
    
    // Specifiche del Meteo Attuale
    const condizioneMeteo = getCondizioneMeteo(meteo);
    const iconaMeteo = getIconaMeteo(meteo);
    
    return `
        <div style="text-align: center; padding: 15px; min-width: 200px; max-width: 280px;">
            <div style="margin-bottom: 15px;">
                <strong style="font-size: 18px; color: #333;">${comune.nome}</strong><br>
                <span style="color: #666; font-size: 14px;">
                    Provincia: ${nomeProvincia}
                </span>
            </div>
            
            <div style="background-color: #f0f8ff; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #d1e7ff;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 10px;">
                    <span style="font-size: 28px;">${iconaMeteo}</span>
                    <div>
                        <span style="font-size: 24px; font-weight: bold; color: #0066cc;">
                            ${meteo ? meteo.temperatura.toFixed(1) : '--'}°C
                        </span>
                    </div>
                </div>
                <div style="font-size: 16px; color: #333; margin-bottom: 5px;">
                    <strong>${condizioneMeteo}</strong>
                </div>
                <div style="font-size: 14px; color: #666;">
                    Vento: ${meteo ? meteo.vento.toFixed(1) : '--'} km/h
                </div>
            </div>
            
            <a href="dettaglio.html?nome=${encodeURIComponent(comune.nome)}&lat=${coordinate.lat}&lon=${coordinate.lng}" 
               style="display: inline-block; padding: 10px 20px; background-color: #0066cc; color: white; 
                      text-decoration: none; border-radius: 6px; font-weight: bold; transition: background-color 0.3s;">
                Dettaglio meteo completo
            </a>
        </div>
    `;
}


// Il metodo getCordinateComune restituisce le coordinate del Comune Selezionato tramite l' API Open Meteo
async function getCoordinateComune(comune) {
    try {
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(comune.nome)}&count=1&language=it`
        );
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            return {
                lat: data.results[0].latitude,
                lng: data.results[0].longitude,
                comune: comune
            };
        }
    } catch (error) {
        console.error(`Errore coordinate per ${comune.nome}:`, error);
    }
    return null;
}

// Il metodo getMeteoAttuale restituisce il condizioni meteo attuali del Comune selezionato sempre tramite l' API di Open Meteo
async function getMeteoAttuale(lat, lon) {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,weather_code&timezone=auto`
        );
        const data = await response.json();
        
        if (data.current) {
            return {
                temperatura: data.current.temperature_2m,
                vento: data.current.wind_speed_10m,
                codiceMeteo: data.current.weather_code
            };
        }
    } catch (error) {
        console.error('Errore nel recupero meteo:', error);
    }
    return null;
}

// Il metodo getCondioneMeteo è utilizzato per assegnare ad ogni condizione meteo un' Icona
function getCondizioneMeteo(meteo) {
    if (!meteo || !meteo.codiceMeteo) return 'Dati non disponibili';
    
    const codice = meteo.codiceMeteo;
    
    const condizioni = {
        0: 'Sereno',
        1: 'Prevalentemente sereno',
        2: 'Parzialmente nuvoloso',
        3: 'Nuvoloso',
        45: 'Nebbia',
        48: 'Nebbia con brina',
        51: 'Pioviggine leggera',
        53: 'Pioviggine moderata',
        55: 'Pioviggine intensa',
        56: 'Pioviggine gelata leggera',
        57: 'Pioviggine gelata intensa',
        61: 'Pioggia leggera',
        63: 'Pioggia moderata',
        65: 'Pioggia intensa',
        66: 'Pioggia gelata leggera',
        67: 'Pioggia gelata intensa',
        71: 'Neve leggera',
        73: 'Neve moderata',
        75: 'Neve intensa',
        77: 'Granelli di neve',
        80: 'Rovesci di pioggia leggeri',
        81: 'Rovesci di pioggia moderati',
        82: 'Rovesci di pioggia violenti',
        85: 'Rovesci di neve leggeri',
        86: 'Rovesci di neve intensi',
        95: 'Temporale',
        96: 'Temporale con grandine leggera',
        99: 'Temporale con grandine intensa'
    };
    
    return condizioni[codice] || 'Condizioni non definite';
}

// Il metodo getIconaMeteo restituisce l' Icona in base al codice restituito dalla funzione precedente
function getIconaMeteo(meteo) {
    if (!meteo || !meteo.codiceMeteo) return '☀️';
    
    const codice = meteo.codiceMeteo;
    
    //  Gestione Icone
    if (codice === 0 || codice === 1) return '☀️'; // Sereno
    if (codice === 2) return '⛅'; // Parzialmente nuvoloso
    if (codice === 3) return '☁️'; // Nuvoloso
    if (codice >= 45 && codice <= 48) return '🌫️'; // Nebbia
    if (codice >= 51 && codice <= 67) return '🌧️'; // Pioggia
    if (codice >= 71 && codice <= 77) return '❄️'; // Neve
    if (codice >= 80 && codice <= 81) return '🌦️'; // Rovesci
    if (codice >= 85 && codice <= 86) return './src/img/icons/nevischio.png'; //neve ista pioggia
    if (codice == 95 || codice == 82) return '⛈️'; // Temporale
    if (codice >= 96 && codice <= 99) return './src/img/icons/nevischio.png'; //grandine
    
    return '☀️';
}
