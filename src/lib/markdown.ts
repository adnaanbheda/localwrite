import { type Descendant, Text } from 'slate'

export function serialize(nodes: Descendant[]): string {
    return nodes.map(n => serializeNode(n)).join('\n')
}

function serializeNode(node: Descendant): string {
    if (Text.isText(node)) {
        let string = node.text
        if (node.bold) string = `**${string}**`
        if (node.italic) string = `*${string}*`
        if (node.code) string = `\`${string}\``
        if (node.underline) string = `__${string}__` // Non-standard markdown but common
        return string
    }

    const children = node.children.map(n => serializeNode(n)).join('')

    switch (node.type) {
        case 'block-quote':
            return `> ${children}`
        case 'check-list-item':
            return `- [${node.checked ? 'x' : ' '}] ${children}`
        case 'heading-one':
            return `# ${children}`
        case 'heading-two':
            return `## ${children}`
        case 'heading-three':
            return `### ${children}`
        case 'heading-four':
            return `#### ${children}`
        case 'heading-five':
            return `##### ${children}`
        case 'heading-six':
            return `###### ${children}`
        case 'paragraph':
            return `${children}`
        case 'link':
            return `[${children}](${node.url})`
        case 'image':
            return `![image](${node.url})`
        case 'bulleted-list':
            return node.children.map(n => serializeNode(n)).join('\n')
        case 'numbered-list':
            return node.children.map(n => serializeNode(n)).join('\n')
        case 'list-item':
            // Logic to determine if parent is numbered or bulleted is complex in simple recursion.
            // Simplified: we rely on parent to format, but here we just return the content prefixed? 
            // Better approach: handle list items inside the list case.
            // But since serializeNode is recursive, we need context.
            // For now, let's assume standard bullet '- ' and we might fix numbered lists later or pass context.
            // Actually, for this simple serializer, let's make lists handle their children specially.
            return `- ${children}`
        default:
            return children
    }
}


// Simplified deserializer (very basic, for MVP)
// Replacing with a robust library like 'remark' or 'unified' would be better for production,
// but for this task to be "offline app" with own logic, we'll write a simple parser.
// Actually, a simple line-based parser works for simple content.

export function deserialize(markdown: string): Descendant[] {
    const lines = markdown.split('\n')
    const nodes: Descendant[] = []

    for (const line of lines) {
        if (line.startsWith('# ')) {
            nodes.push({ type: 'heading-one', children: parseInline(line.slice(2)) })
        } else if (line.startsWith('## ')) {
            nodes.push({ type: 'heading-two', children: parseInline(line.slice(3)) })
        } else if (line.startsWith('### ')) {
            nodes.push({ type: 'heading-three', children: parseInline(line.slice(4)) })
        } else if (line.startsWith('> ')) {
            nodes.push({ type: 'block-quote', children: parseInline(line.slice(2)) })
        } else if (line.match(/^[-*] \[[ x]\] /)) {
            const checked = line.includes('[x]')
            nodes.push({
                type: 'check-list-item',
                checked,
                children: parseInline(line.replace(/^[-*] \[[ x]\] /, ''))
            })
        } else if (line.startsWith('- ')) {
            nodes.push({
                type: 'bulleted-list',
                children: [{ type: 'list-item', children: parseInline(line.slice(2)) }]
            })
        } else if (line.match(/^\d+\. /)) {
            nodes.push({
                type: 'numbered-list',
                children: [{ type: 'list-item', children: parseInline(line.replace(/^\d+\. /, '')) }]
            })
        } else if (line.trim() === '') {
            nodes.push({ type: 'paragraph', children: [{ text: '' }] })
        } else {
            nodes.push({ type: 'paragraph', children: parseInline(line) })
        }
    }

    if (nodes.length === 0) {
        return [{ type: 'paragraph', children: [{ text: '' }] }]
    }

    return nodes
}

function parseInline(text: string): { text: string; bold?: boolean; italic?: boolean; code?: boolean; underline?: boolean }[] {
    // Simple parser for **bold**, *italic*, `code`
    // Note: This is a very basic parser and does not handle nested marks or complex edge cases.

    const parts: { text: string; bold?: boolean; italic?: boolean; code?: boolean; underline?: boolean }[] = []

    // Regex for bold (**...**) or italic (*...*) or code (`...`)
    // We iterate and find matches

    let currentIndex = 0
    // Matches **bold**, `code`, *italic*
    // Order matters: match bold/code first, then italic
    const regex = /(\*\*.*?\*\*)|(`.*?`)|(\*.*?\*)|(__.*?__)/g

    let match

    while ((match = regex.exec(text)) !== null) {
        // Add text before match
        if (match.index > currentIndex) {
            parts.push({ text: text.slice(currentIndex, match.index) })
        }

        const fullMatch = match[0]

        if (fullMatch.startsWith('**')) {
            parts.push({ text: fullMatch.slice(2, -2), bold: true })
        } else if (fullMatch.startsWith('`')) {
            parts.push({ text: fullMatch.slice(1, -1), code: true })
        } else if (fullMatch.startsWith('*')) {
            parts.push({ text: fullMatch.slice(1, -1), italic: true })
        } else if (fullMatch.startsWith('__')) {
            // Assume underline for __ for this simple editor, or bold? 
            // Markdown standard often treats __ as bold or italic depending on position.
            // Let's treat __ as underline for custom flavor, or bold if following strict MD.
            // Given the serializer used __ for underline, let's deserializer it back to underline.
            parts.push({ text: fullMatch.slice(2, -2), underline: true })
        }

        currentIndex = regex.lastIndex
    }

    // Add remaining text
    if (currentIndex < text.length) {
        parts.push({ text: text.slice(currentIndex) })
    }

    return parts.length > 0 ? parts : [{ text: '' }]
}
