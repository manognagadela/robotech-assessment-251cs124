import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function QuizEnrollment() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accepted, setAccepted] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const res = await api.get(`/quizzes/${id}/`);
            setQuiz(res.data);
        } catch (err) { navigate("/quizzes"); }
        finally { setLoading(false); }
    };

    const handleStart = async () => {
        if (!accepted) return;
        try {
            const email = sessionStorage.getItem(`quiz_email_${id}`);
            await api.post(`/quizzes/${id}/start_quiz/`, { email });
            navigate(`/quizzes/${id}/session`);
        } catch (err) {
            alert(err.response?.data?.error || "Initialization failed.");
        }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-cyan-500 font-black animate-pulse">Establishing Session Link...</div>;

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 flex items-center justify-center">
            <div className="max-w-2xl w-full">
                <div className="bg-[#0a0a0f] border border-white/5 rounded-[40px] p-10 md:p-16 shadow-2xl relative overflow-hidden">
                    {/* Background decal */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-600/5 rounded-full blur-3xl" />

                    <div className="mb-10 text-center md:text-left">
                        <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.5em] mb-4 block">Instructional Protocol</span>
                        <h1 className="text-4xl font-bold font-[Orbitron] uppercase tracking-tighter mb-4">{quiz.title}</h1>
                        <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{quiz.instructions || quiz.description || "You are about to enter a proctored assessment environment. Please ensure your surroundings are compliant with standard evaluation protocols."}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        <InfoItem label="Time Allocation" value={`${quiz.duration_minutes} Minutes`} icon="⏱️" />
                        <InfoItem label="Proctoring" value={quiz.auto_submit_on_tab_switch ? "Active" : "None"} icon="🛡️" color="text-red-500" />
                        <InfoItem label="Marking Scheme" value={`+${quiz.default_marks} / -${quiz.default_negative_marks}`} icon="🎯" />
                        <InfoItem label="Total Items" value={`${quiz.question_count || 0} Questions`} icon="📑" />
                    </div>

                    <div className="space-y-6 bg-white/5 border border-white/10 p-8 rounded-3xl mb-12">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-300 mb-2">Terms of Neural Engagement</h3>
                        <ul className="space-y-3 text-xs text-gray-500">
                            <li>● Do not minimize or switch browser tabs during evaluation.</li>
                            <li>● Right-click interactions and shortcut keys are functionally disabled.</li>
                            <li>● The timer is strictly monitored by the central database node.</li>
                            <li>● Connection loss may result in temporary session lock.</li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-6">
                        <label className="flex items-center gap-4 group cursor-pointer">
                            <div
                                onClick={() => setAccepted(!accepted)}
                                className={`w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center ${accepted ? 'bg-cyan-600 border-cyan-600' : 'border-white/10 group-hover:border-white/30'}`}
                            >
                                {accepted && <span className="font-black text-xs text-white">✓</span>}
                            </div>
                            <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">I acknowledge and accept the protocol limitations.</span>
                        </label>

                        <button
                            onClick={handleStart}
                            disabled={!accepted}
                            className="w-full py-6 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-cyan-500/30 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                        >
                            Confirm & Initialize Phase 1
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoItem({ label, value, icon, color = "text-gray-200" }) {
    return (
        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-4">
            <div className="text-2xl">{icon}</div>
            <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className={`text-sm font-bold ${color}`}>{value}</p>
            </div>
        </div>
    );
}
