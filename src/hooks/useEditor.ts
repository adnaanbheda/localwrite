import { useCallback, useEffect, useRef, useState } from 'react'
import type { Descendant } from 'slate'
import { deserialize, serialize } from '../lib/markdown'
import { readFile, saveLastFile, writeFile } from '../lib/storage'

const initialValue: Descendant[] = [{ type: 'paragraph', children: [{ text: '' }] }]

export function useEditor() {
    const [currentFile, setCurrentFile] = useState<FileSystemFileHandle | null>(null)
    const [editorContent, setEditorContent] = useState<Descendant[]>(initialValue)

    const currentFileRef = useRef<FileSystemFileHandle | null>(null)
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        currentFileRef.current = currentFile
    }, [currentFile])

    const openFile = useCallback(async (file: FileSystemFileHandle) => {
        if (currentFileRef.current === file) return

        const content = await readFile(file)
        const nodes = deserialize(content)

        // Update URL first to avoid race conditions in tests
        const url = new URL(window.location.href);
        url.searchParams.set('file', file.name);
        window.history.replaceState(null, '', url.toString());

        currentFileRef.current = file
        setEditorContent(nodes)
        setCurrentFile(file)

        await saveLastFile(file.name)
    }, [])

    const handleEditorChange = useCallback((value: Descendant[]) => {
        // Prevent stale updates
        if (currentFileRef.current && currentFile !== currentFileRef.current) {
            return;
        }

        setEditorContent(value)

        if (!currentFile) return

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }

        saveTimeoutRef.current = setTimeout(async () => {
            const markdown = serialize(value)
            await writeFile(currentFile, markdown)
        }, 1000)
    }, [currentFile])

    const handleRestoreVersion = useCallback(async (content: string) => {
        const nodes = deserialize(content)
        setEditorContent(nodes)

        if (currentFile) {
            await writeFile(currentFile, content)
        }
    }, [currentFile])

    return {
        currentFile,
        editorContent,
        openFile,
        handleEditorChange,
        handleRestoreVersion
    }
}
