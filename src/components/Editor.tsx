import isHotkey from 'is-hotkey'
import { type KeyboardEvent, useCallback, useEffect, useMemo } from 'react'
import {
    createEditor,
    type Descendant,
    Node,
} from 'slate'
import { withHistory } from 'slate-history'
import {
    Editable,
    type RenderElementProps,
    type RenderLeafProps,
    Slate,
    withReact,
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

import { withShortcuts } from './withShortcuts'

interface EditorProps {
    value: Descendant[]
    onChange: (value: Descendant[]) => void
}

const RichTextExample = ({ value, onChange }: EditorProps) => {
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

    return (
        <Slate
            editor={editor}
            initialValue={value}
            onChange={onChange}
        >
            <div className="editor-wrapper">
                <Toolbar />
                <div className="p-4 min-h-[300px]">
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
                </div>
            </div>
        </Slate>
    )
}

const Element = ({ attributes, children, element }: RenderElementProps) => {
    const style: React.CSSProperties = {}
    if (isAlignElement(element)) {
        style.textAlign = element.align as AlignType
    }

    const getId = () => {
        // Simple ID generation matching TOC logic
        return Node.string(element).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
    }

    switch (element.type) {
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

export default RichTextExample
