// Variabili globali
let tuttiIComuni = [];
let mappa;
let markerLayer = L.layerGroup();
let comuniProvincia = [];

// Inizializza tutto quando la pagina è pronta
document.addEventListener('DOMContentLoaded', function() {
    // 1. Inizializza la mappa
    mappa = L.map('map').setView([42.5, 12.5], 6);
    
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mappa);
    
    markerLayer.addTo(mappa);
    
    // 2. Carica i comuni
    caricaComuni();
    
    // 3. Imposta event listener per le select
    document.getElementById('selectRegione').addEventListener('change', aggiornaProvince);
    document.getElementById('selectProvincia').addEventListener('change', aggiornaMappa);
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
    
    // Reset
    selectProvincia.innerHTML = '<option value="">Seleziona una provincia...</option>';
    comuniProvincia = [];
    markerLayer.clearLayers();
    
    if (!regioneSelezionata) return;
    
    // Filtra comuni per regione
    const comuniRegione = tuttiIComuni.filter(
        comune => comune.regione.nome === regioneSelezionata
    );
    
    // Estrai province (nome)
    const province = [...new Set(comuniRegione.map(comune => comune.provincia.nome))];
    
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

// Aggiorna la mappa quando cambia la provincia
async function aggiornaMappa() {
    const provinciaSelezionata = document.getElementById('selectProvincia').value;
    
    if (!provinciaSelezionata) return;
    
    // Filtra comuni per provincia
    comuniProvincia = tuttiIComuni.filter(
        comune => comune.provincia.nome === provinciaSelezionata
    );
    
    // Pulisci marker precedenti
    markerLayer.clearLayers();
    
    // Aggiungi marker per ogni comune
    const bounds = L.latLngBounds([]);
    
    for (const comune of comuniProvincia) {
        // Ottieni latitudine e longitudine
        const coordinate = await getCoordinateComune(comune);
        
        if (coordinate) {
            // Crea marker
            const marker = L.marker([coordinate.lat, coordinate.lng]);
            
            // Popup base
            const popupContent = `
                <div style="text-align: center;">
                    <strong>${comune.nome}</strong><br>
                    Provincia: ${comune.provincia.sigla}<br>
                    <a href="dettaglio.html?nome=${encodeURIComponent(comune.nome)}&lat=${coordinate.lat}&lon=${coordinate.lng}">
                        Dettaglio meteo
                    </a>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            marker.addTo(markerLayer);
            
            // Espandi bounds per fitBounds
            bounds.extend([coordinate.lat, coordinate.lng]);
        }
    }
    
    // Adatta la vista a tutti i marker
    if (bounds.isValid()) {
        mappa.fitBounds(bounds, { padding: [50, 50] });
    }
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
                lng: data.results[0].longitude
            };
        }
    } catch (error) {
        console.error(`Errore coordinate per ${comune.nome}:`, error);
    }
    return null;
}