import React, { useState, useEffect } from 'react';
import './App.css';

/*
PUBLIC_INTERFACE
Main App component for the Notes Single-Page Application.

Implements:
- Responsive sidebar navigation
- Note list view
- Main workspace for note view/edit/create/delete
- Minimal, modern, light-themed UI following provided color palette
*/

const COLOR = {
  accent: '#388e3c',
  primary: '#1976d2',
  secondary: '#ef6c00',
};

function getInitialNotes() {
  // Optionally use localStorage for persistence
  const saved = window.localStorage.getItem('notes_v1');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [
    // Defaults for visual demonstration
    { id: 1, title: "Welcome Note", content: "This is your first note!", created: Date.now() }
  ];
}

function persistNotes(notes) {
  window.localStorage.setItem('notes_v1', JSON.stringify(notes));
}

function Sidebar({ children }) {
  return (
    <aside className="sidebar">
      <div className="side-header">
        <span className="logo-symbol" style={{ color: COLOR.accent, fontWeight: 700, fontSize: 22 }}>✎</span>
        <span className="logo-text" style={{ color: COLOR.primary, fontWeight: 700 }}>NoteEase</span>
      </div>
      {children}
    </aside>
  );
}

function NoteList({ notes, selectedId, onSelect, onNew }) {
  return (
    <div className="note-list">
      <div className="note-list-header">
        <span style={{ fontWeight: 600, fontSize: 16 }}>Notes</span>
        <button className="btn btn-sm" style={{ background: COLOR.primary }} onClick={onNew} aria-label="New note">＋</button>
      </div>
      <ul>
        {notes.length === 0 ? (
          <li className="note-list-empty">No notes yet.</li>
        ) : (
          notes.map(note => (
            <li
              key={note.id}
              className={`note-list-item${selectedId === note.id ? ' selected' : ''}`}
              onClick={() => onSelect(note.id)}
              tabIndex={0}
            >
              <span className="note-title">{note.title || "Untitled"}</span>
              <span className="note-date">{new Date(note.created).toLocaleDateString()}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function NoteEditor({ note, onSave, onDelete, onCancel }) {
  const [title, setTitle] = useState(note ? note.title : "");
  const [content, setContent] = useState(note ? note.content : "");

  useEffect(() => {
    setTitle(note ? note.title : "");
    setContent(note ? note.content : "");
  }, [note?.id]);

  function handleSave(e) {
    e.preventDefault();
    onSave({
      ...note,
      title: title.trim() || "Untitled",
      content,
    });
  }

  return (
    <form className="note-editor" onSubmit={handleSave}>
      <input
        className="note-input note-title-input"
        type="text"
        placeholder="Note title"
        value={title}
        maxLength={60}
        onChange={(e) => setTitle(e.target.value)}
        required
        autoFocus
      />
      <textarea
        className="note-input note-content-input"
        placeholder="Write your note here…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={12}
        required
      />
      <div className="note-editor-actions">
        <button type="submit" className="btn btn-primary">Save</button>
        {note?.id && (
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => onDelete(note.id)}
            tabIndex={-1}
          >
            Delete
          </button>
        )}
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function NoteDisplay({ note, onEdit }) {
  return (
    <div className="note-display">
      <h2 className="note-display-title">{note.title}</h2>
      <div className="note-display-date">
        {note.created ? new Date(note.created).toLocaleString() : ""}
      </div>
      <div className="note-display-content">
        {note.content.split("\n").map((line, i) => <p key={i}>{line}</p>)}
      </div>
      <button className="btn btn-primary" onClick={onEdit}>Edit</button>
    </div>
  );
}

function App() {
  const [notes, setNotes] = useState(getInitialNotes());
  const [selectedId, setSelectedId] = useState(notes.length ? notes[0].id : null);
  const [editorMode, setEditorMode] = useState(null); // 'new', 'edit', or null

  // Any changes to notes, persist them.
  useEffect(() => {
    persistNotes(notes);
    if (notes.length === 0) setSelectedId(null);
    else if (!notes.find(n => n.id === selectedId)) setSelectedId(notes[0].id);
  }, [notes]);

  function handleSelectNote(id) {
    setSelectedId(id);
    setEditorMode(null);
  }

  function handleNewNote() {
    setEditorMode('new');
    setSelectedId(null);
  }

  function handleSaveNote(note) {
    if (editorMode === 'new') {
      const newNote = {
        ...note,
        id: Date.now(),
        created: Date.now(),
      };
      setNotes([newNote, ...notes]);
      setSelectedId(newNote.id);
    } else if (editorMode === 'edit') {
      setNotes(notes.map(n => n.id === note.id ? { ...n, ...note } : n));
      setSelectedId(note.id);
    }
    setEditorMode(null);
  }

  function handleDeleteNote(id) {
    setNotes(notes.filter(n => n.id !== id));
    if (selectedId === id) {
      setSelectedId(notes.length > 1 ? notes.find(n => n.id !== id).id : null);
    }
    setEditorMode(null);
  }

  function handleEditNote() {
    setEditorMode('edit');
  }

  function handleCancelEdit() {
    setEditorMode(null);
  }

  let mainContent;

  if (editorMode === 'new') {
    mainContent = (
      <NoteEditor
        note={{ title: '', content: '' }}
        onSave={handleSaveNote}
        onDelete={null}
        onCancel={handleCancelEdit}
      />
    );
  } else if (editorMode === 'edit') {
    const note = notes.find(n => n.id === selectedId);
    mainContent = note ? (
      <NoteEditor
        note={note}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
        onCancel={handleCancelEdit}
      />
    ) : (
      <div style={{ padding: 32, color: '#888' }}>Note not found.</div>
    );
  } else if (selectedId) {
    const note = notes.find(n => n.id === selectedId);
    mainContent = note ? (
      <NoteDisplay note={note} onEdit={handleEditNote} />
    ) : (
      <div style={{ padding: 32, color: '#888' }}>Note not found.</div>
    );
  } else {
    mainContent = (
      <div style={{ padding: 32, color: '#888' }}>Select or create a note to get started.</div>
    );
  }

  return (
    <div className="app notes-app">
      <Sidebar>
        <NoteList
          notes={notes}
          selectedId={selectedId}
          onSelect={handleSelectNote}
          onNew={handleNewNote}
        />
      </Sidebar>
      <main className="main-area">
        {mainContent}
      </main>
    </div>
  );
}

export default App;