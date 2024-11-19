function showSection(section) {
  document.getElementById("letras-section").classList.add("hidden");
  document.getElementById("cartera-letras-section").classList.add("hidden");
  document.getElementById(`${section}-section`).classList.remove("hidden");
}

// Crear letra
document.getElementById("crear-letra-form").addEventListener("submit", async function (event) {
  event.preventDefault();

  const letraData = {
    fechaGiro: { fecha: document.getElementById("fechaGiro").value },
    fechaVencimiento: { fecha: document.getElementById("fechaVencimiento").value },
    valorNominal: { valor: parseFloat(document.getElementById("valorNominal").value) },
    retencion: { valor: parseFloat(document.getElementById("retencion").value) },
    tasa: { valor: parseFloat(document.getElementById("tasa").value) },
    tipoDeTasa: { tipo: document.getElementById("tipoDeTasa").value },
    diasPorAnio: { dias: parseInt(document.getElementById("diasPorAnio").value) },
    plazoDeTasa: { plazo: document.getElementById("plazoDeTasa").value },
    fechaDeDescuento: { fecha: document.getElementById("fechaDeDescuento").value },
    costos: [],
  };

  try {
    const response = await fetch("http://localhost:8080/api/v1/letras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(letraData),
    });

    if (!response.ok) {
      throw new Error(`Error al crear letra: ${response.statusText}`);
    }

    const createdLetra = await response.json();

    const calcResponse = await fetch(`http://localhost:8080/api/v1/calculo-letra/letra/${createdLetra.id}`);
    const calculo = await calcResponse.json();

    const tableBody = document.getElementById("letras-table-body");
    tableBody.innerHTML += `
      <tr>
        <td>${calculo.id}</td>
        <td>${calculo.numeroDiasTranscurridos}</td>
        <td>${(calculo.tasaEfectivaPeriodo * 100).toFixed(2)}%</td>
        <td>${(calculo.tasaDescontadaPeriodo * 100).toFixed(2)}%</td>
        <td>${calculo.descuento.toFixed(2)}</td>
        <td>${createdLetra.retencion.valor}</td>
        <td>${calculo.valorNeto.toFixed(2)}</td>
        <td>${calculo.valorRecibido.toFixed(2)}</td>
        <td>${calculo.valorEntregado.toFixed(2)}</td>
        <td>${(calculo.tcea * 100).toFixed(2)}%</td>
      </tr>
    `;
    document.getElementById("letras-resultados").classList.remove("hidden");
  } catch (error) {
    console.error("Error al procesar la letra:", error.message);
    alert("No se pudo crear la letra. Por favor, inténtalo nuevamente.");
  }
});

// Crear cartera
let currentCarteraId = null;

document.getElementById("crear-cartera").addEventListener("click", async function () {
  try {
    const response = await fetch("http://localhost:8080/api/v1/cartera-letras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`Error al crear cartera: ${response.statusText}`);
    }

    const cartera = await response.json();
    currentCarteraId = cartera.id;

    alert(`Cartera creada con ID: ${currentCarteraId}`);
    document.getElementById("agregar-letra-cartera-form").classList.remove("hidden");
  } catch (error) {
    console.error("Error al crear cartera:", error.message);
    alert("No se pudo crear la cartera.");
  }
});

// Agregar letra a cartera
document.getElementById("agregar-letra-cartera-form").addEventListener("submit", async function (event) {
  event.preventDefault();

  const letraId = document.getElementById("letraId").value;

  try {
    if (!currentCarteraId) {
      throw new Error("No hay una cartera activa. Por favor, crea una cartera primero.");
    }

    await fetch(`http://localhost:8080/api/v1/cartera-letras/${currentCarteraId}/letras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ letraId: parseInt(letraId) }),
    });

    const response = await fetch(`http://localhost:8080/api/v1/calculo-cartera-letras/${currentCarteraId}`);
    const calculoCartera = await response.json();

    const tableBody = document.getElementById("cartera-table-body");
    tableBody.innerHTML = `
      <tr>
        <td>${calculoCartera.id}</td>
        <td>${calculoCartera.valorTotalRecibido.toFixed(2)}</td>
        <td>${(calculoCartera.tceaCartera * 100).toFixed(2)}%</td>
      </tr>
    `;
    document.getElementById("cartera-resultados").style.display = "block";
  } catch (error) {
    console.error("Error al agregar letra a la cartera:", error.message);
    alert("No se pudo agregar la letra a la cartera.");
  }
});

// Arrays para almacenar los costos
const costosIniciales = [];
const costosFinales = [];

// Agregar costos a la tabla correspondiente
function agregarCosto(tipo) {
    const motivoInput = tipo === 'INICIAL' ? 'motivo-inicial' : 'motivo-final';
    const valorInput = tipo === 'INICIAL' ? 'valor-inicial' : 'valor-final';
    const tablaId = tipo === 'INICIAL' ? 'costos-iniciales-tabla' : 'costos-finales-tabla';

    const motivo = document.getElementById(motivoInput).value;
    const valor = parseFloat(document.getElementById(valorInput).value);

    if (motivo && valor > 0) {
        const nuevoCosto = { motivo, monto: { valor }, tipoCosto: tipo };
        if (tipo === 'INICIAL') {
            costosIniciales.push(nuevoCosto);
        } else {
            costosFinales.push(nuevoCosto);
        }

        const tabla = document.getElementById(tablaId).querySelector('tbody');
        const fila = document.createElement('tr');
        fila.innerHTML = `<td>${motivo}</td><td>${valor.toFixed(2)}</td>`;
        tabla.appendChild(fila);

        document.getElementById(motivoInput).value = '';
        document.getElementById(valorInput).value = '';
    }
}

async function crearLetra() {
  const letraData = {
    fechaGiro: { fecha: document.getElementById('fechaGiro').value },
    fechaVencimiento: { fecha: document.getElementById('fechaVencimiento').value },
    valorNominal: { valor: parseFloat(document.getElementById('valorNominal').value) },
    retencion: { valor: parseFloat(document.getElementById('retencion').value) },
    tasa: { valor: parseFloat(document.getElementById('tasa').value) },
    tipoDeTasa: { tipo: document.getElementById('tipoDeTasa').value },
    diasPorAnio: { dias: parseInt(document.getElementById('diasPorAnio').value) },
    plazoDeTasa: { plazo: document.getElementById('plazoDeTasa').value },
    fechaDeDescuento: { fecha: document.getElementById('fechaDeDescuento').value },
    costos: [...costosIniciales, ...costosFinales],
  };

  try {
    console.log("Enviando datos al backend:", letraData);

    const response = await fetch('http://localhost:8080/api/v1/letras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(letraData),
    });

    if (!response.ok) {
      throw new Error(`Error al crear la letra: ${response.status}`);
    }

    const createdLetra = await response.json();
    console.log("Letra creada exitosamente:", createdLetra);

    const calcResponse = await fetch(`http://localhost:8080/api/v1/calculo-letra/letra/${createdLetra.id}`);
    if (!calcResponse.ok) {
      throw new Error(`Error al obtener el cálculo de la letra: ${calcResponse.status}`);
    }

    const calculo = await calcResponse.json();
    console.log("Cálculo recibido del backend:", calculo);

    const tableBody = document.getElementById("letras-table-body");
    if (!tableBody) {
      console.error("No se encontró el elemento letras-table-body en el DOM.");
      return;
    }

    tableBody.innerHTML += `
      <tr>
        <td>${calculo.id}</td>
        <td>${calculo.numeroDiasTranscurridos}</td>
        <td>${(calculo.tasaEfectivaPeriodo * 100).toFixed(2)}%</td>
        <td>${(calculo.tasaDescontadaPeriodo * 100).toFixed(2)}%</td>
        <td>${calculo.descuento.toFixed(2)}</td>
        <td>${createdLetra.retencion.valor}</td>
        <td>${calculo.valorNeto.toFixed(2)}</td>
        <td>${calculo.valorRecibido.toFixed(2)}</td>
        <td>${calculo.valorEntregado.toFixed(2)}</td>
        <td>${(calculo.tcea * 100).toFixed(2)}%</td>
      </tr>
    `;

    document.getElementById("letras-resultados").style.display = "block";
    console.log("Tabla de resultados actualizada y mostrada.");
  } catch (error) {
    console.error("Error en crearLetra:", error.message);
    alert("Ocurrió un error al procesar la letra. Por favor, verifica los datos ingresados.");
  }
}

function redirectTo(page) {
  window.location.href = page;
}
