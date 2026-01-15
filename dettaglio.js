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
    document.getElementById('titoloComune').textContent = `Dettaglio meteo: ${nomeComune}`;
    
    // Chiama API meteo
    try {
        const meteoData = await getMeteoData(lat, lon);
        mostraDatiMeteo(meteoData);
    } catch (error) {
        console.error('Errore nel caricamento dei dati meteo:', error);
        document.getElementById('datiAttuali').innerHTML = '<p>Errore nel caricamento dei dati meteo</p>';
    }
});

// Ottieni dati meteo da Open-Meteo
async function getMeteoData(lat, lon) {
    const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
    );
    return await response.json();
}

// Mostra dati nella pagina
function mostraDatiMeteo(data) {
    // Dati attuali
    const attuali = data.current;
    const datiAttualiDiv = document.getElementById('datiAttuali');
    
    const dataOra = new Date(attuali.time).toLocaleString('it-IT');
    
    datiAttualiDiv.innerHTML = `
        <p><strong>Temperatura:</strong> ${attuali.temperature_2m} °C</p>
        <p><strong>Vento:</strong> ${attuali.wind_speed_10m} km/h</p>
        <p><strong>Ora rilevazione:</strong> ${dataOra}</p>
    `;
    
    // Previsioni giornaliere (5 giorni)
    const daily = data.daily;
    const tabella = document.getElementById('tabellaPrevisioni').getElementsByTagName('tbody')[0];
    
    for (let i = 0; i < 5; i++) {
        const row = tabella.insertRow();
        
        // Data formattata
        const dataGiorno = new Date(daily.time[i]);
        const dataFormattata = dataGiorno.toLocaleDateString('it-IT', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
        
        // Celle
        const cellData = row.insertCell(0);
        const cellMax = row.insertCell(1);
        const cellMin = row.insertCell(2);
        const cellPrecip = row.insertCell(3);
        
        cellData.textContent = dataFormattata;
        cellMax.textContent = `${daily.temperature_2m_max[i]} °C`;
        cellMin.textContent = `${daily.temperature_2m_min[i]} °C`;
        cellPrecip.textContent = `${daily.precipitation_sum[i]} mm`;
    }
}