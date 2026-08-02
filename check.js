
const { Client } = require('pg');
const client = new Client({
  user: 'postgres.zueccjhzljmidnvnsitd',
  host: 'aws-1-us-east-1.pooler.supabase.com',
  database: 'postgres',
  password: 'ERxDEeaWbAoqaH5J',
  port: 6543,
  ssl: { rejectUnauthorized: false }
});
client.connect()
  .then(() => client.query('SELECT id, nombre, precio, vendidos, disponible FROM productos WHERE nombre ILIKE \'%cuatro%\''))
  .then(res => {
    console.table(res.rows);
    client.end();
  })
  .catch(err => console.error(err));

