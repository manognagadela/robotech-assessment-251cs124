import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function QuizEngine() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(null);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [responses, setResponses] = useState({});
    const [isViolation, setIsViolation] = useState(false);

    const engineRef = useRef(null);
    const guestEmail = sessionStorage.getItem(`quiz_email_${id}`);

    useEffect(() => {
        // 1. Strict Interaction Lock
        const disableContext = (e) => e.preventDefault();
        const disableKeydown = (e) => {
            // Disable Alt+Tab, Win, Ctrl+W, F12 etc where possible
            if (e.altKey || e.ctrlKey || e.metaKey || e.key === 'F12') {
                // We can't block everything, but we can detect it
            }
        };
        document.addEventListener('contextmenu', disableContext);
        document.addEventListener('keydown', disableKeydown);

        // 2. Fullscreen Enforcement
        const enterFS = () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.warn("Fullscreen deferred: Awaiting user pulse.");
                });
            }
        };

        const checkFS = () => {
            if (quiz?.require_fullscreen && !document.fullscreenElement && !loading) {
                handleViolation("Protocol Violation: Fullscreen exit detected.");
            }
        };

        // 3. Tab Switch Proctoring
        const handleVisibility = () => {
            if (document.visibilityState === 'hidden' && quiz?.auto_submit_on_tab_switch) {
                handleViolation("Tab focus loss detected.");
            }
        };

        // 4. Initial Trigger & Listeners
        document.addEventListener('visibilitychange', handleVisibility);
        document.addEventListener('fullscreenchange', checkFS);
        window.addEventListener('blur', handleVisibility);

        // Auto-enforce on heartbeat/click
        const heartbeat = setInterval(() => {
            if (quiz?.require_fullscreen && !document.fullscreenElement && !loading && !isViolation) {
                enterFS();
            }
        }, 3000);

        const handleManualFS = () => {
            if (quiz?.require_fullscreen && !document.fullscreenElement) enterFS();
        };
        document.addEventListener('click', handleManualFS);

        return () => {
            document.removeEventListener('contextmenu', disableContext);
            document.removeEventListener('keydown', disableKeydown);
            document.removeEventListener('visibilitychange', handleVisibility);
            document.removeEventListener('fullscreenchange', checkFS);
            document.removeEventListener('click', handleManualFS);
            window.removeEventListener('blur', handleVisibility);
            clearInterval(heartbeat);
        };
    }, [quiz, loading, isViolation]);

    useEffect(() => {
        const init = async () => {
            try {
                const code = sessionStorage.getItem(`quiz_code_${id}`);

                // Fetch current status and quiz data
                const res = await api.post("/quizzes/join_by_code/", {
                    code,
                    email: guestEmail
                });

                const { quiz, attempt } = res.data;

                if (!attempt || attempt.status !== 'ONGOING') {
                    navigate(`/quizzes/${id}/onboarding`);
                    return;
                }

                setQuiz(quiz);
                setAttempt(attempt);
                setTimeLeft(attempt.time_left);
                setResponses(attempt.responses || {});
                setLoading(false);
            } catch (err) { navigate("/quizzes"); }
        };
        init();
    }, [id]);

    // Timer Logic
    useEffect(() => {
        if (!timeLeft || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleViolation = async (reason) => {
        if (isViolation) return;
        setIsViolation(true);
        await api.post(`/quizzes/${id}/submit_quiz/`, { disqualified: true, email: guestEmail });
        alert(`SECURITY BREACH: ${reason}\nAssessment sequence terminated.`);
        navigate("/quizzes");
    };

    const handleSelectOption = (qId, val) => {
        const newResponses = { ...responses, [qId]: Array.isArray(val) ? val : [val] };
        setResponses(newResponses);
        api.post(`/quizzes/${id}/update_responses/`, { responses: newResponses, email: guestEmail });
    };

    const handleSubmit = async (isAuto = false) => {
        if (!isAuto && !window.confirm("Finalize transmission?")) return;
        setLoading(true);
        try {
            await api.post(`/quizzes/${id}/submit_quiz/`, { email: guestEmail });
            navigate("/quizzes/success");
        } catch (err) {
            alert("Transmission failure.");
        } finally {
            setLoading(false);
        }
    };

    if (loading || !quiz) return <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-cyan-500 font-black uppercase text-[10px] tracking-widest">Neural Link Synchronizing...</p>
    </div>;

    const currentQ = quiz.questions[currentQIndex];
    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col select-none" ref={engineRef}>
            <div className="bg-[#0a0a0f] border-b border-white/5 p-6 flex justify-between items-center shadow-xl relative z-10">
                <div className="flex items-center gap-6">
                    <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center font-black text-xs transform -rotate-12">R</div>
                    <div>
                        <h2 className="text-sm font-bold font-[Orbitron] uppercase tracking-wider">{quiz.title}</h2>
                        <div className="flex gap-4 mt-1">
                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Candidate: {guestEmail || 'Registered Member'}</p>
                            <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Question {currentQIndex + 1}/{quiz.questions.length}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className={`flex flex-col items-end ${timeLeft < 60 ? 'animate-pulse' : ''}`}>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Time Remaining</p>
                        <p className={`text-2xl font-black font-mono ${timeLeft < 60 ? 'text-red-500' : 'text-gray-100'}`}>{formatTime(timeLeft)}</p>
                    </div>
                    <button onClick={() => handleSubmit(false)} className="px-6 py-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20">Finalize</button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-4">
                <div className="hidden lg:flex flex-col bg-[#08080c] border-r border-white/5 p-8 overflow-y-auto no-scrollbar">
                    <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-8">Navigation Web</h3>
                    <div className="grid grid-cols-4 gap-3">
                        {quiz.questions.map((q, idx) => (
                            <button
                                key={q.id}
                                onClick={() => setCurrentQIndex(idx)}
                                className={`w-full aspect-square rounded-xl text-xs font-bold transition-all flex items-center justify-center border ${currentQIndex === idx ? 'bg-cyan-600 border-cyan-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)]' :
                                    responses[q.id] ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'}`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-3 p-8 lg:p-20 overflow-y-auto no-scrollbar bg-black relative">
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-12">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="px-3 py-1 bg-cyan-900/30 border border-cyan-500/30 text-cyan-400 rounded-lg text-[9px] font-black uppercase tracking-widest">{currentQ?.question_type}</span>
                                <span className="text-gray-600 text-[10px] font-bold uppercase">Weight: {currentQ?.marks} PTS</span>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold leading-relaxed text-gray-100 font-[Inter]">{currentQ?.text}</h3>
                        </div>

                        <div className="space-y-4">
                            {['MCQ', 'MSQ'].includes(currentQ?.question_type) ? (
                                currentQ.options?.map((opt, idx) => (
                                    <div
                                        key={opt.id}
                                        onClick={() => {
                                            if (currentQ.question_type === 'MCQ') {
                                                handleSelectOption(currentQ.id, opt.id);
                                            } else {
                                                const current = responses[currentQ.id] || [];
                                                const next = current.includes(opt.id) ? current.filter(id => id !== opt.id) : [...current, opt.id];
                                                handleSelectOption(currentQ.id, next);
                                            }
                                        }}
                                        className={`group flex items-center gap-6 p-6 rounded-[24px] border-2 transition-all cursor-pointer ${responses[currentQ.id]?.includes(opt.id) ? 'bg-cyan-600/10 border-cyan-500 shadow-[0_0_20px_rgba(8,145,178,0.1)]' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center text-xs font-black transition-all ${responses[currentQ.id]?.includes(opt.id) ? 'bg-cyan-500 border-cyan-400' : 'border-white/10 group-hover:border-white/30 text-gray-500'}`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className={`text-lg font-medium transition-colors ${responses[currentQ.id]?.includes(opt.id) ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{opt.text}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="space-y-4">
                                    {currentQ?.question_type === 'SHORT' ? (
                                        <input
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-xl outline-none focus:border-cyan-500 transition-all font-medium"
                                            placeholder="Enter brief response..."
                                            value={responses[currentQ?.id]?.[0] || ""}
                                            onChange={e => handleSelectOption(currentQ.id, e.target.value)}
                                        />
                                    ) : (
                                        <textarea
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-xl outline-none focus:border-cyan-500 transition-all font-medium min-h-[300px] resize-none"
                                            placeholder="Expand technical findings..."
                                            value={responses[currentQ?.id]?.[0] || ""}
                                            onChange={e => handleSelectOption(currentQ.id, e.target.value)}
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center mt-20 pt-10 border-t border-white/10">
                            <button
                                disabled={currentQIndex === 0}
                                onClick={() => setCurrentQIndex(prev => prev - 1)}
                                className="px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 hover:bg-white/5 disabled:opacity-10"
                            >Previous</button>
                            <div className="flex gap-4">
                                {currentQIndex < (quiz?.questions.length - 1) ? (
                                    <button onClick={() => setCurrentQIndex(prev => prev + 1)} className="px-12 py-4 bg-cyan-600 hover:bg-cyan-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-cyan-500/20">Next</button>
                                ) : (
                                    <button onClick={() => handleSubmit(false)} className="px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20">Finalize</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
