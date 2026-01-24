import { Editor, Range, Element as SlateElement, Transforms } from 'slate'
import type { CustomEditor, CustomElement } from './custom-types'

const SHORTCUTS: Record<string, string> = {
    '*': 'list-item',
    '-': 'list-item',
    '+': 'list-item',
    '>': 'block-quote',
    '#': 'heading-one',
    '##': 'heading-two',
    '###': 'heading-three',
    '####': 'heading-four',
    '#####': 'heading-five',
    '######': 'heading-six',
}

export const withShortcuts = (editor: CustomEditor) => {
    const { insertText } = editor

    editor.insertText = text => {
        const { selection } = editor

        if (text === ' ' && selection && Range.isCollapsed(selection)) {
            const { anchor } = selection
            const block = Editor.above(editor, { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }) as any
            const path = block ? block[1] : []
            const start = Editor.start(editor, path)
            const range = { anchor, focus: start }
            const beforeText = Editor.string(editor, range)

            // Handle numbered lists: "1. "
            const numberedListMatch = beforeText.match(/^(\d+)\.$/)
            if (numberedListMatch) {
                Transforms.select(editor, range)
                Transforms.delete(editor)
                const newProperties: Partial<SlateElement> = {
                    type: 'list-item',
                }
                Transforms.setNodes<SlateElement>(editor, newProperties, { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) })

                const list: SlateElement = { type: 'numbered-list', children: [] }
                Transforms.wrapNodes(editor, list, { match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'list-item' })
                return
            }

            const type = SHORTCUTS[beforeText]

            if (type) {
                Transforms.select(editor, range)
                Transforms.delete(editor)
                const newProperties: Partial<SlateElement> = {
                    type: type as CustomElement['type'],
                }
                Transforms.setNodes<SlateElement>(editor, newProperties, {
                    match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
                })

                if (type === 'list-item') {
                    const list: SlateElement = {
                        type: 'bulleted-list',
                        children: [],
                    }
                    Transforms.wrapNodes(editor, list, {
                        match: n =>
                            !Editor.isEditor(n) &&
                            SlateElement.isElement(n) &&
                            n.type === 'list-item',
                    })
                }

                return
            }
        }

        insertText(text)
    }

    return editor
}
