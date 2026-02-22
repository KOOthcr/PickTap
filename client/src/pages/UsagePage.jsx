import React, { useEffect } from 'react';
import { Play, Users, Settings, BarChart3, CheckSquare, Download, Lock, RefreshCw, Smartphone, Monitor } from 'lucide-react';

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
                                href="https://github.com"
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
                        <div className="space-y-6">
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
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                                    <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                                    고급 설정 옵션
                                </h3>
                                <ul className="text-gray-600 text-sm leading-relaxed pl-8 list-disc list-inside space-y-1">
                                    <li><strong>복수 투표 & 순위 투표:</strong> 최대 몇 명까지 투표할지 정하거나(N명), 순위를 매기며 투표하도록 설정할 수 있습니다.</li>
                                    <li><strong>의견 쓰기 모드:</strong> 투표 후 서술형 건의 사항을 받을 수 있습니다.</li>
                                    <li><strong>기기당 1인 1표 원칙:</strong> 한 기기에서 여러 명이 연달아 투표할지, 한 번만 투표할지 통제합니다.</li>
                                </ul>
                            </div>
                        </div>

                        {/* Miniature UI Image Representation */}
                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 flex flex-col justify-center relative shadow-sm">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                                <div className="flex gap-2">
                                    <div className="h-8 bg-indigo-50 rounded flex-1 border border-indigo-100 flex items-center px-2">
                                        <div className="w-3 h-3 rounded-full bg-indigo-400 mr-2"></div>
                                        <div className="h-2 w-16 bg-indigo-200 rounded"></div>
                                    </div>
                                    <div className="h-8 bg-white border border-gray-200 rounded flex-1"></div>
                                </div>
                                <div className="h-24 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center gap-2">
                                    <Download className="w-5 h-5 text-gray-400" />
                                    <div className="h-2 w-20 bg-gray-300 rounded"></div>
                                </div>
                                <div className="flex mt-2 pt-2 border-t border-gray-100 items-center gap-2">
                                    <div className="w-4 h-4 rounded border border-indigo-500 bg-indigo-500 flex items-center justify-center">
                                        <CheckSquare className="w-3 h-3 text-white" />
                                    </div>
                                    <div className="h-2 w-24 bg-gray-700 rounded"></div>
                                </div>
                            </div>
                            <div className="absolute -bottom-4 -right-4 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transform -rotate-2">
                                <Settings className="w-3 h-3" /> 다양한 설정 완비!
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
                        {/* Miniature UI Image Representation */}
                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 flex flex-col justify-center relative shadow-sm order-last md:order-first">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-gray-900 text-white p-3 flex justify-between items-center">
                                    <div className="h-3 w-20 bg-gray-700 rounded"></div>
                                    <div className="bg-green-500 text-[10px] font-bold px-2 py-0.5 rounded text-white flex gap-1 items-center">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div> 시작됨
                                    </div>
                                </div>
                                <div className="p-4 space-y-4">
                                    {/* Stats mock */}
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-gray-50 rounded p-2 text-center text-xs text-gray-500">
                                            전체<br /><strong className="text-lg text-gray-800">100</strong>
                                        </div>
                                        <div className="flex-1 bg-green-50 rounded p-2 text-center text-xs text-green-700">
                                            투표율<br /><strong className="text-lg">85%</strong>
                                        </div>
                                    </div>
                                    {/* List mock */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center bg-gray-50 p-2 rounded text-xs">
                                            <span className="text-gray-600">3학년 1반 홍길동</span>
                                            <span className="w-4 h-4 bg-green-500 rounded-full text-white flex items-center justify-center text-[8px] font-bold">✓</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-gray-50 p-2 rounded text-xs opacity-50">
                                            <span className="text-gray-600">3학년 1반 김철수</span>
                                            <span className="text-[10px] text-gray-400">대기</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-1/2 -right-4 bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg transform translate-y-4 md:translate-x-4 flex items-center gap-2">
                                <Users className="w-3 h-3 text-green-400" /> 실시간 참여 확인
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
                                    <span className="bg-green-100 text-green-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                                    투표 시작 및 종료
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed pl-8">
                                    투표방 생성 직후는 <strong>대기 상태</strong>입니다. 관리자가 <code>선거 시작</code> 버튼을 눌러야만 기표 화면이 나타납니다. 언제든지 선거를 종료할 수 있습니다.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
                                    <span className="bg-green-100 text-green-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                                    실시간 투표율 확인
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed pl-8">
                                    참여 예정 인원 대비 현재 참여한 인원수와 퍼센트(%)를 실시간으로 모니터링할 수 있습니다.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
                                    <span className="bg-green-100 text-green-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                                    명부 체크용 엑셀 다운로드
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed pl-8">
                                    종이 서명 명부를 대체할 수 않도록 관리자 화면에서 각 유권자의 투표 참여 및 접속 코드가 포함된 엑셀 명단을 즉시 다운로드할 수 있습니다.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
                                    <span className="bg-green-100 text-green-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">4</span>
                                    투표 취소 및 설정 초기화
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed pl-8">
                                    진행 중인 선거에 문제가 발생한 경우 <code>투표 취소</code> 버튼을 눌러 투표를 즉시 중단하고 참여자들을 초기 상태로 돌려보낼 수 있습니다.
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

                        {/* Miniature UI Image Representation */}
                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 flex flex-col justify-center relative shadow-sm h-64 mx-auto w-full max-w-[280px]">
                            <div className="bg-white rounded-3xl shadow-xl border-4 border-gray-800 h-full w-full overflow-hidden flex flex-col relative transform hover:scale-105 transition-transform duration-300">
                                {/* Phone Notch */}
                                <div className="absolute top-0 inset-x-0 w-24 h-4 bg-gray-800 rounded-b-xl mx-auto z-20"></div>
                                <div className="bg-teal-500 w-full h-12 flex items-end justify-center pb-2 text-white font-bold text-[10px]">투표 용지</div>
                                <div className="flex-1 p-3 space-y-2">
                                    <div className="w-full bg-indigo-50 border border-indigo-200 p-2 rounded flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full border-2 border-indigo-500 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                        </div>
                                        <div className="h-2 w-16 bg-gray-800 rounded"></div>
                                    </div>
                                    <div className="w-full bg-white border border-gray-200 p-2 rounded flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full border-2 border-gray-300"></div>
                                        <div className="h-2 w-16 bg-gray-400 rounded"></div>
                                    </div>
                                    <div className="w-full h-8 bg-gray-50 border border-gray-200 rounded mt-2 flex items-center p-1 px-2">
                                        <span className="text-[6px] text-gray-400">의견을 남겨주세요...</span>
                                    </div>
                                </div>
                                <div className="p-2 bg-gray-50 border-t border-gray-100">
                                    <div className="w-full bg-teal-500 rounded text-center py-1.5 text-white text-[10px] font-bold">투표 제출</div>
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
                        {/* Miniature UI Image Representation */}
                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 flex flex-col justify-center relative shadow-sm order-last md:order-first">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
                                <div className="flex justify-between items-end border-b border-gray-100 pb-2">
                                    <div className="h-4 w-24 bg-gray-800 rounded"></div>
                                    <div className="h-3 w-12 bg-gray-300 rounded"></div>
                                </div>
                                <div className="space-y-3">
                                    <div className="relative pt-4">
                                        <div className="flex justify-between text-xs mb-1 font-bold text-gray-700">
                                            <span>기호 1번</span>
                                            <span>65표 (65%)</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-3">
                                            <div className="bg-indigo-500 h-3 rounded-full" style={{ width: '65%' }}></div>
                                        </div>
                                    </div>
                                    <div className="relative pt-2">
                                        <div className="flex justify-between text-xs mb-1 font-bold text-gray-700">
                                            <span>기호 2번</span>
                                            <span>35표 (35%)</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-3">
                                            <div className="bg-yellow-500 h-3 rounded-full" style={{ width: '35%' }}></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <div className="bg-green-100 text-green-700 px-2 py-1 flex items-center gap-1 rounded text-[10px] font-bold">
                                        <Download className="w-3 h-3" /> 결과 엑셀
                                    </div>
                                </div>
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
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-yellow-900 flex items-center gap-2">
                                    <span className="bg-yellow-100 text-yellow-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                                    엑셀 내보내기 2종
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed pl-8">
                                    <strong>공개 모드:</strong> 서술형 의견을 포함하여 통계 수치만 깔끔하게 저장<br />
                                    <strong>체크 모드(자동저장):</strong> 모든 유권자의 개별 접속 코드와 투표 실시 시간을 대조할 수 있는 데이터 파일 자동 다운로드.
                                </p>
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
