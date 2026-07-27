const { Pool } = require('pg');

const pool = new Pool({
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.zueccjhzljmidnvnsitd',
  password: 'ERxDEeaWbAoqaH5J',
  database: 'postgres',
});

async function run() {
  try {
    const res = await pool.query('SELECT id, factura, total, subtotal, descuento, impuesto, "estadoPago", "montoPagado", balance, "metodoPago", fecha FROM ventas WHERE fecha >= \'2026-07-26\' AND fecha < \'2026-07-27\'');
    console.log(JSON.stringify(res.rows, null, 2));

    const resItems = await pool.query('SELECT v.factura, i.nombre, i.cantidad, i.precio, i."precioCosto" FROM venta_items i JOIN ventas v ON i."ventaId" = v.id WHERE v.fecha >= \'2026-07-26\' AND v.fecha < \'2026-07-27\'');
    console.log("ITEMS:", JSON.stringify(resItems.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
