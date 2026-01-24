import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import api from "../../api/axios";

// SVG ICONS
const TaskIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const UserIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const WarningIcon = () => <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const ChatIcon = () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;

export default function AdminProjectsPage() {
  const navigate = useNavigate();
  const { user } = useOutletContext();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [joinModal, setJoinModal] = useState(null); // project id

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, uRes] = await Promise.all([
        api.get("/projects/"),
        api.get("/management/")
      ]);
      setProjects(pRes.data);
      setUsers(uRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRequest = async (projectId, message) => {
    try {
      await api.post(`/projects/${projectId}/request_join/`, { message });
      alert("Recruitment request transmitted to sector lead.");
      setJoinModal(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || "Signal failure.");
    }
  };

  return (
    <div className="p-4 sm:p-6 text-white max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <button onClick={() => navigate("/admin/dashboard")} className="text-sm text-cyan-400 hover:underline mb-2">← Dashboard</button>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-500 font-[Orbitron]">
            Project Control
          </h1>
          <p className="text-gray-400 text-sm">Deploy new missions or join ongoing operations.</p>
        </div>
        <div className="flex gap-2">
          {user.permissions?.includes('can_manage_projects') && (
            <button onClick={() => setSelectedProject({ new: true })} className="bg-gradient-to-r from-green-500 to-cyan-600 px-6 py-2 rounded-lg font-bold shadow-lg shadow-cyan-500/20 hover:scale-105 transition">+ Deploy Mission</button>
          )}
          <button onClick={loadData} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg text-gray-300 hover:text-white transition" title="Refresh Data">🔄</button>
        </div>
      </div>

      {loading && !projects.length ? (
        <div className="text-center py-20 text-gray-500">Scanning for active frequencies...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10"><p className="text-gray-400 mb-4">No active operations detected.</p></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map(p => {
            const isMember = p.members?.includes(user.id) || p.lead === user.id;
            const hasRequested = p.join_requests?.some(r => r.user === user.id);

            return (
              <ProjectCard
                key={p.id}
                project={p}
                isMember={isMember}
                hasRequested={hasRequested}
                onJoin={() => setJoinModal(p.id)}
                onClick={() => {
                  if (isMember) navigate(`/admin/projects/${p.id}`);
                  else if (user.permissions?.includes('can_manage_projects')) setSelectedProject(p);
                  else alert("Restricted Area: Recruitment Pending.");
                }}
              />
            );
          })}
        </div>
      )}

      {selectedProject && (
        <ProjectManager
          project={selectedProject}
          users={users}
          onClose={() => setSelectedProject(null)}
          onUpdate={loadData}
        />
      )}

      {joinModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111] border border-cyan-500/30 p-8 rounded-2xl max-w-md w-full shadow-[0_0_50px_rgba(34,211,238,0.1)]">
            <h3 className="text-2xl font-bold font-[Orbitron] text-cyan-400 mb-2">Request Authorization</h3>
            <p className="text-gray-400 text-sm mb-6 uppercase tracking-tighter">Mission: {projects.find(p => p.id === joinModal)?.title}</p>

            <textarea
              className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm h-32 outline-none focus:border-cyan-500 mb-6"
              placeholder="State your credentials and motivation for this operation..."
              id="join-msg"
            />

            <div className="flex gap-4">
              <button onClick={() => setJoinModal(null)} className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 transition-all">ABORT</button>
              <button
                onClick={() => handleJoinRequest(joinModal, document.getElementById('join-msg').value)}
                className="flex-1 py-3 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-500/20"
              >TRANSMIT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, onClick, isMember, hasRequested, onJoin }) {
  const statusColors = {
    'PROPOSED': 'bg-gray-700 text-gray-300',
    'IN_PROGRESS': 'bg-cyan-600/30 text-cyan-300 border-cyan-500/30',
    'COMPLETED': 'bg-green-600/30 text-green-300 border-green-500/30',
    'HALTED': 'bg-red-600/30 text-red-300 border-red-500/30'
  };

  return (
    <div onClick={onClick} className="bg-[#111] border border-white/10 rounded-2xl p-6 hover:border-cyan-500/50 transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98]">
      {/* Background Glow */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-cyan-600/5 blur-3xl rounded-full group-hover:bg-cyan-600/10 transition-all" />

      <div className="flex justify-between items-start mb-4">
        <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider border ${statusColors[project.status] || 'bg-gray-800'}`}>
          {project.status.replace("_", " ")}
        </span>
        {project.status_update_requested && <div className="bg-amber-500/20 text-amber-500 p-1 rounded-full animate-bounce"><WarningIcon /></div>}
      </div>

      <h3 className="text-xl font-bold text-gray-100 mb-2 truncate group-hover:text-cyan-400 transition-colors uppercase font-[Orbitron]">{project.title}</h3>
      <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-6 font-medium leading-tight">{project.description}</p>

      <div className="flex-1 mt-auto">
        <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase tracking-widest border-t border-white/5 pt-4">
          <div className="flex items-center gap-1.5"><UserIcon /><span>Lead: <span className="text-gray-300">{project.lead_details?.username || "TBD"}</span></span></div>
          <div className="flex items-center gap-1.5"><TaskIcon /><span>{project.tasks?.length || 0} OBJS</span></div>
        </div>
      </div>

      <div className="mt-4">
        {isMember ? (
          <div className="w-full py-2 bg-white/5 rounded-lg text-center text-[10px] font-black text-cyan-400 border border-cyan-500/20 uppercase tracking-widest italic flex items-center justify-center gap-2">
            WORKSPACE ACTIVE <span className="animate-pulse">●</span>
          </div>
        ) : hasRequested ? (
          <div className="w-full py-2 bg-amber-500/10 rounded-lg text-center text-[10px] font-black text-amber-500 border border-amber-500/20 uppercase tracking-widest italic">
            SIGNAL PENDING...
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onJoin(); }}
            className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-center text-[10px] font-black text-white transition-all uppercase tracking-widest shadow-md hover:shadow-cyan-500/30"
          >
            REQUEST ACCESS
          </button>
        )}
      </div>
    </div>
  );
}

function ProjectManager({ project, users, onClose, onUpdate }) {
  const isNew = project.new;
  const [activeTab, setActiveTab] = useState("overview");
  const [formData, setFormData] = useState({ ...project });
  const [saving, setSaving] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // NEW TASK FIELDS
  const [newTaskDeadline, setNewTaskDeadline] = useState("");
  const [newTaskReq, setNewTaskReq] = useState("");
  const [expandedTask, setExpandedTask] = useState(null); // ID of expanded task for comments/details

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { title: formData.title, description: formData.description, status: formData.status, lead: formData.lead, is_public: formData.is_public };
      isNew ? await api.post("/projects/", payload) : await api.patch(`/projects/${project.id}/`, payload);
      onUpdate();
      if (isNew) onClose();
    } catch (err) { alert("Failed"); } finally { setSaving(false); }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle) return;
    try {
      await api.post("/tasks/", {
        project: project.id, title: newTaskTitle, status: "TODO",
        due_date: newTaskDeadline || null, requirements: newTaskReq
      });
      setNewTaskTitle(""); setNewTaskDeadline(""); setNewTaskReq("");
      onUpdate();
    } catch (err) { alert("Failed to add task"); }
  };

  const handleAddComment = async (taskId, content) => {
    if (!content.trim()) return;
    try {
      await api.post(`/tasks/${taskId}/comment/`, { content });
      onUpdate();
    } catch (err) { console.error(err); }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try { await api.patch(`/tasks/${taskId}/`, { status: newStatus }); onUpdate(); } catch (err) { console.error(err); }
  };

  // Filter Assignables
  const assignableUsers = users.filter(u => u.id === project.lead || (project.members && project.members.includes(u.id)));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#15151a] border border-white/20 w-full max-w-4xl h-[90vh] rounded-xl flex flex-col shadow-2xl relative overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-start bg-[#1a1a20]">
          <div>{isNew ? <h2 className="text-2xl font-bold text-white">New Project</h2> : <div><h2 className="text-2xl font-bold text-white">{project.title}</h2><div className="flex items-center gap-3 mt-1 text-sm text-gray-400"><span className="bg-white/10 px-2 py-0.5 rounded">{project.status}</span><span>Lead: {project.lead_details?.username || "None"}</span></div></div>}</div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        {!isNew && <div className="flex border-b border-white/10 bg-[#121216]"> {['overview', 'tasks', 'team', 'status'].map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 text-sm font-medium uppercase tracking-wide transition ${activeTab === tab ? 'text-cyan-400 border-b-2 border-cyan-400 bg-white/5' : 'text-gray-500 hover:text-gray-300'}`}>{tab}</button>)}</div>}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0f1014]">
          {(activeTab === 'overview' || isNew) && (
            <form onSubmit={handleSaveInfo} className="space-y-6 max-w-2xl">
              <div><label className="block text-xs uppercase text-gray-500 mb-1">Title</label><input required className="w-full bg-black/30 border border-white/10 rounded p-3 text-white focus:border-cyan-500 outline-none" value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
              <div><label className="block text-xs uppercase text-gray-500 mb-1">Description</label><textarea className="w-full bg-black/30 border border-white/10 rounded p-3 text-white h-32 focus:border-cyan-500 outline-none" value={formData.description || ""} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs uppercase text-gray-500 mb-1">Status</label><select className="w-full bg-black/30 border border-white/10 rounded p-3 text-white focus:border-cyan-500 outline-none" value={formData.status || "PROPOSED"} onChange={e => setFormData({ ...formData, status: e.target.value })}><option value="PROPOSED">Proposed</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option><option value="HALTED">Halted</option></select></div>
                <div><label className="block text-xs uppercase text-gray-500 mb-1">Lead</label><select className="w-full bg-black/30 border border-white/10 rounded p-3 text-white focus:border-cyan-500 outline-none" value={formData.lead || ""} onChange={e => setFormData({ ...formData, lead: e.target.value ? parseInt(e.target.value) : null })}><option value="">-- No Lead --</option>{users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}</select></div>
              </div>
              <button disabled={saving} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded font-bold">{saving ? "Saving..." : "Save Details"}</button>
            </form>
          )}
          {activeTab === 'tasks' && !isNew && (
            <div className="space-y-6">
              <div className="bg-white/5 p-4 rounded-lg flex flex-col gap-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase">New Task</h3>
                <div className="flex flex-col md:flex-row gap-2">
                  <input className="flex-1 bg-black/30 border border-white/10 rounded p-2 text-white" placeholder="Task Title..." value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
                  <input type="date" className="bg-black/30 border border-white/10 rounded p-2 text-white" value={newTaskDeadline} onChange={e => setNewTaskDeadline(e.target.value)} />
                </div>
                <textarea className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-sm h-16" placeholder="Requirements / Details..." value={newTaskReq} onChange={e => setNewTaskReq(e.target.value)} />
                <button onClick={handleAddTask} className="self-end bg-cyan-600 px-4 py-1.5 rounded text-white text-sm font-bold">Add Task</button>
              </div>
              <div className="space-y-2">
                {project.tasks?.length === 0 && <p className="text-gray-500 italic">No tasks assigned.</p>}
                {project.tasks?.map(task => (
                  <div key={task.id} className="bg-white/5 rounded border border-white/5 overflow-hidden">
                    <div className="p-3 flex items-center justify-between hover:bg-white/5 cursor-pointer" onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}>
                      <div className="flex items-center gap-3">
                        <div onClick={(e) => { e.stopPropagation(); handleUpdateTaskStatus(task.id, task.status === 'DONE' ? 'TODO' : 'DONE'); }} className={`w-5 h-5 rounded border flex items-center justify-center ${task.status === 'DONE' ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}>{task.status === 'DONE' && <span className="text-black font-bold text-xs">✓</span>}</div>
                        <div className={`${task.status === 'DONE' ? 'line-through text-gray-500' : 'text-gray-200'}`}>{task.title}</div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        {task.due_date && <span className="text-red-400">Due: {task.due_date}</span>}
                        <div className="flex items-center gap-1"><ChatIcon /> {task.comments?.length || 0}</div>
                        <select onClick={e => e.stopPropagation()} className="bg-black/30 border border-white/10 rounded px-2 py-1 text-gray-300 max-w-[150px]" value={task.assigned_to || ""} onChange={async (e) => { await api.patch(`/tasks/${task.id}/`, { assigned_to: e.target.value || null }); onUpdate(); }}><option value="">Unassigned</option>{assignableUsers.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}</select>
                        <span className={`px-2 py-0.5 rounded ${task.status === 'DONE' ? 'bg-green-500/20 text-green-400' : task.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>{task.status.replace("_", " ")}</span>
                      </div>
                    </div>
                    {expandedTask === task.id && (
                      <div className="p-4 bg-black/20 border-t border-white/10 grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Requirements</h4>
                          <p className="text-sm text-gray-300 whitespace-pre-wrap">{task.requirements || "No details provided."}</p>
                          {task.description && <p className="text-sm text-gray-400 mt-2">{task.description}</p>}
                        </div>
                        <div className="border-l border-white/10 pl-6">
                          <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Discussion</h4>
                          <div className="space-y-3 mb-4 max-h-40 overflow-y-auto custom-scrollbar">
                            {task.comments?.map(c => (
                              <div key={c.id} className="text-xs">
                                <span className="font-bold text-cyan-400">{c.author_name}</span> <span className="text-gray-500 ml-1">{new Date(c.created_at).toLocaleDateString()}</span>
                                <p className="text-gray-300 mt-0.5">{c.content}</p>
                              </div>
                            ))}
                            {(!task.comments || task.comments.length === 0) && <p className="text-gray-600 text-xs italic">No comments yet.</p>}
                          </div>
                          <div className="flex gap-2">
                            <input className="flex-1 bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white" placeholder="Add comment..." onKeyDown={e => { if (e.key === 'Enter') { handleAddComment(task.id, e.target.value); e.target.value = ""; } }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* OTHER TABS ARE SAME AS BEFORE (OMITTED FOR BREVITY / KEPT IN FILE AS IS) */}
          {activeTab === 'team' && !isNew && (
            <div>
              <h3 className="text-lg font-bold text-gray-300 mb-4">Project Members</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.members_details?.map(m => (
                  <div key={m.id} className="bg-white/5 p-3 rounded flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-900 flex items-center justify-center text-xs">{m.username[0]}</div>
                    <div><div className="text-sm font-bold text-white">{m.profile?.full_name || m.username}</div><div className="text-xs text-gray-500">{m.profile?.position || "Member"}</div></div>
                    <button onClick={async () => { const newMembers = project.members.filter(id => id !== m.id); await api.patch(`/projects/${project.id}/`, { members: newMembers }); onUpdate(); }} className="ml-auto text-red-500 hover:text-red-300">&times;</button>
                  </div>
                ))}
                <div className="bg-white/5 p-3 rounded flex items-center justify-center border border-dashed border-white/20 hover:border-cyan-500 cursor-pointer group">
                  <select className="bg-transparent text-gray-400 text-sm outline-none w-full h-full cursor-pointer" onChange={async (e) => { if (!e.target.value) return; const newId = parseInt(e.target.value); if (project.members.includes(newId)) return; const newMembers = [...project.members, newId]; await api.patch(`/projects/${project.id}/`, { members: newMembers }); onUpdate(); e.target.value = ""; }} value="">
                    <option value="">+ Add Member</option>
                    {users.filter(u => !project.members?.includes(u.id)).map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'status' && !isNew && (
            <div className="space-y-6">
              {project.status_update_requested && <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg flex items-center justify-between"><div className="flex items-center gap-3 text-amber-500"><WarningIcon /><div><h4 className="font-bold">Status Update Requested!</h4><p className="text-xs opacity-80">Higher management has requested an update on this project.</p></div></div></div>}
              <div><h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Latest Update</h3><div className="bg-white/5 p-4 rounded-lg min-h-[100px] text-gray-300 text-sm whitespace-pre-wrap">{project.last_status_update || "No updates posted yet."}</div><p className="text-xs text-gray-600 mt-1">Last modified: {new Date(project.last_updated_at).toLocaleString()}</p></div>
              <div className="pt-6 border-t border-white/10"><h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Actions</h3><div className="flex gap-4"><form onSubmit={(e) => { e.preventDefault(); const text = e.target.elements.updateText.value; handleSubmitStatus(text); e.target.reset(); }} className="flex-1"><textarea name="updateText" placeholder="Write a new status update..." className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-sm h-20 outline-none focus:border-cyan-500" required /><button className="mt-2 bg-cyan-600 px-4 py-2 rounded text-white text-sm font-bold">Post Update</button></form>
                <div className="w-px bg-white/10 mx-2" /><div className="w-1/3"><p className="text-xs text-gray-500 mb-2">As a manager, you can request an update from the lead.</p><button onClick={handleRequestStatus} disabled={project.status_update_requested} className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed">{project.status_update_requested ? "Request Sent" : "Request Status Update"}</button></div></div></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
