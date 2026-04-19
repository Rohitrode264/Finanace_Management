const http = require('http');
http.get('http://localhost:3000/students/count', (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log('count:', data));
});
