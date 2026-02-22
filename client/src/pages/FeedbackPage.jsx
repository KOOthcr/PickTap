import React from 'react';
import { MessageCircle, User, Mail, Github, HelpCircle } from 'lucide-react';

const FeedbackPage = () => {
    return (
        <div className="min-h-[calc(100vh-64px-70px)] bg-gradient-to-b from-teal-50 to-teal-100 p-4">
            <div className="max-w-4xl mx-auto py-8 space-y-12">
                {/* Page Title */}
                <div className="flex items-center gap-3 mb-8">
                    <MessageCircle className="w-8 h-8 text-green-500" />
                    <h1 className="text-3xl font-bold text-green-600">문의 및 피드백</h1>
                </div>

                {/* Developer Intro */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <User className="w-6 h-6 text-green-500" />
                        <h2 className="text-xl font-bold text-gray-800">개발자 소개</h2>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-lg font-bold text-gray-900">구리구리구's teacher</span>
                            <span className="text-sm text-gray-400 font-medium">(현직 초등교사, 교육 IT 개발희망자)</span>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                            매번 번거로운 투표와 선거 스트레스에서 벗어나세요! 선생님의 소중한 시간은 지켜드리고, 학생들에게는 데이터 기반의 가장 공정한 투표와 선거 시스템을 제공합니다.
                        </p>
                    </div>
                </section>

                {/* Contact Method */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Mail className="w-6 h-6 text-blue-500" />
                        <h2 className="text-xl font-bold text-gray-800">문의 방법</h2>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-blue-100 shadow-sm">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Mail className="w-5 h-5 text-blue-400" />
                                <span className="text-gray-600">이메일:</span>
                                <a href="mailto:ui7878@korea.kr" className="text-blue-600 font-medium hover:underline">
                                    ui7878@korea.kr
                                </a>
                            </div>
                            <div className="flex items-center gap-2">
                                <Github className="w-5 h-5 text-gray-600" />
                                <span className="text-gray-600">오픈소스 확인:</span>
                                <a href="#" className="font-medium text-gray-800 hover:text-black hover:underline">
                                    GitHub Repository
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <HelpCircle className="w-6 h-6 text-purple-500" />
                        <h2 className="text-xl font-bold text-gray-800">자주 묻는 질문</h2>
                    </div>
                    <div className="space-y-4">
                        {/* Q1 */}
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h3 className="text-purple-700 font-bold mb-2">Q. 버그/오류가 발생하면?</h3>
                            <p className="text-gray-600">
                                A. 이메일로 상세 상황을 알려주시면 빠르게 확인하여 고치겠습니다.
                            </p>
                        </div>

                        {/* Q2 */}
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h3 className="text-purple-700 font-bold mb-2">Q. 새로운 기능을 제안하고 싶어요.</h3>
                            <p className="text-gray-600">
                                A. 언제든 환영합니다! 선생님들의 아이디어가 더 좋은 프로그램을 만듭니다.
                            </p>
                        </div>

                        {/* Q3 */}
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h3 className="text-purple-700 font-bold mb-2">Q. 데이터 보안이 걱정돼요.</h3>
                            <p className="text-gray-600 leading-relaxed">
                                A. 걱정하지 마세요! 모든 데이터는 선생님의 PC(브라우저) 내에서만 처리됩니다. 협업 시 전송되는 데이터 또한 강력하게 <span className="font-bold text-gray-800">암호화(E2EE)</span>되어 서버는 내용을 전혀 알 수 없으며, 화면을 닫는 순간 흔적 없이 사라집니다.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default FeedbackPage;
