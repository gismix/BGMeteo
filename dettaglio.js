/* 
 * Al caricamento della pagina vengono create delle variabili per la lettura dei parametri della URL
 * Successivamente viene aggiornato il titolo dopo opportuna verifica e viene chiamata la API del meteo
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
            <div style="text-align: center; padding: 40px; color: #e74c3c;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px;"></i>
                <h3>Errore nel caricamento dei dati meteo</h3>
                <p>Impossibile recuperare le informazioni meteo per ${nomeComune}.</p>
                <p>Verifica la connessione internet e riprova.</p>
                <a href="index.html" class="back-link" style="margin-top: 20px;">
                    <i class="fas fa-arrow-left"></i> Torna alla mappa
                </a>
            </div>
        `;
    }
});

/* 
 * Questa funzione richiama l'API di Open-meteo per ottenere un JSON contenente le 
 * informazioni meteo di una latitudine e longitudine specificata
 */
async function getMeteoData(lat, lon) {
    const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,weather_code,relative_humidity_2m,apparent_temperature&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=auto&forecast_days=5`
    );
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

// Mostra dati nella pagina
function mostraDatiMeteo(nomeComune, data) {
    // Verifica che i dati siano validi
    if (!data || !data.current || !data.daily) {
        throw new Error('Dati meteo incompleti');
    }
    
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
        <div style="padding: 20px;">
            <div style="margin-bottom: 20px;">
                <h2 style="color: #2c3e50; margin-bottom: 5px;">${nomeComune}</h2>
                <p style="color: #7f8c8d; font-size: 0.9rem;">${dataOra}</p>
            </div>
            
            <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 30px;">
                <div style="font-size: 64px;">${iconaMeteo}</div>
                <div>
                    <div style="font-size: 48px; font-weight: bold; color: #2c3e50;">
                        ${attuali.temperature_2m}°C
                    </div>
                    <div style="font-size: 1.2rem; color: #3498db; margin-top: 5px;">
                        ${condizioneMeteo}
                    </div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div style="background: #f8fafc; padding: 15px; border-radius: 10px; border-left: 4px solid #3498db;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="font-size: 24px;">💨</div>
                        <div>
                            <div style="font-size: 0.9rem; color: #7f8c8d;">Vento</div>
                            <div style="font-size: 1.2rem; font-weight: bold; color: #2c3e50;">
                                ${attuali.wind_speed_10m} km/h
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="background: #f8fafc; padding: 15px; border-radius: 10px; border-left: 4px solid #1abc9c;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="font-size: 24px;">💧</div>
                        <div>
                            <div style="font-size: 0.9rem; color: #7f8c8d;">Umidità</div>
                            <div style="font-size: 1.2rem; font-weight: bold; color: #2c3e50;">
                                ${attuali.relative_humidity_2m}%
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="background: #f8fafc; padding: 15px; border-radius: 10px; border-left: 4px solid #e74c3c;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="font-size: 24px;">🌡️</div>
                        <div>
                            <div style="font-size: 0.9rem; color: #7f8c8d;">Percepita</div>
                            <div style="font-size: 1.2rem; font-weight: bold; color: #2c3e50;">
                                ${attuali.apparent_temperature}°C
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Previsioni giornaliere (5 giorni)
    const daily = data.daily;
    const tabella = document.getElementById('tabellaPrevisioni').getElementsByTagName('tbody')[0];
    
    // Pulisci la tabella
    tabella.innerHTML = '';
    
    for (let i = 0; i < 5; i++) {
        const row = tabella.insertRow();
        
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
        
        // Crea celle con 
        const cellData = row.insertCell(0);
        const cellCondizione = row.insertCell(1);
        const cellMax = row.insertCell(2);
        const cellMin = row.insertCell(3);
        const cellPrecip = row.insertCell(4);
        
        cellData.innerHTML = `
            <div>
                <strong style="color: #2c3e50;">${dataFormattata.split(',')[0]}</strong><br>
                <span style="font-size: 0.9rem; color: #7f8c8d;">${dataFormattata.split(',')[1]}</span>
            </div>
        `;
        
        cellCondizione.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">${iconaPrevisione}</span>
                <span>${condizionePrevisione}</span>
            </div>
        `;
        
        cellMax.innerHTML = `
            <div style="font-size: 1.2rem; font-weight: bold; color: #e74c3c;">
                ${daily.temperature_2m_max[i]}°
            </div>
        `;
        
        cellMin.innerHTML = `
            <div style="font-size: 1.2rem; font-weight: bold; color: #3498db;">
                ${daily.temperature_2m_min[i]}°
            </div>
        `;
        
        cellPrecip.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">🌧️</span>
                <span style="font-weight: bold; color: #2980b9;">${daily.precipitation_sum[i]} mm</span>
            </div>
        `;
    }
}

/*
 * Funzione che permette di trasformare il codice del meteo in descrizione testuale
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
 * Funzione analoga al main.js che converte il codice meteo in icona
 *  usa il parametro codiceMeteo invece di 'meteo.codiceMeteo'
 */
function getIconaMeteo(codiceMeteo) {
    if (codiceMeteo === undefined || codiceMeteo === null) return '☀️';
    
    //  usa il parametro 'codiceMeteo' direttamente
    const codice = codiceMeteo;
    
    // Gestione Icone
    if (codice === 0 || codice === 1) return '☀️';
    if (codice === 2) return '⛅';
    if (codice === 3) return '☁️';
    if (codice >= 45 && codice <= 48) return '🌫️';
    if (codice >= 51 && codice <= 67) return '🌧️';
    if (codice >= 71 && codice <= 77) return '❄️';
    if (codice >= 80 && codice <= 81) return '🌦️';
    if (codice >= 85 && codice <= 86) return '<img src="./src/img/icons/nevischio.png" alt="nevischio" style="width: 32px; height: 32px;">';
    if (codice == 95 || codice == 82) return '⛈️';
    if (codice >= 96 && codice <= 99) return '<img src="./src/img/icons/nevischio.png" alt="grandine" style="width: 32px; height: 32px;">';
    
    return '☀️';
}