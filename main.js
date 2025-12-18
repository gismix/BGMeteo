

const url_comuni = "https://raw.githubusercontent.com/matteocontrini/comuni-json/master/comuni.json"
output.textContent = "Stiamo caricando i Comuni"


function load_comuni(url_comuni){
    fetch(url_comuni).then(promise => promise.json()).then(lista_comuni => {

        output.textContent = 
            "Numero totale di comuni: " + lista_comuni.length +"\n"+"Apri la console per vederli tutti. "+"\n\n"
            + "Primi 5 comuni:\n"
            + lista_comuni.slice(0, 5).map(c => "- " + c.nome).join("\n");
            console.log("Array dei comuni italiani")
            console.log(lista_comuni)
            
            //selezione provincie
            document.addEventListener("DOMContentLoaded", function(){
                for (let i=0; i<lista_comuni.length; i++){
                    const option = document.createElement("option");
                    option.value = lista_comuni[i].value;
                    option.innerHTML = lista_comuni[i].text;
                    aeroportoPartenzaSelect.append(option);
                }
            });
    })
    .catch(err => {
        output.textContent = "Errore nel caricamento dei comuni.\n" + err;
    });
}

load_comuni(url_comuni)
