import forge from 'node-forge';

/**
 * Generates an RSA key pair (2048-bit).
 * This operation is CPU intensive and should ideally be done before showing a blocking UI,
 * or wrapped in a Web Worker if it blocks the main thread noticeably.
 * @returns {Promise<{publicKey: string, privateKey: string}>} PEM formatted keys
 */
export const generateKeyPair = () => {
    return new Promise((resolve, reject) => {
        // Generating a 2048-bit key pair asynchronously
        forge.pki.rsa.generateKeyPair({ bits: 2048, workers: -1 }, (err, keypair) => {
            if (err) {
                return reject(err);
            }
            // Convert keys to PEM format string
            const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
            const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);

            resolve({ publicKey: publicKeyPem, privateKey: privateKeyPem });
        });
    });
};

/**
 * Encrypts a JSON payload using the provided RSA Public Key.
 * Due to RSA payload size limits, we encrypt the data with an AES session key,
 * encrypt the session key with RSA, and return the combined payload.
 * However, since node-forge's RSA encryption can handle tiny payloads, 
 * if the payload is small enough, direct RSA is simpler.
 * For robust voting (with potential long opinions), Hybrid Encryption (RSA + AES) is safer.
 * @param {Object} payload The data to encrypt
 * @param {string} publicKeyPem The RSA public key in PEM format
 * @returns {string} Base64 encoded encrypted string containing both AES key and cipher
 */
export const encryptVote = (payload, publicKeyPem) => {
    try {
        const payloadString = JSON.stringify(payload);

        // 1. Parse Public Key
        const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);

        // 2. Generate a random AES session key (16 bytes = 128 bits) and IV (16 bytes)
        const sessionKey = forge.random.getBytesSync(16);
        const iv = forge.random.getBytesSync(16);

        // 3. Encrypt payload with AES-CBC
        const cipher = forge.cipher.createCipher('AES-CBC', sessionKey);
        cipher.start({ iv: iv });
        cipher.update(forge.util.createBuffer(forge.util.encodeUtf8(payloadString)));
        cipher.finish();
        const encryptedData = cipher.output.getBytes();

        // 4. Encrypt the session key with RSA-OAEP
        const encryptedSessionKey = publicKey.encrypt(sessionKey, 'RSA-OAEP');

        // 5. Combine everything into a single JSON string, base64 encoded for transmission
        const combined = {
            k: forge.util.encode64(encryptedSessionKey),
            i: forge.util.encode64(iv),
            d: forge.util.encode64(encryptedData)
        };

        return forge.util.encode64(JSON.stringify(combined));
    } catch (error) {
        console.error("Encryption failed:", error);
        throw error;
    }
};

/**
 * Decrypts a vote payload using the Admin's RSA Private Key.
 * @param {string} encryptedBase64 The base64 combined encrypted string
 * @param {string} privateKeyPem The RSA private key in PEM format
 * @returns {Object} The parsed original JSON payload
 */
export const decryptVote = (encryptedBase64, privateKeyPem) => {
    try {
        // 1. Decode the combined json
        const combinedJson = forge.util.decode64(encryptedBase64);
        const combined = JSON.parse(combinedJson);

        // 2. Parse Private Key and decode components
        const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
        const encryptedSessionKey = forge.util.decode64(combined.k);
        const iv = forge.util.decode64(combined.i);
        const encryptedData = forge.util.decode64(combined.d);

        // 3. Decrypt the AES session key using RSA-OAEP
        const sessionKey = privateKey.decrypt(encryptedSessionKey, 'RSA-OAEP');

        // 4. Decrypt the payload with AES-CBC
        const decipher = forge.cipher.createDecipher('AES-CBC', sessionKey);
        decipher.start({ iv: iv });
        decipher.update(forge.util.createBuffer(encryptedData));
        const result = decipher.finish();

        if (!result) {
            throw new Error("AES Decryption failed");
        }

        // 5. Return parsed JSON
        const decryptedString = forge.util.decodeUtf8(decipher.output.getBytes());
        return JSON.parse(decryptedString);
    } catch (error) {
        console.error("Decryption failed:", error);
        throw error;
    }
};
