import { HINT_RULES } from '../content/hints';
import { LAB_INTERACTABLES } from '../content/lab';
import { TEST_INTERACTABLES } from '../content/test';
import type { Interactable } from '../content/types';
import { VIEW_H, VIEW_W } from '../config';
import { WorldScene } from './WorldScene';

export class TestScene extends WorldScene {
  constructor() {
    super('test');
  }

  protected override interactableDefs(): Interactable[] {
    return [...TEST_INTERACTABLES, ...LAB_INTERACTABLES];
  }

  protected buildWorld(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x1a1438, 0x1a1438, 0x0d0b1e, 0x0d0b1e, 1).fillRect(0, 0, VIEW_W, 190);
    g.fillStyle(0x2a2150, 1).fillRect(0, 190, VIEW_W, VIEW_H - 190);
    g.lineStyle(1, 0x5fe3ff, 0.25);
    for (let x = 0; x <= VIEW_W; x += 24) g.lineBetween(x, 190, x, VIEW_H);
    this.add
      .text(VIEW_W / 2, 24, 'TEST SCENE (фаза 0)', { fontFamily: 'monospace', fontSize: '10px', color: '#5fe3ff' })
      .setOrigin(0.5);
    this.makeActor('onfim', 200, 215, 'onfim');
  }

  override create(data: { resumeRef?: string }): void {
    super.create(data);
    if (!data?.resumeRef) {
      this.g.hints.setRule(HINT_RULES['test']!);
      void this.g.runScript('test#start');
    }
  }
}
