import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function AdminQuizBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Edit states
    const [editQuiz, setEditQuiz] = useState({});
    const [questions, setQuestions] = useState([]);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const res = await api.get(`/quizzes/${id}/`);
            setQuiz(res.data);
            setEditQuiz(res.data);
            setQuestions(res.data.questions || []);
        } catch (err) { navigate("/portal/quizzes"); }
        finally { setLoading(false); }
    };

    const handleSaveQuiz = async () => {
        setSaving(true);
        try {
            await api.patch(`/quizzes/${id}/`, editQuiz);
            alert("Base configuration updated.");
        } catch (err) { alert("Update failed."); }
        finally { setSaving(false); }
    };

    const handleAddQuestion = async () => {
        try {
            const res = await api.post("/questions/", {
                quiz: id,
                text: "New Tactical Objective",
                question_type: "MCQ",
                marks: quiz.default_marks || 4.0,
                negative_marks: quiz.default_negative_marks || 1.0,
                order: questions.length
            });
            setQuestions([...questions, { ...res.data, options: [] }]);
        } catch (err) { alert("Failed to deploy item."); }
    };

    const handleUpdateQuestion = async (qId, data) => {
        try {
            const res = await api.patch(`/questions/${qId}/`, data);
            setQuestions(questions.map(q => q.id === qId ? { ...res.data, options: q.options } : q));
        } catch (err) { }
    };

    const handleDeleteQuestion = async (qId) => {
        if (!window.confirm("Purge this objective?")) return;
        try {
            await api.delete(`/questions/${qId}/`);
            setQuestions(questions.filter(q => q.id !== qId));
        } catch (err) { }
    };

    const handleAddOption = async (qId) => {
        try {
            const res = await api.post("/options/", {
                question: qId,
                text: "Response Option",
                is_correct: false,
                order: 0
            });
            setQuestions(questions.map(q => q.id === qId ? { ...q, options: [...q.options, res.data] } : q));
        } catch (err) { }
    };

    const handleUpdateOption = async (qId, oId, data) => {
        try {
            const res = await api.patch(`/options/${oId}/`, data);
            setQuestions(questions.map(q => q.id === qId ? {
                ...q,
                options: q.options.map(o => o.id === oId ? res.data : o)
            } : q));
        } catch (err) { }
    };

    const handleDeleteOption = async (qId, oId) => {
        try {
            await api.delete(`/options/${oId}/`);
            setQuestions(questions.map(q => q.id === qId ? {
                ...q,
                options: q.options.filter(o => o.id !== oId)
            } : q));
        } catch (err) { }
    };

    if (loading) return <div className="p-10 text-cyan-500 animate-pulse text-center uppercase font-black">Syncing Node...</div>;

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto text-white">
            <button onClick={() => navigate("/portal/quizzes")} className="text-cyan-500 hover:outline mb-8 flex items-center gap-2 uppercase text-[10px] font-black tracking-widest">← Return to Vault</button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                {/* LEFT: QUIZ SETTINGS */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#0a0a0f] border border-white/10 rounded-3xl p-8 sticky top-6">
                        <h2 className="text-xl font-bold font-[Orbitron] mb-8 text-cyan-400 uppercase tracking-tight">Configuration</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Subject Title</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-cyan-500 outline-none"
                                    value={editQuiz.title}
                                    onChange={e => setEditQuiz({ ...editQuiz, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Duration (Min)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-cyan-500"
                                        value={editQuiz.duration_minutes}
                                        onChange={e => setEditQuiz({ ...editQuiz, duration_minutes: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Access Code</label>
                                    <div className="w-full bg-cyan-900/10 border border-cyan-500/20 rounded-2xl p-4 text-sm font-mono text-cyan-400 text-center font-bold">
                                        {editQuiz.join_code}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Protocol Locks</h3>
                                <Toggle label="Auto-Submit on Tab Switch" value={editQuiz.auto_submit_on_tab_switch} onChange={v => setEditQuiz({ ...editQuiz, auto_submit_on_tab_switch: v })} />
                                <Toggle label="Enforce Fullscreen Mode" value={editQuiz.require_fullscreen} onChange={v => setEditQuiz({ ...editQuiz, require_fullscreen: v })} />
                                <Toggle label="Disable Interactions (Right Click)" value={editQuiz.disable_right_click} onChange={v => setEditQuiz({ ...editQuiz, disable_right_click: v })} />
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Instructions</label>
                                <textarea
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-cyan-500 outline-none h-32"
                                    value={editQuiz.instructions || ""}
                                    onChange={e => setEditQuiz({ ...editQuiz, instructions: e.target.value })}
                                />
                            </div>

                            <button
                                onClick={handleSaveQuiz}
                                disabled={saving}
                                className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all mt-4"
                            >
                                {saving ? "Synchronizing..." : "Overwrite Parameters"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: QUESTION BUILDER */}
                <div className="lg:col-span-2 space-y-8 pb-40">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold font-[Orbitron] uppercase tracking-tighter text-gray-200">Intelligence Items</h2>
                        <button
                            onClick={handleAddQuestion}
                            className="bg-white text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-cyan-400 active:scale-95"
                        >
                            + Deploy Question
                        </button>
                    </div>

                    {questions.map((q, idx) => (
                        <div key={q.id} className="bg-[#0a0a0f] border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-all group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <span className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-mono font-bold text-xs">#{idx + 1}</span>
                                    <select
                                        className="bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] font-black uppercase tracking-widest text-cyan-400"
                                        value={q.question_type}
                                        onChange={e => handleUpdateQuestion(q.id, { question_type: e.target.value })}
                                    >
                                        <option value="MCQ">Single (MCQ)</option>
                                        <option value="MSQ">Multiple Select</option>
                                        <option value="SHORT">Short text</option>
                                        <option value="LONG">Long text</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-600 font-bold uppercase">Marks</span>
                                        <input
                                            type="number"
                                            className="w-12 bg-transparent border-b border-white/10 text-center font-bold text-xs outline-none focus:border-cyan-500"
                                            value={q.marks}
                                            onChange={e => handleUpdateQuestion(q.id, { marks: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-600 font-bold uppercase">Neg.</span>
                                        <input
                                            type="number"
                                            className="w-12 bg-transparent border-b border-red-500/20 text-center font-bold text-xs text-red-400 outline-none focus:border-red-500"
                                            value={q.negative_marks}
                                            onChange={e => handleUpdateQuestion(q.id, { negative_marks: e.target.value })}
                                        />
                                    </div>
                                    <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500/30 hover:text-red-500 transition-colors ml-4 transform hover:scale-125">✕</button>
                                </div>
                            </div>

                            <textarea
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-cyan-500 min-h-[100px] mb-6 font-medium"
                                placeholder="Enter technical probe text..."
                                value={q.text}
                                onBlur={e => handleUpdateQuestion(q.id, { text: e.target.value })}
                                onChange={e => {
                                    const newQ = [...questions];
                                    newQ[idx].text = e.target.value;
                                    setQuestions(newQ);
                                }}
                            />

                            {/* Options Area */}
                            {['MCQ', 'MSQ'].includes(q.question_type) && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Response Mapping</p>
                                        <button
                                            onClick={() => handleAddOption(q.id)}
                                            className="text-[8px] font-black text-cyan-500 hover:text-cyan-400 uppercase tracking-widest"
                                        >+ Add Segment</button>
                                    </div>

                                    <div className="space-y-2">
                                        {q.options?.map((opt, oIdx) => (
                                            <div key={opt.id} className="flex items-center gap-3 group/opt">
                                                <input
                                                    type="checkbox"
                                                    checked={opt.is_correct}
                                                    onChange={e => handleUpdateOption(q.id, opt.id, { is_correct: e.target.checked })}
                                                    className="w-4 h-4 rounded border-white/10 bg-black accent-cyan-500"
                                                    title="Mark as correct"
                                                />
                                                <input
                                                    className={`flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-xs outline-none focus:border-cyan-500/50 transition-all ${opt.is_correct ? 'text-cyan-400 border-cyan-500/20' : 'text-gray-400'}`}
                                                    value={opt.text}
                                                    onBlur={e => handleUpdateOption(q.id, opt.id, { text: e.target.value })}
                                                    onChange={e => {
                                                        const newQ = [...questions];
                                                        const newO = [...newQ[idx].options];
                                                        newO[oIdx].text = e.target.value;
                                                        newQ[idx].options = newO;
                                                        setQuestions(newQ);
                                                    }}
                                                />
                                                <button
                                                    onClick={() => handleDeleteOption(q.id, opt.id)}
                                                    className="opacity-0 group-hover/opt:opacity-100 text-red-500/50 hover:text-red-500 text-xs transition-all"
                                                >✕</button>
                                            </div>
                                        ))}
                                    </div>
                                    {(!q.options || q.options.length === 0) && <p className="text-[8px] text-gray-700 italic px-1 uppercase">No response nodes integrated.</p>}
                                </div>
                            )}
                        </div>
                    ))}

                    {questions.length === 0 && (
                        <div className="p-20 border-2 border-dashed border-white/5 rounded-3xl text-center">
                            <p className="text-gray-600 uppercase text-xs font-black tracking-widest">Awaiting Content Protocol</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Toggle({ label, value, onChange }) {
    return (
        <div className="flex items-center justify-between group cursor-pointer" onClick={() => onChange(!value)}>
            <span className="text-xs text-gray-400 group-hover:text-white transition-colors">{label}</span>
            <div className={`w-10 h-5 rounded-full relative transition-all ${value ? 'bg-cyan-600' : 'bg-white/10'}`}>
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${value ? 'left-6' : 'left-1'}`} />
            </div>
        </div>
    );
}
