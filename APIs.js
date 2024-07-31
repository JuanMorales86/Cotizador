//GOOGLE API
const API_KEY = "AIzaSyDRnn3AI0WMUQmw64bWtFBitjxKNcZ3R8M";
//ID DE CLIENTE AUTH 2.0 DE GOOGLE DEVELOPER
const CLIENT_ID =
  "115875065281-tc8o0p1e62ca23trp3jg3nq136sbpet1.apps.googleusercontent.com";
//ID GOOGLESHEET EL LIBRO EN CUENTION
const SHEET_ID =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTA2Zw7K_L0-wrjre23P_BvW9u6FXUWDbeoOsH6s5sCqRL-Qif74xLTWJU2tkzmC_8YbUUTyHixsYdT/pubhtml";

let sheetData = {};

//API Conexion con el libro
fetch(SHEET_ID)//Iniciar solicitud de red para obtener el contenido de la hoja de  google
  .then((response) => response.text())//Convertiri la respuesta en formato de texto
  .then((htmlContent) => {//Procesar el contenido HTML de la hoja
    const parser = new DOMParser();//Crear un nuevo objeto analizador DOM;
    const doc = parser.parseFromString(htmlContent, "text/html");//Analizar el contenido HTML en un documento DOM

    //Buscar la Hoja en cuestion
    const sheetNames = ["lista de productos", "lista con precio"];//Definir nombres de hojas en cuestion

    const sheetTabs = doc.querySelectorAll("#sheet-menu li");//Seleccionar todos los elementos de pestanas de hojas
    const tables = doc.querySelectorAll("table");//Seleccionar todas las tablas en el documento

    sheetTabs.forEach((tab, index) => {//Interacion o bucle sobre cada pestana de hoja(tab)cen el documento. el index nos dala posicion de la pestana
      const sheetName = tab.textContent.trim().toLocaleLowerCase();//Extrae el nombre de la hoja actual, eliminiaespacio al final y al inicio y lo convierte a minusculas ya que el nombre de la hoja esta en minusculas
      if (sheetNames.includes(sheetName)) {//Verificar el nombre de la hoja actual que estan definidas en sheetNames
        const rows = tables[index].getElementsByTagName("tr");//Se crea una entrada en el objeto sheetData para esta hoja, donde la clave es el nombre de la misma

        //Convierte la coleccion de las filas en un array y mapea cada fila
        sheetData[sheetName] = Array.from(rows).map((row) =>
          Array.from(row.getElementsByTagName("td")).map(
            (cell) => cell.textContent) 
        );//Para cada fila, obtine todas las celdas <td>, las convierte en un array, y mapea cada celda a su contenido de texto
      }
    });
    //console.log("data extraida de la hoja:", sheetData);
    //sheetData = sheetData;
    handleSheetData(); //llamar a la funcion para trabajar con la data
  //Ahora se puede trabjar con las hojas
  })
  .catch((error) => console.error("Error", error));//Registrar cualquier error

function handleSheetData() {
  if (Object.keys(sheetData).length === 0) {
    setTimeout(handleSheetData, 100); // volver a chekear en 100ms
    return;
  }
  const selectList = document.getElementById("lista");
  const selectDiscount = document.getElementById("descuento");
  //Tipo de Lista (Lista Generla)
  populateSelect(selectList, sheetData["lista de productos"], 2,1);
  populateSelect(selectDiscount, sheetData["lista de productos"], 4,1);
  //Evento a la espera del cambio en el select
  selectList.addEventListener("change", populateProductsForList);
  selectDiscount.addEventListener("change", selectDiscount);
}

//Rellenar los selects y quitar celdas en blanco o vacias
function populateSelect(selectElement, data, columnIndex, startIndex = 1, isProductList = false) {
  data.slice(startIndex).forEach((option, index) => {
    const value = Array.isArray(option) ? option[columnIndex] : option;
    if ((isProductList || index > 0) && value && value.toString().trim() !== "") {
      //if(index > 1 && option[columnIndex] && option[columnIndex].toString().trim() !== ''){
      const optionElement = document.createElement("option");
      //optionElement.value = option[columnIndex];
      optionElement.value = value;
      optionElement.textContent = value;
      //optionElement.textContent = option[columnIndex];
      selectElement.appendChild(optionElement);
    }
  });
}

function populateProductsForList() {
  const selectedList = document.getElementById("lista").value;
  const capitalizedList =
    selectedList.charAt(0).toUpperCase() + selectedList.slice(1);
  const selectProduct = document.getElementById("productos");
  selectProduct.innerHTML = ""; //Borrar productos existentes
  console.log(capitalizedList);

  const priceList = sheetData["lista con precio"];
  const productsForList = priceList
    .filter((row) => row[1] && row[1].includes(capitalizedList))
    .map((row) => row[0]);

  const uniqueProducts = [...new Set(productsForList)];
  console.log(uniqueProducts);

  populateSelect(selectProduct, uniqueProducts, 0,0, true);

  selectProduct.addEventListener("change", handleSelection);
}


function handleSelection() {
  const selectedList = document.getElementById("lista").value;
  const selectedProduct = document.getElementById("productos").value;

  if (selectedList && selectedProduct) {
    const capitalizedList =
      selectedList.charAt(0).toUpperCase() + selectedList.slice(1);
    const concatValue = selectedProduct + capitalizedList;
    const filteredPrice = filterPrice(concatValue);
    displayPrice(filteredPrice);
    console.log(filteredPrice);
  }
}

function filterPrice(concatValue) {
  if (sheetData["lista con precio"]) {
    const priceList = sheetData["lista con precio"]; //libro
    const filteredSeek = priceList.find((row) => row[2] === concatValue); //busqueda en la columna 2 'concat' del libro con precio.

    return filteredSeek ? filteredSeek[3] : "Precio no encontrado"; //columna 3 'precio del libro con precio.
  }
}

function displayPrice(price) {
  const priceElement = document.getElementById("precio");

  //borrar opcion existente
  priceElement.innerHTML = "";

  //crear y adjuntar la nueva opcion
  const optionElement = document.createElement("option");
  optionElement.value = price;
  optionElement.textContent = price;
  priceElement.appendChild(optionElement);

  //colocar el valor seleccionado
  priceElement.value = price;
}
