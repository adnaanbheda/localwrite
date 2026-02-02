import type { Descendant } from 'slate';
import { describe, expect, it } from 'vitest';
import { deserialize, serialize } from './markdown';

describe('markdown tables', () => {
    it('deserializes a simple table', () => {
        const markdown = `| Header 1 | Header 2 |
| --- | --- |
| Cell 1 | Cell 2 |`;
        const result = deserialize(markdown);
        expect(result[0].type).toBe('table');
        expect(result[0].children).toHaveLength(2); // Header row + Body row (separator is consumed)

        // Header Row
        expect(result[0].children[0].type).toBe('table-row');
        expect(result[0].children[0].children[0].children[0].text).toBe('Header 1');

        // Body Row
        expect(result[0].children[1].type).toBe('table-row');
        expect(result[0].children[1].children[0].children[0].text).toBe('Cell 1');
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
