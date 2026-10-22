import Phaser from 'phaser';
import { VIEW_H, VIEW_W } from '../config';
import { registerAllAssets } from '../gfx/Assets';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create(): void {
    const label = this.add.text(VIEW_W / 2, VIEW_H / 2, 'Архив просыпается…', { fontFamily: 'monospace', fontSize: '10px', color: '#5fe3ff' }).setOrigin(0.5);
    this.time.delayedCall(30, () => {
      const t0 = performance.now();
      registerAllAssets(this);
      console.info(`[boot] текстуры созданы за ${Math.round(performance.now() - t0)} мс`);
      label.destroy();
      const next = (this.registry.get('startScene') as string | undefined) ?? 'test';
      this.scene.start(next);
    });
  }
}
