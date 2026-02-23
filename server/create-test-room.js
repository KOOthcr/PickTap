const { io } = require('socket.io-client');
const forge = require('node-forge');

const SERVER_URL = 'http://localhost:3000';
const ROOM_ID = 'STRESS_TEST_' + Math.floor(Math.random() * 1000);
const NUM_VOTERS = 1000;

console.log(`Creating test room ${ROOM_ID} with ${NUM_VOTERS} voters...`);

const generateKeyPair = () => {
    return new Promise((resolve, reject) => {
        forge.pki.rsa.generateKeyPair({ bits: 2048, workers: -1 }, (err, keypair) => {
            if (err) return reject(err);
            const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
            const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);
            resolve({ publicKey: publicKeyPem, privateKey: privateKeyPem });
        });
    });
};

const run = async () => {
    const keys = await generateKeyPair();
    const socket = io(SERVER_URL);

    const voters = {};
    for (let i = 0; i < NUM_VOTERS; i++) {
        voters[`V${i.toString().padStart(4, '0')}`] = {
            name: `Test Voter ${i}`,
            studentId: i + 1,
            isUsed: false,
            joined: false
        };
    }

    const config = {
        title: 'Load Stress Test',
        candidates: [
            { id: 'C1', name: 'Candidate A', symbol: '1' },
            { id: 'C2', name: 'Candidate B', symbol: '2' },
            { id: 'C3', name: 'Candidate C', symbol: '3' }
        ],
        type: 'school',
        options: {
            multipleVoting: false,
            rankedVoting: false,
            opinionMode: true
        },
        totalVoters: NUM_VOTERS
    };

    socket.on('connect', () => {
        socket.emit('createRoom', {
            roomId: ROOM_ID,
            config,
            voters,
            publicKey: keys.publicKey
        }, (res) => {
            if (res.success) {
                console.log(`Success! Room created: ${ROOM_ID}`);
                // Automatically start voting
                socket.emit('startVoting', { roomId: ROOM_ID }, (startRes) => {
                    if (startRes.success) {
                        console.log(`Voting started for Room: ${ROOM_ID}`);
                        console.log('Now run: node load-test.js ' + ROOM_ID + ' ' + NUM_VOTERS);
                        process.exit(0);
                    } else {
                        console.error('Failed to start voting:', startRes.message);
                        process.exit(1);
                    }
                });
            } else {
                console.error('Failed to create room:', res.message);
                process.exit(1);
            }
        });
    });
};

run();
