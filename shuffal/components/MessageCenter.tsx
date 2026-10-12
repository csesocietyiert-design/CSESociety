'use client';

import { FormEvent, useEffect, useState } from 'react';

interface UserSummary {
  id: string;
  name: string;
  email?: string;
  cse_id?: string;
  role?: string;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

interface Conversation {
  id: string;
  participant: UserSummary | null;
  latestMessage: ChatMessage | null;
  updated_at: string;
}

export default function MessageCenter({ user }: { user: { id: string; role?: string } }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<UserSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/messages', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not load messages');
      setConversations(payload.conversations || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadThread = async (conversationId: string) => {
    setSelectedId(conversationId);
    setSelectedRecipient(null);
    setThreadLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/messages?conversationId=${encodeURIComponent(conversationId)}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not load conversation');
      setMessages(payload.messages || []);
      await fetch('/api/messages', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId }) });
      setConversations((current) => current.map((conversation) => conversation.id === conversationId && conversation.latestMessage ? { ...conversation, latestMessage: { ...conversation.latestMessage, read_at: conversation.latestMessage.sender_id === user.id ? conversation.latestMessage.read_at : new Date().toISOString() } } : conversation));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load conversation');
    } finally {
      setThreadLoading(false);
    }
  };

  // The initial request synchronizes this client view with the server.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadConversations(); }, []);

  useEffect(() => {
    const query = searchTerm.trim();
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      if (query.length < 2) {
        setSearchResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      try {
        const response = await fetch(`/api/messages?search=${encodeURIComponent(query)}`, { cache: 'no-store', signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Could not search members');
        setSearchResults(payload.users || []);
      } catch (requestError) {
        if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) {
          setError(requestError instanceof Error ? requestError.message : 'Could not search members');
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [searchTerm]);

  const openRecipient = (recipient: UserSummary) => {
    const existingConversation = conversations.find((conversation) => conversation.participant?.id === recipient.id);
    setSearchTerm('');
    setSearchResults([]);
    setDraft('');
    setError('');
    if (existingConversation) {
      void loadThread(existingConversation.id);
      return;
    }
    setSelectedId('');
    setSelectedRecipient(recipient);
    setMessages([]);
  };

  const deleteConversation = async (conversation: Conversation) => {
    const participantName = conversation.participant?.name || 'this person';
    if (!window.confirm(`Delete this chat with ${participantName} from your inbox? Their copy will not be deleted.`)) return;
    setDeletingId(conversation.id);
    setError('');
    try {
      const response = await fetch(`/api/messages?conversationId=${encodeURIComponent(conversation.id)}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not delete chat history');
      setConversations((current) => current.filter((item) => item.id !== conversation.id));
      if (selectedId === conversation.id) {
        setSelectedId('');
        setSelectedRecipient(null);
        setMessages([]);
        setDraft('');
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not delete chat history');
    } finally {
      setDeletingId('');
    }
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || (!selectedId && !selectedRecipient) || sending) return;
    setSending(true);
    setError('');
    try {
      const response = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: selectedId || undefined, counterpartId: selectedRecipient?.id, message }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not send message');
      setMessages((current) => [...current, payload.message]);
      setSelectedId(payload.message.conversation_id);
      setSelectedRecipient(null);
      setDraft('');
      await loadConversations();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not send message');
    } finally {
      setSending(false);
    }
  };

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedId);
  const selectedParticipant = selectedConversation?.participant || selectedRecipient;
  const hasSelectedThread = Boolean(selectedId || selectedRecipient);
  const unreadCount = conversations.filter((conversation) => conversation.latestMessage && conversation.latestMessage.sender_id !== user.id && !conversation.latestMessage.read_at).length;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-700/70 bg-gradient-to-br from-slate-900 via-slate-900/95 to-blue-950/50 shadow-2xl">
      <div className="border-b border-white/10 bg-gradient-to-r from-blue-600/20 via-slate-900/30 to-teal-500/10 px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">CSE Society Connect</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Direct messages</h2>
            <p className="mt-1 text-sm text-slate-400">Private, secure conversations with verified Society members.</p>
          </div>
          {unreadCount > 0 && <span className="rounded-full border border-teal-300/30 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-200">{unreadCount} unread</span>}
        </div>
      </div>

      {error && <div className="border-b border-rose-400/20 bg-rose-400/10 px-5 py-3 text-sm text-rose-200">{error}</div>}
      <div className="grid min-h-[34rem] md:grid-cols-[15rem_1fr]">
        <aside className="border-b border-slate-700/60 bg-slate-950/30 p-3 md:border-b-0 md:border-r">
          <label htmlFor="message-recipient-search" className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">New message</label>
          <input id="message-recipient-search" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Name or Society ID" autoComplete="off" className="mb-4 mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-teal-400" />
          {searchTerm.trim().length >= 2 && <div className="mb-4">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">People</p>
            {searching ? <p className="px-3 py-2 text-xs text-slate-500">Searching...</p> : searchResults.length === 0 ? <p className="px-3 py-2 text-xs text-slate-500">No verified members found.</p> : searchResults.map((recipient) => <button key={recipient.id} type="button" onClick={() => openRecipient(recipient)} className="mb-1 w-full rounded-xl px-3 py-2.5 text-left transition hover:bg-white/5">
              <span className="block truncate text-sm font-medium text-white">{recipient.name}</span>
              <span className="mt-1 block truncate text-xs text-slate-500">{recipient.cse_id || recipient.role || 'Verified Society member'}</span>
            </button>)}
          </div>}
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Conversations</p>
          {loading ? <p className="px-3 py-5 text-sm text-slate-500">Loading...</p> : conversations.length === 0 ? <p className="px-3 py-5 text-sm leading-6 text-slate-500">No conversations yet.</p> : conversations.map((conversation) => {
            const unread = conversation.latestMessage && conversation.latestMessage.sender_id !== user.id && !conversation.latestMessage.read_at;
            return <div key={conversation.id} className={`mb-1 flex items-center rounded-xl transition ${selectedId === conversation.id ? 'bg-blue-500/20 ring-1 ring-blue-400/40' : 'hover:bg-white/5'}`}>
              <button type="button" onClick={() => void loadThread(conversation.id)} className="min-w-0 flex-1 px-3 py-3 text-left">
                <span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold text-white">{conversation.participant?.name || 'Society member'}</span>{unread && <span className="h-2 w-2 shrink-0 rounded-full bg-teal-300" />}</span>
                <span className="mt-1 block truncate text-xs text-slate-500">{conversation.latestMessage?.body || 'Start a conversation'}</span>
              </button>
              <button type="button" onClick={() => void deleteConversation(conversation)} disabled={deletingId === conversation.id} aria-label={`Delete conversation with ${conversation.participant?.name || 'Society member'}`} title="Delete chat history" className="shrink-0 px-2 text-xs text-slate-500 transition hover:text-rose-300 disabled:opacity-40">Delete</button>
            </div>;
          })}
        </aside>

        <div className="flex min-w-0 flex-col">
          {!hasSelectedThread ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-300/30 bg-gradient-to-br from-blue-500/20 to-teal-400/20 text-2xl text-teal-200">•••</div>
              <h3 className="mt-5 text-lg font-semibold text-white">Your messages</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">Search for a verified member by name or Society ID to start a private conversation.</p>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-700/60 px-5 py-4"><p className="font-semibold text-white">{selectedParticipant?.name || 'Conversation'}</p><p className="mt-1 text-xs text-slate-500">{selectedParticipant?.cse_id || selectedParticipant?.email || 'Private Society message'}</p></div>
              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-950/20 px-5 py-5">
                {threadLoading ? <p className="text-center text-sm text-slate-500">Loading conversation...</p> : messages.map((message) => <div key={message.id} className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.sender_id === user.id ? 'rounded-br-sm bg-gradient-to-r from-blue-600 to-teal-600 text-white' : 'rounded-bl-sm border border-slate-700 bg-slate-800/80 text-slate-200'}`}><p className="whitespace-pre-wrap break-words">{message.body}</p><time className="mt-1 block text-[10px] opacity-60">{new Date(message.created_at).toLocaleString('en-IN')}</time></div></div>)}
              </div>
              <form onSubmit={sendMessage} className="border-t border-slate-700/60 bg-slate-900/60 p-4"><div className="flex items-end gap-2"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} rows={2} placeholder="Write a private message..." disabled={sending} className="min-h-12 flex-1 resize-none rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-teal-400" /><button type="submit" disabled={sending || !draft.trim()} className="rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:brightness-110 disabled:opacity-40">{sending ? 'Sending' : 'Send'}</button></div><p className="mt-2 text-right text-[11px] text-slate-500">{draft.length}/2000</p></form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
