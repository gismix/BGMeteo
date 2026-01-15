

const url_comuni = "https://raw.githubusercontent.com/matteocontrini/comuni-json/master/comuni.json"
output.textContent = "Stiamo caricando i Comuni"


const form = document.getElementById("meteoForm")
const lista_comuni = []
const proValues = document.getElementById("listaProvince")
const comValues = document.getElementById("listaComuni")


document.addEventListener("DOMContentLoaded", function(){
    load_comuni(url_comuni).then(() => {
        for(let i = 0; i < lista_comuni.length; i++){
           
            const provincia = document.createElement("option")
            provincia.value = lista_comuni[i].provincia.nome; 
            provincia.setAttribute("data-sigla", lista_comuni[i].sigla)
            //console.log(provincia)
            proValues.appendChild( provincia)
            
        }
        print_comuni(url_comuni) 

        const provinciaInput = document.getElementById("provinciaInput");
        provinciaInput.addEventListener("input", function () {
            const provinciaSelezionata = provinciaInput.value;
            aggiornaComuni(provinciaSelezionata);
        });
    });
});




//028



function load_comuni(url_comuni) {
    return new Promise((resolve, reject) => {
        fetch(url_comuni)
            .then(res => res.json())
            .then(dati => {

                lista_comuni.push(...dati);

                for (let i = 0; i < lista_comuni.length; i++) {
                    for (let j = i + 1; j < lista_comuni.length; j++) {

                        if (lista_comuni[i].provincia.codice === lista_comuni[j].provincia.codice) {
                            lista_comuni.splice(j, 1);
                            j--;
                        }
                    }
                }

                // ordinamento alfabetico province
                lista_comuni.sort((a, b) =>
                    a.provincia.nome.localeCompare(b.provincia.nome)
                );

                console.log(lista_comuni);
                resolve();
            })
            .catch(err => {
                output.textContent = "Errore nel caricamento dei comuni.\n" + err;
                reject(err);
            });
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

//MAPPA 

let map = L.map('map').setView([45.380372, 11.652963], 13);


L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

/*cerchi e cose varie*/
let bastia = L.marker([45.380372, 11.652963]).addTo(map);
var stra = L.circle([45.409659, 12.021065], {
    color: 'pink',
    fillColor: 'pink',
    fillOpacity: 0.5,
    radius: 50
}).addTo(map);