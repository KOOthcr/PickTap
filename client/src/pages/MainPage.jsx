import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, School, CheckSquare, LogIn } from 'lucide-react';
import { useModal } from '../contexts/ModalContext';

const MainPage = () => {
    const showModal = useModal();
    const [voteType, setVoteType] = useState('class'); // 'class' or 'school'
    const [createForm, setCreateForm] = useState({
        type: 'class',
        name: '',
        count: '',
    });
    const [joinCode, setJoinCode] = useState('');

    const navigate = useNavigate();

    const handleCreateTypeChange = (type) => {
        setCreateForm({ ...createForm, type });
        setVoteType(type); // Sync overall theme
    };

    const handleCreate = async () => {
        if (!createForm.name || !createForm.count) {
            if (!createForm.name) {
                await showModal.alert('투표 이름 정보가 부족합니다', '입력 오류');
                return;
            }
            if (!createForm.count) {
                await showModal.alert('투표 인원 정보가 부족합니다', '입력 오류');
                return;
            }
            return;
        }
        navigate(`/create/${createForm.type}`, { state: createForm });
    };

    const handleJoin = async () => {
        if (!joinCode || joinCode.length < 4) {
            await showModal.alert('올바른 참여 코드를 입력해주세요.', '참여 실패');
            return;
        }
        navigate(`/vote/${joinCode.toUpperCase()}`);
    };

    return (
        <div className="min-h-[calc(100vh-64px-70px)] bg-gradient-to-b from-teal-50 to-teal-100 flex flex-col items-center justify-center p-4">
            {/* Hero Section */}
            <div className="text-center mb-10 animate-fade-in-down">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 flex items-center justify-center gap-3">
                    <span>☝️</span> 한표꾹
                </h1>
                <p className="text-lg text-gray-600">
                    우리 학급의 뜻을 모으는 가장 쉬운 방법
                </p>

            </div>

            {/* Content Section - Grid for Create and Join */}
            <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl">

                {/* Create Vote Section */}
                <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300 border-t-8 border-green-400">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-green-100 rounded-full">
                            <CheckSquare className="w-6 h-6 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">새로운 투표 만들기</h2>
                    </div>

                    <form className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-600 block">투표 유형</label>
                            <div className="relative flex p-1.5 bg-gray-100 rounded-2xl w-full">
                                {/* Sliding Background */}
                                <div
                                    className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-md transition-all duration-300 ease-out ${createForm.type === 'class' ? 'left-1.5' : 'left-[calc(50%+1px)]'
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleCreateTypeChange('class')}
                                    className={`relative z-10 flex-1 py-3 text-sm font-bold rounded-xl transition-colors duration-200 ${createForm.type === 'class' ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    학급용
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCreateTypeChange('school')}
                                    className={`relative z-10 flex-1 py-3 text-sm font-bold rounded-xl transition-colors duration-200 ${createForm.type === 'school' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    학교용
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="voteName" className="text-sm font-semibold text-gray-600 block">
                                투표 이름
                            </label>
                            <input
                                type="text"
                                id="voteName"
                                placeholder={createForm.type === 'class' ? "예: 우리반 반장 선거" : "예: 우리학교 회장 선거"}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white"
                                value={createForm.name}
                                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="voteCount" className="text-sm font-semibold text-gray-600 block">
                                투표 인원
                            </label>
                            <input
                                type="number"
                                id="voteCount"
                                placeholder="총 인원 입력"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white"
                                value={createForm.count}
                                onChange={(e) => setCreateForm({ ...createForm, count: e.target.value })}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleCreate}
                            className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/30 transition-all transform hover:-translate-y-1 mt-4"
                        >
                            만들기
                        </button>
                    </form>
                </div>

                {/* Join Vote Section */}
                <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300 border-t-8 border-blue-400 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <LogIn className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">투표 참여하기</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="joinCode" className="text-sm font-semibold text-gray-600 block">
                                참여 코드
                            </label>
                            <input
                                type="text"
                                id="joinCode"
                                placeholder="6자리 코드 입력"
                                maxLength={6}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white text-center text-2xl tracking-widest uppercase"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleJoin}
                            className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-1"
                        >
                            참여하기
                        </button>

                        <p className="text-center text-gray-400 text-sm mt-4">
                            선생님께 전달받은 코드를 입력해주세요.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MainPage;
