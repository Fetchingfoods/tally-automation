function insertRow(cells, bodyId) {
  let newRow = document.getElementById(bodyId).insertRow();

  for (let i = 0; i < cells.length; i++) {
    let newCell = newRow.insertCell();
    newCell.textContent = cells[i];
  }
}

function clearTables() {
  const tableBodies = document.getElementsByClassName("table-body");

  for (const body of tableBodies) {
    body.innerHTML = "";
  }
}

function parseCSV(data) {
  const rows = data.reduce((acc, item) => {
    const name = item["Lineitem name"];
    const sku = item["Lineitem sku"];
    const quantity = item["Lineitem quantity"];
    const status = item["Lineitem fulfillment status"];
    const requiresShipping = item["Lineitem requires shipping"];

    // Filter lines
    if (status !== "pending") return acc;
    if (requiresShipping == "false") return acc;

    const typeRegex = /^(JC|OD|PC|Bites)/;
    const proteinRegex =
      /(Chicken|Boneless Rabbit|Rabbit w\/bone|Boneless Rabbit|Rabbit|Buffalo|Wild Boar|Duck w\/bone|Duck|Kangaroo|Lamb|Pork|Turkey|Venison Salmon|Venison|Guinea Hen|Partridge|Pheasant|Quail|Beef|Ostrich|Rex and Rosie|Kanagroo)/i;
    const sizeRegex = /(-?\d+\.?\d*)\s*(?:oz|lb)/;

    const typeMatch = sku.match(typeRegex);
    const proteinMatch = sku.match(proteinRegex);
    const sizeMatch = name.match(sizeRegex);

    const type = typeMatch ? typeMatch[0] : "";
    const size = sizeMatch ? sizeMatch[0] : "";
    const protein = proteinMatch ? proteinMatch[0] : "";
    const isCooked = name.includes("Cooked");
    const existingItemIndex = acc.findIndex(
      (i) => (i.sku && i.sku === sku) || i.name === name
    );

    if (existingItemIndex >= 0) {
      acc[existingItemIndex].count += parseInt(quantity);
    } else {
      acc.push({
        type,
        protein,
        size,
        isCooked,
        count: parseInt(quantity),
        name,
        sku,
      });
    }
    return acc;
  }, []);

  return rows;
}

function generateReports(rows) {
  rows.sort((a, b) => a.sku?.localeCompare(b.sku));

  generateJustCat(rows);
  generateOnlyDog(rows);

  // Premium Cat
  rows
    .filter((r) => r.type === "PC")
    .forEach((r) => insertRow([r.sku, r.count], "premiumCatBody"));

  // Only Bites
  rows
    .filter((r) => r.type === "Bites")
    .forEach((r) => insertRow([r.sku, r.count], "bitesBody"));

  // All rows
  rows.forEach((r) =>
    insertRow(
      [
        r.sku,
        r.type,
        r.protein,
        r.size,
        r.isCooked ? "Cooked" : "Raw",
        // r.name,
        r.count,
      ],
      "productVariantsBody"
    )
  );

  // Exceptions
  rows
    .filter((r) => !r.type)
    .forEach((r) => insertRow([r.sku, r.name, r.count], "exceptionsBody"));

  // All
  rows.forEach((r) => insertRow([r.sku, r.count], "allBody"));
}

function generateCustomTable(rows, variants, proteins, bodyId, warningId) {
  proteins.forEach((protein) => {
    const tableRow = [protein];
    variants.forEach((variant) => {
      let product;
      const index = rows.findIndex(
        (item) =>
          ((variant.sku && item.sku.includes(variant.sku)) ||
            item.size === variant?.size) &&
          item.isCooked === variant.isCooked &&
          item.protein === protein
      );
      if (index !== -1) {
        product = rows.splice(index, 1)[0];
      }
      tableRow.push(product ? product.count : "");
    });
    insertRow(tableRow, bodyId);
  });
  let warning = '';
  if (rows.length) {
    console.warn("Not included in " + bodyId + ":", rows);
    warning = "Not included in the table above:" +
    rows.map((r) => "<br>" + r.sku + " - " + r.count);
  }
  document.getElementById(warningId).innerHTML = warning
}

function generateJustCat(rows) {
  const justCatRows = [...rows.filter((p) => p.type === "JC")];
  const variants = [
    { sku: "Sampler Pack", isCooked: false },
    { sku: "Sampler Pack", isCooked: true },
    { size: "16oz", isCooked: false },
    { size: "16oz", isCooked: true },
    { size: "24oz", isCooked: false },
    { size: "32oz", isCooked: false },
  ];

  const proteins = [
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

  generateCustomTable(
    justCatRows,
    variants,
    proteins,
    "justCatBody",
    "justCatWarning"
  );
}

function generateOnlyDog(rows) {
  const onlyDogRows = rows.filter((p) => p.type === "OD");
  const variants = [
    { sku: "Sampler Pack", isCooked: false },
    { sku: "Sampler Pack", isCooked: true },
    { size: "16oz", isCooked: false },
    { size: "16oz", isCooked: true },
    { size: "24oz", isCooked: false },
    { size: "32oz", isCooked: false },
  ];

  const proteins = [
    "Turkey",
    "Venison",
    "Rabbit",
    "Pork",
    "Beef",
    "Lamb",
    "Duck",
    "Duck w/bone",
    "Wild Boar",
    "Buffalo",
    "Venison Salmon",
    "Rex and Rosie",
  ];
  generateCustomTable(
    onlyDogRows,
    variants,
    proteins,
    "onlyDogBody",
    "onlyDogWarning"
  );
}

function init(csvContent) {
  const rows = parseCSV(csvContent.data);
  clearTables();
  generateReports(rows);
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
