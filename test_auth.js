const http = require('http');

const data = JSON.stringify({
  username: 'ManuelOmar',
  password: 'Bizcochao'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('LOGIN RESPONSE:', res.statusCode, body);
    try {
      const json = JSON.parse(body);
      if (json.data && json.data.access_token) {
        testProductos(json.data.access_token);
      } else {
        console.log("No token found in response", json);
      }
    } catch(e) {
      console.error(e);
    }
  });
});

req.write(data);
req.end();

function testProductos(token) {
  const options2 = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/productos',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const req2 = http.request(options2, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      console.log('PRODUCTOS RESPONSE:', res.statusCode, body);
    });
  });

  req2.end();
}
