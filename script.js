document.addEventListener('DOMContentLoaded', () => {
  let mapInitialized = false;
  let map, geojsonLayer;
  let municipioData = [];

  const exploreBtn = document.getElementById("exploreBtn");
  const backBtn = document.getElementById("backBtn");
  const citySelectBtn = document.getElementById("citySelectBtn");
  const cityDropdown = document.getElementById("cityDropdown");
  const infoBox = document.getElementById("municipioInfo");

  const format = num => num.toLocaleString("es-ES");

  exploreBtn.addEventListener("click", () => {
    document.getElementById("intro").classList.add("hidden");
    document.getElementById("split-view").classList.remove("hidden");

    if (!mapInitialized) {
      setTimeout(() => {
        map = L.map('map').setView([28.3, -15.5], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        fetch("data/canarias_municipios.geojson")
          .then(res => res.json())
          .then(data => {
            municipioData = data.features.map(f => ({
              name: f.properties.ETIQUETA,
              vehiculos: parseInt(f.properties["VEHICULOS2022Total vehículos"]),
              feature: f
            }));

            const avgVehiculos = Math.round(
              municipioData.reduce((sum, m) => sum + m.vehiculos, 0) / municipioData.length
            );

            const sorted = [...municipioData].sort((a, b) => b.vehiculos - a.vehiculos);
            const chunkSize = Math.floor(sorted.length / 5);

            sorted.forEach((m, i) => {
                if (i < chunkSize) {
                  m.rank = "🚗🚗🚗 ¡Vuestro municipio vive sobre ruedas! (20% más motorizado)";
                } else if (i < chunkSize * 2) {
                  m.rank = "🚗🚗 Bastante motorizado... el coche es vuestro mejor amigo (40% más motorizado)";
                } else if (i < chunkSize * 3) {
                  m.rank = "🚲 En la media, ni tanto ni tan poco. Un equilibrio digno.";
                } else if (i < chunkSize * 4) {
                  m.rank = "🦶🚶 Poco motorizado... parece que os gusta andar o compartir coche (40% menos motorizado)";
                } else {
                  m.rank = "🧘🚶‍♀️ ¡Zen total! ¿Vivís en bici o a lomos de una cabra? (20% menos motorizado)";
                }
              });
              
            municipioData = sorted;

            geojsonLayer = L.geoJSON(data, {
              style: {
                color: "#008060",
                weight: 1,
                fillColor: "#ccece6",
                fillOpacity: 0.5
              },
              onEachFeature: (feature, layer) => {
                if (feature.properties && feature.properties.ETIQUETA) {
                  layer.bindPopup(feature.properties.ETIQUETA);
                }
              }
            }).addTo(map);

            // Poblar selector
            const etiquetas = municipioData.map(m => m.name).sort();
            etiquetas.forEach(name => {
              const option = document.createElement("option");
              option.value = name;
              option.textContent = name;
              cityDropdown.appendChild(option);
            });

            // Evento: selección de municipio
            cityDropdown.addEventListener("change", () => {
              const selected = cityDropdown.value;
              const municipio = municipioData.find(m => m.name === selected);

              geojsonLayer.eachLayer(layer => {
                if (layer.feature.properties.ETIQUETA === selected) {
                  map.fitBounds(layer.getBounds());
                  layer.openPopup();
                }
              });

              // Mostrar texto y mini gráfico
              infoBox.innerHTML = `
              <div class="info-data">
                <p>
                  ¿Sabías que tu <strong>'${municipio.name}'</strong> tiene
                  <strong>${format(municipio.vehiculos)}</strong> coches,
                  frente a los <strong>${format(avgVehiculos)}</strong> de media en Canarias?
                </p>
              </div>
              <div class="info-humor">
                <p>${municipio.rank}</p>
              </div>
              <div class="mini-chart">
                <div class="chart-labels">
                  <span>Más coches</span>
                  <span>Menos coches</span>
                </div>
                <div class="chart-bar">
                  <div class="chart-marker" id="chartMarker"></div>
                </div>
              </div>
            `;                    
              infoBox.classList.remove("hidden");

              // Mover marcador en la mini gráfica
              const index = sorted.findIndex(m => m.name === municipio.name);
              const percentage = index / (sorted.length - 1);
              const marker = document.getElementById("chartMarker");
              marker.style.left = `${percentage * 100}%`;
            });
          });

        mapInitialized = true;
      }, 50);
    }
  });

  backBtn.addEventListener("click", () => {
    document.getElementById("split-view").classList.add("hidden");
    document.getElementById("intro").classList.remove("hidden");
  });

  citySelectBtn.addEventListener("click", () => {
    cityDropdown.classList.remove("hidden");
  });
});
