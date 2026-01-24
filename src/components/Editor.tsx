import isHotkey from 'is-hotkey'
import { type KeyboardEvent, useCallback, useMemo } from 'react'
import {
    type Descendant,
    createEditor,
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

    return (
        <Slate
            editor={editor}
            initialValue={value}
            onChange={onChange}
        >
            <div className="border border-border rounded-lg overflow-hidden bg-background shadow-sm">
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
    switch (element.type) {
        case 'block-quote':
            return (
                <blockquote style={style} {...attributes}>
                    {children}
                </blockquote>
            )
        case 'bulleted-list':
            return (
                <ul style={style} {...attributes} className="list-disc pl-5">
                    {children}
                </ul>
            )
        case 'heading-one':
            return (
                <h1 style={style} {...attributes} className="text-4xl font-extrabold mt-6 mb-4">
                    {children}
                </h1>
            )
        case 'heading-two':
            return (
                <h2 style={style} {...attributes} className="text-3xl font-bold mt-4 mb-2">
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
                <ol style={style} {...attributes} className="list-decimal pl-5">
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
