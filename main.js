

const url_comuni = "https://raw.githubusercontent.com/matteocontrini/comuni-json/master/comuni.json"
output.textContent = "Stiamo caricando i Comuni"


const form = document.getElementById("meteoForm")
const lista_comuni = []
const proValues = document.getElementById("cityname") 


document.addEventListener("DOMContentLoaded", function(){
    load_comuni(url_comuni).then(() => {
        for(let i = 0; i < lista_comuni.length; i++){
           
            const provincia = document.createElement("option")
            provincia.value = lista_comuni[i].provincia.nome; // Nome completo visibile
            provincia.setAttribute("data-sigla", lista_comuni[i].sigla)
            //console.log(provincia)
            proValues.appendChild( provincia)
            
        }
        print_comuni(url_comuni) 
    });
});




//028



function load_comuni(url_comuni) {
    return new Promise((resolve, reject) => {
        fetch(url_comuni).then(promise => promise.json()).then(dati => {
            lista_comuni.push(...dati)
            console.log(lista_comuni)
            resolve();
        })
        .catch(err => {
            output.textContent = "Errore nel caricamento dei comuni.\n" + err;
            reject(err);
        });
    });
}
    fetch(url_comuni).then(promise => promise.json()).then(dati => {
        lista_comuni.push(...dati)
        console.log(lista_comuni)
    })
    .catch(err => {
        output.textContent = "Errore nel caricamento dei comuni.\n" + err;
    });


















    

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

