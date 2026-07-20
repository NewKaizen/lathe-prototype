import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LatheData } from '../../../../core/models/fleet.model';
import { STATUS_META } from '../../../../core/lib/status';
import { Icon } from '../../../../shared/icon/icon';

@Component({
    selector: 'app-fleet-plant-view',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon],
    templateUrl: './fleet-plant-view.html',
})
export class FleetPlantView {
    // MOCK: layout físico real da Planta D depende de asset do Figma (pendência de design).
    readonly plantSectors = input.required<[string, LatheData[]][]>();

    readonly select = output<LatheData>();

    protected STATUS_META = STATUS_META;
}
