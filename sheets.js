let listas;
let productByList = {};
const cl = console.log.bind(console);

//Obtener la lista
async function getListas() {
  let response;
  try {
		// Fetch
    response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: "1CZLpqGFtfUQYrNHiVeW5p1lwuZjYD3rC8h3PSoRQpYM", //lista con precio id del url
      range: "lista con precio!A:Q", //Rango de la hoja en cuestion
    });
  } catch (err) {
    console.error(err); //mostrar si hay errores
    return;
  }
  const range = response.result; //procede respusta
  if (!range || !range.values || range.values.length == 0) {//si la respuesta tiene un valor
    console.warn("No se encontraron valores"); // o no encontro valor
    return;
  } //range es mi respuesta con los datos de la hoja
console.log(range.values)


  listas = [];//Array vacio para llenarla con la data especifica

  //interar dentro de la sheet conectada y escoger las columnas necesarias
	listas = range.values.slice(1).map(fila => ({
    Producto: fila[0],
    ListadePrecio: fila[1],
    concat: fila[2],
    Precio: fila[3],
    Descuento: fila[7] || '',
    Cantidad: fila[12] || '',
    Productos2: fila[14] || '',
    Listas: fila[16] || '',
  })).filter(item => item.Producto && item.ListadePrecio);
		//coalescencia de nulos o fallback value si una fila es undefined, null o una cadena vacia se usara {una cadena vacia} como valor predeterminado


    //Una vez conectado el sheet necesito cargar la data principal listas y descuentos
		productByList = {};
		listas.forEach(item => {
			if(!productByList[item.ListadePrecio]) {
				productByList[item.ListadePrecio] = new Set();
			}
			productByList[item.ListadePrecio].add(item.Producto);
		})

    //Despues que carga el sheet llamo a la funcion populateSelect para que llene los select principales con las listas y los descuentos
    const selectList = document.getElementById('lista')
    //populateQuantity(400);
		populateSelect(selectList, listas, 'Listas');
		//populateSelect(document.getElementById('descuento'), listas, 'Descuento');
    
    //utimo cambio prueba
    selectList.addEventListener("change", () => {
      const rows = document.querySelectorAll('.input-row');
      rows.forEach((row, index) => {
        populateProductsForList(index);
      populateSelect(document.getElementById('descuento'), listas, 'Descuento')
    });
    });
    updateCss()
    initializeRows(5);// Inicializa 5 filas, puedes ajustar este número
    
    //selectList.addEventListener("change", populateProductsForList);(importante)
	
    //retorno las listas array para poder usarlo
	return listas;
};


//Funcion para modificar a mayuscualas la primera letra de un valor
function capitalizadList(value) {
  const capitalizad = value.charAt(0).toUpperCase() + value.slice(1)
  return capitalizad
}

//Funcion para llenar los selects 
function populateSelect(selectElement, data, ispropertyName = true){
  if(!selectElement) return; //Asegurar q el selectEment exista antes de tratar de de accesar al valor.
  const currentValue = selectElement.value;
	selectElement.innerHTML = '<option value="">Seleccionar</option>';
	const values = ispropertyName ? [...new Set(data.map(item => item[ispropertyName]))] : data;
	values.forEach((value) => {
		if(value && value.trim() !== ''){
			const optionElement = document.createElement('option');
			optionElement.value = value;//valor que va a tomar el select cuando se clickee
			optionElement.textContent = value;//los valores de la columna
			selectElement.appendChild(optionElement);
		}
	});

  //Este if comprobara que se selecciono un valor en elemento producto y si es asi no lo cambiara cuando se seleccione una lista nueva, esto es cn el fin de que cambie el precio por listas y no se quite el producto actual siempre y cuando exista en concat
  if(currentValue && values.includes(currentValue)){
    selectElement.value = currentValue;
  } 
}

//Funcion para llenar los productos por lista
function populateProductsForList(rowIndex) {
  const selectedList = document.getElementById("lista").value;
  // const selectProduct = document.getElementById("productos");
  const selectProduct = document.getElementById(`productos-${rowIndex}`);
  
  if(!selectedList || !selectProduct) return;
  
  const currentProduct = selectProduct.value;
  
  const productsForList = listas.filter(item => item.ListadePrecio === capitalizadList(selectedList)).map(item => item.Producto);

  
  const uniqueProducts = [...new Set(productsForList)];
  //console.log('Unique Products:', uniqueProducts);
  populateSelect(selectProduct, uniqueProducts, false);

  if(uniqueProducts.includes(currentProduct)) {
    selectProduct.value = currentProduct;
  }

  handleSelection(rowIndex);
  
}

function populateQuantity(quantitySelect,maxQuantity) {
  //const quantitySelect = document.getElementById('cantidad');
  const options = Array.from({length: maxQuantity}, (_, i) => i + 1)

  options.forEach(value => {
    const optionElement = document.createElement('option');
    optionElement.value = value;
    optionElement.textContent = value;
    quantitySelect.appendChild(optionElement);
  })
}


//Funcion que une las columnas Listas con Productos y resuelve mediante la funcion filterprice a displayPrice cuando encuentra un match con concatValue
function handleSelection(rowIndex) {
  updateCss()
  const selectedList = document.getElementById('lista').value
  // const selectedProduct = document.getElementById('productos').value
  // const selectDiscount = document.getElementById('descuento').value
  const selectedProduct = document.getElementById(`productos-${rowIndex}`).value;
  const selectDiscount = document.getElementById(`descuento-${rowIndex}`).value;
 
  
  cl(`Row ${rowIndex}: List: ${selectedList}, Product: ${selectedProduct}, Discount: ${selectDiscount}`);
  
  if (!selectedList || !selectedProduct){
    displayPrice("", rowIndex);
    dispalyedPrecioTotal("", rowIndex);
    displayDiscountedPrice("", rowIndex);
    if(!selectedProduct){
      selectDiscount.value = "";
      selectDiscount.innerHTML = '<optionvalue="">Seleccione</optionvalue=>';
    }
    return
  };//si la selecciono esta en blanco se resetean las tres displays

  if(selectedProduct !== "") {
    const concatValue = selectedProduct + capitalizadList(selectedList);
    cl(concatValue)
    const filteredPrice = filterPrice(concatValue);
    cl(filteredPrice)
    const basePrice = parseArgentinePrice(filteredPrice)
    cl(basePrice)
    
    displayPrice(formatPrice(basePrice), rowIndex);
    
    const totalPrice = unitaryPrice(basePrice, rowIndex);
    cl(totalPrice)
    dispalyedPrecioTotal(totalPrice, rowIndex);
    

    if(selectDiscount !== ""){
      const discountPercentage = parseFloat(selectDiscount);//parseFloat convierte el valor string que llega del html y lo convierte en un numero de punto flotante q maneja numeros decimales que vienen desde un elemento input
      const discountedPrice = CalculateDiscountPrice(basePrice, discountPercentage);
      const priceformatted = formatPrice(discountedPrice);

      displayDiscountedPrice(priceformatted, rowIndex);
      dispalyedPrecioTotal(unitaryPrice(discountedPrice, rowIndex), rowIndex);
      
    } else {
      displayDiscountedPrice("", rowIndex);
      dispalyedPrecioTotal(totalPrice, rowIndex);
    } 
    updateTotals()
  } else {
    displayPrice("", rowIndex);
    displayDescuento(rowIndex)
    displayDiscountedPrice("", rowIndex)
    dispalyedPrecioTotal("", rowIndex)
    
    
  }
}

//Convierte una cadena con formato texto a un formato numerico entendible para javascript
function parseArgentinePrice(priceString) {
  return Number(priceString.replace(/\./g, '').replace(',', '.'));
  /*
priceString.replace(/./g, '') elimina todos los puntos (.) de la cadena. El /./g es una expresión regular que coincide con todas las apariciones de un punto.

.replace(',', '.') luego reemplaza la coma por un punto. Esto convierte el separador decimal del formato argentino (coma) al formato que JavaScript entiende (punto).

Number(...) convierte la cadena resultante en un número de JavaScript.
  */
}



function formatPrice(price){
  cl('formatPricefunction', price)
  const numPrice = typeof price === 'string' ? parseArgentinePrice(price) : price;
  cl('tipo de precio',numPrice)
  return new Intl.NumberFormat('es-AR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numPrice);
}


//Funcion para encontrar el precio donde concat sea igual a la concatencion ProductoLista
function filterPrice(concatValue){
  const filteredSeek = listas.find(item => item.concat === concatValue)
  cl('filterPrice',filteredSeek)
  cl('formateando en filterprice', formatPrice(filteredSeek.Precio))
  return filteredSeek === "" ? 'Precio no encontrado 💸' : formatPrice(filteredSeek.Precio)
}

const CalculateDiscountPrice = (price, discount) => {
  //const numericPrice = parseFloat(price.replace('.', '').replace(',', '.')) ;
  const discounAmount = price * (discount  / 100);
  return (price - discounAmount);
}

//Funcion que totaliza por cuantos productos
function unitaryPrice(price, rowIndex){
  const quantity = document.getElementById(`cantidad-${rowIndex}`).value

  if(quantity !== "" && quantity !== "Seleccione"){
    const totalPrice = price * parseInt(quantity)
    cl('unitaryprice',price)
    cl('unitaryprice con cantidad',totalPrice)
    return formatPrice(totalPrice)
  } else {
    return formatPrice(price)
  }
}

function displayDiscountedPrice(price, rowIndex) {
  const discountedPriceElement = document.getElementById(`preciocdes-${rowIndex}`);
  discountedPriceElement.innerHTML = "";
  discountedPriceElement.value = price ? price : "";
}
function displayDescuento(rowIndex){
  const descuentoElement = document.getElementById(`descuento-${rowIndex}`);
  if(descuentoElement){
    descuentoElement.innerHTML = "";
    descuentoElement.value = "";
  }
}

//Funcioin para mostrar el precio que corresponde con concat
function displayPrice(price, rowIndex) {
  const priceElement = document.getElementById(`precio-${rowIndex}`);
  priceElement.innerHTML = "";
  priceElement.value = price;
}
function dispalyedPrecioTotal(price, rowIndex){
  const precioTotalElement = document.getElementById(`preciototal-${rowIndex}`);
  precioTotalElement.innerHTML = "";
  precioTotalElement.value = price;
}

function createRow(rowIndex){
  const row = document.createElement('div');
  row.className = 'input-row tables-row';
  row.innerHTML = `
    <select id="cantidad-${rowIndex}" class='cantidad'>
      <option value ="">Seleccionar</option>
    </select>
    <select id="productos-${rowIndex}" class='productos'>
      <option value ="">Seleccionar</option>
    </select>
    <input type='text' id="precio-${rowIndex}" class='precio' readonly>
    </input>
    <select id="descuento-${rowIndex}" class='descuento'>
      <option value ="">Seleccionar</option>
    </select>
    <input type='text' id="preciocdes-${rowIndex}" class='preciocdes' readonly>
    </input>
    <input type='text' id="preciototal-${rowIndex}" class='preciototal' readonly>
    </input>
  `;
  return row;
}

function createTotalsRow() {
  const totalsRow = document.createElement('div');
  totalsRow.className = 'input-row';
  totalsRow.innerHTML = `
        <div class="total-column">
      <label for="cantidadTotal">Cantidad Total</label>
      <input type="text" id="cantidadTotal" class="cantidadTotal" readonly>
    </div>
    <div class="total-column">
      <label for="precioListaTotal">Precio Lista Total</label>
      <input type="text" id="precioListaTotal" class="precioListaTotal" readonly>
    </div>
    <div class="total-column">
      <label for="precioCDescuentoTotal">Precio C/Descuento</label>
      <input type="text" id="precioCDescuentoTotal" class="precioCDescuentoTotal" readonly>
    </div>
    <div class="total-column">
      <label for="TOTAL">TOTAL</label>
      <input type="text" id="TOTAL" class="TOTAL" readonly>
    </div>
  `;
  return totalsRow;
}

function initializeRows(numRows){
  const container = document.getElementById('prime-table');
  if(!container){
    console.error("Container 'prime-table' not found");
      return;
  }
  for(let i = 0; i < numRows; i++) {
    const row = createRow(i);
    container.appendChild(row);
    populateQuantity(document.getElementById(`cantidad-${i}`), 400);
    populateSelect(document.getElementById(`descuento-${i}`), listas, 'Descuento');
    document.getElementById(`productos-${i}`).addEventListener('change', () => handleSelection(i));
    document.getElementById(`descuento-${i}`).addEventListener('change', () => handleSelection(i));
    document.getElementById(`cantidad-${i}`).addEventListener('change', () => handleSelection(i));

  }

  const totalsRow = createTotalsRow();
  container.appendChild(totalsRow);
}

function updateTotals() {
  let cantidadTotal = 0;
  let precioListaTotal = 0;
  let precioCDescuentoTotal = 0;
  let TOTAL = 0;

  const rows = document.querySelectorAll('.input-row:not(.totals-row)');
  rows.forEach((row, index) => {
    const cantidadElement = document.getElementById(`cantidad-${index}`);
    const precioElement = document.getElementById(`precio-${index}`);
    const precioCDesElement = document.getElementById(`preciocdes-${index}`);
    const precioTotalElement = document.getElementById(`preciototal-${index}`);

    if (cantidadElement && precioElement && precioCDesElement && precioTotalElement) {
      const cantidad = parseInt(cantidadElement.value) || 0;
      const precio = parseArgentinePrice(precioElement.value) || 0;
      const precioCDescuento = parseArgentinePrice(precioCDesElement.value) || 0;
      const precioTotal = parseArgentinePrice(precioTotalElement.value) || 0;

      cantidadTotal += cantidad;
      precioListaTotal += precio * cantidad;
      precioCDescuentoTotal += precioCDescuento * cantidad;
      TOTAL += precioTotal;
    }
  });

  const updateElement = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.value = value;
  };

  updateElement('cantidadTotal', cantidadTotal);
  updateElement('precioListaTotal', formatPrice(precioListaTotal));
  updateElement('precioCDescuentoTotal', formatPrice(precioCDescuentoTotal));
  updateElement('TOTAL', formatPrice(TOTAL));
}

//Resetea el elemento productos y precio si una nueva lista se escoge
function initializeEventListeners() {
  const listaSelect = document.getElementById('lista')
  const productSelect = document.getElementById('productos')
  const descuentoSelect = document.getElementById('descuento')
  const cantidad = document.getElementById('cantidad')


  // listaSelect.addEventListener('change', function() {
  //   if(productSelect.value === ""){
  //     productSelect.innerHTML = '<option value ="">Seleccione un tipo</option>';
  //     displayPrice("Seleccione un Producto")
  //   } else {
  //     handleSelection();
  //   }
  //   populateProductsForList()
  // });

  listaSelect.addEventListener('change', function() {
    document.querySelectorAll('.input-row').forEach((row, index) => {
      populateProductsForList(index);
    });
  });

  productSelect.addEventListener("change", handleSelection(0));
  descuentoSelect.addEventListener('change', handleSelection(0));
  cantidad.addEventListener('change', handleSelection(0))
};

initializeEventListeners();

async function updateCss(){
  const selectLista = document.getElementById('lista');

  if(selectLista.value === ""){
    selectLista.style.borderColor = "red";
  } else {
    selectLista.style.borderColor = "#33e333";  }

 
}

const selectLista = document.getElementById('lista');  
selectLista.addEventListener("change", updateCss);
