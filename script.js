function parseCsv(results) {
  let tallyCounts = {};

  for (let i = 0; i < results.data.length; i++) {
    let row = results.data[i];
    let sku = row["Lineitem sku"];
    let quantity = parseInt(row["Lineitem quantity"]);

    if (tallyCounts.hasOwnProperty(sku)) {
      tallyCounts[sku] += quantity;
    } else {
      tallyCounts[sku] = quantity;
    }
  }

  let tableHtml = `
        <table border="1">
            <tr>
                <th>SKU</th>
                <th>Tally Count</th>
            </tr>
        `;

  for (let sku in tallyCounts) {
    tableHtml += `
                <tr>
                    <td>${sku}</td>
                    <td>${tallyCounts[sku]}</td>
                </tr>
            `;
  }

  tableHtml += `</table>`;

  let output = document.getElementById("output");
  output.innerHTML = tableHtml;
}

document
  .getElementById("inputfile")
  .addEventListener("change", function (event) {
    let file = event.target.files[0];
    let reader = new FileReader();

    reader.onload = function (progressEvent) {
      let csvContent = this.result;

      Papa.parse(csvContent, {
        header: true,
        complete: parseCsv,
      });
    };

    reader.readAsText(file);
  });
