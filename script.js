function parseCsv(results) {
  let counts = {};

  for (let i = 0; i < results.data.length; i++) {
    let row = results.data[i];
    let sku = row["Lineitem sku"];
    let quantity = parseInt(row["Lineitem quantity"]);

    if (counts.hasOwnProperty(sku)) {
      counts[sku] += quantity;
    } else {
      counts[sku] = quantity;
    }
  }

  const insertRow = (a, b, body) => {
    let newRow = body.insertRow();
    let cellA = newRow.insertCell();
    let cellB = newRow.insertCell();

    cellA.textContent = a;
    cellB.textContent = b;
  };

  // All - Group by SKU
  let allBody = document.getElementById("allBody");
  Object.keys(counts).forEach((sku) => insertRow(sku, counts[sku], allBody));

  // Only Bites
  let bitesBody = document.getElementById("bitesBody");
  Object.keys(counts)
    .filter((sku) => sku.includes("Bites"))
    .forEach((sku) => insertRow(sku, counts[sku], bitesBody));

  // Only Special
  let specialBody = document.getElementById("specialBody");
  const specialRegex = /(Broth|Jerky|SMELT|Duck Neck|Special)/i;
  Object.keys(counts)
    .filter((sku) => specialRegex.test(sku))
    .forEach((sku) => insertRow(sku, counts[sku], specialBody));

}

document
  .getElementById("inputfile")
  .addEventListener("change", function (event) {
    let file = event.target.files[0];
    let reader = new FileReader();

    reader.onload = function (e) {
      let csvContent = this.result;

      Papa.parse(csvContent, {
        header: true,
        complete: parseCsv,
      });
    };

    reader.readAsText(file);
  });
