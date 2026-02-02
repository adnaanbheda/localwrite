import type { Descendant } from 'slate';
import { describe, expect, it } from 'vitest';
import { deserialize, serialize } from './markdown';

describe('markdown', () => {
    it('serializes empty check item', () => {
        const nodes: Descendant[] = [{
            type: 'check-list-item',
            checked: false,
            children: [{ text: 'Task 1' }]
        }];
        const result = serialize(nodes);
        expect(result).toBe('- [ ] Task 1');
    });

    it('serializes checked item', () => {
        const nodes: Descendant[] = [{
            type: 'check-list-item',
            checked: true,
            children: [{ text: 'Task 2' }]
        }];
        const result = serialize(nodes);
        expect(result).toBe('- [x] Task 2');
    });

    it('deserializes empty check item', () => {
        const markdown = '- [ ] Task 1';
        const result = deserialize(markdown);
        expect(result[0]).toMatchObject({
            type: 'check-list-item',
            checked: false,
            children: [{ text: 'Task 1' }]
        });
    });

    it('deserializes checked item', () => {
        const markdown = '- [x] DONE';
        const result = deserialize(markdown);
        expect(result[0]).toMatchObject({
            type: 'check-list-item',
            checked: true,
            children: [{ text: 'DONE' }]
        });
    });
});
