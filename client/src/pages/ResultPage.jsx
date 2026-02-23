import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useModal } from '../contexts/ModalContext';
import { Home, Download, Trophy, FileSpreadsheet } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { decryptVote } from '../utils/cryptoUtils';

// ─────────────────────────────────────────────────────────────────────────────
// Vote Tally Helper
// ─────────────────────────────────────────────────────────────────────────────
const tallyVotes = (votes, candidates, options) => {
    const { multipleVoting, rankedVoting } = options || {};

    if (multipleVoting && rankedVoting) {
        const rankMap = {};
        candidates.forEach(c => { rankMap[c.id] = {}; });
        votes.forEach(v => {
            const choices = v.choices || (v.candidateId ? [{ candidateId: v.candidateId, rank: 1 }] : []);
            choices.forEach(({ candidateId, rank }) => {
                if (!rankMap[candidateId]) rankMap[candidateId] = {};
                rankMap[candidateId][rank] = (rankMap[candidateId][rank] || 0) + 1;
            });
        });
        const allRanks = new Set();
        votes.forEach(v => (v.choices || []).forEach(c => allRanks.add(c.rank)));
        const maxRank = allRanks.size > 0 ? Math.max(...allRanks) : 1;
        const results = candidates.map(c => ({
            ...c,
            rankCounts: rankMap[c.id] || {},
            total: Object.values(rankMap[c.id] || {}).reduce((s, n) => s + n, 0),
        })).sort((a, b) => (b.rankCounts[1] || 0) - (a.rankCounts[1] || 0) || b.total - a.total);
        return { type: 'ranked', results, maxRank };
    }

    if (multipleVoting) {
        const countMap = {};
        candidates.forEach(c => { countMap[c.id] = 0; });
        votes.forEach(v => {
            const choices = v.choices || (v.candidateId ? [{ candidateId: v.candidateId, rank: 1 }] : []);
            choices.forEach(({ candidateId }) => { if (countMap[candidateId] !== undefined) countMap[candidateId]++; });
        });
        return { type: 'multiple', results: candidates.map(c => ({ ...c, count: countMap[c.id] || 0 })).sort((a, b) => b.count - a.count) };
    }

    const countMap = {};
    candidates.forEach(c => { countMap[c.id] = 0; });
    votes.forEach(v => {
        const cid = v.candidateId || v.choices?.[0]?.candidateId;
        if (cid && countMap[cid] !== undefined) countMap[cid]++;
    });
    return { type: 'single', results: candidates.map(c => ({ ...c, count: countMap[c.id] || 0 })).sort((a, b) => b.count - a.count) };
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmtTime = (ts) => {
    if (!ts) return '-';
    try {
        const d = new Date(ts);
        return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch { return '-'; }
};

const describeVote = (voterData, candidates, options) => {
    if (!voterData.isUsed) return '-';
    const { multipleVoting, rankedVoting } = options || {};
    const choices = voterData.choices || (voterData.votedFor ? [{ candidateId: voterData.votedFor, rank: 1 }] : []);
    if (choices.length === 0) return '(기록 없음)';
    const getName = (id) => candidates.find(c => c.id === id)?.name || id;
    if (rankedVoting) return choices.sort((a, b) => a.rank - b.rank).map(c => `${c.rank}순위: ${getName(c.candidateId)}`).join(', ');
    if (multipleVoting) return choices.map(c => getName(c.candidateId)).join(', ');
    return getName(choices[0]?.candidateId);
};

// ─────────────────────────────────────────────────────────────────────────────
// Fanfare Sound (Web Audio API)
// ─────────────────────────────────────────────────────────────────────────────
const playFanfare = () => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const now = ctx.currentTime;
        // C4, E4, G4, C5, E5, G5, C6 (웅장한 도미솔 코드)
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = i % 2 === 0 ? 'triangle' : 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.08);

            gain.gain.setValueAtTime(0, now + i * 0.08);
            gain.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.8);

            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 1.0);
        });
    } catch (e) { console.error('Audio error', e); }
};

// ─────────────────────────────────────────────────────────────────────────────
// Excel Export — mode: 'public' | 'check'
// ─────────────────────────────────────────────────────────────────────────────
const exportExcel = async (resultData, mode) => {
    const { config, voters, votes } = resultData;
    const candidates = config.candidates || [];
    const options = config.options || {};
    const isSchool = config.type === 'school';
    const isPublic = mode === 'public'; // 공개 모드 = 누가 누구를 투표했는지 포함
    const tally = tallyVotes(votes, candidates, options);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'PickTap';

    const hStyle = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'middle' }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: isPublic ? 'FFE8EAF6' : 'FFE8F5E9' } }, border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } } };
    const dStyle = { alignment: { horizontal: 'center', vertical: 'middle' }, border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } } };

    // ── Sheet 1: 후보자 득표 결과 ──────────────────────────────────────────
    const ts = wb.addWorksheet('후보자_득표결과');
    if (tally.type === 'ranked') {
        const rankHeaders = Array.from({ length: tally.maxRank }, (_, i) => `${i + 1}순위`);
        ts.addRow(['기호', '후보자', ...rankHeaders, '합계']);
        ts.getRow(1).eachCell(cell => Object.assign(cell, hStyle));
        tally.results.forEach((c, i) => {
            const rankVals = Array.from({ length: tally.maxRank }, (_, r) => c.rankCounts[r + 1] || 0);
            ts.addRow([c.symbol, c.name, ...rankVals, c.total]);
            ts.getRow(i + 2).eachCell(cell => Object.assign(cell, dStyle));
        });
        ts.getColumn(1).width = 8; ts.getColumn(2).width = 16;
        for (let i = 3; i <= tally.maxRank + 3; i++) ts.getColumn(i).width = 10;
    } else {
        const totalVotes = tally.results.reduce((s, c) => s + c.count, 0);
        ts.addRow(['기호', '후보자', '득표수', '득표율(%)']);
        ts.getRow(1).eachCell(cell => Object.assign(cell, hStyle));
        tally.results.forEach((c, i) => {
            ts.addRow([c.symbol, c.name, c.count, totalVotes > 0 ? ((c.count / totalVotes) * 100).toFixed(1) : '0.0']);
            ts.getRow(i + 2).eachCell(cell => Object.assign(cell, dStyle));
        });
        ts.getColumn(1).width = 8; ts.getColumn(2).width = 16; ts.getColumn(3).width = 10; ts.getColumn(4).width = 12;
    }

    // ── Sheet 2+: 참여자 결과 ──────────────────────────────────────────────
    const buildParticipantSheet = (ws, participantList) => {
        const showCode = !options.simpleVote; // 간단투표 모드가 아닐 때만 코드 표시

        const baseHeaders = isSchool
            ? (showCode ? ['학년', '반', '번호', '이름', '개인코드', '참여여부', '투표시간'] : ['학년', '반', '번호', '이름', '참여여부', '투표시간'])
            : (showCode ? ['번호', '이름', '개인코드', '참여여부', '투표시간'] : ['번호', '이름', '참여여부', '투표시간']);

        // 두 모드 모두 의견 내용 포함
        const headers = isPublic
            ? [...baseHeaders, '투표 내용', '의견 내용']
            : [...baseHeaders, '의견 내용'];

        ws.addRow(headers);
        ws.getRow(1).eachCell(cell => Object.assign(cell, hStyle));

        participantList.forEach(([code, v], i) => {
            let base;
            if (isSchool) {
                base = showCode
                    ? [v.grade || '-', v.class || '-', v.studentId || '-', v.name, code, v.isUsed ? 'O' : 'X', fmtTime(v.voteTime)]
                    : [v.grade || '-', v.class || '-', v.studentId || '-', v.name, v.isUsed ? 'O' : 'X', fmtTime(v.voteTime)];
            } else {
                base = showCode
                    ? [v.studentId || '-', v.name, code, v.isUsed ? 'O' : 'X', fmtTime(v.voteTime)]
                    : [v.studentId || '-', v.name, v.isUsed ? 'O' : 'X', fmtTime(v.voteTime)];
            }

            // v.opinion은 server에서 저장된 값
            const row = isPublic
                ? [...base, describeVote(v, candidates, options), v.opinion || '-']
                : [...base, v.opinion || '-'];

            ws.addRow(row);
            ws.getRow(i + 2).eachCell(cell => Object.assign(cell, dStyle));
        });

        // 컬럼 너비 설정
        if (isSchool) {
            if (showCode) {
                [1, 2, 3, 5].forEach(c => { ws.getColumn(c).width = 8; });
                ws.getColumn(4).width = 14;
                ws.getColumn(6).width = 10;
                ws.getColumn(7).width = 14;
                const nextCol = isPublic ? 8 : 8;
                ws.getColumn(nextCol).width = 30;
                if (isPublic) ws.getColumn(9).width = 30;
            } else {
                [1, 2, 3].forEach(c => { ws.getColumn(c).width = 8; });
                ws.getColumn(4).width = 14;
                ws.getColumn(5).width = 10;
                ws.getColumn(6).width = 14;
                ws.getColumn(7).width = 30;
                if (isPublic) ws.getColumn(8).width = 30;
            }
        } else {
            if (showCode) {
                [1, 3].forEach(c => { ws.getColumn(c).width = 8; });
                ws.getColumn(2).width = 14;
                ws.getColumn(4).width = 10;
                ws.getColumn(5).width = 14;
                ws.getColumn(6).width = 30;
                if (isPublic) ws.getColumn(7).width = 30;
            } else {
                ws.getColumn(1).width = 8;
                ws.getColumn(2).width = 14;
                ws.getColumn(3).width = 10;
                ws.getColumn(4).width = 14;
                ws.getColumn(5).width = 30;
                if (isPublic) ws.getColumn(6).width = 30;
            }
        }
    };

    const voterEntries = Object.entries(voters);
    if (isSchool) {
        const grades = [...new Set(voterEntries.map(([, v]) => v.grade).filter(Boolean))].sort((a, b) => parseInt(a) - parseInt(b));
        const sortedAll = voterEntries.sort((a, b) => (parseInt(a[1].grade) - parseInt(b[1].grade)) || (parseInt(a[1].class) - parseInt(b[1].class)) || (parseInt(a[1].studentId) - parseInt(b[1].studentId)));
        buildParticipantSheet(wb.addWorksheet('전체_참여자_결과'), sortedAll);
        grades.forEach(grade => {
            const ge = voterEntries.filter(([, v]) => v.grade?.toString() === grade.toString()).sort((a, b) => (parseInt(a[1].class) - parseInt(b[1].class)) || (parseInt(a[1].studentId) - parseInt(b[1].studentId)));
            buildParticipantSheet(wb.addWorksheet(`${grade}학년_결과`), ge);
        });
    } else {
        const sorted = voterEntries.sort((a, b) => (parseInt(a[1].studentId) || 0) - (parseInt(b[1].studentId) || 0));
        buildParticipantSheet(wb.addWorksheet('참여자_결과'), sorted);
    }

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const modeLabel = isPublic ? '공개모드' : '체크모드';
    saveAs(blob, `${config.title}_결과_${modeLabel}_${new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}.xlsx`);
};

// ─────────────────────────────────────────────────────────────────────────────
// ResultPage
// ─────────────────────────────────────────────────────────────────────────────
const ResultPage = () => {
    const { roomId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const socket = useSocket();
    const showModal = useModal();

    // Helper to decrypt fetched result records
    const parseAndDecryptVote = (rawVoteStr) => {
        try {
            const record = typeof rawVoteStr === 'string' ? JSON.parse(rawVoteStr) : rawVoteStr;
            const privateKey = sessionStorage.getItem(`picktap_pk_${roomId}`);

            if (privateKey && record.encryptedData) {
                try {
                    const decryptedPayload = decryptVote(record.encryptedData, privateKey);
                    Object.assign(record, decryptedPayload);
                } catch (err) {
                    try { Object.assign(record, JSON.parse(record.encryptedData)); } catch (e) { }
                }
            } else if (record.encryptedData) {
                try { Object.assign(record, JSON.parse(record.encryptedData)); } catch (e) { }
            }

            // Ensure candidateId is mapped for easy tallying and backward compatibility
            if (!record.candidateId && record.choices && record.choices.length > 0) {
                record.candidateId = record.choices[0].candidateId;
            }
            return record;
        } catch (e) {
            console.error("Failed to parse/decrypt result string", e);
            return null;
        }
    };

    const [resultData, setResultData] = useState(() => {
        const initial = location.state?.resultData;
        if (initial && initial.votes) {
            const decryptedVotes = initial.votes.map(parseAndDecryptVote).filter(Boolean);
            const enrichedVoters = { ...initial.voters };

            // Map decrypted data back to voters map for Excel describeVote
            decryptedVotes.forEach(v => {
                if (enrichedVoters[v.voterCode]) {
                    enrichedVoters[v.voterCode].votedFor = v.candidateId;
                    enrichedVoters[v.voterCode].choices = v.choices;
                    enrichedVoters[v.voterCode].opinion = v.opinion;
                }
            });

            return {
                ...initial,
                votes: decryptedVotes,
                voters: enrichedVoters
            };
        }
        return initial || null;
    });

    const [loading, setLoading] = useState(!location.state?.resultData);

    // Reveal states
    const [phase, setPhase] = useState('button'); // 'button' | 'countdown' | 'revealed'
    const [countdown, setCountdown] = useState(3);
    const timerRef = useRef(null);
    const downloadedRef = useRef(false);

    // Fetch data if not passed via state
    useEffect(() => {
        if (resultData || !socket) return;
        socket.emit('getResults', { roomId }, (res) => {
            if (res.success) {
                const decryptedVotes = res.resultData.votes.map(parseAndDecryptVote).filter(Boolean);
                const enrichedVoters = { ...res.resultData.voters };

                decryptedVotes.forEach(v => {
                    if (enrichedVoters[v.voterCode]) {
                        enrichedVoters[v.voterCode].votedFor = v.candidateId;
                        enrichedVoters[v.voterCode].choices = v.choices;
                        enrichedVoters[v.voterCode].opinion = v.opinion;
                    }
                });

                setResultData({
                    ...res.resultData,
                    votes: decryptedVotes,
                    voters: enrichedVoters
                });
            } else {
                showModal.alert('결과를 불러오지 못했습니다: ' + res.message);
                navigate('/');
            }
            setLoading(false);
        });
    }, [resultData, socket, roomId, navigate]);

    // Automatic download trigger
    useEffect(() => {
        if (resultData && location.state?.autoDownload && !downloadedRef.current) {
            const mode = location.state.autoDownload;
            downloadedRef.current = true;

            // Trigger download after a small delay to ensure page is ready
            setTimeout(() => {
                if (mode === 'both') {
                    exportExcel(resultData, 'check');
                    setTimeout(() => {
                        exportExcel(resultData, 'public');
                    }, 500); // Small gap between files
                } else {
                    exportExcel(resultData, mode);
                }

                // Clear the flag from state so it doesn't download again on refreshes
                navigate(location.pathname, { replace: true, state: { ...location.state, autoDownload: null } });
            }, 1000);
        }
    }, [resultData, location.state, navigate, location.pathname]);

    // Countdown logic
    useEffect(() => {
        if (phase !== 'countdown') return;
        if (countdown <= 0) {
            setPhase('revealed');
            playFanfare();
            return;
        }
        timerRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timerRef.current);
    }, [phase, countdown]);

    const handleReveal = () => {
        setPhase('countdown');
        setCountdown(3);
    };

    if (loading || !resultData) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500 text-lg">결과를 불러오는 중...</div>;
    }

    const { config, voters, votes } = resultData;
    const candidates = config.candidates || [];
    const options = config.options || {};
    const tally = tallyVotes(votes, candidates, options);

    const totalVoters = Object.keys(voters).length;
    const votedCount = Object.values(voters).filter(v => v.isUsed).length;
    const participationRate = totalVoters > 0 ? Math.round((votedCount / totalVoters) * 100) : 0;
    const totalVotes = tally.type === 'ranked'
        ? tally.results.reduce((s, c) => s + c.total, 0)
        : tally.results.reduce((s, c) => s + c.count, 0);
    const maxVotes = tally.type === 'ranked'
        ? Math.max(...tally.results.map(r => r.total), 1)
        : Math.max(...tally.results.map(r => r.count), 1);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">

            {/* Header */}
            <header className="bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <Link to="/" className="flex items-center gap-2 group transition-all mr-2">
                        <span className="text-2xl group-hover:scale-110 transition-transform">☝️</span>
                        <span className="font-extrabold text-xl text-gray-900 tracking-tight">한표꾹</span>
                    </Link>
                    <div className="h-6 w-[1px] bg-gray-200 mx-1"></div>
                    <div>
                        <h1 className="text-lg font-extrabold text-gray-900">{config.title}</h1>
                        <p className="text-xs text-gray-400">
                            {config.type === 'school' ? '학교 투표' : '학급 투표'} · 참여율 {participationRate}% ({votedCount}/{totalVoters}명)
                        </p>
                    </div>
                </div>

                {/* 데이터 보존 경고 */}
                <div className="hidden lg:block bg-red-50 border-2 border-red-200 px-6 py-2 rounded-full shadow-md animate-pulse">
                    <p className="text-red-600 text-lg font-black whitespace-nowrap text-center">
                        ⚠️ 투표 결과는 브라우저에 임시로 저장되며, 다운로드하지 않고 창을 닫으면 모든 데이터가 영구적으로 삭제됩니다.
                    </p>
                </div>
            </header>

            <main className="flex-grow flex flex-col items-center justify-center p-6">

                {/* ── Phase: 버튼 ── */}
                {phase === 'button' && (
                    <div className="flex flex-col items-center gap-8 animate-fade-in">
                        <div className="text-center space-y-2">
                            <Trophy className="w-16 h-16 text-yellow-400 mx-auto drop-shadow-lg" />
                            <h2 className="text-3xl font-extrabold text-gray-800">투표가 종료됐습니다!</h2>
                            <p className="text-gray-500 text-sm">아래 버튼을 눌러 결과를 확인하세요</p>
                        </div>
                        <button
                            onClick={handleReveal}
                            className="relative overflow-hidden px-16 py-8 rounded-3xl text-white text-4xl font-extrabold shadow-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 hover:scale-105 active:scale-95 transition-transform duration-200 animate-pulse-gentle"
                        >
                            🎉 결과 확인!
                            <span className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity rounded-3xl" />
                        </button>
                        <p className="text-gray-400 text-xs">누르면 3초 카운트다운 후 결과가 공개됩니다</p>
                    </div>
                )}

                {/* ── Phase: 카운트다운 ── */}
                {phase === 'countdown' && (
                    <div className="flex flex-col items-center justify-center gap-4">
                        <p className="text-gray-500 text-lg font-bold tracking-widest">결과 공개까지...</p>
                        <div
                            key={countdown}
                            className="w-48 h-48 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl animate-countdown"
                        >
                            <span className="text-white text-9xl font-black leading-none">{countdown}</span>
                        </div>
                    </div>
                )}

                {/* ── Phase: 결과 공개 ── */}
                {phase === 'revealed' && (
                    <div className="w-full max-w-6xl space-y-6 animate-reveal">

                        <div className="flex flex-col lg:flex-row items-start gap-8">
                            {/* 후보자 득표 현황 (왼쪽) */}
                            <div className="flex-1 w-full space-y-6">
                                {/* 결과 타이틀 (후보자 결과 위로 이동 및 정렬) */}
                                <div className="text-center space-y-3 mb-4">
                                    <h2 className="text-4xl font-black text-gray-900 flex items-center justify-center gap-3">
                                        <Trophy className="w-10 h-10 text-yellow-400 drop-shadow-sm" /> 최종 결과
                                    </h2>
                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold shadow-sm">
                                            {tally.type === 'ranked' ? '복수·순위 투표' : tally.type === 'multiple' ? '복수 투표' : '단일 투표'}
                                        </span>
                                        <span className="text-gray-300">|</span>
                                        <span className="text-gray-600 font-medium tracking-tight">
                                            총 <span className="text-indigo-600 font-bold">{totalVoters}</span>명 중 <span className="text-indigo-600 font-bold">{votedCount}</span>명 참여
                                        </span>
                                        <span className={`ml-1 px-3 py-1 rounded-full text-xs font-black shadow-sm ${participationRate >= 70 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            현재 참여율 {participationRate}%
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                                    {tally.type === 'ranked' ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-gray-50 text-gray-600 font-bold">
                                                        <th className="p-3 text-center">순위</th>
                                                        <th className="p-3 text-left">후보자</th>
                                                        {Array.from({ length: tally.maxRank }, (_, i) => (
                                                            <th key={i} className="p-3 text-center">{i + 1}순위</th>
                                                        ))}
                                                        <th className="p-3 text-center">합계</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {tally.results.map((c, idx) => (
                                                        <tr key={c.id} className={`border-t ${idx === 0 ? 'bg-yellow-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                                            <td className="p-3 text-center">
                                                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-gray-200 text-gray-600'}`}>{idx + 1}</span>
                                                            </td>
                                                            <td className="p-3 font-bold text-gray-900">기호 {c.symbol} {c.name}</td>
                                                            {Array.from({ length: tally.maxRank }, (_, r) => (
                                                                <td key={r} className="p-3 text-center">
                                                                    <span className={`text-sm font-bold ${(c.rankCounts[r + 1] || 0) > 0 ? 'text-indigo-600' : 'text-gray-300'}`}>
                                                                        {c.rankCounts[r + 1] || 0}표
                                                                    </span>
                                                                </td>
                                                            ))}
                                                            <td className="p-3 text-center font-extrabold text-indigo-700 text-lg">{c.total}표</td>
                                                        </tr>
                                                    ))}
                                                    {/* 미투표 행 추가 */}
                                                    <tr className="border-t bg-gray-100">
                                                        <td className="p-3 text-center">
                                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-600 text-white text-sm font-bold">-</span>
                                                        </td>
                                                        <td className="p-3 font-bold text-gray-600 italic">미투표 참여자</td>
                                                        {Array.from({ length: tally.maxRank }, (_, r) => (
                                                            <td key={r} className="p-3 text-center text-gray-300">-</td>
                                                        ))}
                                                        <td className="p-3 text-center font-extrabold text-gray-700 text-lg">{totalVoters - votedCount}명</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="space-y-5">
                                            {tally.results.map((c, idx) => {
                                                const pct = maxVotes > 0 ? Math.round((c.count / maxVotes) * 100) : 0;
                                                const votePct = totalVotes > 0 ? ((c.count / totalVotes) * 100).toFixed(1) : '0.0';
                                                const MEDAL = ['🥇', '🥈', '🥉'];
                                                return (
                                                    <div key={c.id} className={`p-4 rounded-2xl border-2 ${idx === 0 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-100 bg-gray-50'}`}>
                                                        <div className="flex items-center gap-4 mb-2">
                                                            <span className="text-3xl">{MEDAL[idx] || '▪'}</span>
                                                            <div className="flex-1">
                                                                <p className="font-extrabold text-gray-900 text-lg">기호 {c.symbol} {c.name}</p>
                                                                <p className="text-gray-400 text-xs">득표율 {votePct}%</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-3xl font-black text-indigo-700">{c.count}</span>
                                                                <span className="text-sm text-gray-500 ml-1">표</span>
                                                            </div>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* 미투표 그래프 추가 */}
                                            <div className="p-4 rounded-2xl border-2 border-gray-200 bg-gray-100/50 opacity-90 mt-6 border-dashed">
                                                <div className="flex items-center gap-4 mb-2">
                                                    <span className="text-3xl filter grayscale opacity-50">🚫</span>
                                                    <div className="flex-1">
                                                        <p className="font-extrabold text-gray-500 text-lg italic">미투표 참여자</p>
                                                        <p className="text-gray-400 text-xs">총 {totalVoters}명 중 {totalVoters - votedCount}명</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-3xl font-black text-gray-400">{totalVoters - votedCount}</span>
                                                        <span className="text-sm text-gray-400 ml-1">명</span>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-gray-800 transition-all duration-1000 ease-out shadow-sm"
                                                        style={{ width: `${maxVotes > 0 ? Math.min(100, Math.round(((totalVoters - votedCount) / maxVotes) * 100)) : 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 다운로드 버튼 2가지 (오른쪽) */}
                            <div className="w-full lg:w-96 bg-white rounded-2xl shadow border border-gray-100 p-6 self-start">
                                <h3 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
                                    <FileSpreadsheet className="w-5 h-5 text-green-600" /> 결과 데이터 다운로드
                                </h3>
                                <div className="flex flex-col gap-4">
                                    <button
                                        onClick={() => exportExcel(resultData, 'public')}
                                        className="flex items-center justify-center gap-4 py-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg group"
                                    >
                                        <Download className="w-6 h-6 transition-transform group-hover:translate-y-1" />
                                        <div className="text-left">
                                            <p className="text-lg font-extrabold">공개 모드</p>
                                            <p className="text-xs opacity-70">누가 누구를 투표했는지 포함</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => exportExcel(resultData, 'check')}
                                        className="flex items-center justify-center gap-4 py-6 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors shadow-lg group"
                                    >
                                        <Download className="w-6 h-6 transition-transform group-hover:translate-y-1" />
                                        <div className="text-left">
                                            <p className="text-lg font-extrabold">체크 모드</p>
                                            <p className="text-xs opacity-70">참여여부(O/X)-시간만 포함</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* 카운트다운 / 공개 애니메이션 CSS */}
            <style>{`
                @keyframes countdown-pop {
                    0%   { transform: scale(1.6); opacity: 0; }
                    30%  { transform: scale(1); opacity: 1; }
                    80%  { transform: scale(1); opacity: 1; }
                    100% { transform: scale(0.8); opacity: 0; }
                }
                @keyframes reveal-in {
                    0%   { opacity: 0; transform: translateY(30px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse-gentle {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
                    50%       { box-shadow: 0 0 0 18px rgba(99,102,241,0); }
                }
                .animate-countdown { animation: countdown-pop 0.9s ease-in-out forwards; }
                .animate-reveal     { animation: reveal-in 0.7s ease-out both; }
                .animate-pulse-gentle { animation: pulse-gentle 2s ease-in-out infinite; }
                .animate-fade-in    { animation: reveal-in 0.5s ease-out both; }
            `}</style>
        </div>
    );
};

export default ResultPage;
