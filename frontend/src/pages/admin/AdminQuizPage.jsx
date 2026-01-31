import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function AdminQuizPage() {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            const res = await api.get("/quizzes/");
            setQuizzes(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        const title = prompt("Quiz Title:");
        if (!title) return;

        try {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const res = await api.post("/quizzes/", {
                title,
                join_code: code,
                duration_minutes: 30,
                default_marks: 4,
                default_negative_marks: 1
            });
            navigate(`/portal/quizzes/${res.data.id}`);
        } catch (err) {
            alert("Failed to initiate sequence.");
        }
    };

    const toggleActive = async (quiz) => {
        try {
            await api.patch(`/quizzes/${quiz.id}/`, { is_active: !quiz.is_active });
            fetchQuizzes();
        } catch (err) { alert("Command rejected."); }
    };

    const handleDelete = async (quizId) => {
        if (!window.confirm("CRITICAL WARNING: This will permanently purge the assessment and ALL associated records. Confirm deletion?")) return;
        try {
            await api.delete(`/quizzes/${quizId}/`);
            setQuizzes(quizzes.filter(q => q.id !== quizId));
        } catch (err) { alert("Purge sequence failed."); }
    };

    if (loading) return <div className="p-10 text-cyan-500 animate-pulse font-black uppercase tracking-widest text-center">Opening Exam Vault...</div>;

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto text-white">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h1 className="text-4xl font-bold font-[Orbitron] text-gray-100 tracking-tighter">Evaluation Clusters</h1>
                    <p className="text-gray-500 mt-2 uppercase text-[10px] font-black tracking-[0.3em]">Proctored Examination & Skill Assessment Core</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-cyan-500/20"
                >
                    + Generate New Assessment
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-white">
                {quizzes.map(quiz => (
                    <div key={quiz.id} className="bg-[#111] border border-white/5 rounded-3xl p-8 hover:border-cyan-500/50 transition-all flex flex-col group relative overflow-hidden">
                        {/* Background subtle pulse if active */}
                        {quiz.is_active && <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />}

                        <div className="flex justify-between items-start mb-6">
                            <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${quiz.is_active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                {quiz.is_active ? 'Vault Open' : 'Vault Locked'}
                            </span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        const link = `${window.location.origin}/quizzes`;
                                        navigator.clipboard.writeText(`Quiz: ${quiz.title}\nPortal: ${link}\nCode: ${quiz.join_code}`);
                                        alert("Neural link copied to clipboard.");
                                    }}
                                    className="text-[10px] text-cyan-500 hover:text-cyan-400 font-bold uppercase"
                                >Share</button>
                                <span className="text-[10px] text-gray-600 font-mono font-bold">NODE_{quiz.join_code}</span>
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold font-[Orbitron] mb-3 group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{quiz.title}</h2>
                        <p className="text-gray-500 text-sm mb-8 line-clamp-2 h-10">{quiz.description || "No mission brief provided for this assessment."}</p>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-white/5 p-3 rounded-2xl text-center border border-white/5">
                                <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Duration</p>
                                <p className="text-lg font-bold text-gray-200">{quiz.duration_minutes}m</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-2xl text-center border border-white/5">
                                <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Items</p>
                                <p className="text-lg font-bold text-gray-200">{quiz.question_count || 0}</p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-auto">
                            <button
                                onClick={() => navigate(`/portal/quizzes/${quiz.id}`)}
                                className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5"
                            >
                                Build
                            </button>
                            <button
                                onClick={() => navigate(`/portal/quizzes/${quiz.id}/responses`)}
                                className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5"
                            >
                                Records
                            </button>
                            <button
                                onClick={() => toggleActive(quiz)}
                                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${quiz.is_active ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white' : 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500 hover:text-white'}`}
                            >
                                {quiz.is_active ? 'Lock' : 'Open'}
                            </button>
                            <button
                                onClick={() => handleDelete(quiz.id)}
                                className="py-4 px-4 bg-red-900/10 hover:bg-red-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20 text-red-500"
                                title="Delete Assessment"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {quizzes.length === 0 && (
                <div className="text-center py-40 border-2 border-dashed border-white/5 rounded-[40px]">
                    <p className="text-gray-600 uppercase text-xs font-black tracking-[0.5em]">No Evaluation Parameters Detected</p>
                    <button onClick={handleCreate} className="mt-6 text-cyan-500 font-bold hover:underline text-sm uppercase">Initialize Phase 1</button>
                </div>
            )}
        </div>
    );
}
