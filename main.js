

const url_comuni = "https://raw.githubusercontent.com/matteocontrini/comuni-json/master/comuni.json"
output.textContent = "Stiamo caricando i Comuni"


const form = document.getElementById("meteoForm")
const lista_comuni = []
const proValues = document.getElementById("listaProvince")
const comValues = document.getElementById("listaComuni")


document.addEventListener("DOMContentLoaded", function(){
    load_comuni(url_comuni).then(() => {
        // Crea un set di province uniche
        const provinceUniche = new Set();
        lista_comuni.forEach(comune => {
            provinceUniche.add(comune.provincia.nome);
        });

        // Ordina le province alfabeticamente e aggiungile al datalist
        const provinceOrdinate = Array.from(provinceUniche).sort((a, b) => a.localeCompare(b));
        provinceOrdinate.forEach(provinciaNome => {
            const provincia = document.createElement("option");
            provincia.value = provinciaNome;
            proValues.appendChild(provincia);
        });
        
        // Aggiungi il listener per l'input della provincia
        const provinciaInput = document.getElementById("provinciaInput");
        provinciaInput.addEventListener("input", function () {
            const provinciaSelezionata = provinciaInput.value;
            aggiornaComuni(provinciaSelezionata);
        });

        // Chiamata iniziale per aggiornare i comuni se c'è già una provincia selezionata
        aggiornaComuni(provinciaInput.value);
    });
});




//028



function load_comuni(url_comuni) {
    return new Promise((resolve, reject) => {
        fetch(url_comuni)
            .then(res => res.json())
            .then(dati => {
                lista_comuni.push(...dati);

                // Rimuovi il loop di deduplicazione che stava eliminando comuni
                // Invece, mantieni tutti i comuni

                console.log(lista_comuni);
                resolve();
            })
            .catch(err => {
                output.textContent = "Errore nel caricamento dei comuni.\n" + err;
                reject(err);
            });
    });
}

function aggiornaComuni(provinciaSelezionata) {
    comValues.innerHTML = ""; // Pulisce la lista dei comuni
    const comuniFiltrati = lista_comuni.filter(comune => comune.provincia.nome === provinciaSelezionata);

    // Ordinamento alfabetico dei comuni filtrati
    comuniFiltrati.sort((a, b) => a.nome.localeCompare(b.nome));

    comuniFiltrati.forEach(comune => {
        const comuneOption = document.createElement("option");
        comuneOption.value = comune.nome;
        comValues.appendChild(comuneOption);
    });
}




function print_comuni(url_comuni){
    fetch(url_comuni).then(promise => promise.json()).then(lista_comuni => {

        output.textContent = 
            "Numero totale di comuni: " + lista_comuni.length +"\n"+"Apri la console per vederli tutti. "+"\n\n"
            + "Primi 5 comuni:\n"
            + lista_comuni.slice(0, 5).map(c => "- " + c.nome).join("\n");
            console.log("Array dei comuni italiani")
            console.log(lista_comuni)
            
            
    })
    .catch(err => {
        output.textContent = "Errore nel caricamento dei comuni.\n" + err;
    });
}

print_comuni(url_comuni)

