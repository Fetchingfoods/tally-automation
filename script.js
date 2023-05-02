const TYPE_REGEX = /^(JC|OD|PC|Bites)/;
const PROTEIN_REGEX =
  /(Chicken|Boneless Rabbit|Rabbit w\/bone|Boneless Rabbit|Rabbit|Buffalo|Wild Boar|Duck w\/bone|Duck|Kangaroo|Lamb|Pork|Turkey|Venison Salmon|Venison|Guinea Hen|Partridge|Pheasant|Quail|Beef|Ostrich|Rex and Rosie|Kanagroo)/i;
const SIZE_REGEX = /(\d+\.?\d*)\s*(?:oz|lb)/;
const CUSTOM_REGEX = /(Custom Cat Meal|Custom Dog Meal)(?!.*- Selections$)/;

const getById = (id) => document.getElementById(id);

function insertRow(cells, tableId) {
  let table = getById(tableId);
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
  const customMeals = [];
  const rows = data.reduce((acc, item) => {
    const name = item["Lineitem name"];
    const sku = item["Lineitem sku"];
    const quantity = item["Lineitem quantity"];
    const status = item["Lineitem fulfillment status"];
    const requiresShipping = item["Lineitem requires shipping"];
    const email = item["Email"];
    const orderNumber = item["Name"];
    const shippingName = item["Shipping Name"];

    // Filter lines
    if (filters.fulfillmentStatusPending && status !== "pending") return acc;
    if (filters.requiresShipping && requiresShipping === "false") return acc;
    if (sku === undefined) return acc;

    totalLinesFiltered++;

    const typeMatch = sku.match(TYPE_REGEX);
    const proteinMatch = sku.match(PROTEIN_REGEX);
    const sizeMatch = sku.match(SIZE_REGEX);
    const customMatch = sku.match(CUSTOM_REGEX);

    const type = typeMatch ? typeMatch[0] : "";
    const size = sizeMatch ? sizeMatch[0] : "";
    const protein = proteinMatch ? proteinMatch[0] : "";
    const isCooked = name.includes("Cooked");
    const existingItemIndex = acc.findIndex(
      (i) => (i.sku && i.sku === sku) || i.name === name
    );

    if (customMatch) {
      customMeals.push({
        orderNumber,
        email,
        shippingName,
        name,
        sku,
        quantity,
      });
    } else if (existingItemIndex >= 0) {
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

  const summary = {
    totalLines: data.length,
    totalLinesFiltered,
    totalUniqueItems: rows.length,
  };

  return {
    rows,
    customMeals,
    summary,
  };
}

function generateReports({ rows, customMeals, summary }) {
  rows.sort((a, b) => a.name?.localeCompare(b.name));
  customMeals.sort((a, b) => a.orderNumber?.localeCompare(b.orderNumber));

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

  // Custom Meals
  customMeals.forEach((r) =>
    insertRow(
      [r.orderNumber, r.sku, r.email, r.shippingName, r.quantity],
      "customMealsTable"
    )
  );

  // Exceptions
  rows
    .filter((r) => !r.type)
    .forEach((r) => insertRow([r.sku, r.name, r.count], "exceptionsTable"));

  // All rows with properties
  rows.forEach((r) =>
    insertRow(
      [
        r.sku,
        r.type,
        r.protein,
        r.size,
        r.isCooked ? "Cooked" : "Raw",
        r.name,
        r.count,
      ],
      "productVariantsTable"
    )
  );

  // All rows
  rows.forEach((r) => insertRow([r.sku, r.count], "allTable"));

  generateSummary(summary);
}

function generateSummary(summary) {
  getById("summary").classList.remove("hidden");
  getById("totalLines").innerHTML = summary.totalLines;
  getById("totalLinesFiltered").innerHTML = summary.totalLinesFiltered;
  getById("totalUniqueItems").innerHTML = summary.totalUniqueItems;
}

function generateCustomTable(rows, variants, proteins, tableId, warningId) {
  const tableData = [];
  const itemMatches = (item, variant, protein) =>
    ((variant.sku && item.sku.includes(variant.sku)) ||
      item.size === variant?.size) &&
    item.isCooked === variant.isCooked &&
    item.protein === protein;

  proteins.forEach((protein) => {
    const tableRow = [];
    variants.forEach((variant) => {
      let product;
      const index = rows.findIndex((item) =>
        itemMatches(item, variant, protein)
      );
      if (index !== -1) {
        product = rows.splice(index, 1)[0];
      }
      tableRow.push(product ? product.count : "");
    });
    tableData.push(tableRow);
    insertRow([protein, ...tableRow], tableId);
  });

  // Try to add remaining items that didn't match the protein rows
  const notIncludedItems = rows.filter((item) => {
    const tableRow = [];
    let foundVariant = false;
    variants.forEach((variant) => {
      if (itemMatches(item, variant, item.protein)) {
        foundVariant = true;
        tableRow.push(item.count);
      } else {
        tableRow.push("");
      }
    });
    if (foundVariant) {
      insertRow([item.sku, ...tableRow], tableId);
    }
    return !foundVariant;
  });

  // Show items that didn't match the variant columns
  let message = "";
  if (notIncludedItems.length) {
    message =
      "Not included in the table above:" +
      notIncludedItems.map((r) => "<br>" + r.sku + " - " + r.count);
  }
  getById(warningId).innerHTML = message;
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

let latestCsvContent = null;

function load() {
  if (latestCsvContent) {
    clearTables();
    const filters = {
      requiresShipping: getById("requiresShipping").checked,
      fulfillmentStatusPending: getById("fulfillmentStatusPending").checked,
    };
    const data = parseCSV(latestCsvContent.data, filters);
    generateReports(data);
  }
}

function readFile(event) {
  let reader = new FileReader();

  reader.onload = function () {
    Papa.parse(this.result, {
      header: true,
      complete: (csvContent) => {
        latestCsvContent = csvContent;
        load();
      },
    });
  };

  reader.readAsText(event.target.files[0]);
}

getById("inputfile").addEventListener("change", readFile);
getById("infoButton").addEventListener("click", () => {
  getById("information").classList.toggle("hidden");
});

getById("requiresShipping").addEventListener("change", load);
getById("fulfillmentStatusPending").addEventListener("change", load);
