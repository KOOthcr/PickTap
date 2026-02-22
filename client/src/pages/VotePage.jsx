import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useModal } from '../contexts/ModalContext';
import { CheckCircle, Lock, AlertCircle, Play, Check, RotateCcw } from 'lucide-react';

const VotePage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();
    const showModal = useModal();

    // Steps: 'login' -> 'voting' -> 'completed' -> 'already_voted'
    const [step, setStep] = useState('login');
    const [voterCode, setVoterCode] = useState('');
    const [grade, setGrade] = useState('');
    const [studentClass, setStudentClass] = useState('');
    const [studentId, setStudentId] = useState('');
    const [name, setName] = useState('');

    const [roomInfo, setRoomInfo] = useState(null);
    const [selectedCandidateId, setSelectedCandidateId] = useState(null);
    const [selectedChoices, setSelectedChoices] = useState([]);
    const [opinion, setOpinion] = useState('');
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(5);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Persistency Check (Device block) - Only if oneVotePerDevice is enabled
    useEffect(() => {
        if (!roomInfo) return;
        if (roomInfo.config.options?.oneVotePerDevice) {
            const voted = localStorage.getItem(`voted_${roomId}`);
            if (voted) {
                setStep('already_voted');
            }
        }
    }, [roomInfo, roomId]);


    // Initial Check
    useEffect(() => {
        if (!socket) return;

        socket.emit('joinRoom', { roomId, type: 'public' }, (response) => {
            if (response.success) {
                setRoomInfo({
                    config: response.roomConfig,
                    isStarted: response.isStarted,
                    publicKey: response.publicKey
                });
            } else {
                showModal.alert('존재하지 않는 투표방입니다.');
                navigate('/');
            }
        });

        socket.on('votingStarted', () => {
            setRoomInfo(prev => ({ ...prev, isStarted: true }));
        });
        socket.on('votingEnded', () => {
            setRoomInfo(prev => ({ ...prev, isStarted: false }));
            setStep('ended');
        });
        socket.on('votingReset', () => {
            setRoomInfo(prev => ({ ...prev, isStarted: false }));
            resetVoterState();
            setStep('login');
        });

        return () => {
            socket.off('votingStarted');
            socket.off('votingEnded');
            socket.off('votingReset');
        };
    }, [socket, roomId, navigate, step]);


    // Login Handler
    const handleLogin = () => {
        const isSchool = roomInfo?.config?.type === 'school';
        const isSimple = !isSchool && roomInfo?.config?.options?.simpleVote;

        // Basic Validation
        if (!name.trim()) return setError('이름을 입력해주세요.');
        if (!studentId.trim()) return setError('번호를 입력해주세요.');
        if (isSchool && (!grade.trim() || !studentClass.trim())) return setError('학년/반 정보를 입력해주세요.');
        if (!isSimple && !voterCode.trim()) return setError('참여 코드를 입력해주세요.');

        setIsLoading(true);
        setError('');

        const payload = {
            roomId,
            grade,
            class: studentClass,
            studentId,
            name: name.trim(),
            voterCode: voterCode.trim().toUpperCase()
        };

        socket.emit('checkVoterCode', payload, (response) => {
            setIsLoading(false);
            if (response.success) {
                setStep('voting');
                setError('');
                if (response.voterCode) setVoterCode(response.voterCode);
            } else {
                setError(response.message);
            }
        });
    };

    // Vote Submission - Trigger Modal
    const handleSubmitVote = () => {
        const opts = roomInfo?.config?.options || {};
        const isMultiple = opts.multipleVoting;

        if (!isMultiple && !selectedCandidateId) return;
        if (isMultiple && selectedChoices.length === 0) return;

        setShowConfirmModal(true);
    };

    // Final Submission after Modal Confirmation
    const confirmFinalVote = () => {
        const opts = roomInfo?.config?.options || {};
        const isMultiple = opts.multipleVoting;

        const choices = isMultiple
            ? selectedChoices
            : [{ candidateId: selectedCandidateId, rank: 1 }];

        const encryptedVote = JSON.stringify({
            candidateId: choices[0]?.candidateId,
            choices,
            opinion: opinion.trim(),
            timestamp: Date.now()
        });

        socket.emit('submitVote', { roomId, voterCode, encryptedVote }, (response) => {
            if (response.success) {
                setStep('completed');
                setShowConfirmModal(false);
                // Personal device protection (Conditional)
                if (roomInfo?.config?.options?.oneVotePerDevice) {
                    localStorage.setItem(`voted_${roomId}`, 'true');
                }
            } else {
                showModal.alert('투표 제출 실패: ' + response.message);
                setShowConfirmModal(false);
            }
        });
    };

    // Multiple voting handlers
    const handleMultipleToggle = (candidateId) => {
        const maxChoices = roomInfo?.config?.options?.maxChoices || 2;
        setSelectedChoices(prev => {
            const existing = prev.find(c => c.candidateId === candidateId);
            if (existing) {
                const removed = prev.filter(c => c.candidateId !== candidateId);
                return removed.map((c, i) => ({ ...c, rank: i + 1 }));
            } else {
                if (prev.length >= maxChoices) {
                    showModal.alert(`${maxChoices}명까지만 선택할 수 있습니다.`);
                    return prev;
                }
                const newRank = prev.length + 1;
                return [...prev, { candidateId, rank: newRank }];
            }
        });
    };

    // State Reset for Next Voter (School Mode)
    const resetVoterState = () => {
        setVoterCode('');
        setGrade('');
        setStudentClass('');
        setStudentId('');
        setName('');
        setSelectedCandidateId(null);
        setSelectedChoices([]);
        setOpinion('');
        setError('');
        setCountdown(5);
    };

    // Auto-redirect or Reset after completion
    useEffect(() => {
        if (step === 'completed') {
            const timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);

            if (countdown === 0) {
                resetVoterState();
                setStep('login');
            }

            return () => clearInterval(timer);
        }
    }, [step, countdown, navigate, roomInfo]);


    if (!roomInfo) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">로딩중...</div>;

    const isSchool = roomInfo.config.type === 'school';
    const isSimple = !isSchool && roomInfo.config.options?.simpleVote;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">

            {/* Logo / Header */}
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-black text-gray-900 drop-shadow-sm">{roomInfo?.config?.title}</h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isSchool ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700'}`}>
                        {isSchool ? '학교 투표' : '학급 투표'}
                    </span>
                    <p className="text-xs text-gray-400 font-medium tracking-tight">ID: {roomId}</p>
                </div>
            </div>


            {/* Content Card */}
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative transition-all duration-500">

                {/* 투표 대기 화면 (시작 전) */}
                {(step === 'login' || step === 'voting') && !roomInfo.isStarted && step !== 'ended' && (
                    <div className="p-10 text-center space-y-6 animate-fade-in">
                        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <Play className="w-12 h-12 text-indigo-400 ml-1 fill-current" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-4xl font-black text-gray-900 tracking-tighter">투표 대기 중</h3>
                            <p className="text-gray-500 font-medium">선거 본부에서 투표를 시작하면<br />본인 인증 창이 나타납니다.</p>
                        </div>
                        <div className="pt-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-xs text-gray-400 font-bold animate-pulse">
                                <RotateCcw className="w-3 h-3" /> 실시간 연결됨
                            </div>
                        </div>
                    </div>
                )}

                {/* 투표 공식 종료 화면 */}
                {step === 'ended' && (
                    <div className="p-10 text-center space-y-6 animate-fade-in">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <Lock className="w-12 h-12 text-gray-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black text-gray-900 tracking-tighter">투표 종료</h3>
                            <p className="text-gray-500 font-medium">관리자가 투표를 공식적으로 종료했습니다.<br />지금은 참여하실 수 없습니다.</p>
                        </div>
                        <div className="pt-4">
                            <button
                                onClick={() => navigate('/')}
                                className="px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all active:scale-95"
                            >
                                메인으로 이동
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 1: Login (Only if started) */}
                {step === 'login' && roomInfo.isStarted && (
                    <div className="p-8 space-y-6 animate-fade-in">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg rotate-3">
                                <Lock className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-800">본인 인증</h3>
                            <p className="text-sm text-gray-500 mt-1 font-medium">
                                유권자 명단 정보와 일치해야<br />투표에 참여하실 수 있습니다.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* 학교 투표 전용: 학년/반 */}
                            {isSchool && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-gray-400 ml-1">학년</label>
                                        <input
                                            type="number"
                                            placeholder="학년"
                                            value={grade}
                                            onChange={(e) => setGrade(e.target.value)}
                                            className="w-full text-center text-lg font-bold py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-gray-400 ml-1">반</label>
                                        <input
                                            type="number"
                                            placeholder="반"
                                            value={studentClass}
                                            onChange={(e) => setStudentClass(e.target.value)}
                                            className="w-full text-center text-lg font-bold py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* 공통: 번호 / 이름 */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-400 ml-1">번호</label>
                                    <input
                                        type="number"
                                        placeholder="번호"
                                        value={studentId}
                                        onChange={(e) => setStudentId(e.target.value)}
                                        className="w-full text-center text-lg font-bold py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-400 ml-1">성명</label>
                                    <input
                                        type="text"
                                        placeholder="이름"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full text-center text-lg font-bold py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* 참여 코드 (간단 투표가 아닐 때만) */}
                            {!isSimple && (
                                <div className="space-y-1 pt-2">
                                    <label className="text-[11px] font-bold text-gray-400 ml-1">참여 코드</label>
                                    <input
                                        type="text"
                                        placeholder="참여 코드 입력"
                                        value={voterCode}
                                        onChange={(e) => setVoterCode(e.target.value.toUpperCase())}
                                        className="w-full text-center text-2xl font-black tracking-widest py-4 bg-indigo-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition-all uppercase placeholder:text-sm placeholder:font-normal placeholder:tracking-normal"
                                    />
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 border border-red-100 py-3 px-4 rounded-xl flex items-center gap-2 animate-shake">
                                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                    <p className="text-red-600 text-[13px] font-bold leading-tight">{error}</p>
                                </div>
                            )}

                            <button
                                onClick={handleLogin}
                                disabled={isLoading}
                                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black rounded-2xl transition-all text-xl shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <RotateCcw className="w-6 h-6 animate-spin" />
                                        확인 중...
                                    </>
                                ) : '투표 시작하기'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Voting */}
                {step === 'voting' && (
                    <div className="p-6">
                        <div className="mb-6 flex justify-between items-center">
                            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                {roomInfo.isStarted ? '진행중' : '대기중'}
                            </span>
                            <span className="text-xs text-gray-400">내 코드: {voterCode}</span>
                        </div>

                        {!roomInfo.isStarted ? (
                            <div className="text-center py-10 space-y-4">
                                <Play className="w-16 h-16 text-gray-300 mx-auto" />
                                <p className="text-gray-600 font-medium">아직 투표가 시작되지 않았습니다.</p>
                                <p className="text-xs text-gray-400">관리자가 투표를 시작할 때까지 잠시만 기다려주세요.</p>
                            </div>
                        ) : (() => {
                            const opts = roomInfo.config?.options || {};
                            const isMultiple = opts.multipleVoting;
                            const isRanked = opts.rankedVoting;
                            const maxChoices = opts.maxChoices || 2;
                            const canSubmit = isMultiple ? selectedChoices.length > 0 : !!selectedCandidateId;
                            return (
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                                            {isRanked ? `${maxChoices}순위까지 정해 투표하세요` : isMultiple ? `후보를 ${maxChoices}명까지 선택하세요` : '후보를 선택해주세요'}
                                        </h3>
                                        {isRanked && (
                                            <p className="text-xs text-gray-400">클릭 순서대로 1순위부터 {maxChoices}순위까지 부여됩니다</p>
                                        )}
                                        {isMultiple && !isRanked && (
                                            <p className="text-xs text-gray-400">최대 {maxChoices}명까지 중복 없이 선택 가능합니다</p>
                                        )}
                                    </div>
                                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                                        {roomInfo.config.candidates.map((candidate) => {
                                            const choiceEntry = selectedChoices.find(c => c.candidateId === candidate.id);
                                            const isSelected = isMultiple ? !!choiceEntry : selectedCandidateId === candidate.id;
                                            return (
                                                <label
                                                    key={candidate.id}
                                                    onClick={() => {
                                                        if (isMultiple) handleMultipleToggle(candidate.id);
                                                        else setSelectedCandidateId(candidate.id);
                                                    }}
                                                    className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-100 hover:border-indigo-200'}`}
                                                >
                                                    {isMultiple ? (
                                                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center mr-4 text-xs font-bold ${isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300'}`}>
                                                            {isSelected && (isRanked ? choiceEntry.rank : <Check className="w-3 h-3" />)}
                                                        </div>
                                                    ) : (
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${isSelected ? 'border-indigo-500' : 'border-gray-300'}`}>
                                                            {isSelected && <div className="w-3 h-3 bg-indigo-500 rounded-full" />}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-gray-500 border border-gray-200 shadow-sm">
                                                            {candidate.symbol}
                                                        </div>
                                                        <span className="font-bold text-gray-800 text-lg">{candidate.name}</span>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>

                                    {opts.opinionMode && (
                                        <div className="mt-4">
                                            <h4 className="text-sm font-bold text-gray-700 mb-2 px-1">의견 남기기 (선택사항)</h4>
                                            <textarea
                                                value={opinion}
                                                onChange={(e) => setOpinion(e.target.value)}
                                                placeholder="투표와 함께 전달할 의견을 입력해 주세요."
                                                className="w-full h-24 p-4 border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none text-sm resize-none bg-gray-50 transition-colors"
                                            />
                                        </div>
                                    )}

                                    <button
                                        onClick={handleSubmitVote}
                                        disabled={!canSubmit}
                                        className="w-full mt-6 py-4 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 text-white font-bold rounded-xl transition-colors text-lg shadow-md disabled:shadow-none"
                                    >
                                        투표하기
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Step 3: Completed */}
                {step === 'completed' && (
                    <div className="p-10 text-center space-y-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-500 animate-bounce-small">
                            <Check className="w-10 h-10" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-extrabold text-gray-800">투표 완료!</h3>
                            <p className="text-gray-500 mt-2">
                                소중한 한 표가 안전하게 전달되었습니다.<br />
                                참여해 주셔서 감사합니다.
                            </p>
                        </div>
                        <p className="text-xs text-gray-400 mt-8 font-medium">
                            {countdown}초 후 본인 인증 화면으로 이동합니다.
                        </p>
                        <button
                            onClick={() => {
                                resetVoterState();
                                setStep('login');
                            }}
                            className="text-indigo-500 text-sm font-bold hover:underline"
                        >
                            지금 바로 이동
                        </button>
                    </div>
                )}

                {/* Step 4: Already Voted (Persistence Block) */}
                {step === 'already_voted' && (
                    <div className="p-10 text-center space-y-6 animate-fade-in">
                        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500 shadow-inner">
                            <Lock className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-gray-800">이미 참여한 선거입니다</h3>
                            <p className="text-gray-500 font-medium">
                                기기당 1인 1표 원칙에 따라<br />
                                중복 투표는 허용되지 않습니다.
                            </p>
                        </div>
                        <div className="pt-4 flex flex-col gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95"
                            >
                                메인으로 돌아가기
                            </button>
                        </div>
                    </div>
                )}


            </div>

            {/* Final Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 border border-gray-100 animate-slide-up">
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto text-teal-500 shadow-inner">
                                <CheckCircle className="w-10 h-10" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-gray-900 leading-tight">선택하신 내용을<br />최종 제출하시겠습니까?</h3>
                                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mt-4">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">선택한 후보</p>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {roomInfo.config.options?.multipleVoting ? (
                                            selectedChoices.map((choice, i) => {
                                                const c = roomInfo.config.candidates.find(cand => cand.id === choice.candidateId);
                                                return (
                                                    <span key={i} className="px-3 py-1 bg-white border border-indigo-100 rounded-full text-indigo-600 font-black text-sm shadow-sm">
                                                        {roomInfo.config.options?.rankedVoting && <span className="text-[10px] opacity-60 mr-1">{choice.rank}순위</span>}
                                                        {c?.name}
                                                    </span>
                                                );
                                            })
                                        ) : (() => {
                                            const c = roomInfo.config.candidates.find(cand => cand.id === selectedCandidateId);
                                            return (
                                                <span className="px-4 py-1.5 bg-white border border-teal-100 rounded-full text-teal-600 font-black text-lg shadow-sm">
                                                    기호 {c?.symbol} {c?.name}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>
                                <p className="text-[13px] text-red-500 font-bold pt-2">
                                    ⚠️ 제출 후에는 다시 수정할 수 없습니다.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 pt-4">
                                <button
                                    onClick={confirmFinalVote}
                                    className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white font-black rounded-2xl transition-all shadow-lg shadow-teal-500/30 active:scale-95 text-lg"
                                >
                                    확인, 제출합니다
                                </button>
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="w-full py-3 text-gray-400 font-bold hover:text-gray-600 transition-colors"
                                >
                                    다시 선택하기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer info */}
            <p className="mt-8 text-xs text-gray-400">
                Secure Voting System &copy; 한표꾹
            </p>
        </div>
    );
};

export default VotePage;
