const config = require('../config')
var CryptoJS = require("crypto-js");
module.exports = {
    async encrypt(text) {
        var crypted = CryptoJS.AES.encrypt(JSON.stringify({ text }), config.cryptoSecret).toString();
        return crypted;
    },
    async decrypt(text) {
        var bytes = CryptoJS.AES.decrypt(text, config.cryptoSecret).toString(CryptoJS.enc.Utf8);
        const info3 = JSON.parse(bytes);
        var originalText = info3.text;
        return originalText;
    }
}

