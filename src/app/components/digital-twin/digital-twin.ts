import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    effect,
    ElementRef,
    input,
    OnDestroy,
    viewChild,
} from '@angular/core';
import {
    ArcRotateCamera,
    Color3,
    Color4,
    DirectionalLight,
    Engine,
    HemisphericLight,
    Mesh,
    MeshBuilder,
    Scene,
    StandardMaterial,
    Vector3,
} from '@babylonjs/core';
import { Icon } from '../../shared/icon/icon';

interface TwinData {
    id?: string;
    rpm: number;
    temperature: number;
    vibration: number;
    status: string;
}

@Component({
    selector: 'app-digital-twin',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon],
    templateUrl: './digital-twin.html',
})
export class DigitalTwin implements AfterViewInit, OnDestroy {
    readonly latheData = input.required<TwinData>();
    readonly mode = input<'3d' | 'camera'>('3d');

    private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

    private engine: Engine | null = null;
    private scene: Scene | null = null;
    private rpm = 0;
    private resizeHandler = () => this.engine?.resize();
    private resizeObserver: ResizeObserver | null = null;

    constructor() {
        effect(() => {
            this.rpm = this.latheData().rpm;
        });
    }

    ngAfterViewInit(): void {
        this.buildScene();
    }

    ngOnDestroy(): void {
        window.removeEventListener('resize', this.resizeHandler);
        this.resizeObserver?.disconnect();
        this.scene?.dispose();
        this.engine?.dispose();
    }

    protected resetCamera(): void {
        const camera = this.scene?.activeCamera as ArcRotateCamera | null;
        if (camera) {
            camera.alpha = -Math.PI / 2.5;
            camera.beta = Math.PI / 3;
            camera.radius = 12;
        }
    }

    private buildScene(): void {
        const canvas = this.canvasRef().nativeElement;
        const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, antialias: true });
        this.engine = engine;

        const scene = new Scene(engine);
        scene.clearColor = new Color4(0, 0, 0, 0);
        this.scene = scene;

        const camera = new ArcRotateCamera('camera', -Math.PI / 2.5, Math.PI / 3, 12, new Vector3(0, 1, 0), scene);
        camera.attachControl(canvas, true);
        camera.wheelPrecision = 40;
        camera.minZ = 0.1;

        const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), scene);
        hemiLight.intensity = 0.7;

        const dirLight = new DirectionalLight('dirLight', new Vector3(-1, -2, -1), scene);
        dirLight.intensity = 0.5;
        dirLight.position = new Vector3(10, 10, 10);

        const box = (
            name: string,
            w: number,
            h: number,
            d: number,
            pos: Vector3,
            color: Color3,
            specular?: Color3,
        ): Mesh => {
            const mesh = MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
            mesh.position = pos;
            mesh.material = this.material(name, scene, color, specular);
            return mesh;
        };

        const cylinder = (name: string, h: number, d: number, pos: Vector3, color: Color3, specular?: Color3): Mesh => {
            const mesh = MeshBuilder.CreateCylinder(name, { height: h, diameter: d }, scene);
            mesh.rotation.z = Math.PI / 2;
            mesh.position = pos;
            mesh.material = this.material(name, scene, color, specular);
            return mesh;
        };

        const aluminum = new Color3(0.85, 0.85, 0.87);

        box('bed', 8, 0.4, 1.5, new Vector3(0, 0.2, 0), aluminum, new Color3(0.2, 0.2, 0.2));
        box('headstock', 1.5, 1.8, 1.5, new Vector3(-3.5, 1.1, 0), new Color3(0.9, 0.9, 0.92));
        const spindle = cylinder(
            'spindle',
            1,
            0.4,
            new Vector3(-2.5, 1.25, 0),
            new Color3(0.7, 0.7, 0.72),
            new Color3(0.8, 0.8, 0.8),
        );
        const chuck = cylinder(
            'chuck',
            0.3,
            1.2,
            new Vector3(-2, 1.25, 0),
            new Color3(0.4, 0.4, 0.42),
            new Color3(0.5, 0.5, 0.5),
        );
        box('tailstock', 1.2, 1.3, 1.3, new Vector3(3, 0.85, 0), new Color3(0.9, 0.9, 0.92));
        box('carriage', 1.5, 0.8, 1.8, new Vector3(0, 0.8, 0.4), new Color3(0.8, 0.8, 0.82));
        box('toolHolder', 0.6, 0.4, 0.6, new Vector3(0, 1.4, 0.6), new Color3(0.3, 0.3, 0.35));
        const workpiece = cylinder(
            'workpiece',
            3,
            0.6,
            new Vector3(-0.5, 1.25, 0),
            new Color3(0.65, 0.65, 0.7),
            new Color3(0.8, 0.8, 0.9),
        );

        scene.registerBeforeRender(() => {
            const rotationSpeed = (this.rpm / 60) * 0.016;
            spindle.rotation.x += rotationSpeed;
            chuck.rotation.x += rotationSpeed;
            workpiece.rotation.x += rotationSpeed;
        });

        engine.runRenderLoop(() => scene.render());
        window.addEventListener('resize', this.resizeHandler);

        // Container pode mudar de largura sem a viewport mudar (ex.: recolher a sidebar) —
        // window 'resize' sozinho não captura isso.
        this.resizeObserver = new ResizeObserver(() => this.engine?.resize());
        this.resizeObserver.observe(canvas);
    }

    private material(name: string, scene: Scene, diffuse: Color3, specular?: Color3): StandardMaterial {
        const mat = new StandardMaterial(`${name}Mat`, scene);
        mat.diffuseColor = diffuse;
        if (specular) mat.specularColor = specular;
        return mat;
    }
}
