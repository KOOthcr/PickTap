const { io } = require('socket.io-client');
const forge = require('node-forge');

/**
 * Load Test Script for PickTap
 * Usage: node load-test.js <roomId> <numVotes>
 */

const roomId = process.argv[2];
const numVotes = parseInt(process.argv[3]) || 50;
const SERVER_URL = 'http://localhost:3000';

if (!roomId) {
    console.error('Please provide a roomId: node load-test.js <roomId> [numVotes]');
    process.exit(1);
}

console.log(`Starting load test for Room: ${roomId} with ${numVotes} votes...`);

// Helper for encryption (copied from client logic)
const encryptVote = (payload, publicKeyPem) => {
    const payloadString = JSON.stringify(payload);
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    const sessionKey = forge.random.getBytesSync(16);
    const iv = forge.random.getBytesSync(16);

    const cipher = forge.cipher.createCipher('AES-CBC', sessionKey);
    cipher.start({ iv: iv });
    cipher.update(forge.util.createBuffer(forge.util.encodeUtf8(payloadString)));
    cipher.finish();
    const encryptedData = cipher.output.getBytes();

    const encryptedSessionKey = publicKey.encrypt(sessionKey, 'RSA-OAEP');

    const combined = {
        k: forge.util.encode64(encryptedSessionKey),
        i: forge.util.encode64(iv),
        d: forge.util.encode64(encryptedData)
    };
    return forge.util.encode64(JSON.stringify(combined));
};

const runTest = async () => {
    // 1. Join as admin to get voter list & public key
    const adminSocket = io(SERVER_URL);

    adminSocket.on('connect', () => {
        console.log('Admin connected. Fetching room data...');
        adminSocket.emit('joinRoom', { roomId, type: 'admin' }, async (res) => {
            if (!res.success) {
                console.error('Failed to join room:', res.message);
                process.exit(1);
            }

            const { publicKey, voters, roomConfig } = res;
            const voterCodes = Object.keys(voters).filter(code => !voters[code].isUsed);
            const candidates = roomConfig.candidates || [];

            console.log(`Initial Setup: ${voterCodes.length} available voters, Public Key retrieved.`);

            if (voterCodes.length < numVotes) {
                console.warn(`Warning: Only ${voterCodes.length} voters available, but requested ${numVotes}. Adjusting.`);
            }

            const targetCount = Math.min(numVotes, voterCodes.length);
            let successCount = 0;
            let failCount = 0;
            let completed = 0;

            console.log(`Simulating ${targetCount} votes...`);

            for (let i = 0; i < targetCount; i++) {
                const voterCode = voterCodes[i];
                const voterSocket = io(SERVER_URL);

                voterSocket.on('connect', () => {
                    const candidateId = candidates[Math.floor(Math.random() * candidates.length)].id;
                    const payload = {
                        candidateId,
                        choices: [{ candidateId, rank: 1 }],
                        opinion: `Load test vote #${i + 1}`,
                        timestamp: Date.now()
                    };

                    const encryptedVote = encryptVote(payload, publicKey);

                    voterSocket.emit('submitVote', { roomId, voterCode, encryptedVote }, (response) => {
                        if (response.success) successCount++;
                        else failCount++;

                        completed++;
                        voterSocket.disconnect();

                        if (completed === targetCount) {
                            console.log('--- Test Finished ---');
                            console.log(`Total: ${targetCount}`);
                            console.log(`Success: ${successCount}`);
                            console.log(`Failed: ${failCount}`);
                            adminSocket.disconnect();
                            process.exit(0);
                        }
                    });
                });

                voterSocket.on('connect_error', (err) => {
                    console.error('Voter connection error:', err.message);
                    failCount++;
                    completed++;
                });

                // Small delay to avoid overwhelming the local OS socket limit in one tick
                await new Promise(r => setTimeout(r, 10));
            }
        });
    });
};

runTest();
