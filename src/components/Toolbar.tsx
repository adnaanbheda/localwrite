import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Bold,
    Code,
    Heading1,
    Heading2,
    Italic,
    List,
    ListOrdered,
    Quote,
    Underline
} from 'lucide-react'
import { useSlate } from 'slate-react'
import type { CustomElementFormat, CustomTextKey } from './custom-types'
import { isBlockActive, isMarkActive, toggleBlock, toggleMark } from './editor-utils'
import { ToggleGroup, ToggleGroupItem } from './retroui/ToggleGroup'

const Toolbar = () => {
    return (
        <div className="border-b border-border p-2 flex flex-nowrap gap-2 items-center bg-background sticky top-0 z-10 overflow-x-auto no-scrollbar">
            <MarkToggleGroup />
            <div className="w-px h-6 bg-border mx-1" />
            <BlockToggleGroup />
            <div className="w-px h-6 bg-border mx-1" />
            <AlignToggleGroup />
        </div>
    )
}

const MarkToggleGroup = () => {
    const editor = useSlate()

    // We need to handle each toggle independently because Slate marks are independent
    // But ToggleGroup is designed for grouping. 
    // We can use multiple single-item ToggleGroups or one multiple-select group.
    // Using multiple-select group for marks seems appropriate since multiple marks can be active.

    const formats: { format: CustomTextKey; Icon: React.ElementType }[] = [
        { format: 'bold', Icon: Bold },
        { format: 'italic', Icon: Italic },
        { format: 'underline', Icon: Underline },
        { format: 'code', Icon: Code },
    ]

    const activeValues = formats
        .filter(({ format }) => isMarkActive(editor, format))
        .map(({ format }) => format)

    const handleValueChange = (value: string[]) => {
        // Find what changed
        formats.forEach(({ format }) => {
            const wasActive = isMarkActive(editor, format)
            const isNowActive = value.includes(format)

            if (wasActive !== isNowActive) {
                toggleMark(editor, format)
            }
        })
    }

    return (
        <ToggleGroup
            value={activeValues}
            onValueChange={handleValueChange}
            type="multiple" variant="outlined">
            {formats.map(({ format, Icon }) => (
                <ToggleGroupItem
                    variant="outlined"
                    key={format}
                    value={format}
                    aria-label={format}
                    onMouseDown={(e) => e.preventDefault()}
                >
                    <Icon className="h-4 w-4" />
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    )
}

const BlockToggleGroup = () => {
    const editor = useSlate()

    const formats: { format: CustomElementFormat; Icon: React.ElementType }[] = [
        { format: 'heading-one', Icon: Heading1 },
        { format: 'heading-two', Icon: Heading2 },
        { format: 'block-quote', Icon: Quote },
        { format: 'numbered-list', Icon: ListOrdered },
        { format: 'bulleted-list', Icon: List },
    ]

    // Determine which block type is active.
    // Note: Only one block type usually active at a time in this simple editor model 
    // (except for alignment which is handled separately)
    const activeValue = formats.find(({ format }) =>
        isBlockActive(editor, format)
    )?.format || ''

    return (
        <ToggleGroup
            type="single"
            value={activeValue}
            onValueChange={(value) => {
                if (value) {
                    toggleBlock(editor, value as CustomElementFormat)
                } else if (activeValue) {
                    toggleBlock(editor, activeValue as CustomElementFormat)
                }
            }}
            variant="outlined"
            size="sm"
        >
            {formats.map(({ format, Icon }) => (
                <ToggleGroupItem
                    key={format}
                    value={format}
                    aria-label={format}
                    onMouseDown={(e) => e.preventDefault()}
                >
                    <Icon className="h-4 w-4" />
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    )
}

const AlignToggleGroup = () => {
    const editor = useSlate()

    const formats: { format: CustomElementFormat; Icon: React.ElementType }[] = [
        { format: 'left', Icon: AlignLeft },
        { format: 'center', Icon: AlignCenter },
        { format: 'right', Icon: AlignRight },
        { format: 'justify', Icon: AlignJustify },
    ]

    const activeValue = formats.find(({ format }) =>
        isBlockActive(editor, format, 'align')
    )?.format || 'left'

    return (
        <ToggleGroup
            type="single"
            value={activeValue}
            onValueChange={(value) => {
                if (value) {
                    toggleBlock(editor, value as CustomElementFormat)
                } else if (activeValue) {
                    toggleBlock(editor, activeValue as CustomElementFormat)
                }
            }}
            variant="outlined"
            size="sm"
        >
            {formats.map(({ format, Icon }) => (
                <ToggleGroupItem
                    key={format}
                    value={format}
                    aria-label={format}
                    onMouseDown={(e) => e.preventDefault()}
                >
                    <Icon className="h-4 w-4" />
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    )
}

export default Toolbar
