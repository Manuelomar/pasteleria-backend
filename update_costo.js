const { Client } = require('pg');

const client = new Client({
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.zueccjhzljmidnvnsitd',
  password: 'ERxDEeaWbAoqaH5J',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();

    // Buscar el producto
    const productRes = await client.query("SELECT id, nombre FROM productos WHERE nombre ILIKE '%Cheesecake de dulce de leche%' LIMIT 1");
    if (productRes.rows.length === 0) {
      console.log("Producto no encontrado");
      return;
    }
    const product = productRes.rows[0];
    console.log("Producto encontrado:", product.nombre, product.id);

    // Actualizar en venta_items
    const updateRes = await client.query(`
      UPDATE venta_items
      SET "precioCosto" = 150
      FROM ventas
      WHERE venta_items."ventaId" = ventas.id
        AND venta_items."productoId" = $1
        AND ventas.fecha >= '2026-08-01'
    `, [product.id]);

    console.log(`Actualizados ${updateRes.rowCount} registros en venta_items.`);

    // Asegurarse de que el producto tiene 150 en su catálogo también
    await client.query(`
      UPDATE productos
      SET "precioCosto" = 150
      WHERE id = $1
    `, [product.id]);

    console.log(`Catálogo actualizado a 150 para el producto.`);

  } catch (err) {
    console.error("Error ejecutando script:", err);
  } finally {
    await client.end();
  }
}

run();
