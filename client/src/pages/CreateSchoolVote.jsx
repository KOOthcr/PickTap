import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { Plus, Trash2, Upload, User, Settings, Play, Users, FileSpreadsheet, Download, Check } from 'lucide-react';
import readXlsxFile from 'read-excel-file';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const CreateSchoolVote = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const socket = useSocket();
    // Hardcode type to 'school'
    const type = 'school';
    const { name, count } = location.state || {}; // Basic info from Main Page

    // Redirect if no data
    useEffect(() => {
        if (!name || !count) {
            alert('잘못된 접근입니다.');
            navigate('/');
        }
    }, [name, count, navigate]);

    // Initial State Setup
    const [candidates, setCandidates] = useState([
        { id: 1, name: '', symbol: '1', photo: null },
        { id: 2, name: '', symbol: '2', photo: null },
    ]);
    const [options, setOptions] = useState({
        multipleVoting: false,  // 복수 투표
        rankedVoting: false,    // 순위 투표
        opinionMode: false,     // 의견 쓰기 모드
        realtimeResults: false, // 실시간 후보 득표 상황
        publicVote: false,      // 공개 투표
        randomOrder: false,     // 후보자 기호번호 랜덤
        oneVotePerDevice: false, // 기기당 1인 1표 제한
        maxChoices: 2           // 복수 투표 시 최대 선택 가능 수
    });

    // Voter List State (Per Grade)
    const [activeGrade, setActiveGrade] = useState(1); // 1~6
    // Structure: { 1: [], 2: [], ..., 6: [] }
    const [votersByGrade, setVotersByGrade] = useState({
        1: [], 2: [], 3: [], 4: [], 5: [], 6: []
    });
    const [classCounts, setClassCounts] = useState({
        1: '', 2: '', 3: '', 4: '', 5: '', 6: ''
    });

    const fileInputRef = useRef(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // --- Candidate Handlers ---
    const addCandidate = () => {
        const nextId = candidates.length > 0 ? Math.max(...candidates.map(c => c.id)) + 1 : 1;
        setCandidates([...candidates, { id: nextId, name: '', symbol: String(nextId), photo: null }]);
    };

    const removeCandidate = (id) => {
        if (candidates.length <= 1) {
            alert('최소 1명의 후보가 필요합니다.');
            return;
        }
        setCandidates(candidates.filter(c => c.id !== id));
    };

    const updateCandidate = (id, field, value) => {
        setCandidates(candidates.map(c => c.id === id ? { ...c, [field]: value } : c));
    };


    // --- Voter Handlers ---
    const handleAddVoter = () => {
        const currentGradeVoters = votersByGrade[activeGrade];
        const nextStudentId = currentGradeVoters.length > 0
            ? Math.max(...currentGradeVoters.map(v => parseInt(v.studentId || 0, 10))) + 1
            : 1;

        const newVoter = { id: Date.now(), name: '', studentId: nextStudentId.toString(), class: '' };

        setVotersByGrade({
            ...votersByGrade,
            [activeGrade]: [...currentGradeVoters, newVoter]
        });
    };

    const [onlyNumericCodes, setOnlyNumericCodes] = useState(false);

    const generateVoterCode = (grade, isNumeric) => {
        if (isNumeric) {
            let code = '';
            for (let i = 0; i < 6; i++) code += Math.floor(Math.random() * 10);
            return code;
        }

        const gradeNum = parseInt(grade);
        const letters = 'ABCDEFGHJKMNPQRSTUVWXYZ'; // O, I, L 제외
        let code = '';

        if (gradeNum >= 1 && gradeNum <= 3) {
            for (let i = 0; i < 6; i++) code += Math.floor(Math.random() * 10);
        } else if (gradeNum === 4) {
            code += letters.charAt(Math.floor(Math.random() * letters.length));
            for (let i = 0; i < 5; i++) code += Math.floor(Math.random() * 10);
        } else if (gradeNum === 5) {
            for (let i = 0; i < 2; i++) code += letters.charAt(Math.floor(Math.random() * letters.length));
            for (let i = 0; i < 4; i++) code += Math.floor(Math.random() * 10);
        } else if (gradeNum === 6) {
            for (let i = 0; i < 3; i++) code += letters.charAt(Math.floor(Math.random() * letters.length));
            for (let i = 0; i < 3; i++) code += Math.floor(Math.random() * 10);
        } else {
            for (let i = 0; i < 6; i++) code += Math.floor(Math.random() * 10);
        }
        return code;
    };

    // 숫자/영문 코드 방식 전환 핸들러 - 기존 코드 전체 재생성
    const handleNumericToggle = (newValue) => {
        const msg = newValue
            ? '숫자로만 코드부여로 변경합니다. 기존에 생성된 모든 코드를 새로 만들겠습니까?'
            : '학년별 영문+숫자 조합으로 변경합니다. 기존에 생성된 모든 코드를 새로 만들겠습니까?';
        if (!window.confirm(msg)) return;

        setOnlyNumericCodes(newValue);

        // 전체 코드 재생성
        const regenerated = {};
        Object.keys(votersByGrade).forEach(grade => {
            regenerated[grade] = votersByGrade[grade].map(v => ({
                ...v,
                accessCode: generateVoterCode(grade, newValue)
            }));
        });
        setVotersByGrade(regenerated);
    };


    const handleRemoveVoter = (grade, id) => {
        setVotersByGrade(prev => ({
            ...prev,
            [grade]: prev[grade].filter(v => v.id !== id)
        }));
    };

    const handleUpdateVoterGlobal = (originalGrade, id, field, value) => {
        setVotersByGrade(prev => {
            const newVoters = { ...prev };
            if (field === 'grade') {
                const newGrade = value;
                if (originalGrade == newGrade) return prev;
                const voterIndex = newVoters[originalGrade].findIndex(v => v.id === id);
                if (voterIndex === -1) return prev;
                const voter = { ...newVoters[originalGrade][voterIndex] };
                // Remove from old
                newVoters[originalGrade] = newVoters[originalGrade].filter(v => v.id !== id);
                // Add to new
                newVoters[newGrade] = [...(newVoters[newGrade] || []), voter];
            } else {
                newVoters[originalGrade] = newVoters[originalGrade].map(v => v.id === id ? { ...v, [field]: value } : v);
            }
            return newVoters;
        });
    };

    const handleDeleteAll = () => {
        if (window.confirm('정말 삭제하시겠습니까?')) {
            if (activeGrade === 'all') {
                setVotersByGrade({ 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] });
            } else {
                setVotersByGrade(prev => ({ ...prev, [activeGrade]: [] }));
            }
        }
    };

    const [newVoter, setNewVoter] = useState({ grade: '', class: '', studentId: '', name: '' });

    const handleAddVoterAll = () => {
        const { grade, class: classNum, studentId, name } = newVoter;
        if (!grade || !name) {
            alert('학년과 이름은 필수입니다.');
            return;
        }
        if (grade < 1 || grade > 6) {
            alert('학년은 1~6 사이여야 합니다.');
            return;
        }

        const targetGrade = parseInt(grade);
        const currentGradeVoters = votersByGrade[targetGrade];

        // Auto-generate studentId if missing (only if simple number logic, but here we expect user input usually)
        // If user didn't input studentId, we can try to auto-assign based on existing count
        const finalStudentId = studentId || (currentGradeVoters.length + 1).toString();

        const newVoterObj = {
            id: Date.now(),
            name: name,
            studentId: finalStudentId,
            class: classNum // Store class info
        };

        setVotersByGrade({
            ...votersByGrade,
            [targetGrade]: [...currentGradeVoters, newVoterObj]
        });

        // Reset inputs (keep grade/class for convenience? maybe just name/number)
        setNewVoter({ ...newVoter, studentId: '', name: '' });
    };

    const handleUpdateVoter = (grade, index, field, value) => {
        const newVoters = [...votersByGrade[grade]];
        newVoters[index][field] = value;
        setVotersByGrade({
            ...votersByGrade,
            [grade]: newVoters
        });
    };

    const handleExcelUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(file);

            if (activeGrade === 'all') {
                const newVotersByGrade = { ...votersByGrade };
                let addedCount = 0;

                workbook.eachSheet((sheet, sheetId) => {
                    const sheetName = sheet.name;
                    // Try to parse grade from sheet name (e.g. "1학년") or skip if invalid
                    // Or just iterate standard grades if template is strict. 
                    // Let's assume user uses the template or "1", "2"...
                    let grade = parseInt(sheetName.replace(/[^0-9]/g, ''));
                    // If sheet name doesn't contain number, maybe mapped by order? No, safer to rely on name.
                    if (!grade || grade < 1 || grade > 6) return;

                    // Columns: Class(1), Number(2), Name(3) (1-based index in ExcelJS often, but usually access by key or row values)
                    // Row 1 is header.
                    sheet.eachRow((row, rowNumber) => {
                        if (rowNumber === 1) return; // Skip header

                        // values array is 1-based. cell 1 is index 1.
                        // But strictly safe: row.getCell(1).value
                        const classNum = row.getCell(1).value;
                        const studentId = row.getCell(2).value;
                        const name = row.getCell(3).value;

                        if (name) {
                            newVotersByGrade[grade].push({
                                id: Date.now() + Math.random(),
                                name: name.toString(),
                                studentId: studentId ? studentId.toString() : '',
                                class: classNum ? classNum.toString() : ''
                            });
                            addedCount++;
                        }
                    });
                });

                setVotersByGrade(newVotersByGrade);
                alert(`전체 명단에 ${addedCount}명을 추가했습니다.`);

            } else {
                // Specific Grade
                const newGradeVoters = [...votersByGrade[activeGrade]];
                let addedCount = 0;

                workbook.eachSheet((sheet) => {
                    // Try to parse class from sheet name (e.g. "1반")
                    let classNum = parseInt(sheet.name.replace(/[^0-9]/g, ''));
                    // If parsing fails, default to empty or skip?
                    // If valid template used, it should have number.

                    sheet.eachRow((row, rowNumber) => {
                        if (rowNumber === 1) return; // Skip header

                        // Columns: Number(1), Name(2)
                        const studentId = row.getCell(1).value;
                        const name = row.getCell(2).value;

                        if (name) {
                            newGradeVoters.push({
                                id: Date.now() + Math.random(),
                                name: name.toString(),
                                studentId: studentId ? studentId.toString() : '',
                                class: classNum ? classNum.toString() : ''
                            });
                            addedCount++;
                        }
                    });
                });

                setVotersByGrade({
                    ...votersByGrade,
                    [activeGrade]: newGradeVoters
                });
                alert(`${activeGrade}학년 명단에 ${addedCount}명을 추가했습니다.`);
            }

        } catch (error) {
            console.error('Excel Parsing Error:', error);
            alert('엑셀 파일을 읽는 중 오류가 발생했습니다.');
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDownloadTemplate = async () => {
        if (activeGrade !== 'all' && !classCounts[activeGrade]) {
            alert('학급 수를 입력해주세요.');
            return;
        }
        const workbook = new ExcelJS.Workbook();

        if (activeGrade === 'all') {
            // Create sheets for 1~6 grades
            [1, 2, 3, 4, 5, 6].forEach(grade => {
                const sheet = workbook.addWorksheet(`${grade}학년`);
                sheet.columns = [
                    { header: '반', key: 'class', width: 10 },
                    { header: '번호', key: 'studentId', width: 10 },
                    { header: '이름', key: 'name', width: 15 },
                ];
                // Add sample row
                sheet.addRow({ class: 1, studentId: 1, name: '예시' });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, '전체_유권자_일괄등록_양식.xlsx');
        } else {
            // Specific grade: create N sheets based on class count
            const count = parseInt(classCounts[activeGrade]) || 1;

            for (let i = 1; i <= count; i++) {
                const sheet = workbook.addWorksheet(`${i}반`);
                sheet.columns = [
                    { header: '번호', key: 'studentId', width: 10 },
                    { header: '이름', key: 'name', width: 15 },
                ];
                // Add sample row
                sheet.addRow({ studentId: 1, name: '예시' });
            }

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `${activeGrade}학년_유권자_명단_양식(${count}학급).xlsx`);
        }
    };

    const handleDownloadCodes = async (targetGrade = 'all') => {
        if (targetGrade && typeof targetGrade === 'object') targetGrade = 'all';

        let allVoters = [];
        if (targetGrade === 'all') {
            Object.keys(votersByGrade).forEach(grade => {
                const gradeVoters = votersByGrade[grade].map(v => ({ ...v, grade: grade }));
                allVoters = [...allVoters, ...gradeVoters];
            });
        } else {
            allVoters = votersByGrade[targetGrade].map(v => ({ ...v, grade: targetGrade }));
        }

        if (allVoters.length === 0) {
            alert('등록된 유권자가 없습니다.');
            return;
        }

        const updatedVotersByGrade = { ...votersByGrade };
        let hasUpdates = false;

        const gradesToProcess = targetGrade === 'all' ? Object.keys(updatedVotersByGrade) : [targetGrade.toString()];

        gradesToProcess.forEach(grade => {
            updatedVotersByGrade[grade] = updatedVotersByGrade[grade].map(v => {
                if (v.accessCode) return v;
                hasUpdates = true;
                const code = generateVoterCode(grade, onlyNumericCodes); // grade = votersByGrade의 키 (학년 번호)
                return { ...v, accessCode: code };
            });
        });

        if (hasUpdates) {
            setVotersByGrade(updatedVotersByGrade);
        }

        let exportVoters = [];
        gradesToProcess.forEach(grade => {
            updatedVotersByGrade[grade].forEach(v => {
                exportVoters.push({ ...v, grade: grade });
            });
        });

        exportVoters.sort((a, b) => {
            if (a.grade !== b.grade) return parseInt(a.grade) - parseInt(b.grade);
            const classA = parseInt(a.class) || 0;
            const classB = parseInt(b.class) || 0;
            if (classA !== classB) return classA - classB;
            const numA = parseInt(a.studentId) || 0;
            const numB = parseInt(b.studentId) || 0;
            return numA - numB;
        });

        const workbook = new ExcelJS.Workbook();

        // Helper: Generate Data List Sheet (A-E)
        const generateListSheet = (sheet, voters) => {
            const setBorder = (cell) => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            };

            sheet.getCell('A1').value = '학년';
            sheet.getCell('B1').value = '반';
            sheet.getCell('C1').value = '번호';
            sheet.getCell('D1').value = '이름';
            sheet.getCell('E1').value = '접속코드';

            ['A1', 'B1', 'C1', 'D1', 'E1'].forEach(key => {
                const cell = sheet.getCell(key);
                cell.font = { bold: true };
                setBorder(cell);
            });

            voters.forEach((v, idx) => {
                const row = idx + 2;
                sheet.getCell(`A${row}`).value = v.grade;
                sheet.getCell(`B${row}`).value = v.class;
                sheet.getCell(`C${row}`).value = v.studentId;
                sheet.getCell(`D${row}`).value = v.name;
                sheet.getCell(`E${row}`).value = v.accessCode;
                ['A', 'B', 'C', 'D', 'E'].forEach(col => setBorder(sheet.getCell(`${col}${row}`)));
            });

            sheet.getColumn('A').width = 8;
            sheet.getColumn('B').width = 8;
            sheet.getColumn('C').width = 8;
            sheet.getColumn('D').width = 15;
            sheet.getColumn('E').width = 15;
        };

        // Helper: Generate Printable Card Sheet (separate sheet, 3 cards per row, each card 4 cols wide)
        // Card layout (4 rows x 4 cols):
        //   Row1: [학년] [반] [번호] [이름]
        //   Row2: [val ] [val] [val] [val ]
        //   Row3: [---- 접속코드 (merged 4) ----]
        //   Row4: [---- code value (merged 4)  ]
        // Gap row between card rows: 1
        // Gap col between card cols: 1  → each block occupies 5 columns (4 content + 1 gap, except last)
        const generatePrintSheet = (sheet, voters) => {
            const setBorder = (cell) => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            };

            const CARDS_PER_ROW = 3;
            const CARD_COLS = 4;   // 학년, 반, 번호, 이름
            const CARD_ROWS = 4;   // header, values, code-label, code-value
            const COL_GAP = 1;
            const ROW_GAP = 1;
            const BLOCK_W = CARD_COLS + COL_GAP; // 5
            const BLOCK_H = CARD_ROWS + ROW_GAP; // 5

            voters.forEach((v, idx) => {
                const col = idx % CARDS_PER_ROW;
                const row = Math.floor(idx / CARDS_PER_ROW);

                const startC = 1 + col * BLOCK_W;  // 1, 6, 11
                const startR = 1 + row * BLOCK_H;  // 1, 6, 11...

                const c1 = startC, c2 = startC + 1, c3 = startC + 2, c4 = startC + 3;
                const r1 = startR, r2 = startR + 1, r3 = startR + 2, r4 = startR + 3;

                // Headers
                const h1 = sheet.getCell(r1, c1); h1.value = '학년';
                const h2 = sheet.getCell(r1, c2); h2.value = '반';
                const h3 = sheet.getCell(r1, c3); h3.value = '번호';
                const h4 = sheet.getCell(r1, c4); h4.value = '이름';
                [h1, h2, h3, h4].forEach(c => { c.font = { bold: true }; setBorder(c); });

                // Values
                const v1 = sheet.getCell(r2, c1); v1.value = v.grade;
                const v2 = sheet.getCell(r2, c2); v2.value = v.class;
                const v3 = sheet.getCell(r2, c3); v3.value = v.studentId;
                const v4 = sheet.getCell(r2, c4); v4.value = v.name;
                [v1, v2, v3, v4].forEach(c => setBorder(c));

                // Code label (merged)
                sheet.mergeCells(r3, c1, r3, c4);
                const labelCell = sheet.getCell(r3, c1);
                labelCell.value = '접속코드';
                labelCell.font = { bold: true };
                setBorder(labelCell);

                // Code value (merged)
                sheet.mergeCells(r4, c1, r4, c4);
                const codeCell = sheet.getCell(r4, c1);
                codeCell.value = v.accessCode;
                codeCell.font = { size: 13, bold: true };
                setBorder(codeCell);
            });

            // Set column widths: content cols 1-4, 6-9, 11-14 → width 8. Gap cols 5, 10 → width 2.
            for (let i = 0; i < CARDS_PER_ROW; i++) {
                const base = 1 + i * BLOCK_W;
                for (let j = 0; j < CARD_COLS; j++) {
                    sheet.getColumn(base + j).width = 8;
                }
                // Gap column (except after last card)
                if (i < CARDS_PER_ROW - 1) {
                    sheet.getColumn(base + CARD_COLS).width = 2;
                }
            }

            // Page setup: fit print area to 3 cards wide per page
            sheet.pageSetup = {
                paperSize: 9, // A4
                orientation: 'portrait',
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0,
                margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
            };
        };

        // 1. Full List: data sheet + print sheet
        const summarySheet = workbook.addWorksheet('전체명부');
        generateListSheet(summarySheet, exportVoters);
        const summaryPrintSheet = workbook.addWorksheet('전체명부_인쇄용');
        generatePrintSheet(summaryPrintSheet, exportVoters);

        // 2. When all: group by grade; when specific grade: group by class
        const grouped = {};
        if (targetGrade === 'all') {
            exportVoters.forEach(v => {
                const key = `${v.grade}학년`;
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(v);
            });
        } else {
            exportVoters.forEach(v => {
                const key = `${v.grade}학년_${v.class || '미배정'}반`;
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(v);
            });
        }

        Object.keys(grouped).forEach(sheetNamePrefix => {
            const listSheet = workbook.addWorksheet(`${sheetNamePrefix}_명부`);
            generateListSheet(listSheet, grouped[sheetNamePrefix]);

            const printSheet = workbook.addWorksheet(`${sheetNamePrefix}_인쇄용`);
            generatePrintSheet(printSheet, grouped[sheetNamePrefix]);
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const filename = targetGrade === 'all' ? '학교_전체_유권자_코드.xlsx' : `${targetGrade}학년_유권자_코드.xlsx`;
        saveAs(blob, filename);
    };


    // --- Create Room Handler ---
    const handleCreateRoom = () => {
        // Validation
        if (candidates.some(c => !c.name.trim())) {
            alert('모든 후보자의 이름을 입력해주세요.');
            return;
        }

        let allVoters = [];
        Object.keys(votersByGrade).forEach(grade => {
            const gradeVoters = votersByGrade[grade].map(v => ({ ...v, grade: grade }));
            allVoters = [...allVoters, ...gradeVoters];
        });

        if (allVoters.length === 0) {
            alert('최소 1명 이상의 유권자를 등록해주세요.');
            return;
        }

        if (allVoters.some(v => !v.name.trim())) {
            alert('이름이 비어있는 유권자가 있습니다. 확인해주세요.');
            return;
        }

        // Socket connection check
        if (!socket || !socket.connected) {
            alert('서버에 연결되지 않았습니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        // Show custom confirm modal instead of window.confirm
        setShowConfirmModal(true);
    };

    // Actual room creation — called from modal '지금 시작'
    const proceedToCreate = () => {
        setIsSubmitting(true);

        let allVoters = [];
        Object.keys(votersByGrade).forEach(grade => {
            const gradeVoters = votersByGrade[grade].map(v => ({ ...v, grade: grade }));
            allVoters = [...allVoters, ...gradeVoters];
        });

        const generateRoomId = () => {
            let code = '';
            for (let i = 0; i < 6; i++) {
                code += Math.floor(Math.random() * 10);
            }
            return code;
        };
        const newRoomId = generateRoomId();

        // Prepare Candidates
        let finalCandidates = [...candidates];
        if (options.randomOrder) {
            for (let i = finalCandidates.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [finalCandidates[i], finalCandidates[j]] = [finalCandidates[j], finalCandidates[i]];
            }
            finalCandidates = finalCandidates.map((c, index) => ({
                ...c,
                symbol: (index + 1).toString()
            }));
        }

        // Generate Voter List
        const generatedVoters = {};
        allVoters.forEach(v => {
            let code = v.accessCode;
            if (!code) {
                do {
                    code = generateVoterCode(v.grade, onlyNumericCodes);
                } while (generatedVoters[code]);
            }

            generatedVoters[code] = {
                name: v.name,
                studentId: v.studentId,
                grade: v.grade,
                class: v.class, // Keep class info
                isUsed: false,
                joined: false
            };
        });

        const config = {
            title: name,
            type: type,
            totalVoters: allVoters.length,
            candidates: finalCandidates,
            options: { ...options, onlyNumericCodes },
            publicKey: null,
            allowRealtime: options.realtimeResults
        };

        socket.emit('createRoom', {
            roomId: newRoomId,
            config,
            voters: generatedVoters,
            publicKey: null
        }, (response) => {
            setIsSubmitting(false);
            if (response.success) {
                navigate(`/admin/${newRoomId}`, { state: { roomId: newRoomId, roomConfig: config, generatedVoters } });
            } else {
                alert('방 생성 실패: ' + response.message);
            }
        });
    };

    // Calculate total voters
    const outputTotalVoters = Object.values(votersByGrade).reduce((acc, curr) => acc + curr.length, 0);

    return (
        <div className="min-h-screen bg-indigo-50 p-6 flex flex-col items-center">

            {/* Confirm Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
                        <h2 className="text-xl font-extrabold text-gray-900 mb-3">투표를 시작할까요?</h2>
                        <p className="text-gray-600 text-sm leading-relaxed mb-6">
                            선거 본부 입장 시 후보자나 투표 참여자, 설정을 더 이상 수정할 수 없습니다.<br />
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
            <div className="w-full max-w-7xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <span className="text-sm font-bold text-indigo-500 uppercase tracking-wider">
                        학교 투표 설정
                    </span>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-1">{name}</h1>
                </div>
                <div className="bg-white px-5 py-3 rounded-xl shadow-sm text-gray-600 border border-indigo-100">
                    목표 인원: <span className="font-bold text-gray-400 text-lg mr-2">{count}명</span>
                    등록 인원: <span className="font-bold text-indigo-600 text-lg">{outputTotalVoters}명</span>
                </div>
            </div>

            <div className="flex flex-col gap-8 w-full max-w-7xl">

                {/* Top Section: Candidates (Left) + Settings (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left: Candidates (8 cols) */}
                    <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-md border border-indigo-100">
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

                        {/* 2-column Grid for Candidates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
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

                    {/* Right: Settings (4 cols) */}
                    <div className="lg:col-span-4 bg-white rounded-2xl p-5 shadow-md border border-indigo-100 h-full">
                        <h2 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
                            <Settings className="w-4 h-4 text-gray-500" />
                            설정
                        </h2>
                        <div className="space-y-0.5">
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
                                    checked={options.multipleVoting}
                                    onChange={(e) => setOptions({ ...options, multipleVoting: e.target.checked, rankedVoting: e.target.checked ? options.rankedVoting : false })}
                                    className="w-4 h-4 mt-0.5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                />
                                <div>
                                    <span className="text-gray-800 font-bold text-base block">복수 투표</span>
                                    <span className="text-[12.5px] tracking-tight text-gray-500 leading-tight block group-hover:text-gray-600">유권자가 2명 이상 후보에게 한 표씩 행사합니다.</span>
                                </div>
                            </label>

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

                            <div className="px-1 pt-1">
                                <p className="text-base font-bold text-gray-400 uppercase tracking-wider mb-1">코드 설정</p>
                                <label className="flex items-start space-x-2 cursor-pointer p-2 rounded-lg hover:bg-yellow-50 transition-colors border border-transparent hover:border-yellow-200 group">
                                    <input
                                        type="checkbox"
                                        checked={onlyNumericCodes}
                                        onChange={(e) => handleNumericToggle(e.target.checked)}
                                        className="w-4 h-4 mt-0.5 text-yellow-500 rounded focus:ring-yellow-400 border-gray-300"
                                    />
                                    <div>
                                        <span className="text-gray-800 font-bold text-base block">숫자로만 코드부여</span>
                                        <span className="text-[12.5px] tracking-tight text-gray-500 leading-tight block group-hover:text-gray-600">모든 학년에 숫자 코드만 사용합니다.</span>
                                    </div>
                                </label>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Bottom Section: Voter List (Full Width) */}
                <div className="w-full bg-white rounded-2xl p-6 shadow-md border border-indigo-100 flex flex-col min-h-[500px]">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-xl font-bold text-gray-800">유권자 명부</h2>
                            <span className="text-sm text-gray-500 font-normal ml-2">
                                (학년별 혹은 전체 입력 해주세요.)
                            </span>
                        </div>

                        <button
                            onClick={handleCreateRoom}
                            className="px-12 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-1 flex items-center gap-4 text-3xl"
                        >
                            <Play className="w-8 h-8" />
                            선거 본부 입장
                        </button>
                    </div>

                    {/* Grade Tabs */}
                    <div className="flex gap-2 border-b border-gray-200 mb-6 overflow-x-auto pb-1">
                        {[1, 2, 3, 4, 5, 6, 'all'].map((grade) => (
                            <button
                                key={grade}
                                onClick={() => setActiveGrade(grade)}
                                className={`px-6 py-3 rounded-t-xl font-bold text-sm transition-all whitespace-nowrap 
                                    ${activeGrade === grade
                                        ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-500'
                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {grade === 'all' ? '전체' : `${grade}학년`}
                                <span className={`ml-2 text-xs py-0.5 px-1.5 rounded-full ${activeGrade === grade ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>
                                    {grade === 'all'
                                        ? Object.values(votersByGrade).flat().length
                                        : votersByGrade[grade].length
                                    }
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-grow flex flex-col md:flex-row gap-8">

                        {/* Input Area (Left/Top) */}
                        <div className="w-full md:w-1/4 flex flex-col gap-4 flex-grow">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                                        엑셀 일괄 등록
                                    </h3>
                                </div>

                                {/* Grade Tab Content for Excel Upload */}
                                <div className="flex flex-col gap-3">
                                    {activeGrade !== 'all' && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">학급 수 (반)</label>
                                            <input
                                                type="number"
                                                value={classCounts[activeGrade]}
                                                onChange={(e) => setClassCounts({ ...classCounts, [activeGrade]: e.target.value })}
                                                placeholder="5"
                                                className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-400 outline-none transition-all"
                                            />
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2 mt-1">
                                        <button
                                            onClick={handleDownloadTemplate}
                                            className="w-full py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
                                        >
                                            <Download className="w-5 h-5" /> 양식 다운로드
                                        </button>

                                        <input
                                            type="file"
                                            accept=".xlsx"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleExcelUpload}
                                        />
                                        <button
                                            onClick={() => fileInputRef.current.click()}
                                            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
                                        >
                                            <Upload className="w-5 h-5" /> 파일 업로드
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2">
                                    * 현재 선택된 {activeGrade === 'all' ? '전체' : activeGrade + '학년'} 명단에 추가됩니다.
                                </p>
                            </div>

                            {activeGrade === 'all' ? (
                                // All grade manual add
                                <>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                <Plus className="w-4 h-4" /> 학생 추가
                                            </h3>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">학년</label>
                                                    <select
                                                        value={newVoter.grade}
                                                        onChange={(e) => setNewVoter({ ...newVoter, grade: e.target.value })}
                                                        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-300 text-center bg-white"
                                                    >
                                                        <option value="">선택</option>
                                                        {[1, 2, 3, 4, 5, 6].map(g => <option key={g} value={g}>{g}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">반</label>
                                                    <input
                                                        type="number"
                                                        value={newVoter.class}
                                                        onChange={(e) => setNewVoter({ ...newVoter, class: e.target.value })}
                                                        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-300 text-center"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">번호</label>
                                                    <input
                                                        type="number"
                                                        value={newVoter.studentId}
                                                        onChange={(e) => setNewVoter({ ...newVoter, studentId: e.target.value })}
                                                        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-300 text-center"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">이름</label>
                                                <input
                                                    type="text"
                                                    value={newVoter.name}
                                                    onChange={(e) => setNewVoter({ ...newVoter, name: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-300"
                                                />
                                            </div>
                                            <button
                                                onClick={handleAddVoterAll}
                                                className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-lg font-bold transition-colors shadow-sm"
                                            >
                                                추가하기
                                            </button>

                                        </div>
                                    </div>
                                    {!options.simpleVote && (
                                        <button
                                            onClick={() => handleDownloadCodes('all')}
                                            className="w-full py-4 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-xl text-md font-bold transition-colors shadow-sm flex items-center justify-center gap-2 mt-4"
                                        >
                                            <FileSpreadsheet className="w-5 h-5" />
                                            전체 코드 다운로드
                                        </button>
                                    )}
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={handleAddVoter}
                                        className="w-full h-32 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-sm border border-indigo-200"
                                    >
                                        <Plus className="w-6 h-6" />
                                        학생 추가
                                    </button>
                                    {!options.simpleVote && (
                                        <button
                                            onClick={() => handleDownloadCodes(activeGrade)}
                                            className="w-full py-4 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-xl text-md font-bold transition-colors shadow-sm flex items-center justify-center gap-2 mt-4"
                                        >
                                            <FileSpreadsheet className="w-5 h-5" />
                                            {activeGrade}학년 코드 다운로드
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* List Area (Right/Bottom) */}
                        <div className="w-full md:w-3/4 bg-gray-50 rounded-xl border border-gray-200 p-4 flex flex-col h-[600px]">
                            <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                                <h3 className="font-bold text-gray-700">
                                    {activeGrade === 'all' ? '전체 학년 명단' : `${activeGrade}학년 명단`}
                                    ({activeGrade === 'all' ? Object.values(votersByGrade).flat().length : votersByGrade[activeGrade].length}명)
                                </h3>
                                <button
                                    onClick={handleDeleteAll}
                                    className="text-xs text-red-400 hover:text-red-600 underline"
                                >
                                    전체 삭제
                                </button>
                            </div>

                            <div className="overflow-y-auto flex-grow custom-scrollbar pr-2">
                                {(activeGrade === 'all' ? Object.values(votersByGrade).flat().length : votersByGrade[activeGrade].length) > 0 ? (
                                    <>
                                        {/* Header Row (Responsive Grid) */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-2 sticky top-0 bg-gray-50 z-10">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className={`flex items-center gap-1 px-2 py-1 border-b border-gray-200 text-xs font-bold text-gray-500 ${i === 2 ? 'hidden md:flex' : ''} ${i === 3 ? 'hidden lg:flex' : ''}`}>
                                                    <span className="w-6 text-center">순번</span>
                                                    {activeGrade === 'all' ? (
                                                        <>
                                                            <span className="w-11 text-center">학년</span>
                                                            <span className="w-8 text-center">반</span>
                                                        </>
                                                    ) : (
                                                        <span className="w-8 text-center">반</span>
                                                    )}
                                                    <span className="w-8 text-center">번호</span>
                                                    <span className="flex-1 text-center">이름</span>
                                                    <span className="w-6"></span> {/* Spacer */}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Voter List Content Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-2">
                                            {activeGrade === 'all' ? (
                                                // Render All Voters
                                                Object.keys(votersByGrade).flatMap(grade =>
                                                    votersByGrade[grade].map(v => ({ ...v, currentGrade: grade }))
                                                ).map((v, idx) => (
                                                    <div key={v.id} className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm flex items-center gap-1">
                                                        <span className="text-gray-400 w-6 text-center text-xs flex-shrink-0 font-mono">
                                                            {idx + 1}
                                                        </span>

                                                        <select
                                                            value={v.currentGrade}
                                                            onChange={(e) => handleUpdateVoterGlobal(v.currentGrade, v.id, 'grade', e.target.value)}
                                                            className="w-11 px-1 py-1 border border-gray-200 rounded text-center text-xs focus:ring-1 focus:ring-indigo-300 outline-none bg-white"
                                                        >
                                                            {[1, 2, 3, 4, 5, 6].map(g => <option key={g} value={g}>{g}</option>)}
                                                        </select>

                                                        <input
                                                            type="text"
                                                            value={v.class || ''}
                                                            onChange={(e) => handleUpdateVoterGlobal(v.currentGrade, v.id, 'class', e.target.value)}
                                                            className="w-8 px-1 py-1 border border-gray-200 rounded text-center text-xs focus:ring-1 focus:ring-indigo-300 outline-none"
                                                        />

                                                        <input
                                                            type="text"
                                                            value={v.studentId}
                                                            onChange={(e) => handleUpdateVoterGlobal(v.currentGrade, v.id, 'studentId', e.target.value)}
                                                            className="w-8 px-1 py-1 border border-gray-200 rounded text-center text-xs focus:ring-1 focus:ring-indigo-300 outline-none"
                                                        />

                                                        <input
                                                            type="text"
                                                            value={v.name}
                                                            onChange={(e) => handleUpdateVoterGlobal(v.currentGrade, v.id, 'name', e.target.value)}
                                                            className="flex-1 min-w-0 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-indigo-300 outline-none text-center"
                                                        />

                                                        <button
                                                            onClick={() => handleRemoveVoter(v.currentGrade, v.id)}
                                                            className="text-gray-300 hover:text-red-500 p-1 rounded hover:bg-gray-50"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                // Render Specific Grade Voters
                                                votersByGrade[activeGrade].map((v, index) => (
                                                    <div key={v.id} className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm flex items-center gap-2">
                                                        <span className="text-gray-400 w-6 text-center text-xs flex-shrink-0 font-mono">
                                                            {index + 1}
                                                        </span>
                                                        <input
                                                            type="text"
                                                            placeholder=""
                                                            value={v.class || ''}
                                                            onChange={(e) => handleUpdateVoter(activeGrade, index, 'class', e.target.value)}
                                                            className="w-8 px-1 py-1 border border-gray-200 rounded text-center text-xs focus:ring-1 focus:ring-indigo-300 outline-none"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder=""
                                                            value={v.studentId}
                                                            onChange={(e) => handleUpdateVoter(activeGrade, index, 'studentId', e.target.value)}
                                                            className="w-8 px-1 py-1 border border-gray-200 rounded text-center text-xs focus:ring-1 focus:ring-indigo-300 outline-none"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder=""
                                                            value={v.name}
                                                            onChange={(e) => handleUpdateVoter(activeGrade, index, 'name', e.target.value)}
                                                            className="flex-1 min-w-0 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-indigo-300 outline-none text-center"
                                                        />
                                                        <button
                                                            onClick={() => handleRemoveVoter(activeGrade, v.id)}
                                                            className="text-gray-300 hover:text-red-500 p-1 rounded hover:bg-gray-50"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                                        <Users className="w-8 h-8 opacity-20" />
                                        <p className="text-sm">등록된 유권자가 없습니다.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Final Submit Button */}

        </div >
    );
};

export default CreateSchoolVote;
