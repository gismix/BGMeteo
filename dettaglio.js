

/* 
 * Al caricamento della pagina vengono create delle varibili per la lettura dei parametri della url
 * Successivamente viene aggiornato il titolo dopo opportuna verifica eviene chiamara la API del meteo per verificare eventuali errori
*/
document.addEventListener('DOMContentLoaded', async function() {
    // Leggi parametri dalla URL
    const urlParams = new URLSearchParams(window.location.search);
    const nomeComune = urlParams.get('nome');
    const lat = urlParams.get('lat');
    const lon = urlParams.get('lon');
    
    if (!nomeComune || !lat || !lon) {
        document.getElementById('titoloComune').textContent = 'Comune non trovato';
        return;
    }
    
    // Aggiorna titolo
    document.getElementById('titoloComune').textContent = `Meteo: ${nomeComune}`;
    
    // Chiama API meteo
    try {
        const meteoData = await getMeteoData(lat, lon);
        mostraDatiMeteo(nomeComune, meteoData);
    } catch (error) {
        console.error('Errore nel caricamento dei dati meteo:', error);
        document.getElementById('datiAttuali').innerHTML = `
            <div class="errore">
                <p>Errore nel caricamento dei dati meteo</p>
                <a href="index.html" class="back-link">← Torna alla mappa</a>
            </div>
        `;
    }
});


/* 
 * Questa funzione richiama l'API di Open-meteo per ottenre un json contenete le 
 *  informazioni meteo di una latitudine e longitudine specificata
*/

async function getMeteoData(lat, lon) {
    const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,weather_code,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=auto`
    );
    return await response.json();
}

// Mostra dati nella pagina
function mostraDatiMeteo(nomeComune, data) {
    // Dati attuali
    const attuali = data.current;
    const datiAttualiDiv = document.getElementById('datiAttuali');
    
    const dataOra = new Date(attuali.time).toLocaleString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Determina condizione meteo e icona
    const condizioneMeteo = getCondizioneMeteo(attuali.weather_code);
    const iconaMeteo = getIconaMeteo(attuali.weather_code);
    
    // Costruisci la sezione meteo attuale
    datiAttualiDiv.innerHTML = `
        <div class="meteo-attuale-card">
            <div class="meteo-header">
                <div class="comune-info">
                    <h2>${nomeComune}</h2>
                    <p class="data-ora">${dataOra}</p>
                </div>
            </div>
            
            <div class="meteo-main">
                <div class="temperatura-section">
                    <div class="icona-temperatura">
                        <span class="icona-grande">${iconaMeteo}</span>
                        <div class="temperatura-valore">
                            <span class="temperatura">${attuali.temperature_2m}°C</span>
                            <span class="condizione">${condizioneMeteo}</span>
                        </div>
                    </div>
                </div>
                
                <div class="meteo-dettagli">
                    <div class="dettaglio-box">
                        <div class="dettaglio-icon">💨</div>
                        <div class="dettaglio-testo">
                            <span class="dettaglio-label">Vento</span>
                            <span class="dettaglio-valore">${attuali.wind_speed_10m} km/h</span>
                        </div>
                    </div>
                    
                    <div class="dettaglio-box">
                        <div class="dettaglio-icon">💧</div>
                        <div class="dettaglio-testo">
                            <span class="dettaglio-label">Umidità</span>
                            <span class="dettaglio-valore">${attuali.relative_humidity_2m}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Previsioni giornaliere (5 giorni)
    const daily = data.daily;
    const tabella = document.getElementById('tabellaPrevisioni').getElementsByTagName('tbody')[0];
    
    for (let i = 0; i < 5; i++) {
        const row = tabella.insertRow();
        row.className = 'previsione-giorno';
        
        // Data formattata
        const dataGiorno = new Date(daily.time[i]);
        const dataFormattata = dataGiorno.toLocaleDateString('it-IT', {
            weekday: 'long',
            day: 'numeric',
            month: 'short'
        });
        
        // Icona per la previsione
        const iconaPrevisione = getIconaMeteo(daily.weather_code[i]);
        const condizionePrevisione = getCondizioneMeteo(daily.weather_code[i]);
        
        // Celle
        const cellData = row.insertCell(0);
        const cellCondizione = row.insertCell(1);
        const cellMax = row.insertCell(2);
        const cellMin = row.insertCell(3);
        const cellPrecip = row.insertCell(4);
        
        cellData.innerHTML = `
            <div class="giorno-data">
                <strong>${dataFormattata.split(',')[0]}</strong><br>
            </div>
        `;
        
        cellCondizione.innerHTML = `
            <div class="condizione-giorno">
                <span class="icona-giorno">${iconaPrevisione}</span>
                <span class="testo-condizione">${condizionePrevisione}</span>
            </div>
        `;
        
        cellMax.innerHTML = `
            <div class="temperatura-cella">
                <span class="temp-max">${daily.temperature_2m_max[i]}°</span>
            </div>
        `;
        
        cellMin.innerHTML = `
            <div class="temperatura-cella">
                <span class="temp-min">${daily.temperature_2m_min[i]}°</span>
            </div>
        `;
        
        cellPrecip.innerHTML = `
            <div class="precipitazioni-cella">
                <span class="precip-icon">🌧️</span>
                <span class="precip-valore">${daily.precipitation_sum[i]} mm</span>
            </div>
        `;
    }
}


/*
 * Funzione che permette di trasformare il codice del meteo in descizione testuale
*/
function getCondizioneMeteo(codiceMeteo) {
    if (codiceMeteo === undefined || codiceMeteo === null) return 'Dati non disponibili';
    
    // Tabella conversione codici
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
    
    return condizioni[codiceMeteo] || 'Condizioni non definite';
}

/*
 * Funzione analoga al main.js che coverte il codice meteo precedenemente ottenuto in icona
*/
function getIconaMeteo(meteo) {
    if (!meteo || !meteo.codiceMeteo) return '☀️';
    
    const codice = meteo.codiceMeteo;
    
    // Gestione Icone
    if (codice === 0 || codice === 1) return '☀️';
    if (codice === 2) return '⛅';
    if (codice === 3) return '☁️';
    if (codice >= 45 && codice <= 48) return '🌫️';
    if (codice >= 51 && codice <= 67) return '🌧️';
    if (codice >= 71 && codice <= 77) return '❄️';
    if (codice >= 80 && codice <= 81) return '🌦️';
    if (codice >= 85 && codice <= 86) return '<img src="./src/img/icons/nevischio.png" alt="nevischio">';
    if (codice == 95 || codice == 82) return '⛈️';
    if (codice >= 96 && codice <= 99) return '<img src="./src/img/icons/nevischio.png" alt="grandine">';
    
    return '☀️';
}