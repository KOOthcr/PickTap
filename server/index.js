const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Allow CORS for development
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"]
}));

const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for now (adjust for production)
        methods: ["GET", "POST"]
    }
});

// In-memory data store
// rooms[roomId] = { config, voters, votes, hostSocketId }
const rooms = {};

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // 방 생성 (관리자)
    socket.on('createRoom', ({ roomId, config, voters, publicKey }, callback) => {
        if (rooms[roomId]) {
            return callback({ success: false, message: '이미 존재하는 방 코드입니다.' });
        }

        rooms[roomId] = {
            config,
            voters: voters || {}, // { [code]: { name, studentId, isUsed: false, joined: false } }
            publicKey, // E2EE Public Key
            votes: [], // Encrypted votes
            hostSocketId: socket.id,
            isStarted: false,
        };

        socket.join(roomId);
        console.log(`Room created: ${roomId} by ${socket.id}`);
        callback({ success: true, roomId });
    });

    // 방 입장 (기표자/관리자 공통)
    socket.on('joinRoom', ({ roomId, voterCode, type }, callback) => {
        const room = rooms[roomId];

        if (!room) {
            return callback({ success: false, message: '존재하지 않는 방입니다.' });
        }

        if (type === 'voter') {
            // Allow joining without code for the waiting screen
            if (voterCode) {
                const voter = room.voters[voterCode];
                if (!voter) {
                    return callback({ success: false, message: '유효하지 않은 참여 코드입니다.' });
                }
                if (voter.isUsed) {
                    return callback({ success: false, message: '이미 투표에 참여하셨습니다.' });
                }
                voter.joined = true;
                io.to(room.hostSocketId).emit('voterJoined', { voterCode });
            }
        }

        socket.join(roomId);

        // Admin needs full data
        if (type === 'admin') {
            // For simplicity, return full status. Room host could verify.
            callback({
                success: true,
                roomConfig: room.config,
                publicKey: room.publicKey,
                voters: room.voters, // Full voter list status
                votes: room.votes,   // All encrypted votes
                isStarted: room.isStarted
            });
        } else {
            callback({ success: true, roomConfig: room.config, publicKey: room.publicKey, isStarted: room.isStarted });
        }
    });

    // 투표 시작 (관리자)
    socket.on('startVoting', ({ roomId }, callback) => {
        const room = rooms[roomId];
        if (room && room.hostSocketId === socket.id) {
            room.isStarted = true;
            io.to(roomId).emit('votingStarted');
            callback({ success: true });
        } else {
            callback({ success: false, message: '권한이 없습니다.' });
        }
    });

    // 투표 종료 (관리자)
    socket.on('endVoting', ({ roomId }, callback) => {
        const room = rooms[roomId];
        if (room && room.hostSocketId === socket.id) {
            room.isStarted = false;
            io.to(roomId).emit('votingEnded');
            // 결과 데이터도 함께 반환
            const parsedVotes = room.votes.map(v => {
                try { return JSON.parse(v); } catch { return null; }
            }).filter(Boolean);
            callback({
                success: true,
                resultData: {
                    config: room.config,
                    voters: room.voters,
                    votes: parsedVotes,
                }
            });
        } else {
            callback({ success: false, message: '권한이 없습니다.' });
        }
    });

    // 결과 조회 (관리자 - 결과 페이지 재접속 시)
    socket.on('getResults', ({ roomId }, callback) => {
        const room = rooms[roomId];
        if (!room) return callback({ success: false, message: '존재하지 않는 방입니다.' });
        const parsedVotes = room.votes.map(v => {
            try { return JSON.parse(v); } catch { return null; }
        }).filter(Boolean);
        callback({
            success: true,
            resultData: {
                config: room.config,
                voters: room.voters,
                votes: parsedVotes,
            }
        });
    });

    // 투표 취소 / 초기화 (관리자) - 후보자·유권자·설정 유지, 득표·의견 데이터만 초기화
    socket.on('resetVoting', ({ roomId }, callback) => {
        const room = rooms[roomId];
        if (room && room.hostSocketId === socket.id) {
            room.isStarted = false;
            room.votes = [];          // 득표 데이터 초기화
            room.opinions = [];       // 의견 데이터 초기화
            // 유권자 참여 상태만 초기화 (명단·코드는 유지)
            Object.values(room.voters).forEach(v => {
                v.isUsed = false;
                v.joined = false;
                delete v.votedFor;
            });
            io.to(roomId).emit('votingReset');
            callback({ success: true });
        } else {
            callback({ success: false, message: '권한이 없습니다.' });
        }
    });

    // 투표 제출 (기표자)
    socket.on('submitVote', ({ roomId, voterCode, encryptedVote }, callback) => {
        const room = rooms[roomId];
        if (!room) return callback({ success: false, message: '존재하지 않는 방입니다.' });
        if (!room.isStarted) return callback({ success: false, message: '투표가 진행 중이 아닙니다.' });

        const voter = room.voters[voterCode];
        if (!voter) return callback({ success: false, message: '유효하지 않은 참여 코드입니다.' });
        if (voter.isUsed) return callback({ success: false, message: '이미 투표에 참여하셨습니다.' });

        voter.isUsed = true;
        voter.voteTime = new Date().toISOString();

        // Server strictly treats encryptedVote as an opaque payload.
        const voteRecord = JSON.stringify({
            voterCode,
            voterName: voter.name,
            timestamp: voter.voteTime,
            encryptedData: encryptedVote
        });
        room.votes.push(voteRecord);

        io.to(room.hostSocketId).emit('newVote', { encryptedVote: voteRecord });
        // Server no longer knows candidateId
        io.to(room.hostSocketId).emit('updateVoterStatus', { voterCode, status: 'voted' });

        callback({ success: true });
    });

    // 기표자 본인 인증 (기존 checkVoterCode 고도화)
    socket.on('checkVoterCode', (payload, callback) => {
        const { roomId, grade, class: cls, studentId, name, voterCode } = payload;
        const room = rooms[roomId];
        if (!room) return callback({ success: false, message: '존재하지 않는 방입니다.' });

        const isSchool = room.config.type === 'school';
        const isSimple = !isSchool && room.config.options?.simpleVote;

        let targetVoter = null;
        let targetCode = voterCode;

        if (isSimple) {
            // 간단 투표: 번호와 이름으로 검색
            targetVoter = Object.entries(room.voters).find(([code, v]) =>
                v.studentId?.toString().trim() === studentId?.toString().trim() &&
                v.name?.trim() === name?.trim()
            );
            if (targetVoter) {
                targetCode = targetVoter[0];
                targetVoter = targetVoter[1];
            } else {
                return callback({ success: false, message: '입력하신 정보(번호/이름)가 명단에 없습니다.' });
            }
        } else {
            // 일반/학교 투표: 코드로 먼저 찾고 나머지 정보 대조
            const voter = room.voters[voterCode];
            if (!voter) return callback({ success: false, message: '참여 코드가 일치하지 않습니다.' });

            // 정보 대조 (엄격한 비교 + 상세 에러 피드백)
            if (voter.name?.trim() !== name?.trim()) {
                return callback({ success: false, message: '입력하신 이름이 참여 코드 정보와 일치하지 않습니다.' });
            }
            if (voter.studentId?.toString().trim() !== studentId?.toString().trim()) {
                return callback({ success: false, message: '입력하신 번호가 참여 코드 정보와 일치하지 않습니다.' });
            }

            if (isSchool) {
                if (voter.grade?.toString().trim() !== grade?.toString().trim()) {
                    return callback({ success: false, message: '학년 정보가 일치하지 않습니다.' });
                }
                if (voter.class?.toString().trim() !== cls?.toString().trim()) {
                    return callback({ success: false, message: '반 정보가 일치하지 않습니다.' });
                }
            }
            targetVoter = voter;
        }

        if (targetVoter.isUsed) {
            return callback({ success: false, message: '이미 투표에 참여하셨습니다.' });
        }

        callback({
            success: true,
            voterCode: targetCode,
            name: targetVoter.name,
            isUsed: targetVoter.isUsed
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
