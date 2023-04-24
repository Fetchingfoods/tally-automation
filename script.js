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
  const packs = data.reduce((acc, item) => {
    const name = item["Lineitem name"];
    const sku = item["Lineitem sku"];
    const quantity = item["Lineitem quantity"];
    const status = item["Lineitem fulfillment status"];

    if (!sku || status === "fulfilled") return acc;

    const typeRegex = /(Just Cat|Only Dog|PREMIUM Cat|Bites)/;
    // Review this list or make a parameter
    const proteinRegex =
      /(Chicken|Boneless Rabbit|Rabbit w\/bone|Boneless Rabbit|Rabbit|Buffalo|Wild Boar|Duck w\/bone|Duck|Kangaroo|Lamb|Pork|Turkey|Venison Salmon|Venison|Guinea Hen|Partridge|Pheasant|Quail|Beef|Ostrich|Rex and Rosie|Kanagroo)/i;
    const weightRegex = /(-?\d+\.?\d*)\s*(?:oz|lb)/;

    const typeMatch = name.match(typeRegex);
    const proteinMatch = sku.match(proteinRegex);
    const weightMatch = name.match(weightRegex);

    const type = typeMatch ? typeMatch[0] : "";
    const weight = weightMatch ? weightMatch[0] : "";
    const protein = proteinMatch ? proteinMatch[0] : "";
    const isCooked = name.includes("Cooked");
    const existingItemSku = acc.findIndex((i) => i.sku === sku);

    if (existingItemSku >= 0) {
      acc[existingItemSku].count += parseInt(quantity);
    } else {
      acc.push({
        type,
        protein,
        weight,
        isCooked,
        count: parseInt(quantity),
        name,
        sku,
      });
    }
    return acc;
  }, []);

  return packs;
}

function generateReports(packs) {
  packs.sort((a, b) => a.type?.localeCompare(b.type));

  generateJustCat(packs);
  generateOnlyDog(packs);

  // Premium Cat
  packs
    .filter((p) => p.type === "PREMIUM Cat")
    .forEach((p) => insertRow([p.sku, p.count], "premiumCatBody"));

  // Only Bites
  packs
    .filter((p) => p.type === "Bites")
    .forEach((p) => insertRow([p.sku, p.count], "bitesBody"));

  // Packs
  packs.forEach((p) =>
    insertRow(
      [
        p.type,
        p.protein,
        p.weight,
        p.isCooked ? "Cooked" : "Raw",
        p.sku,
        // p.name,
        p.count,
      ],
      "packsBody"
    )
  );

  // Exceptions
  packs
    .filter((pack) => !pack.type)
    .forEach((pack) => insertRow([pack.sku, pack.count], "exceptionsBody"));

  // All
  packs.forEach((pack) => insertRow([pack.sku, pack.count], "allBody"));

  generateAllByWeight(packs);
}

// TODO is not counting cooked packs
function generateAllByWeight(packs) {
  const weights = Array.from(new Set(packs.map((pack) => pack.weight))).sort(
    (a, b) => parseInt(a) - parseInt(b)
  );

  const types = Array.from(new Set(packs.map((pack) => pack.type)));

  const proteins = Array.from(
    new Set(packs.map((pack) => pack.protein))
  ).sort();

  // Generate header row for the table
  const headerRow = ["Type", "Protein"].concat(weights);
  insertRow(headerRow, "allByWeightBody");

  types.forEach((type) => {
    proteins.forEach((protein) => {
      const row = [type, protein];
      let anyWeight = false;

      weights.forEach((weight) => {
        const pack = packs.find(
          (pack) =>
            pack.weight === weight &&
            pack.type === type &&
            pack.protein === protein
        );

        if (pack) {
          anyWeight = true;
          row.push(pack.count);
        } else {
          row.push("");
        }
      });

      if (anyWeight) {
        insertRow(row, "allByWeightBody");
      }
    });
  });
}

function generateJustCat(packs) {
  const justCatPacks = packs.filter((p) => p.type === "Just Cat");
  const variants = [
    { sku: "Sampler Pack", isCooked: false },
    { sku: "Sampler Pack", isCooked: true },
    { weight: "16oz", isCooked: false },
    { weight: "16oz", isCooked: true },
    { weight: "24oz", isCooked: false },
    { weight: "32oz", isCooked: false },
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
  proteins.forEach((protein) => {
    const row = [protein];
    variants.forEach((variant) => {
      const pack = justCatPacks.find(
        (pack) =>
          ((variant.sku && pack.sku.includes(variant.sku)) ||
            pack.weight === variant?.weight) &&
          pack.isCooked === variant.isCooked &&
          pack.protein === protein
      );

      row.push(pack ? pack.count : "");
    });
    insertRow(row, "justCatBody");
  });
}

function generateOnlyDog(packs) {
  const onlyDogPacks = packs.filter((p) => p.type === "Only Dog");
  const variants = [
    { sku: "Sampler Pack", isCooked: false },
    { sku: "Sampler Pack", isCooked: true },
    { weight: "16oz", isCooked: false },
    { weight: "16oz", isCooked: true },
    { weight: "24oz", isCooked: false },
    { weight: "32oz", isCooked: false },
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
  proteins.forEach((protein) => {
    const row = [protein];
    variants.forEach((variant) => {
      const pack = onlyDogPacks.find(
        (pack) =>
          ((variant.sku && pack.sku.includes(variant.sku)) ||
            pack.weight === variant?.weight) &&
          pack.isCooked === variant.isCooked &&
          pack.protein === protein
      );

      row.push(pack ? pack.count : "");
    });
    insertRow(row, "onlyDogBody");
  });
}

function init(csvContent) {
  const packs = parseCSV(csvContent.data);
  clearTables();
  generateReports(packs);
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
