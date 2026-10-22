import type { SpeakerId } from './types';

export interface SpeakerDef {
  name: string;
  color: string;
  pitch: number;
}

export const SPEAKERS: Record<SpeakerId, SpeakerDef> = {
  byte: { name: 'Байт', color: '#5fe3ff', pitch: 880 },
  player: { name: 'Ты', color: '#ffe9b0', pitch: 520 },
  mnema: { name: 'Мнема', color: '#ffe9b0', pitch: 520 },
  dubler: { name: 'Дублёр', color: '#ffd36b', pitch: 330 },
  guest: { name: 'Гость', color: '#c9b8ff', pitch: 300 },
  inspector: { name: 'Инспектор', color: '#d9d9e8', pitch: 340 },
  correspondent: { name: 'Корреспондент', color: '#d9d9e8', pitch: 320 },
  onfim: { name: 'Онфим', color: '#ffb347', pitch: 700 },
  nastasya: { name: 'Настасья', color: '#f0a07a', pitch: 480 },
  ignat: { name: 'Игнат', color: '#c8b27a', pitch: 300 },
  zina: { name: 'Зина', color: '#9fc7ff', pitch: 640 },
  maria: { name: 'Мария Павловна', color: '#b9c6d8', pitch: 450 },
  prohorov: { name: 'Прохоров', color: '#b8a58f', pitch: 260 },
  timofey: { name: 'Тимофей', color: '#e0b878', pitch: 280 },
  galya: { name: 'Галя', color: '#9be0b8', pitch: 560 },
  ivan: { name: 'Иван Саввич', color: '#c0a070', pitch: 250 },
  lete: { name: 'Лета', color: '#fff4cf', pitch: 360 },
  botanist: { name: 'Семён Аркадьевич', color: '#a8c890', pitch: 330 },
  antonina: { name: 'Антонина', color: '#d8a0a0', pitch: 420 },
  voice1: { name: 'Голос 1', color: '#cfd8e6', pitch: 400 },
  voice2: { name: 'Голос 2', color: '#cfd8e6', pitch: 440 },
  narrator: { name: '', color: '#cfd8e6', pitch: 0 },
  ui: { name: '', color: '#cfd8e6', pitch: 0 },
};
