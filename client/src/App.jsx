import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api/v1/notes';

const App = () => {
  // --- States ---
  const [notes, setNotes] = useState([]);
  const [counts, setCounts] = useState({ home: 0, archive: 0, trash: 0 });
  const [view, setView] = useState('home');
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  // --- Backend bilan aloqa ---
  const fetchData = async () => {
    try {
      const { data } = await axios.get(API);
      setNotes(data.notes);
      setCounts(data.counts);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- Autosave mantiqi ---
  const autosave = useCallback(async (id, fields, actionName = "Tahrirlandi") => {
    try {
      await axios.patch(`${API}/${id}`, { ...fields, lastAction: actionName });
      fetchData(); // Recent logs yangilanishi uchun
    } catch (err) { console.error(err); }
  }, []);

  // --- Amallar (Actions) ---
  const createBlankNote = async () => {
    try {
      const { data } = await axios.post(API, { title: "", content: "", lastAction: "Yaratildi" });
      setActiveId(data._id);
      fetchData();
      showToast("Yangi eslatma yaratildi", "#4fd1c5");
    } catch (err) { console.error(err); }
  };

  const handleAction = async (id, updates, actionName) => {
    try {
      await axios.patch(`${API}/${id}`, { ...updates, lastAction: actionName });
      showToast(actionName, "#c2a8ff");
      if (updates.isTrashed || updates.isArchived || updates.isArchived === false) setActiveId(null);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const duplicateNote = async (note) => {
    try {
      const { data } = await axios.post(API, { 
        title: note.title + " (Nusxa)", 
        content: note.content, 
        lastAction: "Nusxalandi" 
      });
      setActiveId(data._id);
      fetchData();
      showToast("Nusxalandi", "#fbd38d");
    } catch (err) { console.error(err); }
  };

  const deletePermanent = async (id) => {
    if (window.confirm("Butunlay o'chirilsinmi?")) {
      await axios.delete(`${API}/${id}`);
      setActiveId(null);
      fetchData();
      showToast("O'chirildi", "#ff6b6b");
    }
  };

  const showToast = (msg, color) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2000);
  };

  // --- Filtrlash va Guruhlash ---
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const m = n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
      if (view === 'trash') return n.isTrashed && m;
      if (view === 'archive') return n.isArchived && !n.isTrashed && m;
      return !n.isArchived && !n.isTrashed && m;
    }).sort((a, b) => b.isPinned - a.isPinned || new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [notes, view, search]);

  const grouped = useMemo(() => {
    const groups = {};
    filteredNotes.forEach(n => {
      const label = new Date(n.updatedAt).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' });
      if (!groups[label]) groups[label] = [];
      groups[label].push(n);
    });
    return groups;
  }, [filteredNotes]);

  const activeNote = notes.find(n => n._id === activeId);

  return (
    <div className={`app-container ${activeId ? 'editor-open' : ''}`}>
      {/* Toast */}
      {toast && <div className="toast" style={{ background: toast.color }}>{toast.msg}</div>}

      {/* NAVBAR */}
      <header className="navbar" style={{ height: '10vh', display: 'flex', alignItems: 'center', padding: '0 40px' }}>
        <div className="search-v4" style={{ flex: 1, display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '8px 20px', borderRadius: '30px' }}>
          <span className="material-symbols-outlined">search</span>
          <input type="text" placeholder="Eslatmalarni qidirish..." style={{ background: 'none', border: 'none', color: 'white', outline: 'none', marginLeft: '10px', width: '100%' }} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </header>

      <main className="main-layout">
        {/* LIST PANEL */}
        <section className="list-panel custom-scrollbar">
          {Object.keys(grouped).map(date => (
            <div key={date}>
              <div className="date-label">{date.toUpperCase()}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                {grouped[date].map(n => (
                  <div key={n._id} className={`note-card ${n.isPinned ? 'pinned' : ''}`} onClick={() => setActiveId(n._id)}>
                    <div className="card-actions">
                       {/* Dinamik Iconlar */}
                       {!n.isTrashed ? (
                         <>
                           <button className="action-btn" onClick={(e) => { e.stopPropagation(); handleAction(n._id, {isPinned: !n.isPinned}, n.isPinned ? "Qadash olindi" : "Qadaldi") }}>
                             <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#c2a8ff' }}>push_pin</span>
                           </button>
                           <button className="action-btn" onClick={(e) => { e.stopPropagation(); handleAction(n._id, {isArchived: true}, "Arxivlandi") }}>
                             <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#fbd38d' }}>archive</span>
                           </button>
                           <button className="action-btn" onClick={(e) => { e.stopPropagation(); duplicateNote(n) }}>
                             <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#4fd1c5' }}>content_copy</span>
                           </button>
                           <button className="action-btn" onClick={(e) => { e.stopPropagation(); handleAction(n._id, {isTrashed: true}, "Savatga olindi") }}>
                             <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#ff6b6b' }}>delete</span>
                           </button>
                         </>
                       ) : (
                         <>
                           <button className="action-btn" onClick={(e) => { e.stopPropagation(); handleAction(n._id, {isTrashed: false}, "Tiklandi") }}>
                             <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#4fd1c5' }}>restore</span>
                           </button>
                           <button className="action-btn" onClick={(e) => { e.stopPropagation(); deletePermanent(n._id) }}>
                             <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#ff6b6b' }}>delete_forever</span>
                           </button>
                         </>
                       )}
                    </div>
                    <h4 style={{ fontSize: '15px' }}>{n.title || "Sarlavhasiz"}</h4>
                    <p style={{ fontSize: '12px', opacity: 0.5, marginTop: '5px' }}>{n.content?.substring(0, 40)}...</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* EDITOR PANEL */}
        <section className="editor-panel">
          {activeNote && (
            <>
              <div className="editor-header">
                <button className="action-btn" onClick={() => setActiveId(null)}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--primary)' }}>
                    arrow_back
                  </span>
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {/* Editor ichidagi rangli amallar */}
                  {!activeNote.isTrashed && (
                    <>
                      <button className="action-btn" title="Pin" onClick={() => handleAction(activeNote._id, {isPinned: !activeNote.isPinned}, "Qadaldi")}><span className="material-symbols-outlined" style={{ color: '#c2a8ff' }}>push_pin</span></button>
                      <button className="action-btn" title="Archive" onClick={() => handleAction(activeNote._id, {isArchived: !activeNote.isArchived}, "Arxivlandi")}><span className="material-symbols-outlined" style={{ color: '#fbd38d' }}>archive</span></button>
                      <button className="action-btn" title="Nusxalash" onClick={() => duplicateNote(activeNote)}><span className="material-symbols-outlined" style={{ color: '#4fd1c5' }}>content_copy</span></button>
                    </>
                  )}
                  <button className="action-btn" title="O'chirish" onClick={() => activeNote.isTrashed ? deletePermanent(activeNote._id) : handleAction(activeNote._id, {isTrashed: true}, "O'chirildi")}><span className="material-symbols-outlined" style={{ color: '#ff6b6b' }}>delete</span></button>
                </div>
              </div>
              <input className="editor-title" value={activeNote.title} placeholder="Eslatma sarlavhasi..." onChange={(e) => autosave(activeNote._id, { title: e.target.value })} />
              <div className="editor-divider"></div>
              <textarea className="editor-body custom-scrollbar" style={{ background: 'none', border: 'none', width: '100%', outline: 'none', resize: 'none' }} value={activeNote.content} placeholder="Fikrlaringizni yozing..." onChange={(e) => autosave(activeNote._id, { content: e.target.value })} />
            </>
          )}
        </section>

        {/* RECENT PANEL */}
        <section className="recent-panel">
          <div style={{ fontSize: '11px', opacity: 0.4, fontWeight: 800, marginBottom: '15px' }}>RECENT LOGS</div>
          <div className="custom-scrollbar" style={{ overflowY: 'auto', height: '100%' }}>
            {notes.slice(0, 10).map(log => (
              <div key={log._id} className="note-card" style={{ padding: '10px', fontSize: '11px' }} onClick={() => setActiveId(log._id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.5 }}>
                  <span>{new Date(log.updatedAt).toLocaleTimeString()}</span>
                  <span style={{ color: 'var(--primary)' }}>{log.lastAction}</span>
                </div>
                <div style={{ fontWeight: 700, marginTop: '3px' }}>{log.title || "Sarlavhasiz"}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* DOCK */}
      <div className="dock-wrapper">
        <nav className="mac-dock">
          <button className={`dock-item st-low ${view === 'archive' ? 'active' : ''}`} onClick={() => {setView('archive'); setActiveId(null)}}><span className="material-symbols-outlined">archive</span></button>
          <button className={`dock-item st-mid ${view === 'reminders' ? 'active' : ''}`} onClick={() => {setView('reminders'); setActiveId(null)}}><span className="material-symbols-outlined">history</span></button>
          <button className={`dock-item st-high ${view === 'home' ? 'active' : ''}`} onClick={() => {setView('home'); setActiveId(null)}}><span className="material-symbols-outlined">home</span></button>
          <button className={`dock-item st-mid ${view === 'trash' ? 'active' : ''}`} onClick={() => {setView('trash'); setActiveId(null)}}><span className="material-symbols-outlined">delete</span></button>
          <button className="dock-item st-low" onClick={createBlankNote}><span className="material-symbols-outlined">add</span></button>
        </nav>
      </div>
    </div>
  );
};

export default App;
