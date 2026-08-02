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
  .then(() => client.query("UPDATE productos SET disponible = false WHERE id IN ('8b23f5f6-ce8e-4fff-91cd-1ee86300bef3', '063913ba-8e94-4bbf-8286-60c1196814a5')"))
  .then(res => {
    console.log('Disabled rows:', res.rowCount);
    client.end();
  })
  .catch(err => console.error(err));
