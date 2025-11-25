'use client'

import { useState, useRef, useCallback } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Icons } from './Icons'
import { ThemeToggle } from './ThemeToggle'

interface Message {
  id: string
  content: string
  createdAt: string
}

interface FileItem {
  id: string
  name: string
  size: number
  type: string
  data: string
  createdAt: string
}

export function Editor() {
  const [text, setText] = useState('')
  const [messages, setMessages] = useLocalStorage<Message[]>('khos-file-editor-messages', [])
  const [files, setFiles] = useLocalStorage<FileItem[]>('khos-file-editor-files', [])
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = useCallback(() => {
    if (!text.trim()) return

    const newMessage: Message = {
      id: crypto.randomUUID(),
      content: text.trim(),
      createdAt: new Date().toISOString(),
    }

    setMessages(prev => [newMessage, ...prev])
    setText('')
  }, [text, setMessages])

  const handleReset = () => {
    setText('')
  }

  const handleDeleteMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id))
  }

  const handleDeleteAllMessages = () => {
    if (window.confirm('모든 메시지를 삭제하시겠습니까?')) {
      setMessages([])
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files
    if (!uploadedFiles) return

    setIsLoading(true)

    const newFiles: FileItem[] = []

    for (const file of Array.from(uploadedFiles)) {
      const reader = new FileReader()
      const fileData = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      newFiles.push({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        data: fileData,
        createdAt: new Date().toISOString(),
      })
    }

    setFiles(prev => [...newFiles, ...prev])
    setIsLoading(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeleteFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const handleDeleteAllFiles = () => {
    if (window.confirm('모든 파일을 삭제하시겠습니까?')) {
      setFiles([])
    }
  }

  const handleDownloadFile = (file: FileItem) => {
    const link = document.createElement('a')
    link.href = file.data
    link.download = file.name
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
          <ThemeToggle />
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
            <button onClick={handleSave} className="btn btn-primary flex items-center gap-2" disabled={!text.trim()}>
              <Icons.save className="w-4 h-4" />
              Save
            </button>
            <button onClick={handleDeleteAllMessages} className="btn btn-danger flex items-center gap-2" disabled={messages.length === 0}>
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
              />
            </label>
            <button onClick={handleDeleteAllFiles} className="btn btn-danger flex items-center gap-2" disabled={files.length === 0}>
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
                        {formatDate(message.createdAt)}
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
              <p className="text-slate-400 mt-2">업로드 중...</p>
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
                        {formatFileSize(file.size)} • {formatDate(file.createdAt)}
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
                        onClick={() => handleDeleteFile(file.id)}
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
          <p>데이터는 브라우저의 LocalStorage에 저장됩니다</p>
        </footer>
      </div>
    </div>
  )
}
