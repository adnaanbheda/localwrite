import isHotkey from 'is-hotkey'
import { type KeyboardEvent, useCallback, useEffect, useMemo } from 'react'
import {
    createEditor,
    type Descendant,
    Editor as SlateEditor,
    Element as SlateElement
} from 'slate'
import { withHistory } from 'slate-history'
import {
    Editable,
    type RenderElementProps,
    type RenderLeafProps,
    Slate,
    withReact
} from 'slate-react'
import {
    type CustomTextKey
} from './custom-types'
import { toggleMark } from './editor-utils'
import { Element, Leaf } from './editor/Renderers'
import Toolbar from './Toolbar'

import { ContextMenu } from './retroui/ContextMenu'
import { withShortcuts } from './withShortcuts'

const HOTKEYS: Record<string, CustomTextKey> = {
    'mod+b': 'bold',
    'mod+i': 'italic',
    'mod+u': 'underline',
    'mod+`': 'code',
}

interface EditorProps {
    value: Descendant[]
    onChange: (value: Descendant[]) => void
    onHeadingActive?: () => void
}

const Editor = ({ value, onChange, onHeadingActive }: EditorProps) => {
    const renderElement = useCallback(
        (props: RenderElementProps) => <Element {...props} />,
        []
    )
    const renderLeaf = useCallback(
        (props: RenderLeafProps) => <Leaf {...props} />,
        []
    )
    const editor = useMemo(() => withShortcuts(withHistory(withReact(createEditor()))), [])

    // Scroll to hash on load/update
    useEffect(() => {
        const hash = window.location.hash
        if (hash) {
            // Short timeout to ensure DOM is ready
            setTimeout(() => {
                const id = hash.substring(1)
                const element = document.getElementById(id)
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' })
                }
            }, 100)
        }
    }, [value]) // Re-run when value changes (content loaded)

    const handleChange = (newValue: Descendant[]) => {
        onChange(newValue)

        // Check if selection is in a heading
        if (editor.selection && onHeadingActive) {
            const [match] = SlateEditor.nodes(editor, {
                match: n => !SlateEditor.isEditor(n) && SlateElement.isElement(n) && ['heading-one', 'heading-two'].includes(n.type),
                mode: 'lowest'
            })
            if (match) {
                onHeadingActive()
            }
        }
    }

    return (
        <Slate
            editor={editor}
            initialValue={value}
            onChange={handleChange}
        >
            <div className="editor-wrapper">
                <Toolbar />
                <div className="p-4 min-h-[300px]">
                    <ContextMenu>
                        <ContextMenu.Trigger asChild>
                            <Editable
                                renderElement={renderElement}
                                renderLeaf={renderLeaf}
                                placeholder="Enter some rich text…"
                                spellCheck
                                autoFocus
                                onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                                    for (const hotkey in HOTKEYS) {
                                        if (isHotkey(hotkey, event as any)) {
                                            event.preventDefault()
                                            const mark = HOTKEYS[hotkey]
                                            toggleMark(editor, mark)
                                        }
                                    }
                                }}
                                className="outline-none text-foreground min-h-[300px]"
                            />
                        </ContextMenu.Trigger>
                        <ContextMenu.Content>
                            <ContextMenu.Item onClick={() => navigator.clipboard.writeText(window.getSelection()?.toString() || '')}>
                                Copy
                            </ContextMenu.Item>
                            <ContextMenu.Item onClick={() => {
                                const selection = window.getSelection()?.toString()
                                if (selection) {
                                    navigator.clipboard.writeText(selection)
                                    editor.deleteFragment()
                                }
                            }}>
                                Cut
                            </ContextMenu.Item>
                            <ContextMenu.Item onClick={async () => {
                                try {
                                    const text = await navigator.clipboard.readText();
                                    editor.insertText(text);
                                } catch (err) {
                                    console.error('Failed to read clipboard contents: ', err);
                                }
                            }}>
                                Paste
                            </ContextMenu.Item>
                            <ContextMenu.Separator />
                            <ContextMenu.Item onClick={() => toggleMark(editor, 'bold')}>Bold</ContextMenu.Item>
                            <ContextMenu.Item onClick={() => toggleMark(editor, 'italic')}>Italic</ContextMenu.Item>
                            <ContextMenu.Item onClick={() => toggleMark(editor, 'underline')}>Underline</ContextMenu.Item>
                        </ContextMenu.Content>
                    </ContextMenu>
                </div>
            </div>
        </Slate>
    )
}

export default Editor
