const { Client } = require('pg');
const client = new Client({
  user: 'postgres.zueccjhzljmidnvnsitd',
  password: 'ERxDEeaWbAoqaH5J',
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres'
});
client.connect().then(() => {
  client.query("SELECT fecha::text FROM ventas WHERE factura = 'FAC-1785112655331'")
    .then(res => { 
      console.log('Quipes raw text:', res.rows[0]);
      client.end(); 
    })
    .catch(err => { console.error(err); client.end(); });
});
