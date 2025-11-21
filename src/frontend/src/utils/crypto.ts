import CryptoJS from 'crypto-js';

const SECRET_KEY = "e3f3f5b227e39f41899e38f043f54d78399f2097f0a1abdfdbad93c03bb6f521"

export function encrypt<T>(data: T): { iv: string; data: string } {
    const json = JSON.stringify(data);
    const iv = CryptoJS.lib.WordArray.random(16);
    const key = CryptoJS.enc.Hex.parse(SECRET_KEY);
    const encrypted = CryptoJS.AES.encrypt(json, key, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return {
        iv: CryptoJS.enc.Base64.stringify(iv),
        data: encrypted.ciphertext.toString(CryptoJS.enc.Base64)
    };
}

export function decrypt<T>(payload: { iv: string; data: string }): T {
    const key = CryptoJS.enc.Hex.parse(SECRET_KEY);
    const iv = CryptoJS.enc.Base64.parse(payload.iv);
    const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: CryptoJS.enc.Base64.parse(payload.data) } as CryptoJS.lib.CipherParams,
        key,
        {
            iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        }
    );
    return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8)) as T;
}
