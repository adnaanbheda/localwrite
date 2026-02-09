import React from 'react'
import {
    Node,
    Transforms
} from 'slate'
import {
    ReactEditor,
    useSlateStatic,
    type RenderElementProps,
    type RenderLeafProps
} from 'slate-react'
import type { AlignType } from '../custom-types'
import { isAlignElement } from '../editor-utils'

export const Element = ({ attributes, children, element }: RenderElementProps) => {
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

export const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
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

    return (
        <span {...attributes} className="text-foreground">
            {children}
        </span>
    )
}
