document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const textArea = document.getElementById('textArea');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const saveBtn = document.getElementById('saveBtn');
    const clearBtn = document.getElementById('clearDraft');
    const clearAllBtn = document.getElementById('clearAll');
    const copyBtn = document.getElementById('copyBtn');
    const status = document.getElementById('status');
    const notesList = document.getElementById('notesList');
    const notesCount = document.getElementById('notesCount');
    const lastSaved = document.getElementById('lastSaved');
    const browserWarning = document.getElementById('browserWarning');

    // --- Speech Recognition Setup ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        if (browserWarning) {
            browserWarning.textContent = "Speech recognition is not supported in this browser. Please use Chrome or Edge.";
            browserWarning.style.display = 'block';
        }
        [startBtn, stopBtn, saveBtn, clearBtn, copyBtn].forEach(btn => btn && (btn.disabled = true));
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // --- State Management ---
    let isListening = false;
    let userStopped = false; // Flag to differentiate user stop vs. auto stop
    let notes = JSON.parse(localStorage.getItem('speechNotes')) || [];

    // --- Core Functions ---
    function startListening() {
        if (isListening) return;
        try {
            userStopped = false;
            recognition.start();
        } catch (e) {
            console.error("Error starting recognition:", e);
        }
    }

    function stopListening() {
        if (!isListening) return;
        userStopped = true;
        recognition.stop();
    }

    // --- UI Update Functions ---
    function updateUIForListening(isNowListening) {
        isListening = isNowListening;
        if (status) {
            status.textContent = isNowListening ? '🎤 Listening...' : 'Ready to listen';
            status.className = isNowListening ? 'status listening' : 'status idle';
        }
        if (startBtn) startBtn.disabled = isNowListening;
        if (stopBtn) stopBtn.disabled = !isNowListening;
    }

    function renderNotes() {
        if (notesCount) notesCount.textContent = notes.length;
        if (!notesList) return;

        notesList.innerHTML = ''; // Always clear first

        if (notes.length === 0) {
            notesList.innerHTML = '<div class="empty-state">No notes yet — hit <em>Save</em> to add one.</div>';
        } else {
            const fragment = document.createDocumentFragment();
            notes.forEach(note => {
                const noteElement = document.createElement('div');
                noteElement.className = 'note-item';
                noteElement.innerHTML = `
                    <div class="note-content">
                        <div class="note-time">${note.timestamp}</div>
                        <div class="note-text">${note.text}</div>
                    </div>
                    <button class="delete-note-btn" data-id="${note.id}">Delete</button>
                `;
                fragment.appendChild(noteElement);
            });
            notesList.appendChild(fragment);
        }
    }

    function updateLastSaved() {
        if (!lastSaved) return;
        const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        lastSaved.textContent = `Last saved: ${timestamp}`;
    }

    // --- Speech Recognition Event Handlers ---
    recognition.onstart = () => {
        isListening = true;
        updateUIForListening(true);
    };

    recognition.onend = () => {
        isListening = false;
        // If the user didn't manually stop, it was a timeout, so restart.
        if (!userStopped) {
            // Use a small timeout to prevent chaotic restart loops
            setTimeout(() => recognition.start(), 100);
        } else {
            // If the user did stop, update the UI to idle.
            updateUIForListening(false);
        }
    };

    recognition.onerror = (e) => {
        console.error('Speech recognition error:', e.error);
        userStopped = true; // Treat error as a stop
        updateUIForListening(false);
    };

    recognition.onresult = (e) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
            const transcript = e.results[i][0].transcript;
            if (e.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }
        if (textArea) textArea.value = finalTranscript + interimTranscript;
    };

    // --- DOM Event Listeners ---
    if (startBtn) startBtn.addEventListener('click', startListening);
    if (stopBtn) stopBtn.addEventListener('click', stopListening);

    if (clearBtn) clearBtn.addEventListener('click', () => {
        if (textArea) textArea.value = '';
    });

    if (saveBtn) saveBtn.addEventListener('click', () => {
        const text = textArea?.value.trim();
        if (text) {
            const note = { id: Date.now(), text: text, timestamp: new Date().toLocaleString() };
            notes.unshift(note);
            localStorage.setItem('speechNotes', JSON.stringify(notes));
            if (textArea) textArea.value = '';
            renderNotes();
            updateLastSaved();
            if (status) {
                status.textContent = '✅ Note saved!';
                setTimeout(() => {
                    if (status.textContent === '✅ Note saved!') {
                        status.textContent = isListening ? '🎤 Listening...' : 'Ready to listen';
                    }
                }, 2000);
            }
        }
    });

    if (copyBtn) copyBtn.addEventListener('click', async () => {
        const text = textArea?.value.trim();
        if (text && navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(text);
                if (status) status.textContent = '📋 Text copied!';
                setTimeout(() => {
                    if (status.textContent === '📋 Text copied!') {
                        status.textContent = isListening ? '🎤 Listening...' : 'Ready to listen';
                    }
                }, 2000);
            } catch (err) {
                console.error('Could not copy text: ', err);
            }
        }
    });

    if (clearAllBtn) clearAllBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all notes? This cannot be undone.')) {
            notes = [];
            localStorage.removeItem('speechNotes');
            renderNotes();
            if (lastSaved) lastSaved.textContent = 'Last saved: —';
        }
    });

    if (notesList) notesList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-note-btn')) {
            const noteId = parseInt(e.target.dataset.id, 10);
            notes = notes.filter(note => note.id !== noteId);
            localStorage.setItem('speechNotes', JSON.stringify(notes));
            renderNotes();
        }
    });

    // --- Initial Load ---
    renderNotes();
    updateLastSaved();
    updateUIForListening(false);
});
