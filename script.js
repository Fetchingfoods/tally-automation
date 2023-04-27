const TYPE_REGEX = /^(JC|OD|PC|Bites)/;
const PROTEIN_REGEX =
  /(Chicken|Boneless Rabbit|Rabbit w\/bone|Boneless Rabbit|Rabbit|Buffalo|Wild Boar|Duck w\/bone|Duck|Kangaroo|Lamb|Pork|Turkey|Venison Salmon|Venison|Guinea Hen|Partridge|Pheasant|Quail|Beef|Ostrich|Rex and Rosie|Kanagroo)/i;
const SIZE_REGEX = /(-?\d+\.?\d*)\s*(?:oz|lb)/;

function insertRow(cells, tableId) {
  let table = document.getElementById(tableId);
  let body = table.getElementsByTagName("tbody")[0];
  let newRow = body.insertRow();

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

function parseCSV(data, filters) {
  let totalLinesFiltered = 0;
  const rows = data.reduce((acc, item) => {
    const name = item["Lineitem name"];
    const sku = item["Lineitem sku"];
    const quantity = item["Lineitem quantity"];
    const status = item["Lineitem fulfillment status"];
    const requiresShipping = item["Lineitem requires shipping"];

    // Filter lines
    if (filters.fulfillmentStatusPending && status !== "pending") return acc;
    if (filters.requiresShipping && requiresShipping === "false") return acc;
    if (sku === undefined) return acc;

    totalLinesFiltered++;

    const typeMatch = sku.match(TYPE_REGEX);
    const proteinMatch = sku.match(PROTEIN_REGEX);
    const sizeMatch = name.match(SIZE_REGEX);

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

  document.getElementById("summary").classList.remove("hidden");
  document.getElementById("totalLines").innerHTML = data.length;
  document.getElementById("totalLinesFiltered").innerHTML = totalLinesFiltered;
  document.getElementById("totalUniqueItems").innerHTML = rows.length;

  return rows;
}

function generateReports(rows) {
  rows.sort((a, b) => a.sku?.localeCompare(b.sku));

  generateJustCat(rows);
  generateOnlyDog(rows);

  // Premium Cat
  rows
    .filter((r) => r.type === "PC")
    .forEach((r) => insertRow([r.sku, r.count], "premiumCatTable"));

  // Only Bites
  rows
    .filter((r) => r.type === "Bites")
    .forEach((r) => insertRow([r.sku, r.count], "bitesTable"));

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
      "productVariantsTable"
    )
  );

  // Exceptions
  rows
    .filter((r) => !r.type)
    .forEach((r) => insertRow([r.sku, r.name, r.count], "exceptionsTable"));

  // All
  rows.forEach((r) => insertRow([r.sku, r.count], "allTable"));
}

function generateCustomTable(rows, variants, proteins, tableId, warningId) {
  const tableData = [];
  proteins.forEach((protein) => {
    const tableRow = [];
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
    tableData.push(tableRow);
    insertRow([protein, ...tableRow], tableId);
  });

  let warning = "";
  if (rows.length) {
    console.warn("Not included in " + tableId + ":", rows);
    warning =
      "Not included in the table above:" +
      rows.map((r) => "<br>" + r.sku + " - " + r.count);
  }
  document.getElementById(warningId).innerHTML = warning;
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
    "justCatTable",
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
    "onlyDogTable",
    "onlyDogWarning"
  );
}

function init(csvContent) {
  const load = () => {
    const filters = {
      requiresShipping: document.getElementById("requiresShipping").checked,
      fulfillmentStatusPending: document.getElementById(
        "fulfillmentStatusPending"
      ).checked,
    };
    const rows = parseCSV(csvContent.data, filters);
    clearTables();
    generateReports(rows);
  };

  document.getElementById("requiresShipping").addEventListener("change", load);
  document
    .getElementById("fulfillmentStatusPending")
    .addEventListener("change", load);
  load();
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
document.getElementById("infoButton").addEventListener("click", () => {
  document.getElementById("information").classList.toggle("hidden");
});
