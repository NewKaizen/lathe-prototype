import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LatheData, LatheStatus } from '../../../../core/models/fleet.model';
import { STATUS_META, efficiencyText } from '../../../../core/lib/status';
import { FleetLayoutMode } from '../../../../core/services/settings.service';
import { Icon } from '../../../../shared/icon/icon';

export type FilterStatus = 'all' | LatheStatus;

const FILTERS: FilterStatus[] = ['all', 'operational', 'warning', 'critical', 'maintenance'];

const LAYOUT_MODES: { id: FleetLayoutMode; label: string; icon: string }[] = [
    { id: 'grouped', label: 'Agrupado por linha', icon: 'layers' },
    { id: 'grid', label: 'Cards', icon: 'layout-grid' },
    { id: 'list', label: 'Lista', icon: 'list' },
];

const STATUS_ORDER: LatheStatus[] = ['critical', 'warning', 'maintenance', 'operational'];

@Component({
    selector: 'app-fleet-listing-view',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, Icon],
    templateUrl: './fleet-listing-view.html',
})
export class FleetListingView {
    readonly totalCount = input.required<number>();
    readonly search = input<string>('');
    readonly filter = input<FilterStatus>('all');
    readonly layoutMode = input.required<FleetLayoutMode>();
    readonly grouped = input.required<[string, LatheData[]][]>();
    readonly flatSorted = input.required<LatheData[]>();
    readonly filtered = input.required<LatheData[]>();
    readonly isFiltering = input.required<boolean>();
    readonly collapsedSectors = input.required<Set<string>>();
    readonly allCollapsed = input.required<boolean>();
    readonly counts = input.required<Record<LatheStatus, number>>();

    readonly searchChange = output<string>();
    readonly filterChange = output<FilterStatus>();
    readonly layoutModeChange = output<FleetLayoutMode>();
    readonly toggleSector = output<string>();
    readonly toggleAllSectors = output<void>();
    readonly select = output<LatheData>();

    protected statusFilters = FILTERS;
    protected layoutModes = LAYOUT_MODES;
    protected statusOrder = STATUS_ORDER;
    protected STATUS_META = STATUS_META;
    protected efficiencyText = efficiencyText;

    protected sectorCounts(lathes: LatheData[]) {
        return {
            operational: lathes.filter((l) => l.status === 'operational').length,
            warning: lathes.filter((l) => l.status === 'warning').length,
            critical: lathes.filter((l) => l.status === 'critical').length,
            maintenance: lathes.filter((l) => l.status === 'maintenance').length,
        };
    }
}
