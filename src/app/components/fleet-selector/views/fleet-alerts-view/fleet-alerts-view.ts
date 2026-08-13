import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LatheData } from '../../../../core/models/fleet.model';
import { STATUS_META, efficiencyText } from '../../../../core/lib/status';
import { mockAlertDetails, formatDetectedAt } from '../../../../core/data/alert-enrichment.mock';
import { Icon } from '../../../../shared/icon/icon';

@Component({
    selector: 'app-fleet-alerts-view',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon],
    templateUrl: './fleet-alerts-view.html',
})
export class FleetAlertsView {
    readonly urgentAlerts = input.required<LatheData[]>();
    /** Fase 2.1 (redesenho): distingue "frota saudável" de "busca não encontrou nada aqui". */
    readonly isSearching = input<boolean>(false);

    readonly select = output<LatheData>();
    readonly clearSearch = output<void>();

    protected STATUS_META = STATUS_META;
    protected efficiencyText = efficiencyText;
    protected formatDetectedAt = formatDetectedAt;

    /** Fase 4.2: timestamp de detecção + ação sugerida — mock derivado, não faz parte de LatheData. */
    protected alertDetails = computed(() =>
        this.urgentAlerts().map((lathe) => ({ lathe, ...mockAlertDetails(lathe) })),
    );
}
