function insertRow(a, b, body) {
  let newRow = body.insertRow();
  let cellA = newRow.insertCell();
  let cellB = newRow.insertCell();

  cellA.textContent = a;
  cellB.textContent = b;
}

function clearTable(bodyId) {
  const body = document.getElementById(bodyId);
  body.innerHTML = "";
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

  generateJustCat(skus, counts);
}
function generateJustCat(skus, counts) {
  const variants = [
    "Sampler Pack Raw",
    "Sampler Pack Cooked",
    "16oz Cooked",
    "16oz",
    "24oz",
    "32oz",
  ];

  const sortOrder = [
    "Chicken",
    "Turkey",
    "Venison",
    "Rabbit w/bone",
    "Pork",
    "Beef",
    "Lamb",
    "Duck w/bone",
    "Boneless Rabbit",
  ];

  let justCatData = {};

  skus
    .filter((sku) => sku.startsWith("JC "))
    .forEach((sku) => {
      let product = sku.slice(3); // Remove "JC " prefix
      let variant = "";

      // Find and replace variant from the product string
      const foundVariant = variants.some((v) => {
        if (product.includes(v)) {
          variant = v;
          product = product.replace(v, "").trim();

          // If the variant is "16oz" and the product string contains "raw"
          if (variant === "16oz" && product.includes("raw")) {
            product = product.replace("raw", "").trim();
          }

          return true;
        }
      });
      if (!foundVariant) {
        console.warn("Variant not found in sku: ", sku);
      }

      if (!justCatData[product]) {
        justCatData[product] = {};
      }
      justCatData[product][variant] = counts[sku];
    });

  sortOrder.forEach((product) => {
    if (!justCatData[product]) return;

    const rowData = [product].concat(
      variants.map((variant) => justCatData[product][variant] || "")
    );

    let newRow = document.getElementById("justCatBody").insertRow();
    rowData.forEach((data, index) => {
      let cell = newRow.insertCell(index);
      cell.textContent = data;
    });
  });
}

function init(csvContent) {
  const counts = parseCSV(csvContent.data);
  clearTable("justCatBody");
  clearTable("bitesBody");
  clearTable("specialBody");
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
