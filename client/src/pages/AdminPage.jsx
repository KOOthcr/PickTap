import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useModal } from '../contexts/ModalContext';
import { Copy, Users, Lock, Play, Square, Home, QrCode, Download, Award, FileSpreadsheet, RotateCcw } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { QRCodeCanvas } from 'qrcode.react';
import { decryptVote } from '../utils/cryptoUtils';

const AdminPage = () => {
    const { roomId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const socket = useSocket();
    const showModal = useModal();

    const [roomConfig, setRoomConfig] = useState(location.state?.roomConfig || null);
    const [voters, setVoters] = useState(location.state?.generatedVoters || {});
    const [votes, setVotes] = useState([]); // Encrypted votes (or decrypted if we implement key logic)
    const [isStarted, setIsStarted] = useState(false);
    const [showStartModal, setShowStartModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showEndModal, setShowEndModal] = useState(false);
    const [isRealtime, setIsRealtime] = useState(false); // Make it a local toggle, default off
    const [connectedVoters, setConnectedVoters] = useState(0); // Realtime connection count (optional)
    const [voterDisplayMode, setVoterDisplayMode] = useState('check'); // 'public', 'check', 'secret'
    const [activeTab, setActiveTab] = useState('all'); // 'all' or specific grade

    // Helper to decrypt incoming vote records
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

            // Ensure candidateId is set for backward compatibility & easy tallying
            if (!record.candidateId && record.choices && record.choices.length > 0) {
                record.candidateId = record.choices[0].candidateId;
            }

            return record;
        } catch (e) {
            console.error("Failed to parse/decrypt vote string", e);
            return null;
        }
    };

    // Fetch Room Info on Mount (or whenever socket connects)
    useEffect(() => {
        if (!socket) return;

        socket.emit('joinRoom', { roomId, type: 'admin' }, (response) => {
            if (response.success) {
                setRoomConfig(response.roomConfig);
                if (response.voters) setVoters(response.voters);
                setIsStarted(response.isStarted);
                if (response.votes) {
                    const decryptedVotes = response.votes.map(parseAndDecryptVote).filter(Boolean);
                    setVotes(decryptedVotes);

                    // Recover votedFor status for UI
                    setVoters(prev => {
                        const updated = { ...prev };
                        decryptedVotes.forEach(v => {
                            if (updated[v.voterCode]) {
                                updated[v.voterCode].votedFor = v.candidateId;
                            }
                        });
                        return updated;
                    });
                }
            } else {
                showModal.alert('방 정보를 불러오지 못했습니다: ' + response.message);
                navigate('/');
            }
        });

        // Listeners for updates
        socket.on('voterJoined', ({ voterCode }) => {
            setVoters(prev => ({
                ...prev,
                [voterCode]: { ...prev[voterCode], joined: true }
            }));
        });

        socket.on('newVote', ({ encryptedVote }) => {
            const dec = parseAndDecryptVote(encryptedVote);
            if (dec) {
                setVotes(prev => [...prev, dec]);
                // Update local voter tracking with decrypted selection
                setVoters(prev => ({
                    ...prev,
                    [dec.voterCode]: {
                        ...prev[dec.voterCode],
                        isUsed: true,
                        votedFor: dec.candidateId,
                        choices: dec.choices
                    }
                }));
            }
        });

        socket.on('updateVoterStatus', ({ voterCode, status }) => {
            setVoters(prev => ({
                ...prev,
                [voterCode]: { ...prev[voterCode], isUsed: status === 'voted' }
            }));
        });

        socket.on('votingStarted', () => setIsStarted(true));
        socket.on('votingEnded', () => setIsStarted(false));
        socket.on('votingReset', () => {
            setIsStarted(false);
            setVotes([]);
            setVoters(prev => {
                const reset = {};
                Object.entries(prev).forEach(([code, v]) => {
                    reset[code] = { ...v, isUsed: false, joined: false, votedFor: undefined };
                });
                return reset;
            });
        });

        return () => {
            socket.off('voterJoined');
            socket.off('newVote');
            socket.off('updateVoterStatus');
            socket.off('votingStarted');
            socket.off('votingEnded');
            socket.off('votingReset');
        };
    }, [socket, roomId, navigate]);

    if (!roomConfig) return <div className="min-h-screen flex items-center justify-center text-gray-500">방 정보를 불러오는 중...</div>;


    // Handlers
    const handleStartVoting = () => {
        setShowStartModal(true);
    };

    const handleConfirmStart = () => {
        setShowStartModal(false);
        socket.emit('startVoting', { roomId }, (response) => {
            if (response.success) {
                setIsStarted(true);
            } else {
                showModal.alert('무시됨: ' + response.message);
            }
        });
    };

    const handleEndVoting = () => {
        setShowEndModal(true);
    };

    const handleConfirmEnd = () => {
        setShowEndModal(false);
        socket.emit('endVoting', { roomId }, (response) => {
            if (response.success) {
                setIsStarted(false);
                navigate(`/result/${roomId}`, {
                    state: { resultData: response.resultData, roomId, autoDownload: 'both' }
                });
            }
        });
    };

    const handleResetToStart = () => {
        setShowCancelModal(true);
    };

    const handleToggleRealtime = async (e) => {
        const newValue = e.target.checked;
        const msg = newValue
            ? "실시간 중계를 활성화하시겠습니까?\n모든 후보자의 득표 상황과 투표 현황이 실시간으로 노출됩니다."
            : "실시간 중계를 중단하시겠습니까?\n후보자의 득표 상황과 투표 현황이 숨겨지며 '-'로 표시됩니다.";

        if (await showModal.confirm(msg, "실시간 중계 설정")) {
            setIsRealtime(newValue);
        }
    };

    const handleConfirmCancel = () => {
        setShowCancelModal(false);
        // 즉시 클라이언트 상태 초기화 (서버 응답 대기 없이)
        setIsStarted(false);
        setVotes([]);
        setVoters(prev => {
            const reset = {};
            Object.entries(prev).forEach(([code, v]) => {
                reset[code] = { ...v, isUsed: false, joined: false, votedFor: undefined };
            });
            return reset;
        });
        socket.emit('resetVoting', { roomId }, () => { });
    };

    const handleDisplayModeChange = async (e) => {
        const mode = e.target.value;
        let message = '';
        if (mode === 'public') message = '유권자가 누구에게 투표했는지 모두 공개됩니다. (공개 모드)\n\n주의: 비밀 투표 원칙을 위반할 수 있습니다.\n설정을 변경하시겠습니까?';
        else if (mode === 'check') message = '유권자의 투표 참여 여부(O/X)만 공개됩니다. (체크 모드)\n설정을 변경하시겠습니까?';
        else if (mode === 'secret') message = '유권자의 투표 참여 여부 및 상세 정보를 숨깁니다. (비밀 모드)\n설정을 변경하시겠습니까?';

        if (await showModal.confirm(message)) {
            setVoterDisplayMode(mode);
        }
    };

    const handleDownloadCodes = async () => {
        if (!voters || Object.keys(voters).length === 0) {
            showModal.alert('다운로드할 유권자 명단이 없습니다.');
            return;
        }

        const isSchoolVote = roomConfig?.type === 'school';
        let currentVoters = Object.entries(voters).map(([code, data]) => ({
            studentId: data.studentId,
            name: data.name,
            accessCode: code,
            grade: data.grade,
            class: data.class
        }));

        if (isSchoolVote && activeTab !== 'all') {
            currentVoters = currentVoters.filter(v => v.grade?.toString() === activeTab);
            if (currentVoters.length === 0) {
                showModal.alert('해당 탭에 다운로드할 유권자 명단이 없습니다.');
                return;
            }
        }

        const workbook = new ExcelJS.Workbook();

        if (isSchoolVote) {
            currentVoters.sort((a, b) => {
                if (a.grade !== b.grade) return parseInt(a.grade) - parseInt(b.grade);
                const classA = parseInt(a.class) || 0;
                const classB = parseInt(b.class) || 0;
                if (classA !== classB) return classA - classB;
                const numA = parseInt(a.studentId) || 0;
                const numB = parseInt(b.studentId) || 0;
                return numA - numB;
            });

            const generateListSheet = (sheet, exportVoters) => {
                const setBorder = (cell) => {
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                };
                sheet.getCell('A1').value = '학년'; sheet.getCell('B1').value = '반';
                sheet.getCell('C1').value = '번호'; sheet.getCell('D1').value = '이름';
                sheet.getCell('E1').value = '접속코드';
                ['A1', 'B1', 'C1', 'D1', 'E1'].forEach(key => {
                    const cell = sheet.getCell(key); cell.font = { bold: true }; setBorder(cell);
                });
                exportVoters.forEach((v, idx) => {
                    const row = idx + 2;
                    sheet.getCell(`A${row}`).value = v.grade; sheet.getCell(`B${row}`).value = v.class;
                    sheet.getCell(`C${row}`).value = v.studentId; sheet.getCell(`D${row}`).value = v.name;
                    sheet.getCell(`E${row}`).value = v.accessCode;
                    ['A', 'B', 'C', 'D', 'E'].forEach(col => setBorder(sheet.getCell(`${col}${row}`)));
                });
                sheet.getColumn('A').width = 8; sheet.getColumn('B').width = 8;
                sheet.getColumn('C').width = 8; sheet.getColumn('D').width = 15; sheet.getColumn('E').width = 15;
            };

            const generatePrintSheet = (sheet, exportVoters) => {
                const setBorder = (cell) => {
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                };
                const CARDS_PER_ROW = 3; const CARD_COLS = 4; const CARD_ROWS = 4;
                const COL_GAP = 1; const ROW_GAP = 1;
                const BLOCK_W = CARD_COLS + COL_GAP; const BLOCK_H = CARD_ROWS + ROW_GAP;

                exportVoters.forEach((v, idx) => {
                    const col = idx % CARDS_PER_ROW; const row = Math.floor(idx / CARDS_PER_ROW);
                    const startC = 1 + col * BLOCK_W; const startR = 1 + row * BLOCK_H;
                    const c1 = startC, c2 = startC + 1, c3 = startC + 2, c4 = startC + 3;
                    const r1 = startR, r2 = startR + 1, r3 = startR + 2, r4 = startR + 3;

                    const h1 = sheet.getCell(r1, c1); h1.value = '학년'; const h2 = sheet.getCell(r1, c2); h2.value = '반';
                    const h3 = sheet.getCell(r1, c3); h3.value = '번호'; const h4 = sheet.getCell(r1, c4); h4.value = '이름';
                    [h1, h2, h3, h4].forEach(c => { c.font = { bold: true }; setBorder(c); });

                    const v1 = sheet.getCell(r2, c1); v1.value = v.grade; const v2 = sheet.getCell(r2, c2); v2.value = v.class;
                    const v3 = sheet.getCell(r2, c3); v3.value = v.studentId; const v4 = sheet.getCell(r2, c4); v4.value = v.name;
                    [v1, v2, v3, v4].forEach(c => setBorder(c));

                    sheet.mergeCells(r3, c1, r3, c4); const labelCell = sheet.getCell(r3, c1); labelCell.value = '접속코드'; labelCell.font = { bold: true }; setBorder(labelCell);
                    sheet.mergeCells(r4, c1, r4, c4); const codeCell = sheet.getCell(r4, c1); codeCell.value = v.accessCode; codeCell.font = { size: 13, bold: true }; setBorder(codeCell);
                });

                for (let i = 0; i < CARDS_PER_ROW; i++) {
                    const base = 1 + i * BLOCK_W;
                    for (let j = 0; j < CARD_COLS; j++) sheet.getColumn(base + j).width = 8;
                    if (i < CARDS_PER_ROW - 1) sheet.getColumn(base + CARD_COLS).width = 2;
                }

                sheet.pageSetup = { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 } };
            };

            const summarySheet = workbook.addWorksheet(activeTab === 'all' ? '전체명부' : `${activeTab}학년_명부`);
            generateListSheet(summarySheet, currentVoters);
            const summaryPrintSheet = workbook.addWorksheet(activeTab === 'all' ? '전체명부_인쇄용' : `${activeTab}학년_인쇄용`);
            generatePrintSheet(summaryPrintSheet, currentVoters);

            if (activeTab === 'all') {
                const grouped = {};
                currentVoters.forEach(v => {
                    const key = `${v.grade}학년`;
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(v);
                });
                Object.keys(grouped).forEach(sheetNamePrefix => {
                    const listSheet = workbook.addWorksheet(`${sheetNamePrefix}_명부`); generateListSheet(listSheet, grouped[sheetNamePrefix]);
                    const printSheet = workbook.addWorksheet(`${sheetNamePrefix}_인쇄용`); generatePrintSheet(printSheet, grouped[sheetNamePrefix]);
                });
            } else {
                const grouped = {};
                currentVoters.forEach(v => {
                    const key = `${v.grade}학년_${v.class || '미배정'}반`;
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(v);
                });
                Object.keys(grouped).forEach(sheetNamePrefix => {
                    const listSheet = workbook.addWorksheet(`${sheetNamePrefix}_명부`); generateListSheet(listSheet, grouped[sheetNamePrefix]);
                    const printSheet = workbook.addWorksheet(`${sheetNamePrefix}_인쇄용`); generatePrintSheet(printSheet, grouped[sheetNamePrefix]);
                });
            }

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const filename = activeTab === 'all' ? `${roomConfig.title}_전체_코드.xlsx` : `${roomConfig.title}_${activeTab}학년_코드.xlsx`;
            saveAs(blob, filename);

        } else {
            currentVoters.sort((a, b) => {
                const numA = parseInt(a.studentId);
                const numB = parseInt(b.studentId);
                if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                return a.studentId.localeCompare(b.studentId);
            });

            const listSheet = workbook.addWorksheet('표_개별_접속코드');
            listSheet.columns = [
                { header: '번호', key: 'studentId', width: 10 },
                { header: '이름', key: 'name', width: 15 },
                { header: '접속코드', key: 'accessCode', width: 15 },
            ];
            listSheet.getRow(1).font = { bold: true };
            listSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

            currentVoters.forEach(v => {
                listSheet.addRow(v);
            });

            listSheet.eachRow((row) => {
                row.eachCell((cell) => {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                });
            });

            const printSheet = workbook.addWorksheet('표_개별_접속코드(인쇄용)');
            const colWidth = 12;
            const gapWidth = 2;
            printSheet.columns = [
                { width: colWidth }, { width: colWidth }, { width: gapWidth },
                { width: colWidth }, { width: colWidth }, { width: gapWidth },
                { width: colWidth }, { width: colWidth }
            ];

            const cardsPerRow = 3;
            const rowsPerCard = 5;

            currentVoters.forEach((v, index) => {
                const cardIndex = index % cardsPerRow;
                const rowIndex = Math.floor(index / cardsPerRow);

                const startRow = (rowIndex * rowsPerCard) + 1;
                const startCol = (cardIndex * 3) + 1;

                const cellNumLabel = printSheet.getCell(startRow, startCol);
                cellNumLabel.value = '번호';
                cellNumLabel.style = { font: { bold: true }, alignment: { horizontal: 'center' }, border: { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } } };

                const cellNameLabel = printSheet.getCell(startRow, startCol + 1);
                cellNameLabel.value = '이름';
                cellNameLabel.style = { font: { bold: true }, alignment: { horizontal: 'center' }, border: { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } } };

                const cellNumVal = printSheet.getCell(startRow + 1, startCol);
                cellNumVal.value = v.studentId;
                cellNumVal.style = { alignment: { horizontal: 'center' }, border: { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } } };

                const cellNameVal = printSheet.getCell(startRow + 1, startCol + 1);
                cellNameVal.value = v.name;
                cellNameVal.style = { alignment: { horizontal: 'center' }, border: { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } } };

                const cellCodeLabel = printSheet.getCell(startRow + 2, startCol);
                const cellCodeLabelRight = printSheet.getCell(startRow + 2, startCol + 1);
                cellCodeLabel.value = '접속코드';
                printSheet.mergeCells(startRow + 2, startCol, startRow + 2, startCol + 1);
                const codeLabelStyle = { font: { bold: true }, alignment: { horizontal: 'center' }, border: { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } } };
                cellCodeLabel.style = codeLabelStyle;
                cellCodeLabelRight.style = codeLabelStyle;

                const cellCodeVal = printSheet.getCell(startRow + 3, startCol);
                const cellCodeValRight = printSheet.getCell(startRow + 3, startCol + 1);
                cellCodeVal.value = v.accessCode;
                cellCodeVal.font = { size: 12, bold: true };
                printSheet.mergeCells(startRow + 3, startCol, startRow + 3, startCol + 1);
                const codeValStyle = { alignment: { horizontal: 'center', vertical: 'middle' }, border: { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } } };
                cellCodeVal.style = codeValStyle;
                cellCodeValRight.style = codeValStyle;
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `${roomConfig.title}_표_개별_접속코드.xlsx`);
        }
    };

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomId);
        showModal.alert('참여 코드가 복사되었습니다: ' + roomId);
    };

    const voteUrl = `${window.location.origin}/vote/${roomId}`;

    const downloadQRCode = () => {
        const canvas = document.getElementById('room-qr-code');
        if (!canvas) return;
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${roomConfig.title}_참여QR.png`;
        link.href = url;
        link.click();
    };

    if (!roomConfig) return null;

    // Derived Stats
    const totalVoters = roomConfig.totalVoters || 0;
    const votedCount = Object.values(voters).filter(v => v.isUsed).length; // Based on 'isUsed' flag
    // Note: 'votes' array length might be safer if we trust server events more.
    const participationRate = totalVoters > 0 ? Math.round((votedCount / totalVoters) * 100) : 0;

    // School Vote Specifics
    const isSchoolVote = roomConfig?.type === 'school';

    const uniqueGrades = React.useMemo(() => {
        if (!isSchoolVote) return [];
        const grades = new Set();
        Object.values(voters).forEach(v => {
            if (v.grade) grades.add(v.grade.toString());
        });
        return Array.from(grades).sort((a, b) => parseInt(a) - parseInt(b));
    }, [voters, isSchoolVote]);

    const displayedVoters = React.useMemo(() => {
        let allVotersList = Object.values(voters);

        // 정렬: 학년 -> 반 -> 번호 순서 (학급 투표는 번호순)
        allVotersList.sort((a, b) => {
            if (isSchoolVote) {
                if (a.grade !== b.grade) return (parseInt(a.grade) || 0) - (parseInt(b.grade) || 0);
                if (a.class !== b.class) return (parseInt(a.class) || 0) - (parseInt(b.class) || 0);
            }
            return (parseInt(a.studentId) || 0) - (parseInt(b.studentId) || 0);
        });

        if (isSchoolVote && activeTab !== 'all') {
            return allVotersList.filter(v => v.grade?.toString() === activeTab);
        }
        return allVotersList;
    }, [voters, isSchoolVote, activeTab]);


    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">

            {/* 투표 시작 확인 모달 */}
            {showStartModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
                        <h2 className="text-xl font-extrabold text-gray-900 mb-3">투표를 시작하시겠습니까?</h2>
                        <p className="text-gray-500 text-sm leading-relaxed mb-6">
                            투표가 시작되면 유권자들이 바로 투표에 참여할 수 있습니다.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleConfirmStart}
                                className="flex-1 py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl transition-colors shadow-md"
                            >
                                예, 시작합니다
                            </button>
                            <button
                                onClick={() => setShowStartModal(false)}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                            >
                                아니오
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 투표 취소 확인 모달 */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
                        <h2 className="text-xl font-extrabold text-gray-900 mb-2">투표를 취소하시겠습니까?</h2>
                        <p className="text-gray-500 text-sm leading-relaxed mb-6">
                            지금까지 득표된 데이터와 의견을 모두 초기화하고 대기 화면으로 돌아갑니다.<br />
                            <span className="text-indigo-600 font-semibold">후보자 · 유권자 명단 설정은 유지됩니다.</span>
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleConfirmCancel}
                                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-md"
                            >
                                예, 취소합니다
                            </button>
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                            >
                                돌아가기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 투표 종료 확인 모달 */}
            {showEndModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
                        <h2 className="text-xl font-extrabold text-gray-900 mb-3">투표를 종료하시겠습니까?</h2>

                        {/* 참여율 미달 경고 */}
                        {participationRate < 100 && (
                            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
                                <span className="text-orange-500 text-lg mt-0.5">⚠</span>
                                <p className="text-orange-700 text-sm font-medium">
                                    아직 <span className="font-extrabold">{totalVoters - votedCount}명</span>이 투표에 참여하지 않았습니다.({participationRate}% 완료)<br />
                                    그래도 종료하시겠습니까?
                                </p>
                            </div>
                        )}

                        <p className="text-gray-500 text-sm leading-relaxed mb-6">
                            종료하면 결과 확인 화면으로 이동합니다.<br />
                            <span className="text-gray-700 font-semibold">공개 모드, 체크모드 결과가 자동 저장</span> 됩니다.<br />
                            결과 확인 화면에서 직접 다운로드 할 수도 있습니다.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={handleConfirmEnd}
                                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-md"
                            >
                                예, 종료합니다
                            </button>
                            <button
                                onClick={() => setShowEndModal(false)}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                            >
                                돌아가기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex items-center gap-2 group transition-all mr-2">
                        <span className="text-2xl group-hover:scale-110 transition-transform">☝️</span>
                        <span className="font-extrabold text-xl text-gray-900 tracking-tight">한표꾹</span>
                    </Link>
                    <div className="h-6 w-[1px] bg-gray-200 mx-1"></div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            {roomConfig.title}
                            <span className={`text - xs px - 2 py - 0.5 rounded - full ${isStarted ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-500'} `}>
                                {isStarted ? 'LIVE' : '대기중'}
                            </span>
                        </h1>
                        <p className="text-xs text-gray-500">
                            {roomConfig.type === 'class' ? '학급 투표' : '학교 투표'} | ID: {roomId}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Control Buttons */}
                    {!isStarted ? (
                        <button
                            onClick={handleStartVoting}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-all font-bold shadow-md hover:shadow-teal-500/20"
                        >
                            <Play className="w-4 h-4" /> 투표 시작
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleResetToStart}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-bold"
                            >
                                <RotateCcw className="w-4 h-4" /> 투표 취소하기
                            </button>
                            <button
                                onClick={handleEndVoting}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-bold shadow-md hover:shadow-red-500/20"
                            >
                                <Square className="w-4 h-4 fill-current" /> 투표 종료
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-grow p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">

                {/* Left: Info & Code */}
                <div className="space-y-6">
                    {/* Room Code Card */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white text-center shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-white/5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent pointer-events-none"></div>
                        <p className="text-indigo-100 font-medium mb-2 uppercase tracking-wide">참여 코드</p>
                        <div
                            onClick={copyRoomCode}
                            className="bg-white/20 backdrop-blur-sm rounded-xl py-4 px-6 inline-flex items-center gap-3 cursor-pointer hover:bg-white/30 transition-colors"
                        >
                            <span className="text-5xl font-mono font-bold tracking-wider drop-shadow-md">{roomId}</span>
                            <Copy className="w-6 h-6 opacity-70" />
                        </div>
                        <p className="text-xs text-indigo-200 mt-4 opacity-80">학생들에게 이 코드를 공유하세요</p>
                    </div>

                    {/* QR Code Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                        <h3 className="text-gray-500 font-bold mb-4 flex items-center gap-2 w-full justify-start">
                            <QrCode className="w-5 h-5" /> 코드로 참여하기
                        </h3>
                        <div className="bg-white p-2 rounded-xl border border-gray-100 mb-4 shadow-inner">
                            <QRCodeCanvas
                                id="room-qr-code"
                                value={voteUrl}
                                size={160}
                                level="H"
                                includeMargin={true}
                                imageSettings={{
                                    src: "/favicon.ico", // Option for logo
                                    x: undefined,
                                    y: undefined,
                                    height: 24,
                                    width: 24,
                                    excavate: true,
                                }}
                            />
                        </div>
                        <button
                            onClick={downloadQRCode}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-bold w-full justify-center"
                        >
                            <Download className="w-4 h-4" /> QR코드 이미지 저장
                        </button>
                    </div>



                    {/* Options Summary */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 font-bold mb-4">설정 정보</h3>
                        <div className="space-y-2">

                            {/* 간단 투표 모드 - 학급 투표만 */}
                            {!isSchoolVote && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">간단 투표 모드</span>
                                    <span className={roomConfig.options?.simpleVote ? "text-green-600 font-bold" : "text-gray-400"}>
                                        {roomConfig.options?.simpleVote ? "ON" : "OFF"}
                                    </span>
                                </div>
                            )}

                            {/* 복수 투표 */}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">복수 투표</span>
                                <span className={roomConfig.options?.multipleVoting ? "text-green-600 font-bold" : "text-gray-400"}>
                                    {roomConfig.options?.multipleVoting ? "ON" : "OFF"}
                                </span>
                            </div>

                            {/* 순위 투표 - 복수 투표 ON일 때만 */}
                            {roomConfig.options?.multipleVoting && (
                                <div className="flex items-center justify-between text-sm pl-4">
                                    <span className="text-gray-500">└ 순위 투표</span>
                                    <span className={roomConfig.options?.rankedVoting ? "text-green-600 font-bold" : "text-gray-400"}>
                                        {roomConfig.options?.rankedVoting ? "ON" : "OFF"}
                                    </span>
                                </div>
                            )}

                            {/* 의견 쓰기 모드 */}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">의견 쓰기 모드</span>
                                <span className={roomConfig.options?.opinionMode ? "text-green-600 font-bold" : "text-gray-400"}>
                                    {roomConfig.options?.opinionMode ? "ON" : "OFF"}
                                </span>
                            </div>

                            {/* 개인 코드 - 학교 투표만 */}
                            {isSchoolVote && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">개인 코드</span>
                                    <span className="text-indigo-600 font-bold">
                                        {roomConfig.options?.onlyNumericCodes ? "숫자만" : "혼합"}
                                    </span>
                                </div>
                            )}

                            <div className="border-t border-gray-100 pt-2 mt-2" />

                            {/* 실시간 중계 */}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">실시간 중계</span>
                                <span className={isRealtime ? "text-green-600 font-bold" : "text-gray-400"}>
                                    {isRealtime ? "ON" : "OFF"}
                                </span>
                            </div>

                            {/* 투표 모드 */}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">투표 모드</span>
                                <span className="text-indigo-600 font-bold">
                                    {voterDisplayMode === 'check' ? '체크 모드' : voterDisplayMode === 'secret' ? '비밀 모드' : '공개 모드'}
                                </span>
                            </div>

                            {/* 암호화 */}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">암호화 (E2EE)</span>
                                <span className="text-indigo-600 font-bold flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> 적용됨
                                </span>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Center: Candidates (Results) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Award className="w-5 h-5 text-indigo-500" />
                                <span>후보자 현황</span>
                                {isRealtime && isStarted && (
                                    <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                                        LIVE Result
                                    </span>
                                )}
                            </h2>
                            <div className="flex flex-col items-end">
                                <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors" title="후보자의 실시간 득표수를 보여줍니다.">
                                    <input
                                        type="checkbox"
                                        checked={isRealtime}
                                        onChange={handleToggleRealtime}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                    />
                                    <span className="text-sm font-bold text-gray-700">실시간 중계</span>
                                </label>
                                <span className="text-[11px] text-gray-500 mt-1">체크 시 후보자의 득표수를 실시간으로 노출합니다.</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {roomConfig.candidates.map(candidate => (
                                <div key={candidate.id} className="border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:border-indigo-100 transition-colors">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold text-gray-500">
                                        {candidate.symbol}
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-lg text-gray-900">{candidate.name}</h3>
                                        <p className="text-xs text-gray-400">기호 {candidate.symbol}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-extrabold text-indigo-600">
                                            {isRealtime
                                                ? Object.values(voters).reduce((acc, v) => {
                                                    // Count if this candidate was selected either directly or within choices
                                                    if (v.votedFor === candidate.id) return acc + 1;
                                                    if (v.choices && v.choices.some(c => c.candidateId === candidate.id)) return acc + 1;
                                                    return acc;
                                                }, 0)
                                                : '-'}
                                        </span>
                                        <span className="text-xs text-gray-400 block">표</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 실시간 참여 현황 (Moved below Candidates) */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-500 font-bold flex items-center gap-2 text-lg">
                                <Users className="w-5 h-5 text-indigo-500" /> 실시간 참여 현황
                            </h3>
                            <div className="text-teal-600 font-bold bg-teal-50 px-3 py-1 rounded-full text-sm">
                                {participationRate}% 참여완료
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex-grow">
                                <div className="w-full bg-gray-100 rounded-full h-5 overflow-hidden shadow-inner">
                                    <div
                                        className="bg-gradient-to-r from-teal-400 to-teal-500 h-full rounded-full transition-all duration-700 ease-out shadow-sm"
                                        style={{ width: `${participationRate}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="shrink-0 flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold text-gray-900 tabular-nums">{votedCount}</span>
                                <span className="text-gray-400 font-bold text-lg">/ {totalVoters}명</span>
                            </div>
                        </div>
                    </div>

                    {/* Voter Status Board */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-[500px]">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-500" />
                                투표 참여자 현황
                            </h2>
                            <div className="flex items-center gap-3">
                                {/* Only show download button if not simpleVote */}
                                {!roomConfig.options.simpleVote && (
                                    <button
                                        onClick={handleDownloadCodes}
                                        className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors flex items-center gap-2 text-sm border border-gray-200"
                                        title="개별 코드가 포함된 암호 명단을 다운로드합니다."
                                    >
                                        <FileSpreadsheet className="w-4 h-4" />
                                        코드 다운로드
                                    </button>
                                )}
                                <select
                                    value={voterDisplayMode}
                                    onChange={handleDisplayModeChange}
                                    className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block px-3 py-1.5 font-medium shadow-sm outline-none cursor-pointer"
                                >
                                    <option value="public">공개 모드</option>
                                    <option value="check">체크 모드</option>
                                    <option value="secret">비밀 모드</option>
                                </select>
                            </div>
                        </div>

                        {/* Grade Tabs (School Vote Only) */}
                        {isSchoolVote && uniqueGrades.length > 0 && (
                            <div className="flex gap-2 mb-4 border-b border-gray-100 pb-2 overflow-x-auto">
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    전체
                                </button>
                                {uniqueGrades.map(grade => (
                                    <button
                                        key={grade}
                                        onClick={() => setActiveTab(grade)}
                                        className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${activeTab === grade ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        {grade}학년
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                            <div className={`grid gap-3 content-start ${isSchoolVote ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 md:grid-cols-4'}`}>
                                {displayedVoters.map((voter, index) => {
                                    const votedCandidate = roomConfig.candidates.find(c => c.id === voter.votedFor);

                                    return (
                                        <div
                                            key={index}
                                            className={`p-3 rounded-xl border flex transition-colors ${isSchoolVote ? 'flex-col items-start gap-1 justify-start' : 'flex-col items-center justify-center text-center'} ${voterDisplayMode === 'secret' ? 'bg-gray-50 border-gray-100 opacity-90' :
                                                voter.isUsed
                                                    ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                                    : 'bg-gray-50 border-gray-100 opacity-70'
                                                }`}
                                        >
                                            <div className="flex items-center gap-1.5 w-full">
                                                <div className={`rounded-full shrink-0 flex items-center justify-center bg-white shadow-sm border border-gray-100 ${isSchoolVote ? 'w-5 h-5' : 'w-10 h-10 mb-2'}`}>
                                                    {voterDisplayMode === 'secret' ? (
                                                        <Lock className={`text-gray-400 ${isSchoolVote ? 'w-3 h-3' : 'w-4 h-4'}`} />
                                                    ) : voter.isUsed ? (
                                                        <div className={`text-indigo-600 font-bold flex items-center justify-center ${isSchoolVote ? 'w-3 h-3 text-[10px]' : 'w-5 h-5'}`}>✓</div>
                                                    ) : (
                                                        <div className={`bg-gray-300 rounded-full ${isSchoolVote ? 'w-1.5 h-1.5' : 'w-3 h-3'}`} />
                                                    )}
                                                </div>
                                                {isSchoolVote && (
                                                    <span className="text-[11px] text-gray-500 font-bold tracking-tight truncate">
                                                        {voter.grade ? `${voter.grade}학년 ` : ''}{voter.class ? `${voter.class}반` : ''}
                                                    </span>
                                                )}
                                            </div>

                                            <div className={`flex flex-col flex-grow min-w-0 ${isSchoolVote ? 'text-left w-full' : 'w-full px-1'}`}>
                                                <span className={`font-bold text-gray-800 truncate w-full ${isSchoolVote ? 'text-[13px] tracking-tight' : 'text-sm'}`}>
                                                    {isSchoolVote && voter.studentId ? `${voter.studentId}번 ` : ''}{voter.name}
                                                </span>

                                                {/* Status Pill or Public Info horizontally stacked */}
                                                <div className={`flex flex-wrap items-center gap-1.5 mt-1 ${isSchoolVote ? 'justify-start' : 'justify-center mx-1'} truncate w-full`}>
                                                    {voterDisplayMode !== 'secret' && (
                                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${voter.isUsed ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-500'
                                                            }`}>
                                                            {voter.isUsed ? '투표 완료' : '미참여'}
                                                        </span>
                                                    )}

                                                    {/* Public Mode Detail */}
                                                    {voterDisplayMode === 'public' && voter.isUsed && (
                                                        <span className="text-[10px] font-bold text-indigo-600 truncate">
                                                            {(() => {
                                                                const opts = roomConfig?.options || {};
                                                                const choices = voter.choices || (voter.votedFor ? [{ candidateId: voter.votedFor, rank: 1 }] : []);
                                                                if (choices.length === 0) return '알 수 없음';

                                                                const getName = (id) => roomConfig.candidates.find(c => c.id === id)?.name || '알 수 없음';
                                                                const getSymbol = (id) => roomConfig.candidates.find(c => c.id === id)?.symbol || '';

                                                                if (opts.multipleVoting && opts.rankedVoting) {
                                                                    // Show top 3 ranks
                                                                    return choices
                                                                        .sort((a, b) => a.rank - b.rank)
                                                                        .slice(0, 3)
                                                                        .map(c => `${c.rank}위:${getName(c.candidateId)}`)
                                                                        .join(', ');
                                                                }
                                                                if (opts.multipleVoting) {
                                                                    // Show all selections
                                                                    return choices.map(c => getName(c.candidateId)).join(', ');
                                                                }
                                                                const single = roomConfig.candidates.find(c => c.id === voter.votedFor);
                                                                return single ? `${single.symbol}. ${single.name}` : '알 수 없음';
                                                            })()}
                                                        </span>
                                                    )}

                                                    {/* Secret Mode Detail */}
                                                    {voterDisplayMode === 'secret' && (
                                                        <span className="text-[10px] font-medium text-gray-400">
                                                            비밀 모드
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>

            </main >
        </div >
    );
};

export default AdminPage;
