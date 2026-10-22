import { describe, expect, it } from 'vitest';
import type { ChoiceOption, Script, Step } from '../../src/content/types';
import { Director, type DirectorHost } from '../../src/core/Director';
import { EventBus } from '../../src/core/EventBus';
import { Store } from '../../src/core/Store';

function setup(script: Script, pick = 0) {
  const log: string[] = [];
  const host: DirectorHost = {
    async say(step) {
      log.push(`say:${step.who}:${step.text}`);
    },
    async choice(_step, visible: ChoiceOption[]) {
      log.push(`choice:${visible.map((o) => o.text).join('|')}`);
      return visible[pick]!;
    },
    async perform(step: Step) {
      log.push(`perform:${step.t}`);
    },
    checkpoint(id) {
      log.push(`cp:${id}`);
    },
    async wait() {
      log.push('wait');
    },
  };
  const bus = new EventBus();
  const store = new Store(bus);
  const d = new Director(host, store, bus);
  d.register('s', script);
  return { d, store, log };
}

describe('Director', () => {
  it('выполняет шаги по порядку, ставит чекпоинты и выдаёт улики', async () => {
    const { d, store, log } = setup({
      start: [
        { t: 'checkpoint', id: 'c1' },
        { t: 'say', who: 'byte', text: 'Привет' },
        { t: 'giveClue', clue: 'ep1.U1' },
      ],
    });
    await d.run('s#start');
    expect(log).toEqual(['cp:c1', 'say:byte:Привет', 'perform:giveClue']);
    expect(store.hasClue('ep1.U1')).toBe(true);
  });

  it('choice: эффекты применяются, идёт переход на метку', async () => {
    const script: Script = {
      start: [
        {
          t: 'choice',
          options: [
            { text: 'A', goto: 'a', effects: { flags: { x: 1 } } },
            { text: 'B', goto: 'b' },
          ],
        },
      ],
      a: [{ t: 'say', who: 'byte', text: 'A!' }],
      b: [{ t: 'say', who: 'byte', text: 'B!' }],
    };
    const first = setup(script, 0);
    await first.d.run('s#start');
    expect(first.store.flag('x')).toBe(1);
    expect(first.log).toContain('say:byte:A!');
    const second = setup(script, 1);
    await second.d.run('s#start');
    expect(second.log).toContain('say:byte:B!');
    expect(second.log).not.toContain('say:byte:A!');
  });

  it('if: переход по условию', async () => {
    const { d, log } = setup({
      start: [{ t: 'if', cond: { flag: 'x' }, then: 'yes', else: 'no' }],
      yes: [{ t: 'say', who: 'byte', text: 'yes' }],
      no: [{ t: 'say', who: 'byte', text: 'no' }],
    });
    await d.run('s#start');
    expect(log).toEqual(['say:byte:no']);
  });

  it('Байт молчит при byteSilent, остальные говорят', async () => {
    const { d, store, log } = setup({
      start: [
        { t: 'say', who: 'byte', text: 'тихо' },
        { t: 'say', who: 'onfim', text: 'слышно' },
      ],
    });
    store.state.byteSilent = true;
    await d.run('s#start');
    expect(log).toEqual(['say:onfim:слышно']);
  });

  it('awaitFlag ждёт выполнения условия', async () => {
    const { d, store, log } = setup({
      start: [
        { t: 'awaitFlag', cond: { flag: 'ready' } },
        { t: 'say', who: 'byte', text: 'готово' },
      ],
    });
    const p = d.run('s#start');
    await Promise.resolve();
    expect(log).toEqual([]);
    store.setFlag('ready', true);
    await p;
    expect(log).toEqual(['say:byte:готово']);
  });

  it('stop() прерывает ожидание, дальнейшие шаги не выполняются', async () => {
    const { d, store, log } = setup({
      start: [
        { t: 'awaitFlag', cond: { flag: 'never' } },
        { t: 'say', who: 'byte', text: 'не должно прозвучать' },
      ],
    });
    const p = d.run('s#start');
    d.stop();
    store.setFlag('poke', true);
    await p;
    expect(log).toEqual([]);
  });

  it('несуществующая метка — понятная ошибка', async () => {
    const { d } = setup({ start: [{ t: 'goto', name: 'nope' }] });
    await expect(d.run('s#start')).rejects.toThrow(/нет метки/);
  });
});
