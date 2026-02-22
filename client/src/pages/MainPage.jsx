import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, School, CheckSquare, LogIn } from 'lucide-react';

const MainPage = () => {
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

    const handleCreate = () => {
        if (!createForm.name || !createForm.count) {
            alert('정보가 부족합니다'); // User requested "00정보가 부족합니다" -> I'll use a simple alert for now or a custom UI?
            // User said: "00정보가 부족합니다 문구가 나오게 해줘"
            // "00" might mean the specific missing field, but "정보가 하나라도 없으면" implies a generic message or checking each.
            // Let's assume generic "정보가 부족합니다" first.
            // Wait, "00정보가 부족합니다" might mean "투표 이름 정보가 부족합니다" or "투표 인원 정보가 부족합니다".
            // Let's implement specific messages.
            if (!createForm.name) {
                alert('투표 이름 정보가 부족합니다');
                return;
            }
            if (!createForm.count) {
                alert('투표 인원 정보가 부족합니다');
                return;
            }
            return;
        }
        navigate(`/create/${createForm.type}`, { state: createForm });
    };

    const handleJoin = () => {
        if (!joinCode || joinCode.length < 4) {
            alert('올바른 참여 코드를 입력해주세요.');
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
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-600 block">투표 유형</label>
                            <div className="flex gap-4">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="voteType"
                                        value="class"
                                        checked={createForm.type === 'class'}
                                        onChange={() => handleCreateTypeChange('class')}
                                        className="w-5 h-5 text-green-500 focus:ring-green-400 border-gray-300"
                                    />
                                    <span className="text-gray-700">학급용</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="voteType"
                                        value="school"
                                        checked={createForm.type === 'school'}
                                        onChange={() => handleCreateTypeChange('school')}
                                        className="w-5 h-5 text-blue-500 focus:ring-blue-400 border-gray-300"
                                    />
                                    <span className="text-gray-700">학교용</span>
                                </label>
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
