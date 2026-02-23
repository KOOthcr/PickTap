import React, { useEffect } from 'react';
import { Play, Users, Settings, BarChart3, CheckSquare, Download, Lock, RefreshCw, Smartphone, Monitor, User, Plus } from 'lucide-react';

const UsagePage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-[calc(100vh-64px-70px)] bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center gap-3">
                        <span className="text-5xl">📖</span> 한표꾹 사용 가이드
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        누구나 쉽고 안전하게 진행할 수 있는 실시간 선거 시스템, 한표꾹의 상세한 사용 방법을 안내합니다.
                    </p>
                </div>

                {/* Data Security Notice */}
                <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start shadow-sm border-l-4 border-l-blue-500">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                        <Lock className="w-6 h-6" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                            데이터 보안 및 안심 사용 안내
                        </h2>
                        <div className="space-y-4">
                            <p className="text-blue-800 text-lg font-bold leading-tight">
                                모든 데이터는 실시간으로 보여지기만 할 뿐, 어딘가에 저장되지 않습니다.
                            </p>
                            <p className="text-blue-700 text-sm leading-relaxed">
                                Socket.io를 활용해 메모리상에서만 데이터가 실시간 중계되며,
                                <strong>클라이언트 측 암호화(E2EE)</strong>를 적용하여 서버 운영자도 데이터를 절대 볼 수 없습니다.
                                안심하고 사용하시기 바랍니다.
                            </p>
                            <a
                                href="https://github.com/KOOthcr/PickTap"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-blue-600 font-medium text-sm hover:underline"
                            >
                                오픈소스 코드 확인하기 (GitHub) <Play className="w-3 h-3 rotate-0" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Section 1: 투표 설정하기 */}
                <section className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 pointer-events-none"></div>

                    <div className="flex items-center gap-4 mb-8 relative z-10">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <Settings className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">1. 투표 설정하기</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-10 relative z-10">
                        <div className="space-y-8">
                            {/* Original Content - Step 1 & 2 */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                                        <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                                        투표 종류 선택
                                    </h3>
                                    <p className="text-gray-600 text-sm leading-relaxed pl-8">
                                        메인 페이지에서 <strong>학급 투표</strong>(단일 학급 대상) 또는 <strong>학교 투표</strong>(전교생 대상, 학년/반 구조) 중 하나를 선택하여 진행합니다.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                                        <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                                        유권자 명부 작성 (엑셀 지원)
                                    </h3>
                                    <p className="text-gray-600 text-sm leading-relaxed pl-8">
                                        참여할 학생들의 이름, 학급, 번호를 직접 입력하거나 제공된 <strong>양식 다운로드</strong>를 통해 엑셀 파일로 한 번에 업로드할 수 있습니다.
                                    </p>
                                </div>
                            </div>

                            {/* Detailed Feature Cards (New Content) */}
                            <div className="space-y-4 pt-2">
                                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-3">
                                    <p className="font-bold text-indigo-800 flex items-center gap-2">
                                        <RefreshCw className="w-4 h-4" /> 학급 투표 특화 기능
                                    </p>
                                    <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
                                        <div className="bg-white/80 p-2.5 rounded-xl shadow-sm">
                                            <span className="font-bold text-indigo-600">자동 명부 생성:</span> 이름 입력 없이 명수만 지정하면 고유 접속 코드를 즉시 생성합니다. (번호: 1, 2... / 이름: 표1, 표2... 순차 생성)
                                        </div>
                                        <div className="bg-white/80 p-2.5 rounded-xl shadow-sm">
                                            <span className="font-bold text-green-600">간단 투표 모드:</span> 코드 없이 이름만 입력하여 바로 투표할 수 있는 쾌속 모드입니다.
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-3">
                                    <p className="font-bold text-blue-800 flex items-center gap-2">
                                        🔑 학교 투표 스마트 코드
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-xs text-blue-900/70 ml-1">
                                        <li><strong>1~3학년:</strong> 입력이 쉬운 <strong>숫자 6자리</strong></li>
                                        <li><strong>4~6학년:</strong> 보안이 강화된 <strong>영문+숫자</strong></li>
                                        <li><strong>숫자 모드 선택 시:</strong> 전 학년 숫자로만 발급 가능</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Original Content - Step 3 */}
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                                    <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                                    핵심 고급 옵션
                                </h3>
                                <ul className="text-gray-600 text-sm leading-relaxed pl-8 list-disc list-inside space-y-1">
                                    <li><strong>복수/순위 투표:</strong> N명 선택 또는 순위 지정을 통해 정교한 선출이 가능합니다.</li>
                                    <li><strong>의견 쓰기:</strong> 투표와 동시에 후보자나 학교에 건의 사항을 받을 수 있습니다.</li>
                                    <li><strong>기기 제한:</strong> 한 기기에서 1인 1표만 가능하도록 브라우저 쿠키 기반 통제를 지원합니다.</li>
                                </ul>
                            </div>
                        </div>

                        {/* Miniature UI Image Representation - Maximized to fill background */}
                        <div className="bg-gray-50 rounded-2xl p-2 md:p-3 border border-gray-200 relative shadow-sm h-full min-h-[500px] flex items-stretch">
                            <div className="bg-white rounded-[1.8rem] shadow-xl border border-gray-100 p-6 md:p-8 space-y-10 w-full flex flex-col justify-between transform hover:scale-[1.005] transition-all duration-500 ease-out">
                                <div className="space-y-10">
                                    {/* Vote Type Selector Mockup */}
                                    <div className="space-y-4">
                                        <div className="h-4 bg-gray-200 rounded-full w-1/4"></div>
                                        <div className="flex p-1.5 bg-gray-100 rounded-2xl">
                                            <div className="bg-white rounded-xl shadow-lg flex-1 h-12 flex items-center justify-center">
                                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2"></div>
                                                <div className="h-2 w-12 bg-indigo-200 rounded-full"></div>
                                            </div>
                                            <div className="flex-1 flex items-center justify-center">
                                                <div className="h-2 w-12 bg-gray-300 rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Voter Management Mockup */}
                                    <div className="space-y-5">
                                        <div className="h-4 bg-gray-200 rounded-full w-1/3"></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="h-28 bg-indigo-50/50 rounded-3xl border border-dashed border-indigo-200 flex flex-col items-center justify-center gap-3 group cursor-default">
                                                <div className="p-3.5 bg-indigo-100 rounded-2xl group-hover:scale-110 transition-transform">
                                                    <Users className="w-5 h-5 text-indigo-500" />
                                                </div>
                                                <div className="h-2 w-14 bg-indigo-200 rounded-full"></div>
                                            </div>
                                            <div className="h-28 bg-green-50/50 rounded-3xl border border-dashed border-green-200 flex flex-col items-center justify-center gap-3 group cursor-default">
                                                <div className="p-3.5 bg-green-100 rounded-2xl group-hover:scale-110 transition-transform">
                                                    <Smartphone className="w-5 h-5 text-green-500" />
                                                </div>
                                                <div className="h-2 w-14 bg-green-200 rounded-full"></div>
                                            </div>
                                        </div>
                                        <div className="h-16 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-center gap-4 hover:bg-white transition-colors">
                                            <Download className="w-6 h-6 text-gray-400" />
                                            <div className="h-2 w-24 bg-gray-300 rounded-full"></div>
                                        </div>
                                    </div>

                                    {/* New Added Section: Candidate Registration Mockup */}
                                    <div className="space-y-4 pt-2">
                                        <div className="h-4 bg-gray-200 rounded-full w-1/4"></div>
                                        <div className="flex gap-3 overflow-hidden">
                                            <div className="flex-1 min-w-[120px] bg-white border-2 border-indigo-100 rounded-2xl p-3 flex flex-col items-center gap-2 shadow-sm relative overflow-hidden group">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5 text-indigo-400" />
                                                </div>
                                                <div className="h-2 w-16 bg-gray-800 rounded-full"></div>
                                                <div className="h-1.5 w-10 bg-gray-300 rounded-full"></div>
                                            </div>
                                            <div className="flex-1 min-w-[120px] bg-white border border-gray-100 rounded-2xl p-3 flex flex-col items-center gap-2 shadow-sm relative opacity-60">
                                                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5 text-gray-300" />
                                                </div>
                                                <div className="h-2 w-16 bg-gray-400 rounded-full"></div>
                                                <div className="h-1.5 w-10 bg-gray-200 rounded-full"></div>
                                            </div>
                                            <div className="w-10 h-full bg-gray-50 border border-dashed border-gray-200 rounded-2xl flex items-center justify-center shrink-0">
                                                <Plus className="w-5 h-5 text-gray-300" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Settings Checklist Mockup - Pushed to bottom */}
                                <div className="space-y-6 pt-10 border-t border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-6 h-6 rounded-lg border-2 border-indigo-500 bg-indigo-500 flex items-center justify-center shadow-lg">
                                            <CheckSquare className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="h-2.5 w-40 bg-gray-800 rounded-full"></div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-6 h-6 rounded-lg border-2 border-indigo-500 bg-indigo-500 flex items-center justify-center shadow-lg">
                                            <CheckSquare className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="h-2.5 w-32 bg-gray-800 rounded-full"></div>
                                    </div>
                                    <div className="flex items-center gap-4 opacity-40">
                                        <div className="w-6 h-6 rounded-lg border-2 border-gray-300"></div>
                                        <div className="h-2.5 w-48 bg-gray-400 rounded-full"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Badge - Repositioned to overlap neatly */}
                            <div className="absolute bottom-6 -right-3 bg-indigo-600 text-white text-[12px] font-extrabold px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2 transform -rotate-1 hover:rotate-0 transition-all hover:scale-105 cursor-default z-20 border-2 border-white">
                                <Settings className="w-4 h-4 shadow-sm" /> 맞춤형 선거 구축!
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: 투표 관리 및 통제 */}
                <section className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 pointer-events-none"></div>

                    <div className="flex items-center gap-4 mb-8 relative z-10">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <Monitor className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">2. 선거 본부 (관리자 화면)</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-10 relative z-10">
                        {/* Miniature UI Image Representation - Maximized for Admin Screen */}
                        <div className="bg-gray-50 rounded-2xl p-2 md:p-3 border border-gray-200 relative shadow-sm h-full min-h-[600px] flex items-stretch order-last md:order-first">
                            <div className="bg-white rounded-[1.8rem] shadow-xl border border-gray-100 overflow-hidden w-full flex flex-col transform hover:scale-[1.005] transition-all duration-500 ease-out">
                                <div className="bg-gray-900 text-white p-4 flex justify-between items-center shrink-0">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                        <div className="h-3 w-24 bg-gray-700 rounded-full ml-2"></div>
                                    </div>
                                    <div className="bg-green-500 text-[11px] font-extrabold px-3 py-1 rounded-full text-white flex gap-1.5 items-center shadow-lg shadow-green-500/20">
                                        <div className="w-2 h-2 bg-white rounded-full animate-ping"></div> 실시간 중계 중
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col gap-6 overflow-hidden">
                                    {/* Stats mock */}
                                    <div className="grid grid-cols-2 gap-4 shrink-0">
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-center space-y-1">
                                            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">전체 유권자</div>
                                            <div className="text-2xl font-black text-indigo-900">120<span className="text-sm font-normal ml-0.5">명</span></div>
                                        </div>
                                        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center space-y-1">
                                            <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider">현재 투표율</div>
                                            <div className="text-2xl font-black text-green-700">92<span className="text-sm font-normal ml-0.5">%</span></div>
                                        </div>
                                    </div>

                                    {/* Middle Content: Live Feed Mockup */}
                                    <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3 overflow-hidden relative">
                                        <div className="h-3 bg-gray-200 rounded-full w-1/4 mb-4"></div>
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} className={`flex justify-between items-center p-3 rounded-xl border bg-white shadow-sm transition-all ${i === 1 ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 1 ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                        {i}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className={`h-2 rounded-full bg-gray-800 ${i === 1 ? 'w-20' : 'w-16'}`}></div>
                                                        <div className="h-1.5 w-12 bg-gray-300 rounded-full"></div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {i === 1 ? (
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-600 text-[9px] font-bold rounded-lg">방금 투표!</span>
                                                    ) : (
                                                        <div className="w-5 h-5 bg-green-50 rounded-full flex items-center justify-center">
                                                            <span className="text-green-500 text-[10px] font-bold">✓</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-gray-50 to-transparent"></div>
                                    </div>

                                    {/* Bottom Control Mockup */}
                                    <div className="flex gap-3 shrink-0">
                                        <div className="flex-1 h-12 bg-red-500 rounded-xl shadow-lg shadow-red-500/20 flex items-center justify-center gap-2">
                                            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                                            <div className="h-2 w-16 bg-white/40 rounded-full"></div>
                                        </div>
                                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                                            <Download className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-1/2 -right-4 bg-gray-900 text-white text-[11px] font-black px-5 py-2.5 rounded-2xl shadow-2xl transform translate-y-12 md:translate-x-2 flex items-center gap-2 border-2 border-white z-20 hover:scale-105 transition-transform cursor-default">
                                <Users className="w-3.5 h-3.5 text-green-400" /> 110명 실시간 참여 중
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
                                        <span className="bg-green-100 text-green-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                                        투표 진행 및 실시간 중계
                                    </h3>
                                    <p className="text-gray-600 text-sm leading-relaxed pl-8">
                                        <code>선거 시작</code> 버튼으로 투표를 개시하며, <strong>실시간 중계 모드</strong>를 켜면 현황판에 실시간으로 집계되는 득표 드라마를 연출할 수 있습니다.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
                                        <span className="bg-green-100 text-green-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                                        전략적 결과 공개 모드
                                    </h3>
                                    <div className="text-gray-600 text-sm leading-relaxed pl-8 grid grid-cols-1 gap-3">
                                        <div className="bg-white/50 border border-green-100 p-3 rounded-xl space-y-2">
                                            <p className="font-bold text-green-800 flex items-center gap-1.5 text-xs">
                                                <Play className="w-3.5 h-3.5" /> 3가지 핵심 공개 방식
                                            </p>
                                            <ul className="space-y-1.5 text-xs text-green-900/70">
                                                <li><strong>비밀 모드 (기본):</strong> 최종 득표수만 공개되는 표준 비밀 투표</li>
                                                <li><strong>체크 모드:</strong> 관리자만 엑셀로 개별 투표 용지를 상호 대조 가능</li>
                                                <li><strong>공개 모드:</strong> 종료 후 누구나 '누가 누구에게 했는지' 투명하게 확인</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
                                    <span className="bg-green-100 text-green-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                                    명부 체크용 엑셀 다운로드
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed pl-8">
                                    종이 서명 명부가 필요 없습니다. 각 유권자의 투표 참여 시간과 접속 코드가 포함된 엑셀 명단을 관리자 화면에서 즉시 다운로드할 수 있습니다.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
                                    <span className="bg-green-100 text-green-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">4</span>
                                    투표 취소 및 설정 초기화
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed pl-8">
                                    잘못된 설정이나 돌발 상황 시 <code>투표 취소</code> 버튼을 통해 즉시 중단하고 모든 유권자를 대기실(초기 화면)로 안전하게 되돌려보냅니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 3: 투표 참여 (기표자) */}
                <section className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 pointer-events-none"></div>

                    <div className="flex items-center gap-4 mb-8 relative z-10">
                        <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <Smartphone className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">3. 투표 참여 (기표 화면)</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-10 relative z-10">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-teal-900 flex items-center gap-2">
                                    <span className="bg-teal-100 text-teal-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                                    본인 인증 및 투표장 열림 대기
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed pl-8">
                                    전달받은 참여 코드 또는 학번/이름을 입력하면 투표장에 입장합니다. 관리자가 투표를 시작하기 전이라면 <strong>대기 화면</strong>에서 실시간으로 대기합니다.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-teal-900 flex items-center gap-2">
                                    <span className="bg-teal-100 text-teal-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                                    투표 및 의견 남기기
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed pl-8">
                                    투표 용지가 나타나면 원하는 후보를 선택합니다. 단일 선택부터, 최대 N명 복수 선택, 순위 지정까지 관리자의 설정에 맞춰 직관적인 UI가 제공됩니다. (의견 쓰기 옵션 반영 시 텍스트 창 표시)
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-teal-900 flex items-center gap-2">
                                    <span className="bg-teal-100 text-teal-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                                    다음 사람을 위한 자동 초기화
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed pl-8">
                                    공용 기기(예: 태블릿 단말기)를 사용하는 경우, 한 명의 투표가 완료되면 화면이 <strong>자동으로 초기 인증창으로 리셋</strong>되어 다음 사람이 바로 투표를 이어나갈 수 있습니다.
                                </p>
                            </div>
                        </div>

                        {/* Miniature UI Image Representation - Phone Mockup Adjusted to Text Height */}
                        <div className="bg-gray-50 rounded-2xl p-4 md:p-6 border border-gray-200 relative shadow-sm h-full min-h-[380px] max-h-[420px] flex items-center justify-center">
                            <div className="bg-white rounded-[2rem] shadow-2xl border-[5px] border-gray-800 h-full w-full max-w-[200px] overflow-hidden flex flex-col relative transform hover:scale-[1.02] transition-all duration-500 ease-out group">
                                {/* Phone Notch */}
                                <div className="absolute top-0 inset-x-0 w-20 h-4 bg-gray-800 rounded-b-xl mx-auto z-20"></div>

                                {/* Screen Content */}
                                <div className="bg-teal-500 w-full h-10 flex items-end justify-center pb-2 text-white font-bold text-[9px] shrink-0 shadow-lg">투표 용지</div>

                                <div className="flex-1 p-3.5 space-y-2.5 overflow-hidden bg-gray-50/30">
                                    {/* Candidates list preview - more compact */}
                                    <div className="space-y-2">
                                        <div className="w-full bg-white border-2 border-indigo-500 p-2 rounded-xl flex items-center gap-2 shadow-md transform -translate-y-0.5">
                                            <div className="w-3.5 h-3.5 rounded-full border-[2.5px] border-indigo-500 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                            </div>
                                            <div className="space-y-1 flex-1">
                                                <div className="h-1.5 w-14 bg-gray-800 rounded-full"></div>
                                                <div className="h-1 w-8 bg-gray-300 rounded-full"></div>
                                            </div>
                                        </div>
                                        {[1, 2].map(i => (
                                            <div key={i} className="w-full bg-white border border-gray-100 p-2 rounded-xl flex items-center gap-2 shadow-sm opacity-60">
                                                <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200"></div>
                                                <div className="space-y-1 flex-1">
                                                    <div className="h-1.5 w-10 bg-gray-400 rounded-full"></div>
                                                    <div className="h-1 w-6 bg-gray-200 rounded-full"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Opinion Input Mockup - more compact */}
                                    <div className="pt-1.5 space-y-1">
                                        <div className="h-1 w-1/4 bg-gray-300 rounded-full"></div>
                                        <div className="w-full h-10 bg-white border border-gray-200 rounded-lg flex items-start p-1.5 shadow-inner">
                                            <span className="text-[6px] text-gray-400 leading-tight">의견을 남겨주세요...</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit area */}
                                <div className="p-2.5 bg-white border-t border-gray-100 shrink-0">
                                    <div className="w-full bg-teal-500 hover:bg-teal-600 rounded-lg text-center py-2 text-white text-[10px] font-black shadow-lg shadow-teal-500/30 transition-colors">투표 제출하기</div>
                                </div>

                                {/* Home indicator */}
                                <div className="h-1 w-12 bg-gray-200 rounded-full mx-auto my-1.5 shrink-0"></div>
                            </div>

                            {/* Floating QR Code Badge - slightly smaller */}
                            <div className="absolute top-6 -right-2 bg-white p-2.5 rounded-xl shadow-2xl border border-gray-100 transform rotate-6 hover:rotate-0 transition-transform cursor-default z-20 group-hover:scale-110">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg border-2 border-gray-800 border-dashed flex items-center justify-center p-1.5 relative overflow-hidden">
                                    <div className="grid grid-cols-3 gap-0.5 opacity-20">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => <div key={i} className="w-1.5 h-1.5 bg-black rounded-sm"></div>)}
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-5 h-5 bg-white rounded-lg border-2 border-gray-800 flex items-center justify-center">
                                            <Smartphone className="w-2.5 h-2.5 text-gray-800" />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-1 text-center">
                                    <span className="text-[9px] font-black text-gray-800 tracking-tighter">QR CODE</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 4: 결과 확인 */}
                <section className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 pointer-events-none"></div>

                    <div className="flex items-center gap-4 mb-8 relative z-10">
                        <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">4. 최종 결과 확인</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-10 relative z-10">
                        {/* Miniature UI Image Representation - Results Adjusted to Text Height */}
                        <div className="bg-gray-50 rounded-2xl p-4 md:p-6 border border-gray-200 relative shadow-sm h-full min-h-[360px] max-h-[400px] flex items-stretch order-last md:order-first">
                            <div className="bg-white rounded-[1.5rem] shadow-xl border border-gray-100 p-5 space-y-5 w-full flex flex-col transform hover:scale-[1.005] transition-all duration-500 ease-out">
                                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                    <div className="space-y-1">
                                        <div className="h-3 w-24 bg-gray-800 rounded-full"></div>
                                        <div className="h-1.5 w-16 bg-gray-300 rounded-full"></div>
                                    </div>
                                    <div className="bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg flex items-center gap-1.5">
                                        <BarChart3 className="w-3 h-3 text-indigo-500" />
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    {/* Winner Card Mockup - More compact */}
                                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-3 text-white relative overflow-hidden shadow-lg shrink-0">
                                        <div className="relative z-10 flex justify-between items-center">
                                            <div className="space-y-1">
                                                <div className="text-[7px] font-bold opacity-80 uppercase tracking-widest">🏆 당선 확정</div>
                                                <div className="h-2.5 w-16 bg-white rounded-full"></div>
                                            </div>
                                            <div className="text-lg font-black">65<span className="text-[9px] font-normal ml-0.5">표</span></div>
                                        </div>
                                    </div>

                                    {/* Result Bars Mockup - More compact */}
                                    <div className="space-y-3.5">
                                        <div className="relative">
                                            <div className="flex justify-between text-[9px] mb-1 font-bold text-gray-700">
                                                <span>기호 1번</span>
                                                <span className="text-indigo-600">65%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                                                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '65%' }}></div>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <div className="flex justify-between text-[9px] mb-1 font-bold text-gray-700">
                                                <span>기호 2번</span>
                                                <span className="text-yellow-600">35%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                                                <div className="bg-yellow-500 h-full rounded-full" style={{ width: '35%' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Summary Badge - slightly smaller */}
                            <div className="absolute -bottom-3 -left-2 bg-gray-900 text-white text-[8px] font-black px-3.5 py-2 rounded-xl shadow-2xl flex items-center gap-1.5 transform rotate-2 hover:rotate-0 transition-all hover:scale-105 cursor-default z-20 border-2 border-white">
                                <CheckSquare className="w-2.5 h-2.5 text-green-400" /> 결과 레포트 완료
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-yellow-900 flex items-center gap-2">
                                    <span className="bg-yellow-100 text-yellow-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                                    카운트다운 및 팡파레
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed pl-8">
                                    관리자가 투표를 닫으면, 화면에서 자동으로 "3, 2, 1" 카운트다운이 시작되며 모두의 이목을 집중시킨 후 결과가 공개됩니다.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-yellow-900 flex items-center gap-2">
                                    <span className="bg-yellow-100 text-yellow-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                                    결과 시각화
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed pl-8">
                                    각 후보자별 득표수와 득표율(%)이 직관적인 막대 그래프로 표시됩니다. 미투표(기권) 데이터도 함께 볼 수 있습니다.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-yellow-900 flex items-center gap-2">
                                    <span className="bg-yellow-100 text-yellow-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                                    결과 저장 및 엑셀 내보내기
                                </h3>
                                <div className="text-gray-600 text-sm leading-relaxed pl-8 space-y-3">
                                    <p>
                                        <strong>공개 모드:</strong> 서술형 의견을 포함하여 통계 수치만 깔끔하게 저장
                                    </p>
                                    <p>
                                        <strong>체크 모드:</strong> 모든 유권자의 개별 접속 코드와 투표 실시 시간을 대조할 수 있는 상세 데이터 제공
                                    </p>
                                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-start gap-2 mt-2 -mr-2 md:-mr-4 shadow-sm">
                                        <div className="text-blue-600 font-black mt-0.5 text-xs">ℹ️</div>
                                        <p className="text-blue-800 text-xs font-medium break-keep">
                                            <strong>자동 저장 안내:</strong> 공개 모드와 체크 모드에서는 투표 종료와 동시에 결과 파일이 관리자 PC로 자동 다운로드됩니다.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="text-center pt-8 pb-12">
                    <p className="text-gray-500 font-medium mb-4">지금 바로 투표를 시작해보세요!</p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center mx-auto gap-2"
                    >
                        메인으로 돌아가기 <Play className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UsagePage;
