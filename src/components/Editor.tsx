'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Icons } from './Icons'
import { ThemeToggle } from './ThemeToggle'

interface Message {
  id: string
  content: string
  created_at: string
}

interface FileItem {
  id: string
  name: string
  size: number
  type: string
  url: string
  created_at: string
}

export function Editor() {
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 데이터 불러오기
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsSyncing(true)
    try {
      const [messagesRes, filesRes] = await Promise.all([
        supabase.from('messages').select('*').order('created_at', { ascending: false }),
        supabase.from('files').select('*').order('created_at', { ascending: false })
      ])

      if (messagesRes.data) setMessages(messagesRes.data)
      if (filesRes.data) setFiles(filesRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
    setIsSyncing(false)
  }

  const handleSave = useCallback(async () => {
    if (!text.trim()) return

    setIsLoading(true)
    const { data, error } = await supabase
      .from('messages')
      .insert({ content: text.trim() })
      .select()
      .single()

    if (data && !error) {
      setMessages(prev => [data, ...prev])
      setText('')
    }
    setIsLoading(false)
  }, [text])

  const handleReset = () => {
    setText('')
  }

  const handleDeleteMessage = async (id: string) => {
    const { error } = await supabase.from('messages').delete().eq('id', id)
    if (!error) {
      setMessages(prev => prev.filter(m => m.id !== id))
    }
  }

  const handleDeleteAllMessages = async () => {
    if (!window.confirm('모든 메시지를 삭제하시겠습니까?')) return

    setIsLoading(true)
    const ids = messages.map(m => m.id)
    const { error } = await supabase.from('messages').delete().in('id', ids)
    if (!error) {
      setMessages([])
    }
    setIsLoading(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files
    if (!uploadedFiles) return

    setIsLoading(true)

    for (const file of Array.from(uploadedFiles)) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`

      // Storage에 파일 업로드
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }

      // Public URL 가져오기
      const { data: urlData } = supabase.storage
        .from('files')
        .getPublicUrl(fileName)

      // DB에 파일 정보 저장
      const { data, error } = await supabase
        .from('files')
        .insert({
          name: file.name,
          size: file.size,
          type: file.type,
          url: urlData.publicUrl
        })
        .select()
        .single()

      if (data && !error) {
        setFiles(prev => [data, ...prev])
      }
    }

    setIsLoading(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeleteFile = async (file: FileItem) => {
    // URL에서 파일명 추출
    const fileName = file.url.split('/').pop()

    // Storage에서 삭제
    if (fileName) {
      await supabase.storage.from('files').remove([fileName])
    }

    // DB에서 삭제
    const { error } = await supabase.from('files').delete().eq('id', file.id)
    if (!error) {
      setFiles(prev => prev.filter(f => f.id !== file.id))
    }
  }

  const handleDeleteAllFiles = async () => {
    if (!window.confirm('모든 파일을 삭제하시겠습니까?')) return

    setIsLoading(true)

    // Storage에서 모든 파일 삭제
    const fileNames = files.map(f => f.url.split('/').pop()).filter(Boolean) as string[]
    if (fileNames.length > 0) {
      await supabase.storage.from('files').remove(fileNames)
    }

    // DB에서 삭제
    const ids = files.map(f => f.id)
    const { error } = await supabase.from('files').delete().in('id', ids)
    if (!error) {
      setFiles([])
    }

    setIsLoading(false)
  }

  const handleDownloadFile = (file: FileItem) => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    link.target = '_blank'
    link.click()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
              <Icons.note className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent">
              Kho's File Editor
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {isSyncing && (
              <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            )}
            <ThemeToggle />
          </div>
        </header>

        {/* Editor Card */}
        <div className="card p-6 animate-fade-in">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="w-full h-40 bg-slate-50 dark:bg-slate-900 rounded-xl p-4 resize-none border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
          />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-4">
            <button onClick={handleReset} className="btn btn-secondary flex items-center gap-2">
              <Icons.reset className="w-4 h-4" />
              Reset
            </button>
            <button onClick={handleSave} className="btn btn-primary flex items-center gap-2" disabled={!text.trim() || isLoading}>
              <Icons.save className="w-4 h-4" />
              Save
            </button>
            <button onClick={handleDeleteAllMessages} className="btn btn-danger flex items-center gap-2" disabled={messages.length === 0 || isLoading}>
              <Icons.trash className="w-4 h-4" />
              Delete All
            </button>
            <label className="btn btn-secondary flex items-center gap-2 cursor-pointer">
              <Icons.upload className="w-4 h-4" />
              Upload
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                disabled={isLoading}
              />
            </label>
            <button onClick={handleDeleteAllFiles} className="btn btn-danger flex items-center gap-2" disabled={files.length === 0 || isLoading}>
              <Icons.trash className="w-4 h-4" />
              Delete All Files
            </button>
          </div>
        </div>

        {/* Messages Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Icons.note className="w-5 h-5 text-sky-500" />
            저장된 메시지
          </h2>

          {messages.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-slate-400 dark:text-slate-500">저장된 메시지가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className="card p-4 animate-slide-up group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        {formatDate(message.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteMessage(message.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      <Icons.x className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Files Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Icons.file className="w-5 h-5 text-sky-500" />
            업로드된 파일
          </h2>

          {isLoading && (
            <div className="card p-8 text-center">
              <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-400 mt-2">처리 중...</p>
            </div>
          )}

          {!isLoading && files.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-slate-400 dark:text-slate-500">업로드된 파일이 없습니다</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {files.map((file, index) => (
                <div
                  key={file.id}
                  className="card p-4 animate-slide-up group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Icons.file className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-700 dark:text-slate-200 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatFileSize(file.size)} • {formatDate(file.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDownloadFile(file)}
                        className="p-2 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors"
                      >
                        <Icons.download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Icons.x className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-slate-400 py-4">
          <p>클라우드에 동기화되어 모든 기기에서 접근 가능합니다</p>
        </footer>
      </div>
    </div>
  )
}
