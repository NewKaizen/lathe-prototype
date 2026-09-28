import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-page-skeleton',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './page-skeleton.html',
})
export class PageSkeleton {}
