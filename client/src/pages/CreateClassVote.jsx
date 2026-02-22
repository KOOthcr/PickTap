import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useModal } from '../contexts/ModalContext';
import { Plus, Trash2, Upload, User, Settings, Play, Users, FileSpreadsheet, AlertCircle } from 'lucide-react';
import readXlsxFile from 'read-excel-file';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const CreateClassVote = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const socket = useSocket();
    const showModal = useModal();
    // Hardcode type to 'class'
    const type = 'class';
    const { name, count } = location.state || {}; // Basic info from Main Page

    // Redirect if no data
    useEffect(() => {
        if (!name || !count) {
            showModal.alert('잘못된 접근입니다.');
            navigate('/');
        }
    }, [name, count, navigate]);

    // Initial State Setup
    const [candidates, setCandidates] = useState([
        { id: 1, name: '', symbol: '1', photo: null },
        { id: 2, name: '', symbol: '2', photo: null },
    ]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [options, setOptions] = useState({
        simpleVote: false,      // 간단 투표 (이름만 입력)
        multipleVoting: false,  // 복수 투표
        rankedVoting: false,    // 순위 투표
        opinionMode: false,     // 의견 쓰기 모드
        realtimeResults: false, // 실시간 후보 득표 상황
        publicVote: false,      // 공개 투표
        randomOrder: false,     // 후보자 기호번호 랜덤
        oneVotePerDevice: false, // 기기당 1인 1표 제한
        maxChoices: 2           // 복수 투표 시 최대 선택 가능 수
    });

    // Voter List State
    const [voterMode, setVoterMode] = useState('auto'); // 'auto', 'manual', 'excel'
    const [manualVoters, setManualVoters] = useState([]); // Separate state for manual
    const [excelVoters, setExcelVoters] = useState([]);   // Separate state for excel
    const fileInputRef = useRef(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial population for 'auto' mode display (virtual)
    const [autoVoterCount, setAutoVoterCount] = useState(parseInt(count || 0, 10));
    const [autoVoters, setAutoVoters] = useState([]); // Store generated auto voters with codes


    // Populate voters for Manual Mode
    useEffect(() => {
        if (voterMode === 'manual' && manualVoters.length === 0 && count) {
            const initialVoters = Array.from({ length: parseInt(count, 10) }, (_, i) => ({
                id: Date.now() + i,
                name: '',
                studentId: (i + 1).toString()
            }));
            setManualVoters(initialVoters);
        }
    }, [voterMode, count]);


    // --- Candidate Handlers ---
    const addCandidate = () => {
        const nextId = candidates.length > 0 ? Math.max(...candidates.map(c => c.id)) + 1 : 1;
        setCandidates([...candidates, { id: nextId, name: '', symbol: String(nextId), photo: null }]);
    };

    const removeCandidate = (id) => {
        if (candidates.length <= 1) {
            showModal.alert('최소 1명의 후보가 필요합니다.');
            return;
        }
        setCandidates(candidates.filter(c => c.id !== id));
    };

    const updateCandidate = (id, field, value) => {
        setCandidates(candidates.map(c => c.id === id ? { ...c, [field]: value } : c));
    };


    // --- Voter Handlers ---
    const handleAddManualVoter = () => {
        const nextStudentId = manualVoters.length > 0
            ? Math.max(...manualVoters.map(v => parseInt(v.studentId || 0, 10))) + 1
            : 1;
        setManualVoters([...manualVoters, { id: Date.now(), name: '', studentId: nextStudentId.toString() }]);
    };

    const handleRemoveVoter = (id) => {
        if (voterMode === 'manual') {
            setManualVoters(manualVoters.filter(v => v.id !== id));
        } else if (voterMode === 'excel') {
            setExcelVoters(excelVoters.filter(v => v.id !== id));
        }
    };

    const handleExcelUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const processRows = (rows) => {
            // Assume Row 1 is header, or simple format: [Name, StudentID]
            // Skip header if it looks like one (optional logic)
            const newVoters = rows.slice(1).map((row, index) => ({
                id: Date.now() + index,
                name: row[0]?.toString() || '',
                studentId: row[1]?.toString() || '',
            })).filter(v => v.name); // Filter out empty names

            if (newVoters.length === 0) {
                showModal.alert('유효한 데이터가 없습니다. 양식에 맞게 작성해주세요.');
                return;
            }

            setExcelVoters(newVoters);
            showModal.alert(`${newVoters.length}명의 명단을 불러왔습니다.`);

            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };

        if (file.name.endsWith('.csv')) {
            Papa.parse(file, {
                complete: (results) => {
                    processRows(results.data);
                },
                error: (error) => {
                    console.error('CSV Parsing Error:', error);
                    showModal.alert('CSV 파일을 읽는 중 오류가 발생했습니다.');
                }
            });
        } else {
            readXlsxFile(file).then((rows) => {
                processRows(rows);
            }).catch((error) => {
                console.error('Excel Parsing Error:', error);
                showModal.alert('엑셀 파일을 읽는 중 오류가 발생했습니다.');
            });
        }
    };

    const handleDownloadTemplate = () => {
        // Create a simple CSV content with BOM for UTF-8 support in Excel
        const csvContent = "\uFEFF이름,번호\n표1,1\n표2,2\n";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', '투표_유권자_명단_양식.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadCodes = async () => {
        if (options.simpleVote) {
            showModal.alert('간단 투표 모드에서는 개별 코드가 필요하지 않습니다.');
            return;
        }

        let currentVoters = [];
        if (voterMode === 'manual') {
            currentVoters = manualVoters;
        } else if (voterMode === 'excel') {
            currentVoters = excelVoters;
        } else if (voterMode === 'auto') {
            if (autoVoters.length === autoVoterCount) {
                // Sanitize existing names to remove spaces (legacy check)
                currentVoters = autoVoters.map(v => ({ ...v, name: v.name.replace(/\s+/g, '') }));
            } else {
                currentVoters = Array.from({ length: autoVoterCount }, (_, i) => ({
                    name: `표${i + 1}`,
                    studentId: `${i + 1}`
                }));
            }
        }

        if (currentVoters.length === 0) {
            showModal.alert('유권자 명단이 비어있습니다.');
            return;
        }

        // Generate codes for current voters and update state
        const updatedVoters = currentVoters.map(v => {
            if (v.accessCode) return v;
            let code;
            if (type === 'class') {
                code = Math.floor(1000 + Math.random() * 9000).toString();
            } else {
                code = Math.random().toString(36).substring(2, 8).toUpperCase();
            }
            return { ...v, accessCode: code };
        });

        if (voterMode === 'manual') setManualVoters(updatedVoters);
        else if (voterMode === 'excel') setExcelVoters(updatedVoters);
        else if (voterMode === 'auto') setAutoVoters(updatedVoters);

        // Create Workbook
        const workbook = new ExcelJS.Workbook();

        // ---------------------------------------------------------
        // Sheet 1: Basic List (Number, Name, Access Code)
        // ---------------------------------------------------------
        const listSheet = workbook.addWorksheet('표_개별_접속코드');
        listSheet.columns = [
            { header: '번호', key: 'studentId', width: 10 },
            { header: '이름', key: 'name', width: 15 },
            { header: '접속코드', key: 'accessCode', width: 15 },
        ];

        // Style Header
        listSheet.getRow(1).font = { bold: true };
        listSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Add Data
        updatedVoters.forEach(v => {
            listSheet.addRow({
                studentId: v.studentId,
                name: v.name,
                accessCode: v.accessCode
            });
        });

        // Center align all data cells
        listSheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });
        });

        // ---------------------------------------------------------
        // Sheet 2: Print Layout (Card Grid)
        // 3 columns of cards per row. Each card uses 2 Excel columns.
        // Card Structure:
        // Row 1: Left: '번호', Right: '이름'
        // Row 2: Left: [ID], Right: [Name]
        // Row 3: Merged: '접속코드'
        // Row 4: Merged: [Code]
        // ---------------------------------------------------------
        const printSheet = workbook.addWorksheet('표_개별_접속코드(인쇄용)');

        // Define column widths for the grid
        // Card 1 (A,B), Gap (C), Card 2 (D,E), Gap (F), Card 3 (G,H)
        const colWidth = 12;
        const gapWidth = 2; // Narrow gap column
        printSheet.columns = [
            { width: colWidth }, { width: colWidth }, { width: gapWidth },
            { width: colWidth }, { width: colWidth }, { width: gapWidth },
            { width: colWidth }, { width: colWidth }
        ];

        const cardsPerRow = 3;
        const rowsPerCard = 5; // 4 data rows + 1 gap row

        updatedVoters.forEach((v, index) => {
            const cardIndex = index % cardsPerRow; // 0, 1, 2
            const rowIndex = Math.floor(index / cardsPerRow); // 0, 1, 2...

            // Calculate exact start row and col for this card
            const startRow = (rowIndex * rowsPerCard) + 1;
            // Card 1 starts at col A(1), Card 2 at D(4), Card 3 at G(7)
            const startCol = (cardIndex * 3) + 1;

            // --- Row 1: Header (Number | Name) ---
            const cellNumLabel = printSheet.getCell(startRow, startCol);
            cellNumLabel.value = '번호';
            cellNumLabel.style = { font: { bold: true }, alignment: { horizontal: 'center' }, border: { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } } };

            const cellNameLabel = printSheet.getCell(startRow, startCol + 1);
            cellNameLabel.value = '이름';
            cellNameLabel.style = { font: { bold: true }, alignment: { horizontal: 'center' }, border: { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } } };

            // --- Row 2: Data (ID | Name) ---
            const cellNumVal = printSheet.getCell(startRow + 1, startCol);
            cellNumVal.value = v.studentId;
            cellNumVal.style = { alignment: { horizontal: 'center' }, border: { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } } };

            const cellNameVal = printSheet.getCell(startRow + 1, startCol + 1);
            cellNameVal.value = v.name;
            cellNameVal.style = { alignment: { horizontal: 'center' }, border: { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } } };

            // --- Row 3: Header (Access Code - Merged) ---
            const cellCodeLabel = printSheet.getCell(startRow + 2, startCol);
            const cellCodeLabelRight = printSheet.getCell(startRow + 2, startCol + 1);
            cellCodeLabel.value = '접속코드';
            printSheet.mergeCells(startRow + 2, startCol, startRow + 2, startCol + 1);
            const codeLabelStyle = { font: { bold: true }, alignment: { horizontal: 'center' }, border: { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } } };
            cellCodeLabel.style = codeLabelStyle;
            cellCodeLabelRight.style = codeLabelStyle; // Apply to right cell as well

            // --- Row 4: Data (Access Code - Merged) ---
            const cellCodeVal = printSheet.getCell(startRow + 3, startCol);
            const cellCodeValRight = printSheet.getCell(startRow + 3, startCol + 1);
            cellCodeVal.value = v.accessCode;
            cellCodeVal.font = { size: 12, bold: true }; // Make code larger
            printSheet.mergeCells(startRow + 3, startCol, startRow + 3, startCol + 1);
            const codeValStyle = { alignment: { horizontal: 'center', vertical: 'middle' }, border: { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } } };
            cellCodeVal.style = codeValStyle;
            cellCodeValRight.style = codeValStyle; // Apply to right cell as well
        });

        // Save file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, '표_개별_접속코드.xlsx');
    };


    // --- Create Room Handler ---
    const handleCreateRoom = () => {
        // Validation
        if (candidates.some(c => !c.name.trim())) {
            showModal.alert('모든 후보자의 이름을 입력해주세요.');
            return;
        }

        if (voterMode === 'manual') {
            if (manualVoters.some(v => !v.name.trim())) {
                showModal.alert('모든 유권자의 이름을 입력해주세요.');
                return;
            }
        } else if (voterMode !== 'auto') {
            if (voterMode === 'manual' && manualVoters.length === 0) {
                showModal.alert('유권자 명단을 입력하거나 "자동 생성"을 선택해주세요.');
                return;
            }
            if (voterMode === 'excel' && excelVoters.length === 0) {
                showModal.alert('엑셀 파일을 업로드해주세요.');
                return;
            }
        }

        // Socket connection check
        if (!socket || !socket.connected) {
            showModal.alert('서버에 연결되지 않았습니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        // Confirm: show modal instead of window.confirm
        setShowConfirmModal(true);
    };

    // Actual room creation (called from modal confirm)
    const proceedToCreate = () => {

        // Safety timeout: reset after 10 seconds if no response
        const timeout = setTimeout(() => {
            setIsSubmitting(false);
            showModal.alert('서버 응답이 없습니다. 서버가 실행 중인지 확인해주세요.');
        }, 10000);

        // 1. Generate Room ID (Invitation Code)
        // Room ID is always a 6-digit numeric code
        const generateRoomId = () => {
            let code = '';
            for (let i = 0; i < 6; i++) {
                code += Math.floor(Math.random() * 10);
            }
            return code;
        };
        const newRoomId = generateRoomId();

        // 2. Prepare Candidates (Shuffle if needed)
        let finalCandidates = [...candidates];
        if (options.randomOrder) {
            // Fisher-Yates Shuffle
            for (let i = finalCandidates.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [finalCandidates[i], finalCandidates[j]] = [finalCandidates[j], finalCandidates[i]];
            }
            // Re-assign symbols (1, 2, 3...)
            finalCandidates = finalCandidates.map((c, index) => ({
                ...c,
                symbol: (index + 1).toString()
            }));
        }

        // 3. Generate Voter List with Access Codes
        // Logic: Generate a unique random code for each voter.
        const generatedVoters = {};

        let targetCount = 0;
        let voterListSrc = [];

        if (voterMode === 'auto') {
            targetCount = autoVoterCount;
            if (autoVoters.length === targetCount) {
                voterListSrc = autoVoters;
            } else {
                voterListSrc = Array.from({ length: targetCount }, (_, i) => ({ name: `표${i + 1}`, studentId: `${i + 1}` }));
            }
        } else if (voterMode === 'manual') {
            targetCount = manualVoters.length;
            voterListSrc = manualVoters;
        } else if (voterMode === 'excel') {
            targetCount = excelVoters.length;
            voterListSrc = excelVoters;
        }

        voterListSrc.forEach((v, index) => {
            // Generate unique voter code (e.g., 6 chars mostly unique)
            let code = v.accessCode; // Use existing code if generated via Download
            if (!code) {
                do {
                    if (type === 'class') {
                        code = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digits
                    } else {
                        code = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 chars
                    }
                } while (generatedVoters[code]);
            }

            generatedVoters[code] = {
                name: v.name,
                studentId: v.studentId,
                isUsed: false,
                joined: false
            };
        });

        // 4. Prepare Config
        const config = {
            title: name,
            type: type,
            totalVoters: targetCount,
            candidates: finalCandidates,
            options: options,
            publicKey: null,
            allowRealtime: options.realtimeResults
        };

        // 5. Emit to Server
        socket.emit('createRoom', {
            roomId: newRoomId,
            config,
            voters: generatedVoters,
            publicKey: null
        }, (response) => {
            clearTimeout(timeout);
            setIsSubmitting(false);
            if (response.success) {
                // Navigate to Admin Page with initial data
                navigate(`/admin/${newRoomId}`, { state: { roomId: newRoomId, roomConfig: config, generatedVoters } });
            } else {
                showModal.alert('방 생성 실패: ' + response.message);
            }
        });
    };

    return (
        <div className="min-h-screen bg-indigo-50 p-6 flex flex-col items-center">

            {/* Confirm Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-fadeIn">
                        <div className="flex items-center gap-2 mb-3 text-amber-600">
                            <AlertCircle className="w-6 h-6" />
                            <h2 className="text-xl font-extrabold text-gray-900">투표를 시작할까요?</h2>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed mb-6">
                            선거 본부 입장 시 후보자나 투표 참여자, 설정을 <span className="text-red-500 font-bold underline decoration-red-200 underline-offset-4">더 이상 수정할 수 없습니다.</span><br />
                            모든 준비가 끝났나요?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowConfirmModal(false); proceedToCreate(); }}
                                className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-md"
                            >
                                지금 시작
                            </button>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                            >
                                다시 확인할게요
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="w-full max-w-6xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <span className="text-sm font-bold text-indigo-500 uppercase tracking-wider">
                        {type === 'class' ? '학급 투표' : '학교 투표'} 설정
                    </span>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-1">{name}</h1>
                </div>
                <div className="bg-white px-5 py-3 rounded-xl shadow-sm text-gray-600 border border-indigo-100">
                    투표 인원: <span className="font-bold text-indigo-600 text-lg">{count}명</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-6xl items-start">

                {/* Left Column: Candidates (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-md border border-indigo-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <User className="w-5 h-5 text-indigo-500" />
                                후보자 등록
                            </h2>
                            <button
                                onClick={addCandidate}
                                className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-semibold flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" /> 추가
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {candidates.map((candidate, index) => (
                                <div key={candidate.id} className="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-300 transition-colors relative group">
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">기호</span>
                                            <input
                                                type="text"
                                                value={candidate.symbol}
                                                onChange={(e) => updateCandidate(candidate.id, 'symbol', e.target.value)}
                                                className="w-10 bg-white border border-gray-300 rounded-md px-1 py-1 text-center font-bold text-gray-700 text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
                                            />
                                        </div>
                                        <div className="flex-grow">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">이름</span>
                                            <input
                                                type="text"
                                                placeholder={`후보자 ${index + 1}`}
                                                value={candidate.name}
                                                onChange={(e) => updateCandidate(candidate.id, 'name', e.target.value)}
                                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-200 outline-none font-medium"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => removeCandidate(candidate.id)}
                                        className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                                        title="삭제"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Center Column: Voter List (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-md border border-indigo-100 flex flex-col">
                        <div className="flex items-center gap-2 mb-6">
                            <Users className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-xl font-bold text-gray-800">투표자 명부</h2>
                        </div>

                        {/* Tabs */}
                        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                            <button
                                onClick={() => setVoterMode('auto')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${voterMode === 'auto' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                자동 생성
                            </button>
                            <button
                                onClick={() => setVoterMode('manual')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${voterMode === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                수동 입력
                            </button>
                            <button
                                onClick={() => setVoterMode('excel')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${voterMode === 'excel' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                엑셀 입력
                            </button>
                        </div>

                        {/* Content based on Tab */}
                        <div className="flex-grow flex flex-col">
                            {voterMode === 'auto' && (
                                <div className="text-center py-8 bg-indigo-50 rounded-xl border border-indigo-100 flex-grow flex flex-col justify-center items-center">
                                    <Settings className="w-12 h-12 text-indigo-300 mb-3 animate-spin-slow" />
                                    <p className="text-indigo-900 font-bold mb-1">자동 명부 생성 모드</p>
                                    <p className="text-sm text-gray-500 px-4">
                                        총 <span className="font-bold text-indigo-600">{autoVoterCount}개</span>의 표에 대해<br />
                                        순차적 번호(1, 2...)와 이름(표1, 표2...) 및<br />
                                        개별 접속 코드가 자동으로 생성됩니다.
                                    </p>
                                </div>
                            )}

                            {voterMode === 'manual' && (
                                <div className="flex flex-col h-full">
                                    <div className="flex justify-end mb-2">
                                        <button
                                            onClick={handleAddManualVoter}
                                            className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-semibold flex items-center gap-1"
                                        >
                                            <Plus className="w-4 h-4" /> 추가
                                        </button>
                                    </div>
                                    <div className="flex-grow bg-gray-50 rounded-xl border border-gray-200 p-3 overflow-y-auto max-h-[300px] custom-scrollbar">
                                        {manualVoters.map((v, index) => (
                                            <li key={v.id} className="flex items-center gap-1.5">
                                                <div className="flex-1 min-w-0 flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-lg border border-gray-100 shadow-sm text-sm">
                                                    <span className="text-gray-400 w-5 text-center text-xs flex-shrink-0">{index + 1}</span>
                                                    <input
                                                        type="text"
                                                        placeholder="번호"
                                                        value={v.studentId}
                                                        onChange={(e) => {
                                                            const newVoters = [...manualVoters];
                                                            newVoters[index].studentId = e.target.value;
                                                            setManualVoters(newVoters);
                                                        }}
                                                        className="w-12 px-1 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-indigo-200 outline-none text-center text-xs"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="이름"
                                                        value={v.name}
                                                        onChange={(e) => {
                                                            const newVoters = [...manualVoters];
                                                            newVoters[index].name = e.target.value;
                                                            setManualVoters(newVoters);
                                                        }}
                                                        className="flex-1 min-w-0 px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveVoter(v.id)}
                                                    className="flex-shrink-0 text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                                    title="유권자 삭제"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </div>
                                    <p className="text-right text-xs text-gray-500 mt-2">
                                        총 {manualVoters.length}명
                                    </p>
                                </div>
                            )}

                            {voterMode === 'excel' && (
                                <div className="flex-grow flex flex-col justify-center">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={handleDownloadTemplate}
                                            className="flex flex-col items-center justify-center p-6 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl border border-green-200 transition-all group"
                                        >
                                            <FileSpreadsheet className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                                            <span className="font-bold">양식 다운로드</span>
                                        </button>

                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept=".xlsx, .csv"
                                                className="hidden"
                                                ref={fileInputRef}
                                                onChange={handleExcelUpload}
                                            />
                                            <button
                                                onClick={() => fileInputRef.current.click()}
                                                className="w-full h-full flex flex-col items-center justify-center p-6 bg-blue-400 hover:bg-blue-500 text-white rounded-xl shadow-md transition-all group"
                                            >
                                                <Upload className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                                                <span className="font-bold">파일 업로드</span>
                                            </button>
                                        </div>
                                    </div>

                                    {excelVoters.length > 0 ? (
                                        <div className="mt-6 flex-grow flex flex-col h-full">
                                            <div className="flex items-center gap-2 mb-2 p-2 bg-green-50 rounded-lg text-green-700 font-bold justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-5 h-5" />
                                                    <span>총 {excelVoters.length}명 불러옴</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-normal text-green-600">수정 가능</span>
                                                    <button
                                                        onClick={() => setExcelVoters([...excelVoters, { id: Date.now(), name: '', studentId: '' }])}
                                                        className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-xs font-semibold flex items-center gap-1"
                                                    >
                                                        <Plus className="w-3 h-3" /> 추가
                                                    </button>
                                                </div>
                                            </div>

                                            <ul className="space-y-2">
                                                {excelVoters.map((v, index) => (
                                                    <li key={v.id} className="flex items-center gap-1.5">
                                                        <div className="flex-1 min-w-0 flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-lg border border-gray-100 shadow-sm text-sm">
                                                            <span className="text-gray-400 w-5 text-center text-xs flex-shrink-0">{index + 1}</span>
                                                            <input
                                                                type="text"
                                                                placeholder="번호"
                                                                value={v.studentId}
                                                                onChange={(e) => {
                                                                    const newVoters = [...excelVoters];
                                                                    newVoters[index].studentId = e.target.value;
                                                                    setExcelVoters(newVoters);
                                                                }}
                                                                className="w-12 px-1 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-indigo-200 outline-none text-center text-xs"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="이름"
                                                                value={v.name}
                                                                onChange={(e) => {
                                                                    const newVoters = [...excelVoters];
                                                                    newVoters[index].name = e.target.value;
                                                                    setExcelVoters(newVoters);
                                                                }}
                                                                className="flex-1 min-w-0 px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveVoter(v.id)}
                                                            className="flex-shrink-0 text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                                            title="유권자 삭제"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : (
                                        <p className="text-center text-gray-400 text-sm mt-6">
                                            다운로드한 양식에 이름을 작성하여 업로드해주세요.<br />
                                            (A열: 이름)
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Download Codes Button (Only if not Simple Vote) */}
                        {!options.simpleVote && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <button
                                    onClick={handleDownloadCodes}
                                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                    <FileSpreadsheet className="w-4 h-4" />
                                    개별 코드 다운로드 (.csv)
                                </button>
                                <p className="text-[10px] text-gray-400 text-center mt-1">
                                    * 다운로드 시 코드가 고정됩니다. 명단 수정 시 다시 다운로드해주세요.
                                </p>
                            </div>
                        )}
                    </div>

                </div>

                {/* Right Column: Options & Submit (3 cols) */}
                <div className="lg:col-span-3 flex flex-col">
                    {/* Options */}
                    <div className="bg-white rounded-2xl p-5 shadow-md border border-indigo-100 flex-grow flex flex-col">
                        <h2 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
                            <Settings className="w-4 h-4 text-gray-500" />
                            설정
                        </h2>

                        <div className="space-y-0.5 flex-grow">
                            <label className="flex items-start space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 group">
                                <input
                                    type="checkbox"
                                    checked={options.simpleVote}
                                    onChange={(e) => setOptions({ ...options, simpleVote: e.target.checked })}
                                    className="w-4 h-4 mt-0.5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                />
                                <div>
                                    <span className="text-gray-800 font-bold font-bold text-base block">간단 투표 모드</span>
                                    <span className="text-[12.5px] tracking-tight text-gray-500 leading-tight block group-hover:text-gray-600">투표자가 코드 없이 이름만 입력하여 투표합니다.</span>
                                </div>
                            </label>

                            <label className="flex items-start space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 group">
                                <input
                                    type="checkbox"
                                    checked={options.multipleVoting}
                                    onChange={(e) => setOptions({ ...options, multipleVoting: e.target.checked, rankedVoting: e.target.checked ? options.rankedVoting : false })}
                                    className="w-4 h-4 mt-0.5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                />
                                <div>
                                    <span className="text-gray-800 font-bold text-base block">복수 투표</span>
                                    <span className="text-[12.5px] tracking-tight text-gray-500 leading-tight block group-hover:text-gray-600">유권자가 2명 이상 후보에게 한 표씩 행사합니다.</span>
                                </div>
                            </label>

                            {/* Sub-option: Ranked Voting (only visible if multipleVoting is on) */}
                            {options.multipleVoting && (
                                <div className="flex items-center pl-8 pr-2 py-1 gap-1">
                                    <div className="flex items-center gap-0.5 bg-indigo-50 px-1.5 py-1 rounded border border-indigo-100 shadow-sm shrink-0">
                                        <input
                                            type="number"
                                            min="2"
                                            max="100"
                                            value={options.maxChoices}
                                            onChange={(e) => setOptions({ ...options, maxChoices: parseInt(e.target.value) || 2 })}
                                            className="w-8 bg-transparent text-indigo-600 font-bold text-sm outline-none text-center"
                                        />
                                        <span className="text-[10px] text-indigo-400 font-bold">명</span>
                                    </div>
                                    <label className="flex-grow flex items-start space-x-2 cursor-pointer p-1.5 rounded-lg hover:bg-indigo-50 transition-colors border border-transparent hover:border-indigo-200 group">
                                        <input
                                            type="checkbox"
                                            checked={options.rankedVoting}
                                            onChange={(e) => setOptions({ ...options, rankedVoting: e.target.checked })}
                                            className="w-4 h-4 mt-0.5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                        />
                                        <div>
                                            <span className="text-indigo-700 font-bold text-base block leading-tight">순위 투표</span>
                                            <span className="text-[12.5px] tracking-tight text-indigo-400 leading-tight block">선택한 순서대로 순위를 매깁니다.</span>
                                        </div>
                                    </label>
                                </div>
                            )}

                            <label className="flex items-start space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 group">
                                <input
                                    type="checkbox"
                                    checked={options.randomOrder}
                                    onChange={(e) => setOptions({ ...options, randomOrder: e.target.checked })}
                                    className="w-4 h-4 mt-0.5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                />
                                <div>
                                    <span className="text-gray-800 font-bold text-base block">후보자 기호 랜덤</span>
                                    <span className="text-[12.5px] tracking-tight text-gray-500 leading-tight block group-hover:text-gray-600">선거 본부 입장 시 후보자 <br />기호번호를 무작위로 섞습니다.</span>
                                </div>
                            </label>

                            <label className="flex items-start space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 group">
                                <input
                                    type="checkbox"
                                    checked={options.opinionMode}
                                    onChange={(e) => setOptions({ ...options, opinionMode: e.target.checked })}
                                    className="w-4 h-4 mt-0.5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                />
                                <div>
                                    <span className="text-gray-800 font-bold text-base block">의견 쓰기 모드</span>
                                    <span className="text-[12.5px] tracking-tight text-gray-500 leading-tight block group-hover:text-gray-600">투표 완료 후 투표자가 의견을 남길 수 있습니다.</span>
                                </div>
                            </label>

                            <label className="flex items-start space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 group">
                                <input
                                    type="checkbox"
                                    checked={options.oneVotePerDevice}
                                    onChange={(e) => setOptions({ ...options, oneVotePerDevice: e.target.checked })}
                                    className="w-4 h-4 mt-0.5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                />
                                <div>
                                    <span className="text-gray-800 font-bold text-base block">기기당 1인 1표 원칙</span>
                                    <span className="text-[12.5px] tracking-tight text-gray-500 leading-tight block group-hover:text-gray-600">한 기기에서 한 번만 투표할 수 있도록 제한합니다.</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Start Button */}
                    <div className="pt-3">
                        <button
                            onClick={handleCreateRoom}
                            disabled={isSubmitting}
                            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    생성 중...
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5 fill-current" />
                                    선거 본부 입장
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CreateClassVote;
