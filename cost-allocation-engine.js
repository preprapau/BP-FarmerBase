<!-- page content -->

<script>
/* ===== COST ALLOCATION ENGINE ===== */
(function () {

  function getActiveProject() {
    const key = localStorage.getItem("activeProject");
    if (!key) return null;
    return {
      key: key,
      data: JSON.parse(localStorage.getItem(key)) || {}
    };
  }

  function getProduction() {
    return JSON.parse(
      localStorage.getItem("PRODUCTION_MASTER")
    ) || [];
  }

  function runCostAllocation() {

    const projectWrap = getActiveProject();
    if (!projectWrap) return;

    const project = projectWrap.data;
    const expenses = project.expenses || [];
    const products = getProduction();

    let allocation = {};

    products.forEach(p => {
      const qty = Number(p.qty) || 0;
      if (qty === 0) return;

      allocation[p.id] = {
        productId: p.id,
        name: p.name,
        qty: qty,
        unit: p.unit || "",
        directCost: 0,
        allocatedCost: 0,
        totalCost: 0,
        unitCost: 0
      };
    });

    const operatingExpenses = expenses.filter(e =>
      e.costType === "operating" &&
      Array.isArray(e.appliesTo) &&
      Number(e.amount) > 0
    );

    operatingExpenses.forEach(e => {
      const amount = Number(e.amount) || 0;

      if (e.appliesTo.includes("all")) {
        const totalQty = Object.values(allocation)
          .reduce((s, p) => s + p.qty, 0);

        Object.values(allocation).forEach(p => {
          const share = totalQty > 0
            ? (p.qty / totalQty) * amount
            : 0;
          p.allocatedCost += share;
        });
      } else {
        const targets = e.appliesTo.filter(id => allocation[id]);
        const targetQty = targets.reduce(
          (s, id) => s + allocation[id].qty, 0
        );

        targets.forEach(id => {
          const p = allocation[id];
          const share = targetQty > 0
            ? (p.qty / targetQty) * amount
            : 0;
          p.directCost += share;
        });
      }
    });

    Object.values(allocation).forEach(p => {
      p.totalCost = p.directCost + p.allocatedCost;
      p.unitCost = p.qty > 0 ? p.totalCost / p.qty : 0;
    });

    project.costAllocation = allocation;
    localStorage.setItem(projectWrap.key, JSON.stringify(project));
  }

  runCostAllocation();
  window.runCostAllocation = runCostAllocation;

})();
</script>
