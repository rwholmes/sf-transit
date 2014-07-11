var express = require('express');
var app = express();

var port = process.env.PORT || 3000;

app.listen(port);

console.log('Server is now listening on ' + port);

app.use(express.static(__dirname));
