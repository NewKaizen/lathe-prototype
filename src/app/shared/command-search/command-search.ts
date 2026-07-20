import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LatheData } from '../../core/models/fleet.model';
import { COMMAND_ACTIONS, COMMAND_PAGES } from '../../core/lib/commands';
import { STATUS_META } from '../../core/lib/status';
import { Icon } from '../icon/icon';

export type CommandSearchSelection =
    { kind: 'page'; target: string } | { kind: 'action'; id: string } | { kind: 'machine'; latheId: string };

interface SearchResult {
    kind: 'page' | 'action' | 'machine';
    key: string;
    title: string;
    subtitle: string;
    icon: string;
    iconClass: string;
    selection: CommandSearchSelection;
}

type Prefix = '>' | ':' | '<' | null;

function parseQuery(raw: string): { prefix: Prefix; term: string } {
    const trimmed = raw.trimStart();
    if (trimmed.startsWith('>')) return { prefix: '>', term: trimmed.slice(1).trim().toLowerCase() };
    if (trimmed.startsWith(':')) return { prefix: ':', term: trimmed.slice(1).trim().toLowerCase() };
    if (trimmed.startsWith('<')) return { prefix: '<', term: trimmed.slice(1).trim().toLowerCase() };
    return { prefix: null, term: trimmed.trim().toLowerCase() };
}

function textMatches(term: string, label: string, keywords: string[]): boolean {
    if (!term) return true;
    const haystack = `${label} ${keywords.join(' ')}`.toLowerCase();
    return term
        .split(/\s+/)
        .filter(Boolean)
        .every((token) => haystack.includes(token));
}

@Component({
    selector: 'app-command-search',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, Icon],
    templateUrl: './command-search.html',
})
export class CommandSearch {
    readonly lathes = input.required<LatheData[]>();

    readonly select = output<CommandSearchSelection>();
    readonly openReference = output<void>();

    protected query = signal('');
    protected activeIndex = signal(0);
    protected isFocused = signal(false);

    protected STATUS_META = STATUS_META;

    private pageResults = computed<SearchResult[]>(() => {
        const { term } = parseQuery(this.query());
        return COMMAND_PAGES.filter((p) => textMatches(term, p.label, p.keywords)).map((p) => ({
            kind: 'page' as const,
            key: 'page:' + p.id,
            title: p.label,
            subtitle: p.hint,
            icon: p.icon,
            iconClass: 'text-primary',
            selection: { kind: 'page' as const, target: p.id },
        }));
    });

    private actionResults = computed<SearchResult[]>(() => {
        const { term } = parseQuery(this.query());
        return COMMAND_ACTIONS.filter((a) => textMatches(term, a.label, a.keywords)).map((a) => ({
            kind: 'action' as const,
            key: 'action:' + a.id,
            title: a.label,
            subtitle: a.hint,
            icon: a.icon,
            iconClass: 'text-[var(--status-purple)]',
            selection: { kind: 'action' as const, id: a.id },
        }));
    });

    private machineResults = computed<SearchResult[]>(() => {
        const { term } = parseQuery(this.query());
        return this.lathes()
            .filter((l) => textMatches(term, `${l.name} ${l.id} ${l.model}`, [l.sector]))
            .slice(0, 8)
            .map((l) => ({
                kind: 'machine' as const,
                key: 'machine:' + l.id,
                title: l.name,
                subtitle: `${l.model} · ${this.STATUS_META[l.status].label}`,
                icon: 'box',
                iconClass: this.STATUS_META[l.status].text,
                selection: { kind: 'machine' as const, latheId: l.id },
            }));
    });

    protected results = computed<SearchResult[]>(() => {
        const { prefix, term } = parseQuery(this.query());
        if (prefix === ':') return this.pageResults();
        if (prefix === '>') return this.actionResults();
        if (prefix === '<') return this.machineResults();
        if (!term) return [];
        return [...this.pageResults(), ...this.actionResults(), ...this.machineResults()].slice(0, 10);
    });

    protected hasQuery = computed(() => this.query().trim().length > 0);

    protected onInput(value: string): void {
        this.query.set(value);
        this.activeIndex.set(0);
    }

    protected onFocus(): void {
        this.isFocused.set(true);
    }

    protected onBlur(): void {
        setTimeout(() => this.isFocused.set(false), 150);
    }

    protected onKeydown(event: KeyboardEvent): void {
        const list = this.results();
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (list.length) this.activeIndex.set((this.activeIndex() + 1) % list.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (list.length) this.activeIndex.set((this.activeIndex() - 1 + list.length) % list.length);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const chosen = list[this.activeIndex()];
            if (chosen) this.pick(chosen);
        } else if (event.key === 'Escape') {
            (event.target as HTMLInputElement).blur();
            this.query.set('');
        }
    }

    protected pick(result: SearchResult): void {
        this.select.emit(result.selection);
        this.query.set('');
        this.activeIndex.set(0);
    }

    protected clear(): void {
        this.query.set('');
        this.activeIndex.set(0);
    }

    protected kindLabel(kind: SearchResult['kind']): string {
        if (kind === 'page') return 'Página';
        if (kind === 'action') return 'Ação';
        return 'Torno';
    }
}
