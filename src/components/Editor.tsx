import isHotkey from 'is-hotkey'
import { type KeyboardEvent, useCallback, useEffect, useMemo } from 'react'
import {
    createEditor,
    type Descendant,
    Node,
    Editor as SlateEditor,
    Element as SlateElement,
    Transforms
} from 'slate'
import { withHistory } from 'slate-history'
import {
    Editable,
    ReactEditor,
    type RenderElementProps,
    type RenderLeafProps,
    Slate,
    useSlateStatic,
    withReact
} from 'slate-react'
import type {
    AlignType,
    CustomTextKey
} from './custom-types'
import { isAlignElement, toggleMark } from './editor-utils'
import Toolbar from './Toolbar'


const HOTKEYS: Record<string, CustomTextKey> = {
    'mod+b': 'bold',
    'mod+i': 'italic',
    'mod+u': 'underline',
    'mod+`': 'code',
}

import { ContextMenu } from './retroui/ContextMenu'
import { withShortcuts } from './withShortcuts'

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
                        <ContextMenu.Trigger>
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
                                className="outline-none"
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

const Element = ({ attributes, children, element }: RenderElementProps) => {
    const editor = useSlateStatic()
    const style: React.CSSProperties = {}
    if (isAlignElement(element)) {
        style.textAlign = element.align as AlignType
    }

    const getId = () => {
        // Simple ID generation matching TOC logic
        return Node.string(element).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
    }

    switch (element.type) {
        case 'check-list-item':
            return (
                <div {...attributes} className="flex flex-row items-start space-x-2 my-1">
                    <span contentEditable={false} className="select-none mt-1">
                        <input
                            type="checkbox"
                            checked={element.checked}
                            onChange={(event) => {
                                const path = ReactEditor.findPath(editor, element)
                                const newProperties: Partial<typeof element> = {
                                    checked: event.target.checked,
                                }
                                Transforms.setNodes(editor, newProperties, { at: path })
                            }}
                            className="cursor-pointer"
                        />
                    </span>
                    <span className={element.checked ? 'text-muted-foreground' : ''}>
                        {children}
                    </span>
                </div>
            )
        case 'block-quote':
            return (
                <blockquote style={style} {...attributes} className="element-blockquote">
                    {children}
                </blockquote>
            )
        case 'bulleted-list':
            return (
                <ul style={style} {...attributes} className="element-ul">
                    {children}
                </ul>
            )
        case 'heading-one':
            return (
                <h1 id={getId()} style={style} {...attributes} className="element-h1">
                    {children}
                </h1>
            )
        case 'heading-two':
            return (
                <h2 id={getId()} style={style} {...attributes} className="element-h2">
                    {children}
                </h2>
            )
        case 'heading-three':
            return (
                <h3 id={getId()} style={style} {...attributes} className="element-h3">
                    {children}
                </h3>
            )
        case 'list-item':
            return (
                <li style={style} {...attributes}>
                    {children}
                </li>
            )
        case 'numbered-list':
            return (
                <ol style={style} {...attributes} className="element-ol">
                    {children}
                </ol>
            )
        case 'table':
            return (
                <table className="w-full border-collapse my-4">
                    <tbody {...attributes}>{children}</tbody>
                </table>
            )
        case 'table-row':
            return <tr {...attributes}>{children}</tr>
        case 'table-cell':
            return (
                <td {...attributes} className="border border-border p-2 min-w-[50px]">
                    {children}
                </td>
            )
        default:
            return (
                <p style={style} {...attributes}>
                    {children}
                </p>
            )
    }
}

const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
    if (leaf.bold) {
        children = <strong>{children}</strong>
    }

    if (leaf.code) {
        children = <code>{children}</code>
    }

    if (leaf.italic) {
        children = <em>{children}</em>
    }

    if (leaf.underline) {
        children = <u>{children}</u>
    }

    return <span {...attributes}>{children}</span>
}

export default Editor
