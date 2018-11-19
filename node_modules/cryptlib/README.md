# cryptlib

A module to encrypt/decrypt string in Node, written in ES6.

Using companion framework libraries, you should be able to encrypt/decrypt between node, iOS and Android.

Companion libs can be found here: [Cross Platform AES Encryption](https://github.com/skavinvarnan/Cross-Platform-AES)


## Installation

`npm install @skavinvarnan/cryptlib --save`

## Usage

### Encrypt Decrypt with Random IV
In this mode the library will internally create a random IV while encryption and while decryption it will ignore the initial vector chars. **This will always create a different cipherText for the same plain text and key**

```javascript
const plainText = "this is my plain text";
const key = "your key";

const cryptLib = require('@skavinvarnan/cryptlib');

const cipherText = cryptLib.encryptPlainTextWithRandomIV(plainText, key);
console.log('cipherText %s', cipherText);

const decryptedString = cryptLib.decryptCipherTextWithRandomIV(cipherText, key);
console.log('decryptedString %s', decryptedString);
```

### Basic Encrypt Decrypt

```javascript
const cryptLib = require('@skavinvarnan/cryptlib');
const iv = cryptLib.generateRandomIV(16); //16 bytes = 128 bit
const key = cryptLib.getHashSha256('my secret key', 32); //32 bytes = 256 bits
const cipherText = cryptLib.encrypt('This is the text to be encrypted', key, iv);

console.log(cipherText);

const decryptedString = cryptLib.decrypt(cipherText, key, iv);

console.log(decryptedString);
```


## Run Code Sample

`npm start`

## Tests

`npm test`

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code.


## License

MIT license; see [LICENSE](./LICENSE).

(c) 2018 by Kavin Varnan
