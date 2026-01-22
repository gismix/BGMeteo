// Variabili globali
let tuttiIComuni = [];
let mappa;
let markerLayer = L.layerGroup();
let comuniProvincia = [];
let markerComuneSelezionato = null;

// Inizializza tutto quando la pagina è pronta
document.addEventListener('DOMContentLoaded', function() {
    // 1. Inizializza la mappa
    mappa = L.map('map').setView([42.5, 12.5], 6);
    
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mappa);

    //1.1 Aggiunta marker custom
    const markerCustom = L.icon({
        iconUrl: 'src/img/icons/pin.png',
    
        iconSize:     [38, 95], // size of the icon
        shadowSize:   [50, 64], // size of the shadow
        iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
        popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
    });
    
    markerLayer.addTo(mappa);
    
    // 2. Carica i comuni
    caricaComuni();
    
    // 3. Imposta event listener per le select
    document.getElementById('selectRegione').addEventListener('change', aggiornaProvince);
    document.getElementById('selectProvincia').addEventListener('change', aggiornaComuni);
    document.getElementById('selectComune').addEventListener('change', selezionaComune);
});

// Carica il file JSON dei comuni
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

// Estrai e popola le regioni
function popolaRegioni() {
    const selectRegione = document.getElementById('selectRegione');
    
    // Estrai nomi regione (eliminando duplicati)
    const regioni = [...new Set(tuttiIComuni.map(comune => comune.regione.nome))];
    
    // Ordina alfabeticamente
    regioni.sort();
    
    // Aggiungi opzioni alla select
    regioni.forEach(regione => {
        const option = document.createElement('option');
        option.value = regione;
        option.textContent = regione;
        selectRegione.appendChild(option);
    });
}

// Aggiorna le province quando cambia la regione
function aggiornaProvince() {
    const regioneSelezionata = document.getElementById('selectRegione').value;
    const selectProvincia = document.getElementById('selectProvincia');
    const selectComune = document.getElementById('selectComune');
    
    // Reset province e comuni
    selectProvincia.innerHTML = '<option value="">Seleziona una provincia...</option>';
    selectComune.innerHTML = '<option value="">Seleziona un comune...</option>';
    comuniProvincia = [];
    
    // Rimuovi tutti i marker
    markerLayer.clearLayers();
    markerComuneSelezionato = null;
    
    if (!regioneSelezionata) return;
    
    // Filtra comuni per regione
    const comuniRegione = tuttiIComuni.filter(
        comune => comune.regione.nome === regioneSelezionata
    );
    
    // Estrai province (nome) - correzione: accesso sicuro all'oggetto provincia
    const province = [...new Set(comuniRegione
        .filter(comune => comune.provincia && comune.provincia.nome)
        .map(comune => comune.provincia.nome)
    )];
    
    // Ordina
    province.sort();
    
    // Popola select provincia
    province.forEach(provincia => {
        const option = document.createElement('option');
        option.value = provincia;
        option.textContent = provincia;
        selectProvincia.appendChild(option);
    });
}

// Aggiorna i comuni quando cambia la provincia
function aggiornaComuni() {
    const provinciaSelezionata = document.getElementById('selectProvincia').value;
    const selectComune = document.getElementById('selectComune');
    
    // Reset comuni
    selectComune.innerHTML = '<option value="">Seleziona un comune...</option>';
    comuniProvincia = [];
    
    // Rimuovi tutti i marker
    markerLayer.clearLayers();
    markerComuneSelezionato = null;
    
    if (!provinciaSelezionata) return;
    
    // Filtra comuni per provincia - con controllo sicuro
    comuniProvincia = tuttiIComuni.filter(
        comune => comune.provincia && comune.provincia.nome === provinciaSelezionata
    );
    
    // Ordina comuni alfabeticamente
    comuniProvincia.sort((a, b) => a.nome.localeCompare(b.nome));
    
    // Popola select comune
    comuniProvincia.forEach(comune => {
        const option = document.createElement('option');
        option.value = comune.nome;
        option.textContent = comune.nome;
        selectComune.appendChild(option);
    });
    
    // Centra la mappa sulla provincia 
    centraMappaSullaProvincia(provinciaSelezionata);
}

// Funzione per centrare la mappa sulla provincia (approssimata)
async function centraMappaSullaProvincia(provincia) {
    // Prendiamo il primo comune della provincia per avere coordinate approssimative
    if (comuniProvincia.length > 0) {
        const coordinate = await getCoordinateComune(comuniProvincia[0]);
        if (coordinate) {
            mappa.setView([coordinate.lat, coordinate.lng], 9);
        }
    }
}

// Quando si seleziona un comune specifico
async function selezionaComune() {
    const comuneSelezionato = document.getElementById('selectComune').value;
    
    if (!comuneSelezionato) {
        // Se nessun comune selezionato, rimuovi tutti i marker
        markerLayer.clearLayers();
        markerComuneSelezionato = null;
        return;
    }
    
    // Trova il comune nell'array
    const comune = comuniProvincia.find(c => c.nome === comuneSelezionato);
    
    if (!comune) return;
    
    // Ottieni coordinate
    const coordinate = await getCoordinateComune(comune);
    
    if (coordinate) {
        // Ottieni dati meteo attuali
        const meteoAttuale = await getMeteoAttuale(coordinate.lat, coordinate.lng);
        
        // Rimuovi tutti i marker precedenti
        markerLayer.clearLayers();
        
        // Crea marker solo per il comune selezionato
        markerComuneSelezionato = L.marker([coordinate.lat, coordinate.lng], {
            icon: L.icon({
                iconUrl: 'src/img/icons/pin.png',
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                iconSize: [41, 41],
                iconAnchor: [19, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        });
        
        // Crea contenuto popup con meteo - GRAFICA ORIGINALE
        const popupContent = creaContenutoPopup(comune, coordinate, meteoAttuale);
        
        // Crea il popup con opzioni per evitare tagli
        const popup = L.popup({
            maxWidth: 300,
            minWidth: 250,
            maxHeight: 350,
            autoPan: true,
            autoPanPadding: [50, 50],
            closeButton: true,
            className: 'popup-meteo-originale'
        }).setContent(popupContent);
        
        // Associa il popup al marker
        markerComuneSelezionato.bindPopup(popup);
        
        // Aggiungi marker alla mappa
        markerComuneSelezionato.addTo(markerLayer);
        
        // Centra la mappa sul comune selezionato con zoom adeguato
        mappa.setView([coordinate.lat-7, coordinate.lng], 12);
        
        // Apri automaticamente il popup
        markerComuneSelezionato.openPopup();
    }
}

// Funzione per creare il contenuto del popup 
function creaContenutoPopup(comune, coordinate, meteo) {
    // Estrai nome provincia correttamente 
    const nomeProvincia = comune.provincia ? comune.provincia.nome : 'N/A';
    
    // Determina condizione meteo e icona
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

// Ottieni coordinate da Open-Meteo
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

// Ottieni meteo attuale da Open-Meteo
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

// Converti codice meteo in descrizione testuale
function getCondizioneMeteo(meteo) {
    if (!meteo || !meteo.codiceMeteo) return 'Dati non disponibili';
    
    const codice = meteo.codiceMeteo;
    
    // Tabella conversione codici WMO Weather Interpretation Codes
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

// Ottieni icona meteo in base al codice (emoji)
function getIconaMeteo(meteo) {
    if (!meteo || !meteo.codiceMeteo) return '☀️';
    
    const codice = meteo.codiceMeteo;
    
    // Icone emoji per diverse condizioni
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
