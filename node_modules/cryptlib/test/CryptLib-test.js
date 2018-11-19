/*global it, describe, require*/

const chai = require('chai'),
    expect = chai.expect,
    cryptLib = require('../src/CryptLib.js');

describe('CryptLib', function() {

  describe('generateRandomIV()', function() {
    const errorMessage = 'cryptLib.generateRandomIV() -> needs length or in wrong format';

    it('no length should throw error', function() {
      try {
        cryptLib.generateRandomIV()
      } catch (message) {
        expect(message).to.equal(errorMessage);
      }
    });

    it('non-numeric and non-whole number length should throw error', function() {
      try{
        cryptLib.generateRandomIV('abc');
      } catch (message) {
        expect(message).to.equal(errorMessage);
      }

      try{
        cryptLib.generateRandomIV('12a');
      } catch (message) {
        expect(message).to.equal(errorMessage);
      }

      try{
        cryptLib.generateRandomIV('12.2');
      } catch (message) {
        expect(message).to.equal(errorMessage);
      }
    });

    it('negative length should throw error', function() {
      try {
        cryptLib.generateRandomIV('-1');
      } catch (message) {
        expect(message).to.equal(errorMessage);
      }
    });

    it('length = 0, should throw error', function() {
      try {
        cryptLib.generateRandomIV(0);
      } catch (message) {
        expect(message).to.equal(errorMessage);
      }

      try {
        cryptLib.generateRandomIV('0');
      } catch (message) {
        expect(message).to.equal(errorMessage);
      }
    });

    it('length = 2', function() {
      const iv = cryptLib.generateRandomIV(2);
      expect(iv).to.have.length(2);
      expect(iv).to.be.string;
    });

    it('length = 100', function() {
      const iv = cryptLib.generateRandomIV(100);
      expect(iv).to.have.length(100);
      expect(iv).to.be.string;
    });
  });

  describe('getHashSha256()', function() {
    const lengthErrorMessage = 'cryptLib.getHashSha256() -> needs length or in wrong format',
        keyErrorMessage = 'cryptLib.getHashSha256() -> needs key',
        validKey = 'key';

    it('no key should throw error', function() {
      try {
        cryptLib.getHashSha256(null,2);
      } catch (message) {
        expect(message).to.equal(keyErrorMessage);
      }
    });

    it('no length should throw error', function() {
      try {
        cryptLib.getHashSha256(validKey, null);
      } catch (message) {
        expect(message).to.equal(lengthErrorMessage);
      }
    });

    it('non-numeric and non-whole number length should throw error', function() {
      try{
        cryptLib.getHashSha256(validKey, 'abc');
      } catch (message) {
        expect(message).to.equal(lengthErrorMessage);
      }

      try{
        cryptLib.getHashSha256(validKey, '12a');
      } catch (message) {
        expect(message).to.equal(lengthErrorMessage);
      }

      try{
        cryptLib.getHashSha256(validKey, '12.2');
      } catch (message) {
        expect(message).to.equal(lengthErrorMessage);
      }
    });

    it('negative length should throw error', function() {
      try {
        cryptLib.getHashSha256(validKey, '-1');
      } catch (message) {
        expect(message).to.equal(lengthErrorMessage);
      }

      try {
        cryptLib.getHashSha256(validKey, -1);
      } catch (message) {
        expect(message).to.equal(lengthErrorMessage);
      }
    });

    it('length = 0, should throw error', function() {
      try {
        cryptLib.getHashSha256(validKey, 0);
      } catch (message) {
        expect(message).to.equal(lengthErrorMessage);
      }

      try {
        cryptLib.getHashSha256(validKey, '0');
      } catch (message) {
        expect(message).to.equal(lengthErrorMessage);
      }
    });

    it('valid key with length = 2', function() {
      const sha = cryptLib.getHashSha256(validKey, 2);
      expect(sha).to.have.length(2);
      expect(sha).to.be.string;
    });

    it('valid key with length = 64', function() {
      const sha = cryptLib.getHashSha256(validKey, 64);
      expect(sha).to.have.length(64);
      expect(sha).to.be.string;
    });

    it('valid key with length = 100 should return 64 char sha', function() {
      const sha = cryptLib.getHashSha256(validKey, 100);
      expect(sha).to.have.length(64);
      expect(sha).to.be.string;
    });
  });

  describe('encrypt() and decrypt() tests', function() {
    const errorMessage = 'cryptLib._encryptDecrypt: -> key and plain or encrypted text required',
        plainText = 'This is the plain text that will be encrypted and decrypted',
        myKey = 'myKey';

    it('encrypt() with no plain text should throw error', function() {
      try {
        cryptLib.encrypt(null, 'key123', 'iv123');
      } catch(error) {
        expect(error).to.equal(errorMessage);
      }
    });

    it('encrypt() with no key should throw error', function() {
      try {
        cryptLib.encrypt(plainText, null, 'iv123');
      } catch(error) {
        expect(error).to.equal(errorMessage);
      }
    });

    it('basic encrypt() decrypt() locally : 0 char iv and 2 char key', function() {
      const iv = '',
          keyHashed = cryptLib.getHashSha256(myKey, 2),
          encryptedText = cryptLib.encrypt(plainText, keyHashed, iv),
          regularText = cryptLib.decrypt(encryptedText, keyHashed, iv);
      expect(regularText).to.equal(plainText);
    });

    it('basic encrypt() decrypt() locally : 2 char iv and 2 char key', function() {
      const iv = cryptLib.generateRandomIV(2),
          keyHashed = cryptLib.getHashSha256(myKey, 2),
          encryptedText = cryptLib.encrypt(plainText, keyHashed, iv),
          decryptedText = cryptLib.decrypt(encryptedText, keyHashed, iv);
      expect(decryptedText).to.equal(plainText);
    });

    it('basic encrypt() decrypt() locally : 16 char iv and 32 char key', function() {
      const iv = cryptLib.generateRandomIV(16),
          keyHashed = cryptLib.getHashSha256(myKey, 32),
          encryptedText = cryptLib.encrypt(plainText, keyHashed, iv),
          decryptedText = cryptLib.decrypt(encryptedText, keyHashed, iv);
      expect(decryptedText).to.equal(plainText);
    });

    it('basic encrypt() decrypt() locally : 20 char iv and 80 char key', function() {
      const iv = cryptLib.generateRandomIV(20),
          keyHashed = cryptLib.getHashSha256(myKey, 80),
          encryptedText = cryptLib.encrypt(plainText, keyHashed, iv),
          decryptedText = cryptLib.decrypt(encryptedText, keyHashed, iv);
      expect(decryptedText).to.equal(plainText);
    });

    it('decrypt 0 char iv and 2 char key generated by c#', function() {
      let cSharpIv = '',
          cSharpKey = 'b1',
          cSharpPlainText = 'C# text that\'s going to be decrypted',
          cSharpCipher = 'M2rfrn9DqNHJe3Hev9nMxKKgIHoqUsc7FJM+tBGxIrl3Wk9UeKIQ5fRUUZF3q2i5',
          nodeDecrpytedText;
      nodeDecrpytedText = cryptLib.decrypt(cSharpCipher, cSharpKey, cSharpIv);
      expect(nodeDecrpytedText).to.equal(cSharpPlainText);
    });

    it('decrypt 2 char iv and 2 char key generated by c#', function() {
      let cSharpIv = 'sA',
          cSharpKey = 'b1',
          cSharpPlainText = 'C# text that\'s going to be decrypted',
          cSharpCipher = '90iAiA80rSiyEoCAnLC9KNYt41koQKs2Lo5NzciyELkoZGne+BAv1ScMXSWETyAL',
          nodeDecrpytedText;
      nodeDecrpytedText = cryptLib.decrypt(cSharpCipher, cSharpKey, cSharpIv);
      expect(nodeDecrpytedText).to.equal(cSharpPlainText);
    });

    it('decrypt 16 char iv and 32 char key generated by c#', function() {
      let cSharpIv = 'HCHXjb_wIURjCV3G',
          cSharpKey = 'b16920894899c7780b5fc7161560a412',
          cSharpPlainText = 'C# text that\'s going to be decrypted',
          cSharpCipher = '0kv/H19UoAN21Et5jSNTM/yKQAaEPiB5Y6qugTQs3kvNuwMLBiOeFwMFnYr9KZBa',
          nodeDecrpytedText;
      nodeDecrpytedText = cryptLib.decrypt(cSharpCipher, cSharpKey, cSharpIv);
      expect(nodeDecrpytedText).to.equal(cSharpPlainText);
    });
  });

  describe('encryptPlainTextWithRandomIV() and decryptCipherTextWithRandomIV() tests', function() {
    const plainText = "this is my plain text";
    const key = "your key";

    it('test with randomIV with Simple string', function () {
      let cipherTest = cryptLib.encryptPlainTextWithRandomIV(plainText, key);
      expect(cryptLib.decryptCipherTextWithRandomIV(cipherTest, key)).to.equal(plainText);
    });

    it('test with randomIV with JSON', function () {
      let cipherText = cryptLib.encryptPlainTextWithRandomIV('{"asdf": "asdf", "dfadsf" : {"asdf": ["asdf", "asdf"], "cdad": true, "asdfd": 22}}'
        , 'simple key');
      expect(cryptLib.decryptCipherTextWithRandomIV(cipherText, 'simple key')).to.equal('{"asdf": "asdf", "dfadsf" : {"asdf": ["asdf", "asdf"], "cdad": true, "asdfd": 22}}')

    });


  });

});

