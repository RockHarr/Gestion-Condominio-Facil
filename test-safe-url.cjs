const { getSafeUrl } = require('./lib/sanitize.ts');
console.log(getSafeUrl('javascript:alert(1)'));
