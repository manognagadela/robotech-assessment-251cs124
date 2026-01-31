import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function AdminQuizResponses() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAttempt, setSelectedAttempt] = useState(null);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [qRes, aRes] = await Promise.all([
                api.get(`/quizzes/${id}/`),
                api.get(`/attempts/`)
            ]);
            setQuiz(qRes.data);
            setAttempts(aRes.data.filter(a => a.quiz === parseInt(id)));
        } catch (err) { navigate("/admin/quizzes"); }
        finally { setLoading(false); }
    };

    if (loading) return <div className="p-10 text-cyan-500 animate-pulse text-center uppercase font-black">Decrypting Candidate Records...</div>;

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto text-white">
            <button onClick={() => navigate("/portal/quizzes")} className="text-cyan-500 hover:outline mb-8 flex items-center gap-2 uppercase text-[10px] font-black tracking-widest">← Return to Vault</button>

            <div className="mb-12">
                <h1 className="text-4xl font-bold font-[Orbitron] uppercase tracking-tighter">{quiz.title}</h1>
                <p className="text-gray-500 uppercase text-[10px] font-black tracking-[0.3em] mt-2">Submission Ledger ● {attempts.length} Total Records</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* LIST OF ATTEMPTS */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-2">Personnel Logs</h3>
                    <div className="space-y-2">
                        {attempts.map(a => (
                            <div
                                key={a.id}
                                onClick={() => setSelectedAttempt(a)}
                                className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 ${selectedAttempt?.id === a.id ? 'bg-cyan-600/10 border-cyan-500/50' : 'bg-[#0a0a0f] border-white/5 hover:border-white/20'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm tracking-tight">{a.user_details?.profile?.full_name || a.candidate_name || a.user_details?.username}</span>
                                        <span className="text-[9px] text-gray-600 font-mono">{a.user_details?.email || a.candidate_email}</span>
                                    </div>
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${a.status === 'SUBMITTED' ? 'bg-green-500/10 text-green-500' : (a.status === 'DISQUALIFIED' ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500')}`}>{a.status}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-gray-500">
                                    <span className="font-mono">SCORE: <span className="text-gray-200 font-bold">{a.score}</span></span>
                                    <span>{new Date(a.submitted_at || a.start_time).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                        {attempts.length === 0 && <p className="text-xs text-center text-gray-700 py-20 uppercase tracking-widest italic">No Data Acquisition Logs</p>}
                    </div>
                </div>

                {/* DETAILED RESPONSE VIEW */}
                <div className="lg:col-span-2">
                    {selectedAttempt ? (
                        <div className="bg-[#0a0a0f] border border-white/10 rounded-[32px] p-8 md:p-12">
                            <div className="flex justify-between items-start mb-12 pb-8 border-b border-white/5">
                                <div>
                                    <h2 className="text-2xl font-bold font-[Orbitron] uppercase tracking-tight text-cyan-400">
                                        {selectedAttempt.user_details?.profile?.full_name || selectedAttempt.candidate_name || selectedAttempt.user_details?.username}
                                    </h2>
                                    <div className="flex flex-wrap gap-3 mt-2">
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">{selectedAttempt.user_details?.email || selectedAttempt.candidate_email}</p>
                                        {selectedAttempt.user_details?.profile?.position && (
                                            <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-gray-400 uppercase font-bold">POS: {selectedAttempt.user_details?.profile?.position}</span>
                                        )}
                                        {selectedAttempt.user_details?.profile?.sigs?.map(sig => (
                                            <span key={sig.id} className="text-[9px] bg-cyan-500/10 px-2 py-0.5 rounded text-cyan-500 uppercase font-bold">SIG: {sig.name}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Total Intelligence Core</p>
                                    <p className="text-4xl font-black font-mono text-white">{selectedAttempt.score}</p>
                                </div>
                            </div>

                            <div className="space-y-10">
                                {quiz.questions.map((q, idx) => {
                                    const response = selectedAttempt.responses[q.id];
                                    return (
                                        <div key={q.id}>
                                            <div className="flex gap-4 mb-4">
                                                <span className="text-gray-700 font-mono font-bold text-sm">#{idx + 1}</span>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-200 leading-relaxed mb-4">{q.text}</p>
                                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                                                        <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-3">Recorded Response</p>
                                                        {['MCQ', 'MSQ'].includes(q.question_type) ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {q.options.map(opt => (
                                                                    <div key={opt.id} className={`px-4 py-2 rounded-xl text-xs font-bold border ${response?.includes(opt.id) ? (opt.is_correct ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400') : (opt.is_correct ? 'bg-gray-800 border-white/10 text-gray-500' : 'bg-transparent border-white/5 text-gray-700')}`}>
                                                                        {opt.text} {opt.is_correct && "✓"}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-gray-300 font-mono italic whitespace-pre-wrap">{response?.[0] || "MISSING_SIGNAL"}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-20 bg-white/5 rounded-[40px] border-2 border-dashed border-white/5">
                            <h3 className="text-gray-700 uppercase text-xs font-black tracking-[0.4em]">Select Personnel Record</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
