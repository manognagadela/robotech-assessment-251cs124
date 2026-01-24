import { useEffect, useState, useRef } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

// SVG ICON
const GripIcon = () => (
    <svg className="w-5 h-5 text-gray-500 cursor-move hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
    </svg>
);

export default function AdminTaxonomyPage() {
    const navigate = useNavigate();
    const [sigs, setSigs] = useState([]);
    const [fields, setFields] = useState([]);
    const [positions, setPositions] = useState([]);
    const [roles, setRoles] = useState([]);

    const [tab, setTab] = useState("sigs"); // "sigs" | "fields" | "positions"

    const [editItem, setEditItem] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [sigRes, fieldRes, posRes, roleRes] = await Promise.all([
                api.get("/sigs/"),
                api.get("/profile-fields/"),
                api.get("/positions/"),
                api.get("/roles/")
            ]);
            // Ensure they are sorted by order
            setSigs(sigRes.data.sort((a, b) => a.order - b.order));
            setFields(fieldRes.data.sort((a, b) => a.order - b.order));
            setPositions(posRes.data.sort((a, b) => a.rank - b.rank));
            setRoles(roleRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    // Generic CRUD
    const handleSave = async (e) => {
        e.preventDefault();
        let endpoint = "/sigs/";
        if (tab === 'fields') endpoint = "/profile-fields/";
        if (tab === 'positions') endpoint = "/positions/";

        const payload = { ...editItem };
        // Clean up
        if (tab === 'fields' && !payload.limit_to_sig) payload.limit_to_sig = null;

        if (tab === 'fields' && payload.label && !payload.key) {
            payload.key = payload.label.toLowerCase().replace(/\s+/g, '_');
        }

        // Handle Role Link for positions
        if (tab === 'positions' && !payload.role_link) payload.role_link = null;

        try {
            if (payload.id) {
                await api.put(`${endpoint}${payload.id}/`, payload);
            } else {
                await api.post(endpoint, payload);
            }
            setIsFormOpen(false);
            loadData();
        } catch (err) {
            alert("Failed to save. Ensure unique constraints.");
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure?")) return;
        let endpoint = "/sigs/";
        if (tab === 'fields') endpoint = "/profile-fields/";
        if (tab === 'positions') endpoint = "/positions/";

        try {
            await api.delete(`${endpoint}${id}/`);
            loadData();
        } catch (err) {
            alert("Failed to delete.");
        }
    };

    const openCreate = () => {
        if (tab === 'sigs') setEditItem({ name: "", description: "" });
        if (tab === 'positions') setEditItem({ name: "", rank: 10, role_link: "" });
        if (tab === 'fields') setEditItem({ label: "", key: "", field_type: "text", is_required: false, limit_to_sig: "" });
        setIsFormOpen(true);
    };

    /* ================= DRAG & DROP LOGIC ================= */
    const dragItem = useRef();
    const dragOverItem = useRef();

    const handleDragStart = (e, item, index, listType) => {
        dragItem.current = { index, listType };
        // e.dataTransfer.effectAllowed = "move";
    };

    const handleDragEnter = (e, index, listType) => {
        dragOverItem.current = { index, listType };
    };

    const handleDragEnd = async () => {
        if (!dragItem.current || !dragOverItem.current) return;
        const source = dragItem.current;
        const dest = dragOverItem.current;

        if (source.listType !== dest.listType) return;
        if (source.index === dest.index) return;

        // Clone list based on type
        let listClone = [];
        let setList = null;
        let endpoint = "";

        if (tab === 'sigs') {
            listClone = [...sigs];
            setList = setSigs;
            endpoint = "/sigs/reorder-sigs/";
        } else if (tab === 'fields') {
            listClone = [...fields];
            setList = setFields;
            endpoint = "/profile-fields/reorder-fields/";
        } else {
            return; // No DnD for positions yet
        }

        // Reorder
        const itemToMove = listClone[source.index];
        listClone.splice(source.index, 1);
        listClone.splice(dest.index, 0, itemToMove);

        // Optimistic Update
        setList(listClone);

        // API Call
        const payload = listClone.map((item, idx) => ({
            id: item.id,
            order: idx
        }));

        try {
            await api.post(endpoint, { items: payload });
        } catch (err) {
            console.error("Reorder failed", err);
            loadData(); // Revert
        }

        dragItem.current = null;
        dragOverItem.current = null;
    };


    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-20 p-6 min-h-screen">
            <h1 className="text-3xl font-bold font-[Orbitron] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-6">
                Structure Management
            </h1>

            {/* TABS */}
            <div className="flex gap-4 mb-8 border-b border-white/10 overflow-x-auto">
                <button onClick={() => setTab("sigs")} className={`pb-2 px-4 whitespace-nowrap transition ${tab === 'sigs' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'}`}>
                    SIGs (Teams)
                </button>
                <button onClick={() => setTab("positions")} className={`pb-2 px-4 whitespace-nowrap transition ${tab === 'positions' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400'}`}>
                    Positions & Ranks
                </button>
                <button onClick={() => setTab("fields")} className={`pb-2 px-4 whitespace-nowrap transition ${tab === 'fields' ? 'text-pink-400 border-b-2 border-pink-400' : 'text-gray-400'}`}>
                    Profile Fields
                </button>
            </div>

            <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                    <button onClick={openCreate} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded text-white flex items-center gap-2 transition">
                        <span className="text-xl font-bold">+</span> Add New {tab === 'sigs' ? "SIG" : tab === 'positions' ? "Position" : "Field"}
                    </button>
                    <button onClick={loadData} className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded text-gray-300 hover:text-white transition" title="Refresh">
                        🔄
                    </button>
                </div>
                {(tab === 'sigs' || tab === 'fields') && <span className="text-xs text-gray-500 italic">Drag items to reorder</span>}
            </div>

            {/* SIGS */}
            {tab === 'sigs' && (
                <div className="grid gap-3">
                    {sigs.map((sig, index) => (
                        <div
                            key={sig.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, sig, index, 'sigs')}
                            onDragEnter={(e) => handleDragEnter(e, index, 'sigs')}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            className="bg-white/5 p-4 rounded-lg flex items-center gap-4 group border border-white/5 hover:border-cyan-500/30 transition cursor-default"
                        >
                            <div className="p-2 bg-black/20 rounded cursor-move text-gray-500 hover:text-cyan-400"><GripIcon /></div>

                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-cyan-400">{sig.name}</h3>
                                <p className="text-gray-400 text-sm">{sig.description || "No description"}</p>
                            </div>
                            <div className="flex gap-3 opacity-100 sm:opacity-0 group-hover:opacity-100 transition">
                                <button onClick={() => { setEditItem(sig); setIsFormOpen(true); }} className="text-cyan-300 hover:underline">Edit</button>
                                <button onClick={() => handleDelete(sig.id)} className="text-red-400 hover:underline">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* POSITIONS (No DnD yet, Rank sorted) */}
            {tab === 'positions' && (
                <div className="grid gap-3">
                    {positions.map(p => (
                        <div key={p.id} className="bg-white/5 p-4 rounded-lg flex items-center justify-between group border border-white/5 hover:border-green-500/30 transition">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-xs" title="Rank">{p.rank}</span>
                                <div>
                                    <h3 className="font-bold text-lg text-white">{p.name}</h3>
                                    {p.role_link && (
                                        <button onClick={() => navigate("/admin/roles")} className="text-xs text-gray-400 hover:text-cyan-400 transition bg-white/5 px-2 py-0.5 rounded mt-1 flex items-center gap-1">
                                            <span>🔗 Linked Role: {roles.find(r => r.id === p.role_link)?.name || "Unknown"}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-3 opacity-100 sm:opacity-0 group-hover:opacity-100 transition">
                                <button onClick={() => { setEditItem(p); setIsFormOpen(true); }} className="text-green-300 hover:underline">Edit</button>
                                <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:underline">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* FIELDS */}
            {tab === 'fields' && (
                <div className="grid gap-3">
                    {fields.map((f, index) => (
                        <div
                            key={f.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, f, index, 'fields')}
                            onDragEnter={(e) => handleDragEnter(e, index, 'fields')}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            className="bg-white/5 p-4 rounded-lg flex items-center gap-4 group border border-white/5 hover:border-pink-500/30 transition"
                        >
                            <div className="p-2 bg-black/20 rounded cursor-move text-gray-500 hover:text-pink-400"><GripIcon /></div>

                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-bold text-lg text-pink-400">{f.label}</h3>
                                    <span className="text-[10px] uppercase tracking-wider bg-gray-800 px-2 py-0.5 rounded text-gray-400">{f.field_type}</span>
                                    {f.limit_to_sig && (
                                        <span className="text-[10px] bg-cyan-900/50 px-2 py-0.5 rounded text-cyan-200 border border-cyan-500/20">
                                            Only: {sigs.find(s => s.id === f.limit_to_sig)?.name || "SIG#" + f.limit_to_sig}
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-500 text-xs font-mono mt-1 w-full truncate">Key: {f.key}</p>
                            </div>
                            <div className="flex gap-3 opacity-100 sm:opacity-0 group-hover:opacity-100 transition">
                                <button onClick={() => { setEditItem(f); setIsFormOpen(true); }} className="text-pink-300 hover:underline">Edit</button>
                                <button onClick={() => handleDelete(f.id)} className="text-red-400 hover:underline">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <form onSubmit={handleSave} className="bg-[#111] border border-white/20 p-6 rounded-xl w-full max-w-md space-y-4 shadow-xl max-h-[90vh] overflow-y-auto animate-scale-in">
                        <h2 className="text-xl font-bold text-white mb-4">
                            {editItem.id ? "Edit Item" : "Create New Item"}
                        </h2>

                        {tab === 'sigs' && (
                            <>
                                <div><label className="text-xs text-gray-400 block mb-1">Name</label><input required className="w-full bg-black/40 border border-white/20 rounded p-2 text-white focus:border-cyan-500 outline-none" value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} /></div>
                                <div><label className="text-xs text-gray-400 block mb-1">Description</label><textarea className="w-full bg-black/40 border border-white/20 rounded p-2 text-white focus:border-cyan-500 outline-none" value={editItem.description} onChange={e => setEditItem({ ...editItem, description: e.target.value })} /></div>
                            </>
                        )}

                        {tab === 'positions' && (
                            <>
                                <div><label className="text-xs text-gray-400 block mb-1">Position Title</label><input required className="w-full bg-black/40 border border-white/20 rounded p-2 text-white focus:border-green-500 outline-none" value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} /></div>
                                <div><label className="text-xs text-gray-400 block mb-1">Rank Order (1=Top)</label><input type="number" required className="w-full bg-black/40 border border-white/20 rounded p-2 text-white focus:border-green-500 outline-none" value={editItem.rank} onChange={e => setEditItem({ ...editItem, rank: parseInt(e.target.value) })} /></div>

                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Link to Role (Permissions)</label>
                                    <select className="w-full bg-black/40 border border-white/20 rounded p-2 text-white focus:border-green-500 outline-none" value={editItem.role_link || ""} onChange={e => setEditItem({ ...editItem, role_link: e.target.value ? parseInt(e.target.value) : null })}>
                                        <option value="">-- No Permissions --</option>
                                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                    <p className="text-[10px] text-gray-500 mt-1">Users with this position will automatically inherit permissions from the selected role.</p>
                                </div>
                            </>
                        )}

                        {tab === 'fields' && (
                            <>
                                <div><label className="text-xs text-gray-400 block mb-1">Label</label><input required className="w-full bg-black/40 border border-white/20 rounded p-2 text-white focus:border-pink-500 outline-none" value={editItem.label} onChange={e => setEditItem({ ...editItem, label: e.target.value })} /></div>
                                <div><label className="text-xs text-gray-400 block mb-1">Key (Internal Variable)</label><input className="w-full bg-black/40 border border-white/20 rounded p-2 text-white font-mono text-sm focus:border-pink-500 outline-none" value={editItem.key} onChange={e => setEditItem({ ...editItem, key: e.target.value })} disabled={!!editItem.id} placeholder="Auto-generated if empty" /></div>
                                <div><label className="text-xs text-gray-400 block mb-1">Type</label><select className="w-full bg-black/40 border border-white/20 rounded p-2 text-white focus:border-pink-500 outline-none" value={editItem.field_type} onChange={e => setEditItem({ ...editItem, field_type: e.target.value })}><option value="text">Text Input</option><option value="url">URL Link</option><option value="date">Date Picker</option><option value="number">Number</option><option value="textarea">Long Text Area</option></select></div>

                                {/* SIG LIMITER */}
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Show Only For SIG (Optional)</label>
                                    <select className="w-full bg-black/40 border border-white/20 rounded p-2 text-white focus:border-pink-500 outline-none" value={editItem.limit_to_sig || ""} onChange={e => setEditItem({ ...editItem, limit_to_sig: e.target.value ? parseInt(e.target.value) : null })}>
                                        <option value="">-- All Public Profiles --</option>
                                        {sigs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <p className="text-[10px] text-gray-500 mt-1">If selected, this field will ONLY appear on profiles belonging to this SIG.</p>
                                </div>
                            </>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-white/10 mt-4">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded text-gray-300 transition">Cancel</button>
                            <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded text-white font-bold transition shadow-lg shadow-cyan-500/20">Save</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
