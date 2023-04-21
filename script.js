function insertRow(a, b, body) {
  let newRow = body.insertRow();
  let cellA = newRow.insertCell();
  let cellB = newRow.insertCell();

  cellA.textContent = a;
  cellB.textContent = b;
}

function parseCSV(rows) {
  let counts = {};

  for (let row of rows) {
    let sku = row["Lineitem sku"];
    let quantity = parseInt(row["Lineitem quantity"]);

    if (counts.hasOwnProperty(sku)) {
      counts[sku] += quantity;
    } else {
      counts[sku] = quantity;
    }
  }
  return counts;
}

function generateReport(counts) {
  const skus = Object.keys(counts);
  const get = (id) => document.getElementById(id);

  // All - Group by SKU
  skus.forEach((sku) => insertRow(sku, counts[sku], get("allBody")));

  // Only Bites
  skus
    .filter((sku) => sku.includes("Bites"))
    .forEach((sku) => insertRow(sku, counts[sku], get("bitesBody")));

  // Only Special
  const specialRegex = /(Broth|Jerky|SMELT|Duck Neck|Special)/i;
  skus
    .filter((sku) => specialRegex.test(sku))
    .forEach((sku) => insertRow(sku, counts[sku], get("specialBody")));

  // Just Cat
  skus
    .filter((sku) => sku.startsWith("JC "))
    .forEach((sku) => insertRow(sku, counts[sku], get("justCatBody")));
}

function init(csvContent) {
  const counts = parseCSV(csvContent.data);
  generateReport(counts);
}

function readFile(event) {
  let reader = new FileReader();

  reader.onload = function () {
    Papa.parse(this.result, {
      header: true,
      complete: init,
    });
  };

  reader.readAsText(event.target.files[0]);
}

document.getElementById("inputfile").addEventListener("change", readFile);
