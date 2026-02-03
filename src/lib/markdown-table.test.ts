import type { Descendant } from 'slate';
import { describe, expect, it } from 'vitest';
import type { TableCellElement, TableElement, TableRowElement } from '../components/custom-types';
import { deserialize, serialize } from './markdown';

describe('markdown tables', () => {
    it('deserializes a simple table', () => {
        const markdown = `| Header 1 | Header 2 |
| --- | --- |
| Cell 1 | Cell 2 |`;
        const result = deserialize(markdown);
        const table = result[0] as TableElement;

        expect(table.type).toBe('table');
        expect(table.children).toHaveLength(2); // Header row + Body row (separator is consumed)

        // Header Row
        const headerRow = table.children[0] as TableRowElement;
        expect(headerRow.type).toBe('table-row');
        const headerCell = headerRow.children[0] as TableCellElement;
        expect((headerCell.children[0] as any).text).toBe('Header 1');

        // Body Row
        const bodyRow = table.children[1] as TableRowElement;
        expect(bodyRow.type).toBe('table-row');
        const bodyCell = bodyRow.children[0] as TableCellElement;
        expect((bodyCell.children[0] as any).text).toBe('Cell 1');
    });

    it('serializes a simple table', () => {
        const nodes: Descendant[] = [{
            type: 'table',
            children: [
                {
                    type: 'table-row',
                    children: [
                        { type: 'table-cell', children: [{ text: 'H1' }] },
                        { type: 'table-cell', children: [{ text: 'H2' }] }
                    ]
                } as any,
                {
                    type: 'table-row',
                    children: [
                        { type: 'table-cell', children: [{ text: 'C1' }] },
                        { type: 'table-cell', children: [{ text: 'C2' }] }
                    ]
                } as any
            ]
        } as any];

        const markdown = serialize(nodes);
        // Expect separator to be inserted
        const lines = markdown.split('\n');
        expect(lines[0]).toContain('| H1 | H2 |');
        expect(lines[1]).toContain('| --- | --- |');
        expect(lines[2]).toContain('| C1 | C2 |');
    });
});
