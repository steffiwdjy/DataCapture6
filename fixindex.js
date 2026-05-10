const fs = require('fs');
let code = fs.readFileSync('public/index.html', 'utf8');

code = code.replace(/window\.location\.href = 'https\:\/\/member\.thejarrdin\.com\/login\?from=visitor';/g, "window.location.href = '/login.html'; // window.location.href = 'https://member.thejarrdin.com/login?from=visitor';");
code = code.replace(/window\.location\.href = 'https\:\/\/member\.thejarrdin\.com\/logout';/g, "window.location.href = '/login.html'; // window.location.href = 'https://member.thejarrdin.com/logout';");

fs.writeFileSync('public/index.html', code);
console.log('Replaced in index.html');
